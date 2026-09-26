const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const { dhakaToday } = require("../utils/time");

// =========================================
// HELPER
// =========================================

const safeQuery = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Optional query failed:", error.message);
    return [];
  }
};

const getTableColumns = async (tableName) => {
  const result = await pool.query(
    `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows;
};

// Every route here is called as /api/patient-dashboard/... and the patient's
// own id is always taken from the URL param, matched against the logged-in
// patient's token (req.user.id) - never trust a body/query patient_id alone.
const ownPatientOnly = (req, res, paramName = "patientId") => {
  const id = Number(req.params[paramName]);

  if (req.user.role === "admin") return id;

  if (req.user.role !== "patient" || req.user.id !== id) {
    res.status(403).json({ error: "You can access only your own account" });
    return null;
  }

  return id;
};


// =========================================
// GET INSURANCE FORM SCHEMA
// =========================================

router.get("/insurance-schema", async (req, res) => {
  try {
    const columns = await getTableColumns("insurance");

    const editable = columns.filter(
      (column) =>
        column.column_name !== "insurance_id" &&
        column.column_name !== "patient_id"
    );

    res.json(editable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// UPDATE PATIENT PROFILE
// =========================================

router.put("/profile/:patientId", async (req, res) => {
  const patientId = ownPatientOnly(req, res);
  if (patientId === null) return;

  const { name, email, password, phone, dob, gender, blood_group, address } =
    req.body;

  try {
    let hashedPassword = null;

    if (password) {
      if (String(password).length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `
      UPDATE patient
      SET
        name        = COALESCE($1, name),
        email       = COALESCE($2, email),
        password    = COALESCE($3, password),
        phone       = COALESCE($4, phone),
        dob         = COALESCE($5, dob),
        gender      = COALESCE($6, gender),
        blood_group = COALESCE($7, blood_group),
        address     = COALESCE($8, address)
      WHERE patient_id = $9
      RETURNING patient_id, name, email, phone, dob, gender, blood_group, address
      `,
      [
        name || null,
        email || null,
        hashedPassword,
        phone || null,
        dob || null,
        gender || null,
        blood_group || null,
        address || null,
        patientId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({
      message: "Profile updated successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "This email is already used" });
    }
    console.error("Patient profile update error:", error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// PATIENT BOOK APPOINTMENT USING A FREE SLOT
// One transaction via sp_book_appointment: creates the appointment
// (carrying the doctor's current visit fee) and marks the slot booked.
// =========================================

router.post("/appointments/book", async (req, res) => {
  const { doctor_id, slot_id, reason, notes } = req.body;
  const patientId = req.user.id;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can book appointments" });
  }

  if (!doctor_id || !slot_id) {
    return res
      .status(400)
      .json({ error: "Doctor and time slot are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "CALL sp_book_appointment($1::int, $2::int, $3::int, $4::text, $5::text, NULL::int)",
      [patientId, Number(doctor_id), Number(slot_id), reason || null, notes || null]
    );

    const apptId = result.rows[0].p_appt_id;

    const appt = await client.query(
      `SELECT * FROM appointment WHERE appt_id = $1`,
      [apptId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: `Appointment requested. Visit fee: ${Number(
        appt.rows[0].fee || 0
      ).toFixed(2)}. Waiting for front desk confirmation.`,
      appointment: appt.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    const dbCode = /^MC(\d{3})$/.exec(error.code || "");
    if (dbCode) {
      return res.status(Number(dbCode[1])).json({ error: error.message });
    }

    console.error("Patient booking error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});


// =========================================
// PATIENT APPROVES / DECLINES A DOCTOR-RECOMMENDED LAB TEST
// Lifecycle: requested (doctor) -> approved/declined (patient) -> scheduled (staff) -> completed (doctor)
// =========================================

router.patch("/lab-tests/:id/decision", async (req, res) => {
  const { decision } = req.body; // "approved" | "declined"
  const patientId = req.user.id;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can do this" });
  }

  if (!["approved", "declined"].includes(decision)) {
    return res.status(400).json({ error: "decision must be approved or declined" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE labtest
      SET status = $1
      WHERE test_id = $2 AND patient_id = $3 AND status = 'requested'
      RETURNING *
      `,
      [decision, req.params.id, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: "This lab test is not yours or is no longer waiting for your decision",
      });
    }

    res.json({ message: `Lab test ${decision}`, lab_test: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// PATIENT APPROVES / DECLINES A DOCTOR-RECOMMENDED SURGERY
// Lifecycle: recommended (doctor) -> approved/declined (patient) -> scheduled (staff) -> completed (doctor)
// =========================================

router.patch("/surgeries/:id/decision", async (req, res) => {
  const { decision } = req.body; // "approved" | "declined"
  const patientId = req.user.id;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can do this" });
  }

  if (!["approved", "declined"].includes(decision)) {
    return res.status(400).json({ error: "decision must be approved or declined" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE surgery
      SET status = $1
      WHERE surgery_id = $2 AND patient_id = $3 AND status = 'recommended'
      RETURNING *
      `,
      [decision, req.params.id, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: "This surgery is not yours or is no longer waiting for your decision",
      });
    }

    res.json({ message: `Surgery ${decision}`, surgery: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// PATIENT SELF-REQUESTS A LAB TEST (no appointment/doctor needed)
// Goes straight to status 'approved' since the patient IS the one deciding -
// no separate patient-approval step, unlike a doctor-ordered test.
// =========================================

router.post("/lab-tests/self-request", async (req, res) => {
  const { test_name, type } = req.body;
  const patientId = req.user.id;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can do this" });
  }

  if (!test_name) {
    return res.status(400).json({ error: "Test name is required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO labtest (patient_id, doctor_id, staff_id, test_name, type, status)
      VALUES ($1, NULL, NULL, $2, $3, 'approved')
      RETURNING *
      `,
      [patientId, test_name, type || null]
    );

    res.status(201).json({
      message: "Lab test requested. Staff will schedule it shortly.",
      lab_test: result.rows[0],
    });
  } catch (error) {
    console.error("Self-request lab test error:", error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// AMBULANCE
// =========================================

router.post("/ambulance/request", async (req, res) => {
  const { pickup_location, drop_location } = req.body;
  const patientId = req.user.id;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can request an ambulance" });
  }

  if (!pickup_location) {
    return res.status(400).json({ error: "Pickup location is required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO ambulance_request (patient_id, pickup_location, drop_location, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
      `,
      [patientId, pickup_location, drop_location || null]
    );

    res.status(201).json({
      message: "Ambulance requested. A coordinator will assign a vehicle shortly.",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Ambulance request error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/ambulance/requests/:id/cancel", async (req, res) => {
  const patientId = req.user.id;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only patients can do this" });
  }

  try {
    await pool.query(
      "CALL sp_cancel_ambulance_request($1::int, $2::int)",
      [req.params.id, patientId]
    );

    res.json({ message: "Ambulance request cancelled" });
  } catch (error) {
    const dbCode = /^MC(\d{3})$/.exec(error.code || "");
    if (dbCode) {
      return res.status(Number(dbCode[1])).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// PATIENT CREATE COMPLAINT
// =========================================

router.post("/complaints/:patientId", async (req, res) => {
  const patientId = ownPatientOnly(req, res);
  if (patientId === null) return;

  const { target_type, target_id, complaint_type, description } = req.body;

  try {
    if (!complaint_type || !description) {
      return res
        .status(400)
        .json({ error: "Complaint type and description are required" });
    }

    const columnRows = await getTableColumns("complaint");
    const columns = new Set(columnRows.map((column) => column.column_name));

    const insertColumns = [];
    const values = [];

    const addValue = (column, value) => {
      if (columns.has(column)) {
        insertColumns.push(column);
        values.push(value);
        return true;
      }
      return false;
    };

    if (!addValue("patient_id", patientId)) {
      addValue("filed_by_patient_id", patientId);
    }

    if (target_type === "staff" && target_id) {
      if (!addValue("staff_id", Number(target_id))) {
        addValue("against_staff_id", Number(target_id));
      }
    }

    if (target_type === "doctor" && target_id) {
      if (!addValue("doctor_id", Number(target_id))) {
        addValue("against_doctor_id", Number(target_id));
      }
    }

    addValue("complaint_type", complaint_type);
    addValue("description", description);

    // Use Bangladesh "today", not the server's own timezone.
    if (columns.has("date")) addValue("date", dhakaToday());
    if (columns.has("complaint_date")) addValue("complaint_date", dhakaToday());
    if (columns.has("status")) addValue("status", "pending");
    if (columns.has("complaint_status")) addValue("complaint_status", "pending");

    const placeholders = values.map((_, index) => `$${index + 1}`);

    const result = await pool.query(
      `
      INSERT INTO complaint (${insertColumns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
      `,
      values
    );

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: result.rows[0],
    });
  } catch (error) {
    console.error("Patient complaint error:", error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// PATIENT ADD INSURANCE
// =========================================

router.post("/insurance/:patientId", async (req, res) => {
  const patientId = ownPatientOnly(req, res);
  if (patientId === null) return;

  try {
    const columnRows = await getTableColumns("insurance");
    const available = new Set(columnRows.map((column) => column.column_name));

    if (!available.has("patient_id")) {
      return res
        .status(500)
        .json({ error: "Insurance table does not contain patient_id" });
    }

    const insertColumns = ["patient_id"];
    const values = [patientId];

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "insurance_id" || key === "patient_id" || !available.has(key)) {
        continue;
      }
      if (value === "" || value === null || value === undefined) continue;

      insertColumns.push(key);
      values.push(value);
    }

    const placeholders = values.map((_, index) => `$${index + 1}`);

    const result = await pool.query(
      `
      INSERT INTO insurance (${insertColumns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
      `,
      values
    );

    res.status(201).json({
      message: "Insurance information added successfully",
      insurance: result.rows[0],
    });
  } catch (error) {
    console.error("Insurance create error:", error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================
// LOAD ALL PATIENT DASHBOARD DATA
// =========================================

router.get("/data/:patientId", async (req, res) => {
  const patientId = ownPatientOnly(req, res);
  if (patientId === null) return;

  try {
    const profileResult = await pool.query(
      `
      SELECT patient_id, name, email, phone, dob, gender, blood_group, address
      FROM patient
      WHERE patient_id = $1
      `,
      [patientId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const appointments = await safeQuery(
      `
      SELECT
        a.*,
        d.name AS doctor_name,
        d.specialization,
        s.name AS staff_name
      FROM appointment a
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN staff s ON a.staff_id = s.staff_id
      WHERE a.patient_id = $1
      ORDER BY a.appt_date DESC, a.appt_time DESC
      `,
      [patientId]
    );

    const prescriptions = await safeQuery(
      `
      SELECT pr.*, d.name AS doctor_name
      FROM prescription pr
      LEFT JOIN doctor d ON pr.doctor_id = d.doctor_id
      WHERE pr.patient_id = $1
      ORDER BY pr.pres_id DESC
      `,
      [patientId]
    );

    const prescriptionItems = await safeQuery(
      `
      SELECT pi.*, mi.item_name
      FROM prescription_item pi
      JOIN prescription pr ON pi.pres_id = pr.pres_id
      LEFT JOIN medical_item mi ON pi.item_id = mi.item_id
      WHERE pr.patient_id = $1
      ORDER BY pi.pres_id DESC
      `,
      [patientId]
    );

    const labTests = await safeQuery(
      `
      SELECT lt.*, d.name AS doctor_name, s.name AS staff_name
      FROM labtest lt
      LEFT JOIN doctor d ON lt.doctor_id = d.doctor_id
      LEFT JOIN staff s ON lt.staff_id = s.staff_id
      WHERE lt.patient_id = $1
      ORDER BY lt.date DESC NULLS FIRST, lt.test_id DESC
      `,
      [patientId]
    );

    const surgeries = await safeQuery(
      `
      SELECT s.*, d.name AS doctor_name, st.name AS staff_name
      FROM surgery s
      LEFT JOIN doctor d ON s.doctor_id = d.doctor_id
      LEFT JOIN staff st ON s.staff_id = st.staff_id
      WHERE s.patient_id = $1
      ORDER BY s.date DESC NULLS FIRST, s.surgery_id DESC
      `,
      [patientId]
    );

    const admissions = await safeQuery(
      `
      SELECT
        ad.*,
        r.room_type,
        r.status AS room_status,
        d.name AS doctor_name
      FROM admission ad
      LEFT JOIN room r ON ad.room_id = r.room_id
      LEFT JOIN doctor d ON ad.doctor_id = d.doctor_id
      WHERE ad.patient_id = $1
      ORDER BY ad.adm_id DESC
      `,
      [patientId]
    );

    const insurance = await safeQuery(
      `SELECT * FROM insurance WHERE patient_id = $1`,
      [patientId]
    );

    const ambulanceRequests = await safeQuery(
      `
      SELECT ar.*, am.vehicle_no, am.vehicle_type
      FROM ambulance_request ar
      LEFT JOIN ambulance am ON am.ambulance_id = ar.ambulance_id
      WHERE ar.patient_id = $1
      ORDER BY ar.request_id DESC
      `,
      [patientId]
    );

    let complaints = [];

    try {
      const complaintColumns = await getTableColumns("complaint");
      const complaintSet = new Set(complaintColumns.map((c) => c.column_name));

      let patientColumn = null;
      if (complaintSet.has("patient_id")) patientColumn = "patient_id";
      else if (complaintSet.has("filed_by_patient_id"))
        patientColumn = "filed_by_patient_id";

      let orderColumn = "complaint_id";
      if (complaintSet.has("date")) orderColumn = "date";
      else if (complaintSet.has("complaint_date")) orderColumn = "complaint_date";

      if (patientColumn) {
        complaints = await safeQuery(
          `SELECT * FROM complaint WHERE ${patientColumn} = $1 ORDER BY ${orderColumn} DESC`,
          [patientId]
        );
      }
    } catch (error) {
      console.error("Complaint load error:", error.message);
    }

    res.json({
      profile: profileResult.rows[0],
      appointments,
      prescriptions,
      prescription_items: prescriptionItems,
      lab_tests: labTests,
      surgeries,
      admissions,
      insurance,
      complaints,
      ambulance_requests: ambulanceRequests,
    });
  } catch (error) {
    console.error("Patient dashboard data error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;