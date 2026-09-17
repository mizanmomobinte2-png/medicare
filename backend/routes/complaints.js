const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name AS patient_name, s.name AS staff_name
      FROM complaint c
      LEFT JOIN patient p ON c.patient_id = p.patient_id
      LEFT JOIN staff s ON c.staff_id = s.staff_id
      ORDER BY c.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name AS patient_name, s.name AS staff_name
      FROM complaint c
      LEFT JOIN patient p ON c.patient_id = p.patient_id
      LEFT JOIN staff s ON c.staff_id = s.staff_id
      WHERE c.complaint_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Complaint not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, staff_id, complaint_type, date, status, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO complaint (patient_id, staff_id, complaint_type, date, status, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, staff_id || null, complaint_type, date || null, status || "open", description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, staff_id, complaint_type, date, status, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE complaint SET patient_id = COALESCE($1, patient_id), staff_id = COALESCE($2, staff_id),
       complaint_type = COALESCE($3, complaint_type), date = COALESCE($4, date),
       status = COALESCE($5, status), description = COALESCE($6, description)
       WHERE complaint_id = $7 RETURNING *`,
      [patient_id, staff_id, complaint_type, date, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Complaint not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM complaint WHERE complaint_id = $1 RETURNING complaint_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Complaint not found" });
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
