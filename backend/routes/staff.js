const express = require("express");
console.log("STAFF ROUTE FILE LOADED");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// =====================
// GET ALL STAFF
// =====================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, d.dept_name
      FROM staffs s
      LEFT JOIN department d
        ON s.dept_id = d.dept_id
      ORDER BY s.staff_id
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================
// STAFF LOGIN
// =====================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM staffs WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const staff = result.rows[0];

    if (!staff.password) {
      return res.status(401).json({
        error: "This staff account has no password. Register again.",
      });
    }

    const matched = await bcrypt.compare(
      password,
      staff.password
    );

    if (!matched) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Staff login successful",
      staff: {
        staff_id: staff.staff_id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        dept_id: staff.dept_id,
        salary: staff.salary,
      },
    });
  } catch (err) {
    console.error("Staff login error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================
// REGISTER STAFF
// =====================
router.post("/", async (req, res) => {
  const {
    name,
    email,
    password,
    dept_id,
    salary,
    phone,
  } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existingStaff = await pool.query(
      "SELECT staff_id FROM staffs WHERE email = $1",
      [email]
    );

    if (existingStaff.rows.length > 0) {
      return res.status(409).json({
        error: "Staff with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const result = await pool.query(
      `
      INSERT INTO staffs
      (
        name,
        email,
        password,
        dept_id,
        salary,
        phone
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING
        staff_id,
        name,
        email,
        dept_id,
        salary,
        phone
      `,
      [
        name,
        email,
        hashedPassword,
        dept_id || null,
        salary || null,
        phone || null,
      ]
    );

    res.status(201).json({
      message: "Staff registered successfully",
      staff: result.rows[0],
    });
  } catch (err) {
    console.error("Staff registration error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================
// GET SINGLE STAFF
// =====================
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT s.*, d.dept_name
      FROM staffs s
      LEFT JOIN department d
        ON s.dept_id = d.dept_id
      WHERE s.staff_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Staff not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================
// UPDATE STAFF
// =====================
router.put("/:id", async (req, res) => {
  const {
    name,
    email,
    password,
    dept_id,
    salary,
    phone,
  } = req.body;

  try {
    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(
        password,
        10
      );
    }

    const result = await pool.query(
      `
      UPDATE staffs
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        password = COALESCE($3, password),
        dept_id = COALESCE($4, dept_id),
        salary = COALESCE($5, salary),
        phone = COALESCE($6, phone)
      WHERE staff_id = $7
      RETURNING
        staff_id,
        name,
        email,
        dept_id,
        salary,
        phone
      `,
      [
        name,
        email,
        hashedPassword,
        dept_id,
        salary,
        phone,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Staff not found",
      });
    }

    res.json({
      message: "Staff updated successfully",
      staff: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================
// DELETE STAFF
// =====================
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM staffs WHERE staff_id = $1 RETURNING staff_id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Staff not found",
      });
    }

    res.json({
      message: "Staff deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;