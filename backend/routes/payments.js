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
      sg.patient_id,
      lt.patient_id
    ) AS patient_id,

    pt.name AS patient_name,

    CASE
      WHEN b.appt_id IS NOT NULL
        THEN 'appointment'

      WHEN b.adm_id IS NOT NULL
        THEN 'admission'

      WHEN bs.surgery_id IS NOT NULL
        THEN 'surgery'

      WHEN bl.test_id IS NOT NULL
        THEN 'labtest'

      ELSE 'other'
    END AS source_type,

    COALESCE(
      b.appt_id,
      b.adm_id,
      bs.surgery_id,
      bl.test_id
    ) AS source_id

  FROM payment p

  JOIN billing b
    ON p.bill_id = b.bill_id

  LEFT JOIN admission a
    ON b.adm_id = a.adm_id

  LEFT JOIN appointment ap
    ON b.appt_id = ap.appt_id

  LEFT JOIN billing_surgery bs
    ON b.bill_id = bs.bill_id

  LEFT JOIN surgery sg
    ON bs.surgery_id = sg.surgery_id

  LEFT JOIN billing_labtest bl
    ON b.bill_id = bl.bill_id

  LEFT JOIN labtest lt
    ON bl.test_id = lt.test_id

  LEFT JOIN patient pt
    ON pt.patient_id =
       COALESCE(
         a.patient_id,
         ap.patient_id,
         sg.patient_id,
         lt.patient_id
       )
`;

// =====================================================
// GET ALL PAYMENTS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      ${PAYMENT_QUERY}

      ORDER BY p.payment_id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(
      "Get payments error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// GET PAYMENTS OF A PATIENT
// =====================================================

router.get(
  "/patient/:patientId",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT *
          FROM (
            ${PAYMENT_QUERY}
          ) payment_data

          WHERE patient_id = $1

          ORDER BY payment_id DESC
          `,
          [req.params.patientId]
        );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Patient payments error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET PAYMENTS HANDLED BY STAFF
// =====================================================

router.get(
  "/staff/:staffId",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT *
          FROM (
            ${PAYMENT_QUERY}
          ) payment_data

          WHERE staff_id = $1

          ORDER BY payment_id DESC
          `,
          [req.params.staffId]
        );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Staff payments error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET SINGLE PAYMENT
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const result =
      await pool.query(
        `
        SELECT *
        FROM (
          ${PAYMENT_QUERY}
        ) payment_data

        WHERE payment_id = $1
        `,
        [req.params.id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Payment not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(
      "Get payment error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// PATIENT MAKES PAYMENT
// =====================================================

router.post("/", async (req, res) => {
  const {
    bill_id,
    patient_id,
    payment_date,
    amount,
    method,
    ref_no,
    notes,
  } = req.body;

  const client =
    await pool.connect();

  try {
    if (!bill_id) {
      return res.status(400).json({
        error:
          "Please select a bill first.",
      });
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        error:
          "Enter a valid payment amount.",
      });
    }

    if (!method) {
      return res.status(400).json({
        error:
          "Payment method is required.",
      });
    }

    await client.query("BEGIN");

    // -----------------------------------------
    // LOCK BILL
    // -----------------------------------------

    const billResult =
      await client.query(
        `
        SELECT
          b.*,

          COALESCE(
            a.patient_id,
            ap.patient_id,
            sg.patient_id,
            lt.patient_id
          ) AS patient_id

        FROM billing b

        LEFT JOIN admission a
          ON b.adm_id = a.adm_id

        LEFT JOIN appointment ap
          ON b.appt_id =
             ap.appt_id

        LEFT JOIN billing_surgery bs
          ON b.bill_id = bs.bill_id

        LEFT JOIN surgery sg
          ON bs.surgery_id =
             sg.surgery_id

        LEFT JOIN billing_labtest bl
          ON b.bill_id = bl.bill_id

        LEFT JOIN labtest lt
          ON bl.test_id =
             lt.test_id

        WHERE b.bill_id = $1

        FOR UPDATE OF b
        `,
        [bill_id]
      );

    if (
      billResult.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        error: "Bill not found.",
      });
    }

    const bill =
      billResult.rows[0];

    // -----------------------------------------
    // PATIENT OWNERSHIP CHECK
    // -----------------------------------------

    if (
      patient_id &&
      Number(
        bill.patient_id
      ) !==
        Number(
          patient_id
        )
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(403).json({
        error:
          "This bill does not belong to this patient.",
      });
    }

    // -----------------------------------------
    // BILL MUST BE APPROVED FIRST
    // -----------------------------------------

    if (
      bill.status === "pending"
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        error:
          "Staff must approve this bill before payment.",
      });
    }

    if (
      bill.status === "paid"
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        error:
          "This bill is already fully paid.",
      });
    }

    // -----------------------------------------
    // BILL TOTAL
    // -----------------------------------------

    const netAmount =
      Number(
        bill.amount || 0
      ) -
      Number(
        bill.discount || 0
      ) +
      Number(
        bill.tax || 0
      );

    // -----------------------------------------
    // PREVIOUS PAYMENTS
    // -----------------------------------------

    const previousResult =
      await client.query(
        `
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS paid_amount

        FROM payment

        WHERE bill_id = $1
        `,
        [bill_id]
      );

    const alreadyPaid =
      Number(
        previousResult.rows[0]
          .paid_amount || 0
      );

    const remainingBefore =
      netAmount -
      alreadyPaid;

    if (
      Number(amount) >
      remainingBefore
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        error:
          `Maximum payable amount is ${remainingBefore.toFixed(
            2
          )}`,
      });
    }

    // -----------------------------------------
    // INSERT PAYMENT
    // -----------------------------------------

    const paymentResult =
      await client.query(
        `
        INSERT INTO payment
        (
          bill_id,
          payment_date,
          amount,
          method,
          ref_no,
          notes
        )

        VALUES
        (
          $1,
          COALESCE(
            $2,
            CURRENT_DATE
          ),
          $3,
          $4,
          $5,
          $6
        )

        RETURNING *
        `,
        [
          bill_id,
          payment_date || null,
          Number(amount),
          method,
          ref_no || null,
          notes || null,
        ]
      );

    const totalPaid =
      alreadyPaid +
      Number(amount);

    const remainingAmount =
      Math.max(
        netAmount -
          totalPaid,
        0
      );

    const newStatus =
      remainingAmount <= 0
        ? "paid"
        : "partial";

    // -----------------------------------------
    // UPDATE BILL STATUS
    // -----------------------------------------

    await client.query(
      `
      UPDATE billing

      SET status = $1

      WHERE bill_id = $2
      `,
      [
        newStatus,
        bill_id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message:
        "Payment successful.",

      payment:
        paymentResult.rows[0],

      bill_status:
        newStatus,

      net_amount:
        netAmount,

      paid_amount:
        totalPaid,

      remaining_amount:
        remainingAmount,
    });
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Payment create error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;