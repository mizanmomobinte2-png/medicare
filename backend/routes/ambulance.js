// All staff dashboard work lives here: /api/staff-work/...
// Every route needs a valid token, an active staff account and the right work role.
// "Assign to me" (claim) endpoints are atomic: two staff clicking together -> only one wins.

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../db");

const { verifyToken } = require("../middleware/authMiddleware");
const { loadStaff, requireWorkRole } = require("../middleware/workRoleMiddleware");
const { WORK_ROLES, COMMON_MODULES } = require("../config/workRoles");

router.use(verifyToken, loadStaff);

// -----------------------------------------
// helpers
// -----------------------------------------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const h = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }

    // errors raised by our triggers / procedures: RAISE ... USING ERRCODE = 'MC409'
    const dbCode = /^MC(\d{3})$/.exec(err.code || "");
    if (dbCode) {
      return res.status(Number(dbCode[1])).json({ error: err.message });
    }
    console.error(req.method, req.originalUrl, err);
    res.status(500).json({ error: err.message });
  }
};

const idOf = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Invalid id");
  return id;
};

const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

const FRONT_DESK = requireWorkRole("FRONT_DESK");
const ADMISSION = requireWorkRole("ADMISSION");
const LAB_TECH = requireWorkRole("LAB_TECH");
const SURGERY = requireWorkRole("SURGERY_COORD");
const BLOOD = requireWorkRole("BLOOD_BANK");
const BILLING = requireWorkRole("BILLING");
const COMPLAINT = requireWorkRole("COMPLAINT");
const AMBULANCE = requireWorkRole("AMBULANCE_COORD");

// =========================================
// ME / PROFILE / ADMIN RELATION (all staff)
// =========================================

router.get(
  "/me",
  h(async (req, res) => {
    const r = await pool.query(
      `
      SELECT s.staff_id, s.name, s.email, s.phone, s.salary, s.status,
             s.dept_id, s.staff_role, d.dept_name
      FROM staff s
      LEFT JOIN department d ON d.dept_id = s.dept_id
      WHERE s.staff_id = $1
      `,
      [req.staff.staff_id]
    );

    const me = r.rows[0];
    const cfg = WORK_ROLES[me.staff_role];

    res.json({
      ...me,
      role_label: cfg ? cfg.label : null,
      modules: [...COMMON_MODULES, ...(cfg ? cfg.modules : [])],
    });
  })
);

router.put(
  "/profile",
  h(async (req, res) => {
    const { name, email, phone, password } = req.body;

    let hash = null;
    if (password) {
      if (String(password).length < 6) {
        throw new HttpError(400, "Password must be at least 6 characters");
      }
      hash = await bcrypt.hash(password, 10);
    }

    try {
      const r = await pool.query(
        `
        UPDATE staff
        SET name     = COALESCE(NULLIF($1, ''), name),
            email    = COALESCE(NULLIF($2, ''), email),
            phone    = COALESCE($3, phone),
            password = COALESCE($4, password)
        WHERE staff_id = $5
        RETURNING staff_id, name, email, phone, dept_id, status, staff_role
        `,
        [name ?? null, email ?? null, phone ?? null, hash, req.staff.staff_id]
      );

      res.json({ message: "Profile updated successfully", staff: r.rows[0] });
    } catch (err) {
      if (err.code === "23505") {
        throw new HttpError(409, "This email is already used by another staff");
      }
      throw err;
    }
  })
);

router.get(
  "/admin-relations",
  h(async (req, res) => {
    const r = await pool.query(
      `
      SELECT a.user_id AS admin_id, a.username
      FROM admin_staff ast
      JOIN admin a ON a.user_id = ast.admin_id
      WHERE ast.staff_id = $1
      ORDER BY a.user_id
      `,
      [req.staff.staff_id]
    );
    res.json(r.rows);
  })
);

// =========================================
// APPOINTMENTS  (FRONT_DESK)
// =========================================

const APPT_SELECT = `
  SELECT a.appt_id, a.patient_id, a.doctor_id, a.staff_id, a.appt_date,
         a.appt_time, a.status, a.reason, a.notes, a.fee, a.slot_id, a.reject_reason,
         p.name AS patient_name, p.phone AS patient_phone,
         d.name AS doctor_name
  FROM appointment a
  LEFT JOIN patient p ON p.patient_id = a.patient_id
  LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
`;

router.get(
  "/appointments/mine",
  FRONT_DESK,
  h(async (req, res) => {
    const r = await pool.query(
      `${APPT_SELECT}
       WHERE a.staff_id = $1
       ORDER BY a.appt_date DESC, a.appt_time`,
      [req.staff.staff_id]
    );
    res.json(r.rows);
  })
);

router.get(
  "/appointments/unassigned",
  FRONT_DESK,
  h(async (req, res) => {
    const r = await pool.query(
      `${APPT_SELECT}
       WHERE a.staff_id IS NULL
         AND COALESCE(a.status, 'pending') NOT IN ('cancelled', 'rejected', 'completed')
       ORDER BY a.appt_date, a.appt_time`
    );
    res.json(r.rows);
  })
);

router.post(
  "/appointments/:id/claim",
  FRONT_DESK,
  h(async (req, res) => {
    const id = idOf(req);

    // Claim only ASSIGNS the appointment to this staff member; it does NOT
    // approve or reject it. That decision is a separate, explicit step
    // (see /appointments/:id/decide) so the status always reflects a real
    // front-desk decision, never an automatic side effect of claiming.
    const r = await pool.query(
      `
      UPDATE appointment
      SET staff_id = $1
      WHERE appt_id = $2
        AND staff_id IS NULL
        AND COALESCE(status, 'pending') NOT IN ('cancelled', 'rejected', 'completed')
      RETURNING *
      `,
      [req.staff.staff_id, id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(
        409,
        "Another staff already took this appointment, or it is no longer open"
      );
    }

    res.json({ message: "Appointment assigned to you", appointment: r.rows[0] });
  })
);

// Edit notes only. Date/time changes go through /reschedule so they always
// land on a real, free time slot of the same doctor.
router.patch(
  "/appointments/:id",
  FRONT_DESK,
  h(async (req, res) => {
    const id = idOf(req);
    const { notes } = req.body;

    const r = await pool.query(
      `
      UPDATE appointment
      SET notes = COALESCE($1, notes)
      WHERE appt_id = $2 AND staff_id = $3
      RETURNING *
      `,
      [notes ?? null, id, req.staff.staff_id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(403, "This appointment is not assigned to you");
    }

    res.json({ message: "Appointment updated", appointment: r.rows[0] });
  })
);

// Front desk approves or rejects. Approving auto-creates the visit-fee bill;
// rejecting frees the time slot and removes an unpaid auto-bill, all inside
// one transaction (sp_decide_appointment).
router.patch(
  "/appointments/:id/decide",
  FRONT_DESK,
  h(async (req, res) => {
    const id = idOf(req);
    const { decision, reason } = req.body; // "confirmed" | "rejected"

    if (!["confirmed", "rejected"].includes(decision)) {
      throw new HttpError(400, "decision must be confirmed or rejected");
    }

    if (decision === "rejected" && !reason) {
      throw new HttpError(400, "A reason is required to reject an appointment");
    }

    await tx(async (c) => {
      await c.query(
        "CALL sp_decide_appointment($1::int, $2::int, $3::text, $4::text)",
        [id, req.staff.staff_id, decision, reason || null]
      );
    });

    const r = await pool.query(`${APPT_SELECT} WHERE a.appt_id = $1`, [id]);

    res.json({ message: `Appointment ${decision}`, appointment: r.rows[0] });
  })
);

// The doctor's other free, upcoming slots - for moving this appointment.
router.get(
  "/appointments/:id/free-slots",
  FRONT_DESK,
  h(async (req, res) => {
    const id = idOf(req);

    const appt = await pool.query(
      `SELECT doctor_id, staff_id FROM appointment WHERE appt_id = $1`,
      [id]
    );

    if (appt.rows.length === 0) throw new HttpError(404, "Appointment not found");
    if (appt.rows[0].staff_id !== req.staff.staff_id) {
      throw new HttpError(403, "This appointment is not assigned to you");
    }

    const slots = await pool.query(
      `
      SELECT slot_id, slot_date, start_time, end_time, room
      FROM time_slot
      WHERE doctor_id = $1
        AND status = 'available'
        AND (slot_date + start_time) > fn_now_dhaka()
      ORDER BY slot_date, start_time
      `,
      [appt.rows[0].doctor_id]
    );

    res.json(slots.rows);
  })
);

// Move the appointment to another free slot of the same doctor.
router.patch(
  "/appointments/:id/reschedule",
  FRONT_DESK,
  h(async (req, res) => {
    const id = idOf(req);
    const slotId = Number(req.body.slot_id);

    if (!Number.isInteger(slotId) || slotId <= 0) {
      throw new HttpError(400, "slot_id is required");
    }

    await tx(async (c) => {
      await c.query(
        "CALL sp_reschedule_appointment($1::int, $2::int, $3::int)",
        [id, req.staff.staff_id, slotId]
      );
    });

    const r = await pool.query(`${APPT_SELECT} WHERE a.appt_id = $1`, [id]);

    res.json({ message: "Appointment rescheduled", appointment: r.rows[0] });
  })
);

// =========================================
// ADMISSIONS + WARD & ROOMS  (ADMISSION)
// =========================================

router.get(
  "/admissions",
  requireWorkRole("ADMISSION"),
  h(async (req, res) => {
    const r = await pool.query(`
      SELECT ad.*, p.name AS patient_name, d.name AS doctor_name,
             r.room_type, a.reason, s.name AS staff_name
      FROM admission ad
      LEFT JOIN patient p ON p.patient_id = ad.patient_id
      LEFT JOIN doctor d ON d.doctor_id = ad.doctor_id
      LEFT JOIN room r ON r.room_id = ad.room_id
      LEFT JOIN appointment a ON a.appt_id = ad.appt_id
      LEFT JOIN staff s ON s.staff_id = ad.staff_id
      ORDER BY ad.adm_id DESC
    `);
    res.json(r.rows);
  })
);

router.patch(
  "/admissions/:id/admit",
  ADMISSION,
  h(async (req, res) => {
    const id = idOf(req);
    const { room_id, adm_date, charge, notes } = req.body;

    if (!room_id) throw new HttpError(400, "Room is required");

    // BEGIN -> CALL procedure -> COMMIT (tx() does ROLLBACK if the procedure raises)
    const admission = await tx(async (c) => {
      await c.query(
        "CALL sp_admit_patient($1::int, $2::int, $3::int, $4::date, $5::numeric, $6::text)",
        [
          id,
          room_id,
          req.staff.staff_id,
          isDate(adm_date) ? adm_date : null,
          charge ?? null,
          notes ?? null,
        ]
      );

      const r = await c.query(`SELECT * FROM admission WHERE adm_id = $1`, [id]);
      return r.rows[0];
    });

    res.json({ message: "Patient admitted successfully", admission });
  })
);

router.patch(
  "/admissions/:id/discharge",
  ADMISSION,
  h(async (req, res) => {
    const id = idOf(req);

    const admission = await tx(async (c) => {
      await c.query("CALL sp_discharge_patient($1::int)", [id]);

      const r = await c.query(`SELECT * FROM admission WHERE adm_id = $1`, [id]);
      return r.rows[0];
    });

    res.json({ message: "Patient discharged successfully", admission });
  })
);

router.get(
  "/ward-rooms",
  ADMISSION,
  h(async (req, res) => {
    const [wards, rooms] = await Promise.all([
      pool.query(`
        SELECT w.ward_id, w.dept_id, w.capacity, w.floor, d.dept_name
        FROM ward w
        LEFT JOIN department d ON d.dept_id = w.dept_id
        ORDER BY w.ward_id
      `),
      pool.query(`
        SELECT room_id, ward_id, room_type, floor, capacity, status
        FROM room
        ORDER BY room_id
      `),
    ]);

    res.json({ wards: wards.rows, rooms: rooms.rows });
  })
);

// =========================================
// LAB TESTS  (LAB_TECH)
// =========================================

router.get(
  "/lab-tests",
  LAB_TECH,
  h(async (req, res) => {
    const r = await pool.query(
      `
      SELECT lt.*, p.name AS patient_name, p.phone AS patient_phone,
             d.name AS doctor_name, s.name AS staff_name
      FROM labtest lt
      LEFT JOIN patient p ON p.patient_id = lt.patient_id
      LEFT JOIN doctor d ON d.doctor_id = lt.doctor_id
      LEFT JOIN staff s ON s.staff_id = lt.staff_id
      WHERE lt.status IN ('approved', 'scheduled')
        AND (lt.staff_id IS NULL OR lt.staff_id = $1)
      ORDER BY lt.test_id DESC
      `,
      [req.staff.staff_id]
    );
    res.json(r.rows);
  })
);

router.post(
  "/lab-tests/:id/claim",
  LAB_TECH,
  h(async (req, res) => {
    const id = idOf(req);

    const r = await pool.query(
      `
      UPDATE labtest SET staff_id = $1
      WHERE test_id = $2 AND staff_id IS NULL AND status = 'approved'
      RETURNING *
      `,
      [req.staff.staff_id, id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(
        409,
        "Another staff already took this lab test, or the patient has not approved it yet"
      );
    }

    res.json({ message: "Lab test assigned to you", lab_test: r.rows[0] });
  })
);

router.patch(
  "/lab-tests/:id/schedule",
  LAB_TECH,
  h(async (req, res) => {
    const id = idOf(req);
    const { date, unit_price } = req.body;

    if (!isDate(date)) throw new HttpError(400, "A valid date is required");

    const r = await pool.query(
      `
      UPDATE labtest
      SET date = $1,
          unit_price = COALESCE($2, unit_price),
          status = 'scheduled'
      WHERE test_id = $3
        AND staff_id = $4
        AND status IN ('approved', 'scheduled')
      RETURNING *
      `,
      [date, unit_price ?? null, id, req.staff.staff_id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(403, "This lab test is not assigned to you");
    }

    res.json({ message: "Lab test scheduled", lab_test: r.rows[0] });
  })
);

// =========================================
// SURGERIES  (SURGERY_COORD)
// =========================================

router.get(
  "/surgeries",
  SURGERY,
  h(async (req, res) => {
    const r = await pool.query(
      `
      SELECT s.*, p.name AS patient_name, d.name AS doctor_name,
             st.name AS staff_name
      FROM surgery s
      LEFT JOIN patient p ON p.patient_id = s.patient_id
      LEFT JOIN doctor d ON d.doctor_id = s.doctor_id
      LEFT JOIN staff st ON st.staff_id = s.staff_id
      WHERE s.status IN ('approved', 'scheduled')
        AND (s.staff_id IS NULL OR s.staff_id = $1)
      ORDER BY s.surgery_id DESC
      `,
      [req.staff.staff_id]
    );
    res.json(r.rows);
  })
);

router.post(
  "/surgeries/:id/claim",
  SURGERY,
  h(async (req, res) => {
    const id = idOf(req);

    const r = await pool.query(
      `
      UPDATE surgery SET staff_id = $1
      WHERE surgery_id = $2 AND staff_id IS NULL AND status = 'approved'
      RETURNING *
      `,
      [req.staff.staff_id, id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(
        409,
        "Another staff already took this surgery, or the patient has not approved it yet"
      );
    }

    res.json({ message: "Surgery assigned to you", surgery: r.rows[0] });
  })
);

router.patch(
  "/surgeries/:id/schedule",
  SURGERY,
  h(async (req, res) => {
    const id = idOf(req);
    const { date } = req.body;

    if (!isDate(date)) throw new HttpError(400, "A valid date is required");

    const r = await pool.query(
      `
      UPDATE surgery
      SET date = $1, status = 'scheduled'
      WHERE surgery_id = $2
        AND staff_id = $3
        AND status IN ('approved', 'scheduled')
      RETURNING *
      `,
      [date, id, req.staff.staff_id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(403, "This surgery is not assigned to you");
    }

    res.json({ message: "Surgery scheduled", surgery: r.rows[0] });
  })
);

// =========================================
// BLOOD BANK  (BLOOD_BANK)
// =========================================

router.get(
  "/blood/bank",
  BLOOD,
  h(async (req, res) => {
    const r = await pool.query(`SELECT * FROM blood_bank ORDER BY bank_id`);
    res.json(r.rows);
  })
);

router.get(
  "/blood/requests",
  BLOOD,
  h(async (req, res) => {
    const r = await pool.query(`
      SELECT br.*, s.name AS staff_name, hs.name AS handled_by_name,
             bb.blood_group, bb.available_quantity
      FROM blood_request br
      LEFT JOIN staff s ON s.staff_id = br.staff_id
      LEFT JOIN staff hs ON hs.staff_id = br.handled_by
      LEFT JOIN blood_bank bb ON bb.bank_id = br.bank_id
      ORDER BY br.request_id DESC
    `);
    res.json(r.rows);
  })
);

router.post(
  "/blood/requests",
  BLOOD,
  h(async (req, res) => {
    const bankId = Number(req.body.bank_id);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(bankId) || bankId <= 0) {
      throw new HttpError(400, "bank_id is required");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, "Quantity must be a whole number above 0");
    }

    const bank = await pool.query(
      `SELECT bank_id FROM blood_bank WHERE bank_id = $1`,
      [bankId]
    );

    if (bank.rows.length === 0) {
      throw new HttpError(404, "Blood bank record not found");
    }

    const r = await pool.query(
      `
      INSERT INTO blood_request (staff_id, bank_id, quantity, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
      `,
      [req.staff.staff_id, bankId, quantity]
    );

    res.status(201).json({ message: "Blood request submitted", request: r.rows[0] });
  })
);

router.patch(
  "/blood/requests/:id/decision",
  BLOOD,
  h(async (req, res) => {
    const id = idOf(req);
    const { decision } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      throw new HttpError(400, "decision must be approved or rejected");
    }

    const request = await tx(async (c) => {
      const rq = await c.query(
        `SELECT * FROM blood_request WHERE request_id = $1 FOR UPDATE`,
        [id]
      );

      if (rq.rows.length === 0) throw new HttpError(404, "Request not found");

      const row = rq.rows[0];

      if (row.status !== "pending") {
        throw new HttpError(409, "This request was already processed");
      }

      // Approving fires trigger trg_blood_request_stock, which takes the units out of
      // stock and raises MC409 (-> HTTP 409) when the bank does not have enough.
      const upd = await c.query(
        `
        UPDATE blood_request
        SET status = $1, handled_by = $2, handled_at = CURRENT_TIMESTAMP
        WHERE request_id = $3
        RETURNING *
        `,
        [decision, req.staff.staff_id, id]
      );

      return upd.rows[0];
    });

    res.json({ message: `Request ${decision}`, request });
  })
);

// =========================================
// BILLING + PAYMENTS  (BILLING)
// =========================================

const BILL_JOINS = `
  LEFT JOIN admission ad ON ad.adm_id = b.adm_id
  LEFT JOIN appointment ap ON ap.appt_id = b.appt_id
  LEFT JOIN ambulance_request amb ON amb.request_id = b.ambulance_request_id
  LEFT JOIN billing_surgery bs ON bs.bill_id = b.bill_id
  LEFT JOIN surgery sg ON sg.surgery_id = bs.surgery_id
  LEFT JOIN billing_labtest bl ON bl.bill_id = b.bill_id
  LEFT JOIN labtest lt ON lt.test_id = bl.test_id
  LEFT JOIN patient pt
    ON pt.patient_id = COALESCE(ad.patient_id, ap.patient_id, amb.patient_id, sg.patient_id, lt.patient_id)
  LEFT JOIN staff st ON st.staff_id = b.staff_id
`;

const SOURCE_COLS = `
  CASE
    WHEN b.appt_id IS NOT NULL THEN 'appointment'
    WHEN b.adm_id IS NOT NULL THEN 'admission'
    WHEN b.ambulance_request_id IS NOT NULL THEN 'ambulance'
    WHEN bs.surgery_id IS NOT NULL THEN 'surgery'
    WHEN bl.test_id IS NOT NULL THEN 'labtest'
    ELSE 'other'
  END AS source_type,
  COALESCE(b.appt_id, b.adm_id, b.ambulance_request_id, bs.surgery_id, bl.test_id) AS source_id
`;

router.get(
  "/billing/bills",
  BILLING,
  h(async (req, res) => {
    const r = await pool.query(`
      SELECT b.*, pt.name AS patient_name, st.name AS staff_name,
             ${SOURCE_COLS},
             (COALESCE(b.amount,0) - COALESCE(b.discount,0) + COALESCE(b.tax,0)) AS net_amount,
             COALESCE((SELECT SUM(py.amount) FROM payment py WHERE py.bill_id = b.bill_id), 0) AS paid_amount
      FROM billing b
      ${BILL_JOINS}
      ORDER BY b.bill_id DESC
    `);
    res.json(r.rows);
  })
);

router.get(
  "/billing/payments",
  BILLING,
  h(async (req, res) => {
    const r = await pool.query(`
      SELECT py.payment_id, py.bill_id, py.payment_date, py.amount, py.method,
             py.ref_no, b.status AS bill_status, pt.name AS patient_name,
             ${SOURCE_COLS}
      FROM payment py
      JOIN billing b ON b.bill_id = py.bill_id
      ${BILL_JOINS}
      ORDER BY py.payment_id DESC
    `);
    res.json(r.rows);
  })
);

// Items that can still be billed, already filtered (no duplicates)
router.get(
  "/billing/items",
  BILLING,
  h(async (req, res) => {
    const [appointments, admissions, surgeries, labtests] = await Promise.all([
      pool.query(`
        SELECT a.appt_id AS id, NULL::numeric AS amount,
               'Appointment #' || a.appt_id || ' - ' || COALESCE(p.name, '?') AS label
        FROM appointment a
        LEFT JOIN patient p ON p.patient_id = a.patient_id
        WHERE COALESCE(a.status, '') NOT IN ('cancelled', 'rejected')
          AND NOT EXISTS (SELECT 1 FROM billing b WHERE b.appt_id = a.appt_id)
        ORDER BY a.appt_id DESC
      `),
      pool.query(`
        SELECT ad.adm_id AS id, ad.charge AS amount,
               'Admission #' || ad.adm_id || ' - ' || COALESCE(p.name, '?') AS label
        FROM admission ad
        LEFT JOIN patient p ON p.patient_id = ad.patient_id
        WHERE ad.status <> 'pending'
          AND NOT EXISTS (SELECT 1 FROM billing b WHERE b.adm_id = ad.adm_id)
        ORDER BY ad.adm_id DESC
      `),
      pool.query(`
        SELECT s.surgery_id AS id, NULL::numeric AS amount,
               'Surgery #' || s.surgery_id || ' - ' || COALESCE(p.name, '?') || ' - ' || COALESCE(s.surgery_name, '') AS label
        FROM surgery s
        LEFT JOIN patient p ON p.patient_id = s.patient_id
        WHERE NOT EXISTS (SELECT 1 FROM billing_surgery bs WHERE bs.surgery_id = s.surgery_id)
        ORDER BY s.surgery_id DESC
      `),
      pool.query(`
        SELECT lt.test_id AS id, lt.unit_price AS amount,
               'Lab Test #' || lt.test_id || ' - ' || COALESCE(p.name, '?') || ' - ' || COALESCE(lt.test_name, '') AS label
        FROM labtest lt
        LEFT JOIN patient p ON p.patient_id = lt.patient_id
        WHERE NOT EXISTS (SELECT 1 FROM billing_labtest bl WHERE bl.test_id = lt.test_id)
        ORDER BY lt.test_id DESC
      `),
    ]);

    res.json({
      appointments: appointments.rows,
      admissions: admissions.rows,
      surgeries: surgeries.rows,
      labtests: labtests.rows,
    });
  })
);

router.post(
  "/billing/create",
  BILLING,
  h(async (req, res) => {
    const { source_type } = req.body;
    const sourceId = Number(req.body.source_id);
    const amount = Number(req.body.amount);
    const discount = Number(req.body.discount) || 0;
    const taxAmount = Number(req.body.tax) || 0;

    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      throw new HttpError(400, "Select an item to bill");
    }

    if (!Number.isFinite(amount)) {
      throw new HttpError(400, "Amount must be a number");
    }

    // the procedure validates the rest, inserts billing + junction row
    const bill = await tx(async (c) => {
      const call = await c.query(
        "CALL sp_create_bill($1::text, $2::int, $3::int, $4::numeric, $5::numeric, $6::numeric, NULL::int)",
        [source_type, sourceId, req.staff.staff_id, amount, discount, taxAmount]
      );

      const r = await c.query(`SELECT * FROM billing WHERE bill_id = $1`, [
        call.rows[0].p_bill_id,
      ]);

      return r.rows[0];
    });

    res.status(201).json({ message: "Bill created", bill });
  })
);

// Front desk / cashier collects a cash (or card etc.) payment at the counter,
// on behalf of a patient. One transaction via sp_record_payment: inserts the
// payment row and moves the bill to 'partial' or 'paid'.
router.post(
  "/billing/:id/pay",
  BILLING,
  h(async (req, res) => {
    const id = idOf(req);
    const amount = Number(req.body.amount);
    const method = req.body.method || "cash";
    const refNo = req.body.ref_no || null;
    const notes = req.body.notes || null;

    if (!(amount > 0)) throw new HttpError(400, "Enter a valid payment amount");

    const status = await tx(async (c) => {
      const call = await c.query(
        "CALL sp_record_payment($1::int, $2::numeric, $3::text, $4::text, $5::text, NULL::text)",
        [id, amount, method, refNo, notes]
      );
      return call.rows[0].p_status;
    });

    const bill = await pool.query(`SELECT * FROM billing WHERE bill_id = $1`, [id]);

    res.json({ message: `Payment recorded. Bill is now ${status}.`, bill: bill.rows[0] });
  })
);

router.patch(
  "/billing/:id/approve",
  BILLING,
  h(async (req, res) => {
    const id = idOf(req);

    const r = await pool.query(
      `
      UPDATE billing SET status = 'unpaid'
      WHERE bill_id = $1 AND status = 'pending'
      RETURNING *
      `,
      [id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(409, "Bill is not pending (already approved or not found)");
    }

    res.json({ message: "Bill approved", bill: r.rows[0] });
  })
);

// =========================================
// COMPLAINTS  (COMPLAINT)
// =========================================

router.get(
  "/complaints",
  COMPLAINT,
  h(async (req, res) => {
    const r = await pool.query(
      `
      SELECT c.*, p.name AS patient_name, s.name AS staff_name
      FROM complaint c
      LEFT JOIN patient p ON p.patient_id = c.patient_id
      LEFT JOIN staff s ON s.staff_id = c.staff_id
      WHERE c.staff_id IS NULL OR c.staff_id = $1
      ORDER BY c.date DESC, c.complaint_id DESC
      `,
      [req.staff.staff_id]
    );
    res.json(r.rows);
  })
);

router.post(
  "/complaints/:id/claim",
  COMPLAINT,
  h(async (req, res) => {
    const id = idOf(req);

    const r = await pool.query(
      `
      UPDATE complaint
      SET staff_id = $1,
          status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
      WHERE complaint_id = $2 AND staff_id IS NULL
      RETURNING *
      `,
      [req.staff.staff_id, id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(409, "Another staff already took this complaint");
    }

    res.json({ message: "Complaint assigned to you", complaint: r.rows[0] });
  })
);

router.patch(
  "/complaints/:id/status",
  COMPLAINT,
  h(async (req, res) => {
    const id = idOf(req);
    const { status } = req.body;

    if (!["in_progress", "resolved", "closed"].includes(status)) {
      throw new HttpError(400, "Invalid status");
    }

    const r = await pool.query(
      `
      UPDATE complaint SET status = $1
      WHERE complaint_id = $2 AND staff_id = $3
      RETURNING *
      `,
      [status, id, req.staff.staff_id]
    );

    if (r.rows.length === 0) {
      throw new HttpError(403, "This complaint is not assigned to you");
    }

    res.json({ message: "Complaint updated", complaint: r.rows[0] });
  })
);

// =========================================
// AMBULANCE  (AMBULANCE_COORD)
// =========================================

router.get(
  "/ambulance/vehicles",
  AMBULANCE,
  h(async (req, res) => {
    const r = await pool.query(`SELECT * FROM ambulance ORDER BY ambulance_id`);
    res.json(r.rows);
  })
);

router.get(
  "/ambulance/requests",
  AMBULANCE,
  h(async (req, res) => {
    const r = await pool.query(
      `
      SELECT ar.*, p.name AS patient_name, p.phone AS patient_phone,
             am.vehicle_no, am.vehicle_type, am.base_fare
      FROM ambulance_request ar
      LEFT JOIN patient p ON p.patient_id = ar.patient_id
      LEFT JOIN ambulance am ON am.ambulance_id = ar.ambulance_id
      WHERE ar.status IN ('pending', 'assigned')
         OR ar.staff_id = $1
      ORDER BY ar.request_id DESC
      `,
      [req.staff.staff_id]
    );
    res.json(r.rows);
  })
);

router.patch(
  "/ambulance/requests/:id/assign",
  AMBULANCE,
  h(async (req, res) => {
    const id = idOf(req);
    const ambulanceId = Number(req.body.ambulance_id);

    if (!Number.isInteger(ambulanceId) || ambulanceId <= 0) {
      throw new HttpError(400, "ambulance_id is required");
    }

    await tx(async (c) => {
      await c.query(
        "CALL sp_assign_ambulance($1::int, $2::int, $3::int)",
        [id, req.staff.staff_id, ambulanceId]
      );
    });

    const r = await pool.query(
      `SELECT * FROM ambulance_request WHERE request_id = $1`,
      [id]
    );

    res.json({ message: "Ambulance assigned", request: r.rows[0] });
  })
);

router.patch(
  "/ambulance/requests/:id/complete",
  AMBULANCE,
  h(async (req, res) => {
    const id = idOf(req);
    const charge = Number(req.body.charge);

    if (!(charge >= 0)) throw new HttpError(400, "A valid charge is required");

    const billId = await tx(async (c) => {
      const call = await c.query(
        "CALL sp_complete_ambulance_trip($1::int, $2::int, $3::numeric, NULL::int)",
        [id, req.staff.staff_id, charge]
      );
      return call.rows[0].p_bill_id;
    });

    const [request, bill] = await Promise.all([
      pool.query(`SELECT * FROM ambulance_request WHERE request_id = $1`, [id]),
      pool.query(`SELECT * FROM billing WHERE bill_id = $1`, [billId]),
    ]);

    res.json({
      message: "Trip completed and bill created",
      request: request.rows[0],
      bill: bill.rows[0],
    });
  })
);

module.exports = router;