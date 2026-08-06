const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, d.dept_name FROM ward w
      LEFT JOIN department d ON w.dept_id = d.dept_id
      ORDER BY w.ward_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, d.dept_name FROM ward w
      LEFT JOIN department d ON w.dept_id = d.dept_id
      WHERE w.ward_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Ward not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { dept_id, capacity, floor } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO ward (dept_id, capacity, floor) VALUES ($1, $2, $3) RETURNING *",
      [dept_id || null, capacity, floor]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { dept_id, capacity, floor } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ward SET dept_id = COALESCE($1, dept_id), capacity = COALESCE($2, capacity),
       floor = COALESCE($3, floor) WHERE ward_id = $4 RETURNING *`,
      [dept_id, capacity, floor, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Ward not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM ward WHERE ward_id = $1 RETURNING ward_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Ward not found" });
    res.json({ message: "Ward deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
