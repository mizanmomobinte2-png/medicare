const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT doc.*, d.dept_name FROM doctor doc
      LEFT JOIN department d ON doc.dept_id = d.dept_id
      ORDER BY doc.doctor_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT doc.*, d.dept_name FROM doctor doc
      LEFT JOIN department d ON doc.dept_id = d.dept_id
      WHERE doc.doctor_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Doctor not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, email, salary, phone, status, specialization, dept_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO doctor (name, email, salary, phone, status, specialization, dept_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, salary, phone, status || "active", specialization, dept_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { name, email, salary, phone, status, specialization, dept_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE doctor SET name = COALESCE($1, name), email = COALESCE($2, email),
       salary = COALESCE($3, salary), phone = COALESCE($4, phone),
       status = COALESCE($5, status), specialization = COALESCE($6, specialization),
       dept_id = COALESCE($7, dept_id) WHERE doctor_id = $8 RETURNING *`,
      [name, email, salary, phone, status, specialization, dept_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Doctor not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM doctor WHERE doctor_id = $1 RETURNING doctor_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Doctor not found" });
    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
