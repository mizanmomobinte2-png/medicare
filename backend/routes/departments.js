const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM department ORDER BY dept_id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM department WHERE dept_id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Department not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { dept_name, description, floor, phone, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO department (dept_name, description, floor, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [dept_name, description, floor, phone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { dept_name, description, floor, phone, email } = req.body;
  try {
    const result = await pool.query(
      `UPDATE department SET dept_name = COALESCE($1, dept_name), description = COALESCE($2, description),
       floor = COALESCE($3, floor), phone = COALESCE($4, phone), email = COALESCE($5, email)
       WHERE dept_id = $6 RETURNING *`,
      [dept_name, description, floor, phone, email, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Department not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM department WHERE dept_id = $1 RETURNING dept_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Department not found" });
    res.json({ message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
