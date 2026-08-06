const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM medical_item ORDER BY item_id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM medical_item WHERE item_id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Medical item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { item_name, category, unit_price, manufacturer } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO medical_item (item_name, category, unit_price, manufacturer) VALUES ($1, $2, $3, $4) RETURNING *",
      [item_name, category, unit_price, manufacturer]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { item_name, category, unit_price, manufacturer } = req.body;
  try {
    const result = await pool.query(
      `UPDATE medical_item SET item_name = COALESCE($1, item_name), category = COALESCE($2, category),
       unit_price = COALESCE($3, unit_price), manufacturer = COALESCE($4, manufacturer)
       WHERE item_id = $5 RETURNING *`,
      [item_name, category, unit_price, manufacturer, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Medical item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM medical_item WHERE item_id = $1 RETURNING item_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Medical item not found" });
    res.json({ message: "Medical item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
