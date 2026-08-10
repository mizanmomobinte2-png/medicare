const express = require("express");
console.log("DOCTORS LOGIN ROUTE FILE LOADED");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT doc.*, d.dept_name
      FROM doctor doc
      LEFT JOIN department d
        ON doc.dept_id = d.dept_id
      ORDER BY doc.doctor_id
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const result = await pool.query(
      "SELECT * FROM doctor WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const doctor = result.rows[0];

    if (!doctor.password) {
      return res.status(401).json({
        error: "This doctor account has no password. Register again."
      });
    }

    const matched = await bcrypt.compare(
      password,
      doctor.password
    );

    if (!matched) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    res.status(200).json({
      message: "Doctor login successful",
      doctor: {
        doctor_id: doctor.doctor_id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        status: doctor.status,
        specialization: doctor.specialization,
        dept_id: doctor.dept_id
      }
    });
  } catch (err) {
    console.error("Doctor login error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/", async (req, res) => {
  const {
    name,
    email,
    password,
    salary,
    phone,
    specialization,
    dept_id
  } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    const existingDoctor = await pool.query(
      "SELECT doctor_id FROM doctor WHERE email = $1",
      [email]
    );

    if (existingDoctor.rows.length > 0) {
      return res.status(409).json({
        error: "Doctor with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO doctor
      (
        name,
        email,
        password,
        salary,
        phone,
        status,
        specialization,
        dept_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING
        doctor_id,
        name,
        email,
        salary,
        phone,
        status,
        specialization,
        dept_id
      `,
      [
        name,
        email,
        hashedPassword,
        salary || null,
        phone || null,
        "active",
        specialization || null,
        dept_id || null
      ]
    );

    res.status(201).json({
      message: "Doctor registered successfully",
      doctor: result.rows[0]
    });
  } catch (err) {
    console.error("Doctor registration error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT doc.*, d.dept_name
      FROM doctor doc
      LEFT JOIN department d
        ON doc.dept_id = d.dept_id
      WHERE doc.doctor_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Doctor not found"
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.put("/:id", async (req, res) => {
  const {
    name,
    email,
    salary,
    phone,
    status,
    specialization,
    dept_id
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE doctor
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        salary = COALESCE($3, salary),
        phone = COALESCE($4, phone),
        status = COALESCE($5, status),
        specialization = COALESCE($6, specialization),
        dept_id = COALESCE($7, dept_id)
      WHERE doctor_id = $8
      RETURNING *
      `,
      [
        name,
        email,
        salary,
        phone,
        status,
        specialization,
        dept_id,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Doctor not found"
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM doctor WHERE doctor_id = $1 RETURNING doctor_id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Doctor not found"
      });
    }

    res.json({
      message: "Doctor deleted"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;