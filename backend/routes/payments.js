const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT py.*, b.amount AS bill_amount, b.status AS bill_status,
             p.name AS patient_name
      FROM payment py
      LEFT JOIN billing b ON py.bill_id = b.bill_id
      LEFT JOIN admission ad ON b.adm_id = ad.adm_id
      LEFT JOIN patient p ON ad.patient_id = p.patient_id
      ORDER BY py.payment_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT py.*, b.amount AS bill_amount, b.status AS bill_status
      FROM payment py
      LEFT JOIN billing b ON py.bill_id = b.bill_id
      WHERE py.payment_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Payment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { bill_id, payment_date, amount, method, ref_no, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO payment (bill_id, payment_date, amount, method, ref_no, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [bill_id, payment_date || null, amount, method, ref_no, notes]
    );

    // Update bill status based on total payments
    const totalPaid = await client.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payment WHERE bill_id = $1",
      [bill_id]
    );
    const bill = await client.query("SELECT amount, discount, tax FROM billing WHERE bill_id = $1", [bill_id]);
    const netAmount = parseFloat(bill.rows[0].amount) - parseFloat(bill.rows[0].discount || 0) + parseFloat(bill.rows[0].tax || 0);
    const paid = parseFloat(totalPaid.rows[0].total);

    let newStatus = "partial";
    if (paid >= netAmount) newStatus = "paid";
    else if (paid === 0) newStatus = "unpaid";

    await client.query("UPDATE billing SET status = $1 WHERE bill_id = $2", [newStatus, bill_id]);
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
  const { bill_id, payment_date, amount, method, ref_no, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE payment SET bill_id = COALESCE($1, bill_id), payment_date = COALESCE($2, payment_date),
       amount = COALESCE($3, amount), method = COALESCE($4, method),
       ref_no = COALESCE($5, ref_no), notes = COALESCE($6, notes)
       WHERE payment_id = $7 RETURNING *`,
      [bill_id, payment_date, amount, method, ref_no, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Payment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM payment WHERE payment_id = $1 RETURNING payment_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
