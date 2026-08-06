const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.name AS patient_name, d.name AS doctor_name, s.name AS staff_name
      FROM appointment a
      LEFT JOIN patient p ON a.patient_id = p.patient_id
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN staffs s ON a.staff_id = s.staff_id
      ORDER BY a.appt_date DESC, a.appt_time
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.name AS patient_name, d.name AS doctor_name, s.name AS staff_name
      FROM appointment a
      LEFT JOIN patient p ON a.patient_id = p.patient_id
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN staffs s ON a.staff_id = s.staff_id
      WHERE a.appt_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Appointment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, doctor_id, staff_id, appt_date, appt_time, status, reason, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO appointment (patient_id, doctor_id, staff_id, appt_date, appt_time, status, reason, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [patient_id, doctor_id || null, staff_id || null, appt_date, appt_time, status || "pending", reason, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, doctor_id, staff_id, appt_date, appt_time, status, reason, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointment SET patient_id = COALESCE($1, patient_id), doctor_id = COALESCE($2, doctor_id),
       staff_id = COALESCE($3, staff_id), appt_date = COALESCE($4, appt_date),
       appt_time = COALESCE($5, appt_time), status = COALESCE($6, status),
       reason = COALESCE($7, reason), notes = COALESCE($8, notes)
       WHERE appt_id = $9 RETURNING *`,
      [patient_id, doctor_id, staff_id, appt_date, appt_time, status, reason, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Appointment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM appointment WHERE appt_id = $1 RETURNING appt_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
