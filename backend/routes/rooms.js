const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, w.ward_id, d.dept_name FROM room r
      LEFT JOIN ward w ON r.ward_id = w.ward_id
      LEFT JOIN department d ON w.dept_id = d.dept_id
      ORDER BY r.room_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, w.ward_id, d.dept_name FROM room r
      LEFT JOIN ward w ON r.ward_id = w.ward_id
      LEFT JOIN department d ON w.dept_id = d.dept_id
      WHERE r.room_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Room not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { ward_id, room_type, floor, capacity, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO room (ward_id, room_type, floor, capacity, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [ward_id || null, room_type, floor, capacity, status || "available"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { ward_id, room_type, floor, capacity, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE room SET ward_id = COALESCE($1, ward_id), room_type = COALESCE($2, room_type),
       floor = COALESCE($3, floor), capacity = COALESCE($4, capacity),
       status = COALESCE($5, status) WHERE room_id = $6 RETURNING *`,
      [ward_id, room_type, floor, capacity, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Room not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM room WHERE room_id = $1 RETURNING room_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Room not found" });
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
