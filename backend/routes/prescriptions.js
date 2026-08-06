const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
      FROM prescription pr
      LEFT JOIN patient p ON pr.patient_id = p.patient_id
      LEFT JOIN doctor d ON pr.doctor_id = d.doctor_id
      ORDER BY pr.pres_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pres = await pool.query(`
      SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
      FROM prescription pr
      LEFT JOIN patient p ON pr.patient_id = p.patient_id
      LEFT JOIN doctor d ON pr.doctor_id = d.doctor_id
      WHERE pr.pres_id = $1
    `, [req.params.id]);

    if (pres.rows.length === 0) return res.status(404).json({ error: "Prescription not found" });

    const items = await pool.query(`
      SELECT pi.*, mi.item_name, mi.category, mi.unit_price
      FROM prescription_item pi
      JOIN medical_item mi ON pi.item_id = mi.item_id
      WHERE pi.pres_id = $1
    `, [req.params.id]);

    res.json({ ...pres.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { patient_id, doctor_id, date, diagnosis, advice, note, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO prescription (patient_id, doctor_id, date, diagnosis, advice, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, doctor_id || null, date || null, diagnosis, advice, note]
    );
    const presId = result.rows[0].pres_id;

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          "INSERT INTO prescription_item (pres_id, item_id, quantity, dosage) VALUES ($1, $2, $3, $4)",
          [presId, item.item_id, item.quantity || 1, item.dosage]
        );
      }
    }
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  const { patient_id, doctor_id, date, diagnosis, advice, note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE prescription SET patient_id = COALESCE($1, patient_id), doctor_id = COALESCE($2, doctor_id),
       date = COALESCE($3, date), diagnosis = COALESCE($4, diagnosis),
       advice = COALESCE($5, advice), note = COALESCE($6, note)
       WHERE pres_id = $7 RETURNING *`,
      [patient_id, doctor_id, date, diagnosis, advice, note, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Prescription not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM prescription WHERE pres_id = $1 RETURNING pres_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Prescription not found" });
    res.json({ message: "Prescription deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
