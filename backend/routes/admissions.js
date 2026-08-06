const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ad.*, p.name AS patient_name, r.room_type, r.room_id
      FROM admission ad
      LEFT JOIN patient p ON ad.patient_id = p.patient_id
      LEFT JOIN room r ON ad.room_id = r.room_id
      ORDER BY ad.adm_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ad.*, p.name AS patient_name, r.room_type, r.room_id
      FROM admission ad
      LEFT JOIN patient p ON ad.patient_id = p.patient_id
      LEFT JOIN room r ON ad.room_id = r.room_id
      WHERE ad.adm_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Admission not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, room_id, adm_date, discharge_date, status, charge, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO admission (patient_id, room_id, adm_date, discharge_date, status, charge, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patient_id, room_id || null, adm_date || null, discharge_date || null, status || "admitted", charge, notes]
    );
    if (room_id) {
      await pool.query("UPDATE room SET status = 'occupied' WHERE room_id = $1", [room_id]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, room_id, adm_date, discharge_date, status, charge, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE admission SET patient_id = COALESCE($1, patient_id), room_id = COALESCE($2, room_id),
       adm_date = COALESCE($3, adm_date), discharge_date = COALESCE($4, discharge_date),
       status = COALESCE($5, status), charge = COALESCE($6, charge),
       notes = COALESCE($7, notes) WHERE adm_id = $8 RETURNING *`,
      [patient_id, room_id, adm_date, discharge_date, status, charge, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Admission not found" });
    if (status === "discharged" && room_id) {
      await pool.query("UPDATE room SET status = 'available' WHERE room_id = $1", [room_id]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM admission WHERE adm_id = $1 RETURNING adm_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Admission not found" });
    res.json({ message: "Admission deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
