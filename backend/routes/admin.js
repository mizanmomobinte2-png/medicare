const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all admins
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, username, role, last_login, status FROM admin ORDER BY user_id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one admin
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username, role, last_login, status FROM admin WHERE user_id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Admin not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE admin
router.post("/", async (req, res) => {
  const { username, password, role, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO admin (username, password, role, status) VALUES ($1, $2, $3, $4) RETURNING user_id, username, role, status",
      [username, password, role || "admin", status || "active"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE admin
router.put("/:id", async (req, res) => {
  const { username, password, role, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE admin SET username = COALESCE($1, username), password = COALESCE($2, password),
       role = COALESCE($3, role), status = COALESCE($4, status) WHERE user_id = $5
       RETURNING user_id, username, role, status`,
      [username, password, role, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Admin not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE admin
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM admin WHERE user_id = $1 RETURNING user_id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Admin not found" });
    res.json({ message: "Admin deleted", user_id: result.rows[0].user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT user_id, username, role, status FROM admin WHERE username = $1 AND password = $2 AND status = 'active'",
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    await pool.query("UPDATE admin SET last_login = NOW() WHERE user_id = $1", [result.rows[0].user_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
