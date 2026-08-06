const express = require("express");
const router = express.Router();
const pool = require("../db");

// Blood bank stock
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blood_bank ORDER BY bank_id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blood_bank WHERE bank_id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Blood bank record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { blood_group, available_quantity, storage_location, expiry_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO blood_bank (blood_group, available_quantity, storage_location, expiry_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [blood_group, available_quantity || 0, storage_location, expiry_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { blood_group, available_quantity, storage_location, expiry_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE blood_bank SET blood_group = COALESCE($1, blood_group),
       available_quantity = COALESCE($2, available_quantity),
       storage_location = COALESCE($3, storage_location),
       last_updated = CURRENT_TIMESTAMP,
       expiry_date = COALESCE($4, expiry_date)
       WHERE bank_id = $5 RETURNING *`,
      [blood_group, available_quantity, storage_location, expiry_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Blood bank record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM blood_bank WHERE bank_id = $1 RETURNING bank_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Blood bank record not found" });
    res.json({ message: "Blood bank record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ward blood supplies
router.get("/supplies/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ws.*, w.ward_id, bb.blood_group, d.dept_name
      FROM ward_blood_supply ws
      JOIN ward w ON ws.ward_id = w.ward_id
      JOIN blood_bank bb ON ws.bank_id = bb.bank_id
      LEFT JOIN department d ON w.dept_id = d.dept_id
      ORDER BY ws.supply_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/supplies", async (req, res) => {
  const { ward_id, bank_id, quantity } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO ward_blood_supply (ward_id, bank_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [ward_id, bank_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff blood requests
router.get("/requests/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT br.*, s.name AS staff_name, bb.blood_group
      FROM blood_request br
      LEFT JOIN staffs s ON br.staff_id = s.staff_id
      LEFT JOIN blood_bank bb ON br.bank_id = bb.bank_id
      ORDER BY br.request_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/requests", async (req, res) => {
  const { staff_id, bank_id, quantity, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO blood_request (staff_id, bank_id, quantity, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [staff_id, bank_id, quantity, status || "pending"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
