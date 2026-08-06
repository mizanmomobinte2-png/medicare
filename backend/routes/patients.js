const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patient ORDER BY patient_id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patient WHERE patient_id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, email, password, phone, dob, gender, blood_group, address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patient (name, email, password, phone, dob, gender, blood_group, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, password, phone, dob || null, gender, blood_group, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { name, email, password, phone, dob, gender, blood_group, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE patient SET name = COALESCE($1, name), email = COALESCE($2, email),
       password = COALESCE($3, password), phone = COALESCE($4, phone),
       dob = COALESCE($5, dob), gender = COALESCE($6, gender),
       blood_group = COALESCE($7, blood_group), address = COALESCE($8, address)
       WHERE patient_id = $9 RETURNING *`,
      [name, email, password, phone, dob, gender, blood_group, address, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM patient WHERE patient_id = $1 RETURNING patient_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
