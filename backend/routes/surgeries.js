const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.name AS patient_name, d.name AS doctor_name
      FROM surgery s
      LEFT JOIN patient p ON s.patient_id = p.patient_id
      LEFT JOIN doctor d ON s.doctor_id = d.doctor_id
      ORDER BY s.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.name AS patient_name, d.name AS doctor_name
      FROM surgery s
      LEFT JOIN patient p ON s.patient_id = p.patient_id
      LEFT JOIN doctor d ON s.doctor_id = d.doctor_id
      WHERE s.surgery_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Surgery not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, doctor_id, surgery_name, date, type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO surgery (patient_id, doctor_id, surgery_name, date, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, doctor_id || null, surgery_name, date || null, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, doctor_id, surgery_name, date, type } = req.body;
  try {
    const result = await pool.query(
      `UPDATE surgery SET patient_id = COALESCE($1, patient_id), doctor_id = COALESCE($2, doctor_id),
       surgery_name = COALESCE($3, surgery_name), date = COALESCE($4, date),
       type = COALESCE($5, type) WHERE surgery_id = $6 RETURNING *`,
      [patient_id, doctor_id, surgery_name, date, type, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Surgery not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM surgery WHERE surgery_id = $1 RETURNING surgery_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Surgery not found" });
    res.json({ message: "Surgery deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
