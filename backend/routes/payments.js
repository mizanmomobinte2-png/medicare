const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================================
// COMMON PAYMENT QUERY
// =====================================================

const PAYMENT_QUERY = `
  SELECT
    p.payment_id,
    p.bill_id,
    p.payment_date,
    p.amount,
    p.method,
    p.ref_no,
    p.notes,

    b.staff_id,
    b.status AS bill_status,
    b.amount AS bill_amount,
    b.discount,
    b.tax,

    COALESCE(
      a.patient_id,
      ap.patient_id,
      amb.patient_id,
      sg.patient_id,
      lt.patient_id
    ) AS patient_id,

    pt.name AS patient_name,

    CASE
      WHEN b.appt_id IS NOT NULL THEN 'appointment'
      WHEN b.adm_id IS NOT NULL THEN 'admission'
      WHEN b.ambulance_request_id IS NOT NULL THEN 'ambulance'
      WHEN bs.surgery_id IS NOT NULL THEN 'surgery'
      WHEN bl.test_id IS NOT NULL THEN 'labtest'
      ELSE 'other'
    END AS source_type,

    COALESCE(b.appt_id, b.adm_id, b.ambulance_request_id, bs.surgery_id, bl.test_id) AS source_id

  FROM payment p

  JOIN billing b ON p.bill_id = b.bill_id

  LEFT JOIN admission a ON b.adm_id = a.adm_id
  LEFT JOIN appointment ap ON b.appt_id = ap.appt_id
  LEFT JOIN ambulance_request amb ON b.ambulance_request_id = amb.request_id
  LEFT JOIN billing_surgery bs ON b.bill_id = bs.bill_id
  LEFT JOIN surgery sg ON bs.surgery_id = sg.surgery_id
  LEFT JOIN billing_labtest bl ON b.bill_id = bl.bill_id
  LEFT JOIN labtest lt ON bl.test_id = lt.test_id

  LEFT JOIN patient pt
    ON pt.patient_id = COALESCE(a.patient_id, ap.patient_id, amb.patient_id, sg.patient_id, lt.patient_id)
`;

// =====================================================
// GET ALL PAYMENTS (admin / staff only)
// =====================================================

router.get("/", async (req, res) => {
  if (req.user.role === "patient") {
    return res.status(403).json({ error: "Access forbidden" });
  }

  try {
    const result = await pool.query(`${PAYMENT_QUERY} ORDER BY p.payment_id DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET PAYMENTS OF A PATIENT (that patient, or admin/staff)
// =====================================================

router.get("/patient/:patientId", async (req, res) => {
  const patientId = Number(req.params.patientId);

  if (req.user.role === "patient" && req.user.id !== patientId) {
    return res.status(403).json({ error: "You can access only your own payments" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM (${PAYMENT_QUERY}) payment_data WHERE patient_id = $1 ORDER BY payment_id DESC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Patient payments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET PAYMENTS HANDLED BY STAFF (admin, or that staff)
// =====================================================

router.get("/staff/:staffId", async (req, res) => {
  const staffId = Number(req.params.staffId);

  if (req.user.role === "staff" && req.user.id !== staffId) {
    return res.status(403).json({ error: "You can access only your own payments" });
  }

  if (!["admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access forbidden" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM (${PAYMENT_QUERY}) payment_data WHERE staff_id = $1 ORDER BY payment_id DESC`,
      [staffId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Staff payments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET SINGLE PAYMENT (owner patient, or admin/staff)
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM (${PAYMENT_QUERY}) payment_data WHERE payment_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const row = result.rows[0];

    if (req.user.role === "patient" && req.user.id !== Number(row.patient_id)) {
      return res.status(403).json({ error: "You can access only your own payments" });
    }

    res.json(row);
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PATIENT MAKES A PAYMENT ONLINE
// Uses sp_record_payment so the same rules (bill must be approved,
// amount can't exceed the remaining balance) apply everywhere payments
// happen, staff counter or patient self-service alike.
// =====================================================

router.post("/", async (req, res) => {
  const { bill_id, payment_date, amount, method, ref_no, notes } = req.body;

  if (req.user.role !== "patient") {
    return res.status(403).json({ error: "Only a patient can pay their own bill here" });
  }

  const client = await pool.connect();

  try {
    if (!bill_id) {
      return res.status(400).json({ error: "Please select a bill first." });
    }

    await client.query("BEGIN");

    // Make sure this bill actually belongs to the logged-in patient.
    const owner = await client.query(
      `
      SELECT
        COALESCE(a.patient_id, ap.patient_id, amb.patient_id, sg.patient_id, lt.patient_id) AS patient_id
      FROM billing b
      LEFT JOIN admission a ON b.adm_id = a.adm_id
      LEFT JOIN appointment ap ON b.appt_id = ap.appt_id
      LEFT JOIN ambulance_request amb ON b.ambulance_request_id = amb.request_id
      LEFT JOIN billing_surgery bs ON b.bill_id = bs.bill_id
      LEFT JOIN surgery sg ON bs.surgery_id = sg.surgery_id
      LEFT JOIN billing_labtest bl ON b.bill_id = bl.bill_id
      LEFT JOIN labtest lt ON bl.test_id = lt.test_id
      WHERE b.bill_id = $1
      `,
      [bill_id]
    );

    if (owner.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bill not found." });
    }

    if (Number(owner.rows[0].patient_id) !== req.user.id) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "This bill does not belong to you." });
    }

    const call = await client.query(
      "CALL sp_record_payment($1::int, $2::numeric, $3::text, $4::text, $5::text, NULL::text)",
      [bill_id, Number(amount), method || "cash", ref_no || null, notes || null]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Payment successful.",
      bill_status: call.rows[0].p_status,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    const dbCode = /^MC(\d{3})$/.exec(error.code || "");
    if (dbCode) {
      return res.status(Number(dbCode[1])).json({ error: error.message });
    }

    console.error("Payment create error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;