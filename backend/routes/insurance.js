const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.name AS patient_name FROM insurance i
      LEFT JOIN patient p ON i.patient_id = p.patient_id
      ORDER BY i.insurance_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.name AS patient_name FROM insurance i
      LEFT JOIN patient p ON i.patient_id = p.patient_id
      WHERE i.insurance_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Insurance not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, policy_number, company_name, coverage, expiry_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO insurance (patient_id, policy_number, company_name, coverage, expiry_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, policy_number, company_name, coverage, expiry_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, policy_number, company_name, coverage, expiry_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE insurance SET patient_id = COALESCE($1, patient_id),
       policy_number = COALESCE($2, policy_number), company_name = COALESCE($3, company_name),
       coverage = COALESCE($4, coverage), expiry_date = COALESCE($5, expiry_date)
       WHERE insurance_id = $6 RETURNING *`,
      [patient_id, policy_number, company_name, coverage, expiry_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Insurance not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM insurance WHERE insurance_id = $1 RETURNING insurance_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Insurance not found" });
    res.json({ message: "Insurance deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
