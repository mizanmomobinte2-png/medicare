const pool = require("../db");

// Use AFTER verifyToken.
// Loads the staff row from the database on every request, so when an admin
// changes a role or deactivates a staff member it takes effect immediately.
async function loadStaff(req, res, next) {
  try {
    if (!req.user || req.user.role !== "staff") {
      return res.status(403).json({ error: "Staff access only" });
    }

    const result = await pool.query(
      `
      SELECT staff_id, name, email, phone, dept_id, status, staff_role
      FROM staff
      WHERE staff_id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Staff account not found" });
    }

    const staff = result.rows[0];

    if (
      staff.status &&
      String(staff.status).toLowerCase() !== "active"
    ) {
      return res.status(403).json({ error: "Staff account is not active" });
    }

    req.staff = staff;
    next();
  } catch (err) {
    console.error("loadStaff error:", err);
    res.status(500).json({ error: err.message });
  }
}

// requireWorkRole("LAB_TECH") or requireWorkRole("ADMISSION", "BILLING")
const requireWorkRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.staff || !roles.includes(req.staff.staff_role)) {
      return res.status(403).json({
        error: `Your work role cannot do this. Required: ${roles.join(" / ")}`,
      });
    }
    next();
  };

module.exports = { loadStaff, requireWorkRole };