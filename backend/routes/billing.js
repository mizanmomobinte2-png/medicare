const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================
// COMMON BILL DATA
// =====================================

const BILL_BASE_CTE = `
  WITH bill_base AS (
    SELECT
      b.*,

      COALESCE(
        ad.patient_id,
        a.patient_id,
        amb.patient_id,

        (
          SELECT s.patient_id
          FROM billing_surgery bs
          JOIN surgery s
            ON bs.surgery_id = s.surgery_id
          WHERE bs.bill_id = b.bill_id
          LIMIT 1
        ),

        (
          SELECT lt.patient_id
          FROM billing_labtest bl
          JOIN labtest lt
            ON bl.test_id = lt.test_id
          WHERE bl.bill_id = b.bill_id
          LIMIT 1
        )
      ) AS patient_id,

      CASE
        WHEN b.appt_id IS NOT NULL
          THEN 'appointment'

        WHEN b.adm_id IS NOT NULL
          THEN 'admission'

        WHEN b.ambulance_request_id IS NOT NULL
          THEN 'ambulance'

        WHEN EXISTS (
          SELECT 1
          FROM billing_surgery bs
          WHERE bs.bill_id = b.bill_id
        )
          THEN 'surgery'

        WHEN EXISTS (
          SELECT 1
          FROM billing_labtest bl
          WHERE bl.bill_id = b.bill_id
        )
          THEN 'labtest'

        ELSE 'other'
      END AS source_type,

      CASE
        WHEN b.appt_id IS NOT NULL
          THEN b.appt_id

        WHEN b.adm_id IS NOT NULL
          THEN b.adm_id

        WHEN b.ambulance_request_id IS NOT NULL
          THEN b.ambulance_request_id

        WHEN EXISTS (
          SELECT 1
          FROM billing_surgery bs
          WHERE bs.bill_id = b.bill_id
        )
          THEN (
            SELECT bs.surgery_id
            FROM billing_surgery bs
            WHERE bs.bill_id = b.bill_id
            LIMIT 1
          )

        WHEN EXISTS (
          SELECT 1
          FROM billing_labtest bl
          WHERE bl.bill_id = b.bill_id
        )
          THEN (
            SELECT bl.test_id
            FROM billing_labtest bl
            WHERE bl.bill_id = b.bill_id
            LIMIT 1
          )

        ELSE NULL
      END AS source_id

    FROM billing b

    LEFT JOIN admission ad
      ON b.adm_id = ad.adm_id

    LEFT JOIN appointment a
      ON b.appt_id = a.appt_id

    LEFT JOIN ambulance_request amb
      ON b.ambulance_request_id = amb.request_id
  )
`;


// =====================================
// GET ALL BILLS (admin / staff only)
// =====================================

router.get("/", async (req, res) => {
  if (req.user.role === "patient") {
    return res.status(403).json({ error: "Access forbidden" });
  }

  try {
    const result = await pool.query(`
      ${BILL_BASE_CTE}

      SELECT
        bb.*,
        p.name AS patient_name,
        st.name AS staff_name,

        (
          COALESCE(bb.amount, 0)
          - COALESCE(bb.discount, 0)
          + COALESCE(bb.tax, 0)
        ) AS net_amount,

        COALESCE(
          (
            SELECT SUM(py.amount)
            FROM payment py
            WHERE py.bill_id = bb.bill_id
          ),
          0
        ) AS paid_amount

      FROM bill_base bb

      LEFT JOIN patient p
        ON bb.patient_id = p.patient_id

      LEFT JOIN staff st
        ON bb.staff_id = st.staff_id

      ORDER BY
        bb.bill_date DESC,
        bb.bill_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Get bills error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// GET BILLS HANDLED BY ONE STAFF (admin, or that staff)
// =====================================

router.get(
  "/staff/:staffId",
  async (req, res) => {
    const staffId = Number(req.params.staffId);

    if (req.user.role === "staff" && req.user.id !== staffId) {
      return res.status(403).json({ error: "You can access only your own bills" });
    }

    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access forbidden" });
    }

    try {
      const result = await pool.query(
        `
        ${BILL_BASE_CTE}

        SELECT
          bb.*,

          p.name AS patient_name,

          st.name AS staff_name,

          (
            COALESCE(bb.amount, 0)
            - COALESCE(bb.discount, 0)
            + COALESCE(bb.tax, 0)
          ) AS net_amount,

          COALESCE(
            (
              SELECT SUM(py.amount)
              FROM payment py
              WHERE py.bill_id = bb.bill_id
            ),
            0
          ) AS paid_amount

        FROM bill_base bb

        LEFT JOIN patient p
          ON bb.patient_id = p.patient_id

        LEFT JOIN staff st
          ON bb.staff_id = st.staff_id

        WHERE bb.staff_id = $1

        ORDER BY
          bb.bill_date DESC,
          bb.bill_id DESC
        `,
        [staffId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Staff bills error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET BILLS OF ONE PATIENT (that patient, or admin/staff)
// =====================================

router.get(
  "/patient/:patientId",
  async (req, res) => {
    const patientId = Number(req.params.patientId);

    if (req.user.role === "patient" && req.user.id !== patientId) {
      return res.status(403).json({ error: "You can access only your own bills" });
    }

    try {
      const result = await pool.query(
        `
        ${BILL_BASE_CTE}

        SELECT
          bb.*,

          p.name AS patient_name,

          st.name AS staff_name,

          (
            COALESCE(bb.amount, 0)
            - COALESCE(bb.discount, 0)
            + COALESCE(bb.tax, 0)
          ) AS net_amount,

          COALESCE(
            (
              SELECT SUM(py.amount)
              FROM payment py
              WHERE py.bill_id = bb.bill_id
            ),
            0
          ) AS paid_amount

        FROM bill_base bb

        LEFT JOIN patient p
          ON bb.patient_id = p.patient_id

        LEFT JOIN staff st
          ON bb.staff_id = st.staff_id

        WHERE bb.patient_id = $1

        ORDER BY
          bb.bill_date DESC,
          bb.bill_id DESC
        `,
        [patientId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Patient bills error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET SINGLE BILL (owner patient, or admin/staff)
// =====================================

router.get("/:id", async (req, res) => {
  try {
    const bill = await pool.query(
      `
      ${BILL_BASE_CTE}

      SELECT
        bb.*,
        p.name AS patient_name,
        st.name AS staff_name,

        (
          COALESCE(bb.amount, 0)
          - COALESCE(bb.discount, 0)
          + COALESCE(bb.tax, 0)
        ) AS net_amount

      FROM bill_base bb

      LEFT JOIN patient p
        ON bb.patient_id = p.patient_id

      LEFT JOIN staff st
        ON bb.staff_id = st.staff_id

      WHERE bb.bill_id = $1
      `,
      [req.params.id]
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({
        error: "Bill not found",
      });
    }

    if (
      req.user.role === "patient" &&
      Number(bill.rows[0].patient_id) !== req.user.id
    ) {
      return res.status(403).json({ error: "This bill does not belong to you" });
    }

    const labTests = await pool.query(
      `
      SELECT lt.*

      FROM billing_labtest bl

      JOIN labtest lt
        ON bl.test_id = lt.test_id

      WHERE bl.bill_id = $1
      `,
      [req.params.id]
    );

    const surgeries = await pool.query(
      `
      SELECT s.*

      FROM billing_surgery bs

      JOIN surgery s
        ON bs.surgery_id = s.surgery_id

      WHERE bs.bill_id = $1
      `,
      [req.params.id]
    );

    const payments = await pool.query(
      `
      SELECT *
      FROM payment
      WHERE bill_id = $1
      ORDER BY payment_date DESC
      `,
      [req.params.id]
    );

    res.json({
      ...bill.rows[0],

      lab_tests:
        labTests.rows,

      surgeries:
        surgeries.rows,

      payments:
        payments.rows,
    });
  } catch (err) {
    console.error(
      "Get bill error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// STAFF CREATE BILL
// Kept for backward compatibility; the staff dashboard now uses
// POST /api/staff-work/billing/create (goes through sp_create_bill).
// Restricted to admin - see server.js LEGACY_STAFF_ROUTES.
//
// source_type:
// appointment
// admission
// surgery
// labtest
// =====================================

router.post(
  "/staff/create",
  async (req, res) => {
    const {
      staff_id,
      source_type,
      source_id,
      amount,
      discount,
      tax,
    } = req.body;

    const client =
      await pool.connect();

    try {
      if (
        !staff_id ||
        !source_type ||
        !source_id
      ) {
        return res.status(400).json({
          error:
            "staff_id, source_type and source_id are required",
        });
      }

      if (
        amount === undefined ||
        Number(amount) <= 0
      ) {
        return res.status(400).json({
          error:
            "Valid bill amount is required",
        });
      }

      const staffCheck =
        await client.query(
          `
          SELECT staff_id
          FROM staff
          WHERE staff_id = $1
          `,
          [staff_id]
        );

      if (
        staffCheck.rows.length === 0
      ) {
        return res.status(404).json({
          error: "Staff not found",
        });
      }

      await client.query("BEGIN");

      let patientId = null;
      let appointmentId = null;
      let admissionId = null;

      if (
        source_type ===
        "appointment"
      ) {
        const source =
          await client.query(
            `
            SELECT
              appt_id,
              patient_id,
              staff_id

            FROM appointment

            WHERE appt_id = $1
            `,
            [source_id]
          );

        if (
          source.rows.length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({
            error:
              "Appointment not found",
          });
        }

        if (
          Number(
            source.rows[0].staff_id
          ) !== Number(staff_id)
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(403).json({
            error:
              "This appointment is not assigned to you",
          });
        }

        const duplicate =
          await client.query(
            `
            SELECT bill_id
            FROM billing
            WHERE appt_id = $1
            `,
            [source_id]
          );

        if (
          duplicate.rows.length > 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(409).json({
            error:
              "Bill already exists for this appointment",
          });
        }

        patientId =
          source.rows[0].patient_id;

        appointmentId =
          Number(source_id);
      }

      else if (
        source_type ===
        "admission"
      ) {
        const source =
          await client.query(
            `
            SELECT
              adm_id,
              patient_id
            FROM admission
            WHERE adm_id = $1
            `,
            [source_id]
          );

        if (
          source.rows.length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({
            error:
              "Admission not found",
          });
        }

        const duplicate =
          await client.query(
            `
            SELECT bill_id
            FROM billing
            WHERE adm_id = $1
            `,
            [source_id]
          );

        if (
          duplicate.rows.length > 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(409).json({
            error:
              "Bill already exists for this admission",
          });
        }

        patientId =
          source.rows[0].patient_id;

        admissionId =
          Number(source_id);
      }

      else if (
        source_type === "surgery"
      ) {
        const source =
          await client.query(
            `
            SELECT
              surgery_id,
              patient_id
            FROM surgery
            WHERE surgery_id = $1
            `,
            [source_id]
          );

        if (
          source.rows.length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({
            error:
              "Surgery not found",
          });
        }

        const duplicate =
          await client.query(
            `
            SELECT bs.bill_id

            FROM billing_surgery bs

            WHERE bs.surgery_id = $1
            `,
            [source_id]
          );

        if (
          duplicate.rows.length > 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(409).json({
            error:
              "Bill already exists for this surgery",
          });
        }

        patientId =
          source.rows[0].patient_id;
      }

      else if (
        source_type === "labtest"
      ) {
        const source =
          await client.query(
            `
            SELECT
              test_id,
              patient_id
            FROM labtest
            WHERE test_id = $1
            `,
            [source_id]
          );

        if (
          source.rows.length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({
            error:
              "Lab test not found",
          });
        }

        const duplicate =
          await client.query(
            `
            SELECT bl.bill_id

            FROM billing_labtest bl

            WHERE bl.test_id = $1
            `,
            [source_id]
          );

        if (
          duplicate.rows.length > 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(409).json({
            error:
              "Bill already exists for this lab test",
          });
        }

        patientId =
          source.rows[0].patient_id;
      }

      else {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          error:
            "Invalid source_type",
        });
      }

      const billResult =
        await client.query(
          `
          INSERT INTO billing
          (
            adm_id,
            appt_id,
            staff_id,
            bill_date,
            amount,
            discount,
            tax,
            status
          )

          VALUES
          (
            $1,
            $2,
            $3,
            CURRENT_DATE,
            $4,
            $5,
            $6,
            'pending'
          )

          RETURNING *
          `,
          [
            admissionId,
            appointmentId,
            staff_id,
            Number(amount),
            Number(discount) || 0,
            Number(tax) || 0,
          ]
        );

      const billId =
        billResult.rows[0].bill_id;

      if (
        source_type === "surgery"
      ) {
        await client.query(
          `
          INSERT INTO billing_surgery
          (
            bill_id,
            surgery_id
          )

          VALUES ($1,$2)
          `,
          [
            billId,
            source_id,
          ]
        );
      }

      if (
        source_type === "labtest"
      ) {
        await client.query(
          `
          INSERT INTO billing_labtest
          (
            bill_id,
            test_id
          )

          VALUES ($1,$2)
          `,
          [
            billId,
            source_id,
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      res.status(201).json({
        message:
          "Bill created successfully",

        patient_id:
          patientId,

        source_type,

        source_id:
          Number(source_id),

        bill:
          billResult.rows[0],
      });
    } catch (err) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Staff create bill error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    } finally {
      client.release();
    }
  }
);


// =====================================
// STAFF APPROVE BILL (admin - legacy path; staff use /api/staff-work/billing/:id/approve)
// pending -> unpaid
// =====================================

router.patch(
  "/:id/staff-approve",
  async (req, res) => {
    const {
      staff_id,
    } = req.body;

    try {
      if (!staff_id) {
        return res.status(400).json({
          error:
            "staff_id is required",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE billing

          SET status = 'unpaid'

          WHERE
            bill_id = $1
            AND staff_id = $2
            AND status = 'pending'

          RETURNING *
          `,
          [
            req.params.id,
            staff_id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(409).json({
          error:
            "Bill is not pending or was created by another staff",
        });
      }

      res.json({
        message:
          "Bill approved successfully",

        bill:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "Approve bill error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// UPDATE BILL (admin only, see server.js)
// =====================================

router.put("/:id", async (req, res) => {
  const {
    amount,
    discount,
    tax,
    status,
  } = req.body;

  try {
    const result =
      await pool.query(
        `
        UPDATE billing

        SET
          amount =
            COALESCE(
              $1,
              amount
            ),

          discount =
            COALESCE(
              $2,
              discount
            ),

          tax =
            COALESCE(
              $3,
              tax
            ),

          status =
            COALESCE(
              $4,
              status
            )

        WHERE bill_id = $5

        RETURNING *
        `,
        [
          amount,
          discount,
          tax,
          status,
          req.params.id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error: "Bill not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// DELETE BILL (admin only, see server.js)
// =====================================

router.delete("/:id", async (req, res) => {
  try {
    const result =
      await pool.query(
        `
        DELETE FROM billing
        WHERE bill_id = $1
        RETURNING bill_id
        `,
        [req.params.id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error: "Bill not found",
      });
    }

    res.json({
      message: "Bill deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;