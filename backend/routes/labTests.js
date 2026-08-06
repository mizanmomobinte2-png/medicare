const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lt.*, p.name AS patient_name FROM labtest lt
      LEFT JOIN patient p ON lt.patient_id = p.patient_id
      ORDER BY lt.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lt.*, p.name AS patient_name FROM labtest lt
      LEFT JOIN patient p ON lt.patient_id = p.patient_id
      WHERE lt.test_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Lab test not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, test_name, type, unit_price, result, date } = req.body;
  try {
    const dbResult = await pool.query(
      `INSERT INTO labtest (patient_id, test_name, type, unit_price, result, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, test_name, type, unit_price, result, date || null]
    );
    res.status(201).json(dbResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, test_name, type, unit_price, result, date } = req.body;
  try {
    const dbResult = await pool.query(
      `UPDATE labtest SET patient_id = COALESCE($1, patient_id), test_name = COALESCE($2, test_name),
       type = COALESCE($3, type), unit_price = COALESCE($4, unit_price),
       result = COALESCE($5, result), date = COALESCE($6, date)
       WHERE test_id = $7 RETURNING *`,
      [patient_id, test_name, type, unit_price, result, date, req.params.id]
    );
    if (dbResult.rows.length === 0) return res.status(404).json({ error: "Lab test not found" });
    res.json(dbResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM labtest WHERE test_id = $1 RETURNING test_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Lab test not found" });
    res.json({ message: "Lab test deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
