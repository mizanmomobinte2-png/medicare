const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

const { generateToken, verifyToken } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { isValidRole, listRoles } = require("../config/workRoles");

// Never send the password hash to the browser
const PUBLIC_COLS = `
  s.staff_id, s.name, s.email, s.salary, s.phone,
  s.status, s.dept_id, s.staff_role, s.created_at
`;

const toDeptId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// =========================================
// WORK ROLE LIST (public: used by register form + admin page)
// =========================================

router.get("/work-roles", (req, res) => {
  res.json(listRoles());
});

// =========================================
// GET ALL STAFF (admin)
// =========================================

router.get("/", verifyToken, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ${PUBLIC_COLS}, d.dept_name
      FROM staff s
      LEFT JOIN department d ON s.dept_id = d.dept_id
      ORDER BY s.staff_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Get staff error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// STAFF LOGIN (public)
// =========================================

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      `SELECT * FROM staff WHERE LOWER(email) = LOWER($1)`,
      [String(email).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const staff = result.rows[0];

    if (!staff.password) {
      return res
        .status(401)
        .json({ error: "This staff account has no password" });
    }

    const matched = await bcrypt.compare(password, staff.password);

    if (!matched) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (
      staff.status &&
      String(staff.status).toLowerCase() !== "active"
    ) {
      return res
        .status(403)
        .json({ error: "This staff account is not active. Contact admin." });
    }

    const token = generateToken(staff.staff_id, "staff");

    res.status(200).json({
      message: "Staff login successful",
      token,
      role: "staff",
      staff: {
        staff_id: staff.staff_id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        dept_id: staff.dept_id,
        status: staff.status,
        staff_role: staff.staff_role,
      },
    });
  } catch (err) {
    console.error("Staff login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// REGISTER STAFF (public) - work role is required
// =========================================

router.post("/", async (req, res) => {
  const { name, email, password, salary, phone, dept_id, staff_role } =
    req.body;

  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    if (!isValidRole(staff_role)) {
      return res.status(400).json({ error: "A valid work role is required" });
    }

    const existing = await pool.query(
      `SELECT staff_id FROM staff WHERE LOWER(email) = LOWER($1)`,
      [String(email).trim()]
    );

    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Staff with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO staff
        (name, email, password, salary, phone, status, dept_id, staff_role)
      VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
      RETURNING staff_id, name, email, salary, phone, status, dept_id, staff_role
      `,
      [
        String(name).trim(),
        String(email).trim(),
        hashedPassword,
        salary === "" || salary === undefined ? null : salary,
        phone || null,
        toDeptId(dept_id),
        staff_role,
      ]
    );

    res.status(201).json({
      message: "Staff registered successfully",
      staff: result.rows[0],
    });
  } catch (err) {
    console.error("Staff registration error:", err);

    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Staff with this email already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

// =========================================
// GET SINGLE STAFF (admin, or the staff himself)
// =========================================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const staffId = Number(req.params.id);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ error: "Invalid staff id" });
    }

    const isOwner = req.user.role === "staff" && req.user.id === staffId;

    if (req.user.role !== "admin" && !isOwner) {
      return res
        .status(403)
        .json({ error: "You can access only your own profile" });
    }

    const result = await pool.query(
      `
      SELECT ${PUBLIC_COLS}, d.dept_name
      FROM staff s
      LEFT JOIN department d ON s.dept_id = d.dept_id
      WHERE s.staff_id = $1
      `,
      [staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// UPDATE STAFF (admin) - includes work role, status, password reset
// =========================================

router.put("/:id", verifyToken, authorize("admin"), async (req, res) => {
  const { name, email, salary, phone, status, dept_id, staff_role, password } =
    req.body;

  try {
    if (staff_role && !isValidRole(staff_role)) {
      return res.status(400).json({ error: "Invalid work role" });
    }

    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be active or inactive" });
    }

    let hashedPassword = null;

    if (password) {
      if (String(password).length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `
      UPDATE staff
      SET
        name       = COALESCE($1, name),
        email      = COALESCE($2, email),
        salary     = COALESCE($3, salary),
        phone      = COALESCE($4, phone),
        status     = COALESCE($5, status),
        dept_id    = COALESCE($6, dept_id),
        staff_role = COALESCE($7, staff_role),
        password   = COALESCE($8, password)
      WHERE staff_id = $9
      RETURNING staff_id, name, email, salary, phone, status, dept_id, staff_role
      `,
      [
        name || null,
        email || null,
        salary === "" ? null : salary ?? null,
        phone ?? null,
        status || null,
        toDeptId(dept_id),
        staff_role || null,
        hashedPassword,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json({
      message: "Staff updated successfully",
      staff: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// DELETE STAFF (admin)
// =========================================

router.delete("/:id", verifyToken, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM staff WHERE staff_id = $1 RETURNING staff_id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;