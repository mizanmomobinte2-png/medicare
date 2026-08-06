const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, ad.patient_id, p.name AS patient_name
      FROM billing b
      LEFT JOIN admission ad ON b.adm_id = ad.adm_id
      LEFT JOIN patient p ON ad.patient_id = p.patient_id
      ORDER BY b.bill_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const bill = await pool.query(`
      SELECT b.*, ad.patient_id, p.name AS patient_name
      FROM billing b
      LEFT JOIN admission ad ON b.adm_id = ad.adm_id
      LEFT JOIN patient p ON ad.patient_id = p.patient_id
      WHERE b.bill_id = $1
    `, [req.params.id]);

    if (bill.rows.length === 0) return res.status(404).json({ error: "Bill not found" });

    const labTests = await pool.query(`
      SELECT lt.* FROM billing_labtest bl
      JOIN labtest lt ON bl.test_id = lt.test_id
      WHERE bl.bill_id = $1
    `, [req.params.id]);

    const surgeries = await pool.query(`
      SELECT s.* FROM billing_surgery bs
      JOIN surgery s ON bs.surgery_id = s.surgery_id
      WHERE bs.bill_id = $1
    `, [req.params.id]);

    const payments = await pool.query(
      "SELECT * FROM payment WHERE bill_id = $1 ORDER BY payment_date",
      [req.params.id]
    );

    res.json({
      ...bill.rows[0],
      lab_tests: labTests.rows,
      surgeries: surgeries.rows,
      payments: payments.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { adm_id, bill_date, amount, discount, tax, status, lab_test_ids, surgery_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO billing (adm_id, bill_date, amount, discount, tax, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [adm_id || null, bill_date || null, amount, discount || 0, tax || 0, status || "unpaid"]
    );
    const billId = result.rows[0].bill_id;

    if (lab_test_ids && lab_test_ids.length > 0) {
      for (const testId of lab_test_ids) {
        await client.query(
          "INSERT INTO billing_labtest (bill_id, test_id) VALUES ($1, $2)",
          [billId, testId]
        );
      }
    }
    if (surgery_ids && surgery_ids.length > 0) {
      for (const surgeryId of surgery_ids) {
        await client.query(
          "INSERT INTO billing_surgery (bill_id, surgery_id) VALUES ($1, $2)",
          [billId, surgeryId]
        );
      }
    }
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  const { adm_id, bill_date, amount, discount, tax, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE billing SET adm_id = COALESCE($1, adm_id), bill_date = COALESCE($2, bill_date),
       amount = COALESCE($3, amount), discount = COALESCE($4, discount),
       tax = COALESCE($5, tax), status = COALESCE($6, status)
       WHERE bill_id = $7 RETURNING *`,
      [adm_id, bill_date, amount, discount, tax, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Bill not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM billing WHERE bill_id = $1 RETURNING bill_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Bill not found" });
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
