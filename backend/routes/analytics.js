// /api/analytics  -> admin only.
// Every query joins several tables and/or aggregates (COUNT, SUM, FILTER, GROUP BY),
// and some call the SQL functions fn_bill_balance / fn_ward_occupancy / fn_doctor_recent_appointments.

const express = require("express");
const router = express.Router();
const pool = require("../db");

const { verifyToken } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(verifyToken, authorize("admin"));

const run = (sql) => async (req, res) => {
  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Analytics error:", req.originalUrl, err);
    res.status(500).json({ error: err.message });
  }
};

// 1) Top doctors: appointments per doctor (joins doctor + department + appointment)
router.get(
  "/top-doctors",
  run(`
    SELECT d.doctor_id,
           d.name,
           d.specialization,
           dep.dept_name,
           COUNT(a.appt_id)                                  AS total_appointments,
           COUNT(*) FILTER (WHERE a.status = 'completed')    AS completed,
           COUNT(DISTINCT a.patient_id)                      AS unique_patients,
           fn_doctor_recent_appointments(d.doctor_id, 30)    AS last_30_days
    FROM doctor d
    LEFT JOIN department dep ON dep.dept_id = d.dept_id
    LEFT JOIN appointment a  ON a.doctor_id = d.doctor_id
    GROUP BY d.doctor_id, dep.dept_name
    ORDER BY completed DESC, total_appointments DESC
    LIMIT 10
  `)
);

// 2) Monthly revenue: billed vs collected (billing + payment, aggregated by month)
router.get(
  "/monthly-revenue",
  run(`
    SELECT TO_CHAR(DATE_TRUNC('month', x.bill_date), 'YYYY-MM') AS month,
           COUNT(*)                                             AS bills,
           SUM(x.net_amount)                                    AS billed,
           SUM(x.paid_amount)                                   AS collected,
           SUM(x.net_amount) - SUM(x.paid_amount)               AS outstanding
    FROM (
      SELECT b.bill_id,
             b.bill_date,
             COALESCE(b.amount, 0) - COALESCE(b.discount, 0) + COALESCE(b.tax, 0) AS net_amount,
             COALESCE(pay.paid, 0) AS paid_amount
      FROM billing b
      LEFT JOIN (
        SELECT bill_id, SUM(amount) AS paid
        FROM payment
        GROUP BY bill_id
      ) pay ON pay.bill_id = b.bill_id
    ) x
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12
  `)
);

// 3) Ward occupancy (ward + department + room, uses fn_ward_occupancy)
router.get(
  "/ward-occupancy",
  run(`
    SELECT w.ward_id,
           dep.dept_name,
           w.capacity,
           COUNT(r.room_id)                                            AS total_rooms,
           COUNT(*) FILTER (WHERE LOWER(r.status) = 'occupied')        AS occupied_rooms,
           fn_ward_occupancy(w.ward_id)                                AS occupancy_pct
    FROM ward w
    LEFT JOIN department dep ON dep.dept_id = w.dept_id
    LEFT JOIN room r         ON r.ward_id = w.ward_id
    GROUP BY w.ward_id, dep.dept_name
    ORDER BY occupancy_pct DESC, w.ward_id
  `)
);

// 4) Staff workload by work role (staff + 6 tables counted with subqueries)
router.get(
  "/staff-workload",
  run(`
    SELECT t.*,
           (t.appointments + t.lab_tests + t.surgeries + t.admissions + t.complaints + t.bills) AS total
    FROM (
      SELECT s.staff_id,
             s.name,
             s.staff_role,
             (SELECT COUNT(*) FROM appointment a WHERE a.staff_id = s.staff_id) AS appointments,
             (SELECT COUNT(*) FROM labtest l     WHERE l.staff_id = s.staff_id) AS lab_tests,
             (SELECT COUNT(*) FROM surgery g     WHERE g.staff_id = s.staff_id) AS surgeries,
             (SELECT COUNT(*) FROM admission ad  WHERE ad.staff_id = s.staff_id) AS admissions,
             (SELECT COUNT(*) FROM complaint c   WHERE c.staff_id = s.staff_id) AS complaints,
             (SELECT COUNT(*) FROM billing b     WHERE b.staff_id = s.staff_id) AS bills
      FROM staff s
    ) t
    ORDER BY total DESC, t.name
  `)
);

// 5) Patients with the highest unpaid balance (patient resolved through 4 possible bill sources,
//    balance computed by fn_bill_balance)
router.get(
  "/outstanding-balances",
  run(`
    WITH bill_patient AS (
      SELECT b.bill_id,
             COALESCE(ad.patient_id, ap.patient_id, sg.patient_id, lt.patient_id) AS patient_id
      FROM billing b
      LEFT JOIN admission ad       ON ad.adm_id = b.adm_id
      LEFT JOIN appointment ap     ON ap.appt_id = b.appt_id
      LEFT JOIN billing_surgery bs ON bs.bill_id = b.bill_id
      LEFT JOIN surgery sg         ON sg.surgery_id = bs.surgery_id
      LEFT JOIN billing_labtest bl ON bl.bill_id = b.bill_id
      LEFT JOIN labtest lt         ON lt.test_id = bl.test_id
      WHERE b.status IN ('unpaid', 'partial')
    )
    SELECT p.patient_id,
           p.name,
           p.phone,
           COUNT(*)                        AS open_bills,
           SUM(fn_bill_balance(bp.bill_id)) AS balance
    FROM bill_patient bp
    JOIN patient p ON p.patient_id = bp.patient_id
    GROUP BY p.patient_id, p.name, p.phone
    HAVING SUM(fn_bill_balance(bp.bill_id)) > 0
    ORDER BY balance DESC
    LIMIT 10
  `)
);

// 6) Blood stock vs demand per blood group (blood_bank + blood_request)
router.get(
  "/blood-demand",
  run(`
    SELECT bb.bank_id,
           bb.blood_group,
           bb.available_quantity,
           bb.expiry_date,
           COALESCE(SUM(br.quantity) FILTER (WHERE br.status = 'pending'), 0)  AS pending_units,
           COALESCE(SUM(br.quantity) FILTER (WHERE br.status = 'approved'), 0) AS approved_units,
           COUNT(br.request_id)                                                AS total_requests
    FROM blood_bank bb
    LEFT JOIN blood_request br ON br.bank_id = bb.bank_id
    GROUP BY bb.bank_id
    ORDER BY pending_units DESC, bb.blood_group
  `)
);

// 7) Billing audit log written by trigger trg_billing_audit
router.get(
  "/billing-audit",
  run(`
    SELECT audit_id, bill_id, action, old_status, new_status,
           old_amount, new_amount, changed_by, changed_at
    FROM billing_audit
    ORDER BY audit_id DESC
    LIMIT 20
  `)
);

module.exports = router;