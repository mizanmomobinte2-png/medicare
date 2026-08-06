const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts.*, d.name AS doctor_name FROM time_slot ts
      LEFT JOIN doctor d ON ts.doctor_id = d.doctor_id
      ORDER BY ts.slot_date, ts.start_time
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts.*, d.name AS doctor_name FROM time_slot ts
      LEFT JOIN doctor d ON ts.doctor_id = d.doctor_id
      WHERE ts.slot_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Time slot not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { doctor_id, slot_date, start_time, end_time, status, room } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO time_slot (doctor_id, slot_date, start_time, end_time, status, room)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [doctor_id, slot_date, start_time, end_time, status || "available", room]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { doctor_id, slot_date, start_time, end_time, status, room } = req.body;
  try {
    const result = await pool.query(
      `UPDATE time_slot SET doctor_id = COALESCE($1, doctor_id), slot_date = COALESCE($2, slot_date),
       start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time),
       status = COALESCE($5, status), room = COALESCE($6, room)
       WHERE slot_id = $7 RETURNING *`,
      [doctor_id, slot_date, start_time, end_time, status, room, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Time slot not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM time_slot WHERE slot_id = $1 RETURNING slot_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Time slot not found" });
    res.json({ message: "Time slot deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
