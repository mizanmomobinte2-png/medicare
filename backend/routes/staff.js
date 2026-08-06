const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, d.dept_name FROM staffs s
      LEFT JOIN department d ON s.dept_id = d.dept_id
      ORDER BY s.staff_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, d.dept_name FROM staffs s
      LEFT JOIN department d ON s.dept_id = d.dept_id
      WHERE s.staff_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Staff not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, email, password, dept_id, salary, phone } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO staffs (name, email, password, dept_id, salary, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, email, password, dept_id || null, salary, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { name, email, password, dept_id, salary, phone } = req.body;
  try {
    const result = await pool.query(
      `UPDATE staffs SET name = COALESCE($1, name), email = COALESCE($2, email),
       password = COALESCE($3, password), dept_id = COALESCE($4, dept_id),
       salary = COALESCE($5, salary), phone = COALESCE($6, phone)
       WHERE staff_id = $7 RETURNING *`,
      [name, email, password, dept_id, salary, phone, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Staff not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM staffs WHERE staff_id = $1 RETURNING staff_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Staff not found" });
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
