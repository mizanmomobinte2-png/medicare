const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// =========================================
// HELPER
// Keeps real DB user_id
// Also sends admin_id for frontend login
// =========================================

const formatAdmin = (admin) => {
  if (!admin) {
    return null;
  }

  return {
    user_id: admin.user_id,

    // Frontend CommonLogin expects admin_id
    admin_id: admin.user_id,

    username: admin.username,
    role: admin.role,
    last_login: admin.last_login,
    status: admin.status,
  };
};

// =========================================
// GET ALL ADMINS
// =========================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        user_id,
        username,
        role,
        last_login,
        status

      FROM admin

      ORDER BY user_id
    `);

    res.json(
      result.rows.map(formatAdmin)
    );
  } catch (err) {
    console.error(
      "Get admins error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// =========================================
// GET SINGLE ADMIN
// =========================================

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        user_id,
        username,
        role,
        last_login,
        status

      FROM admin

      WHERE user_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Admin not found",
      });
    }

    res.json(
      formatAdmin(result.rows[0])
    );
  } catch (err) {
    console.error(
      "Get admin error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// =========================================
// CREATE ADMIN
// =========================================

router.post("/", async (req, res) => {
  const {
    username,
    password,
    role,
    status,
  } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        error:
          "Username and password are required",
      });
    }

    // Check duplicate username
    const check = await pool.query(
      `
      SELECT user_id

      FROM admin

      WHERE username = $1
      `,
      [username]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({
        error:
          "Username already exists",
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const result = await pool.query(
      `
      INSERT INTO admin
      (
        username,
        password,
        role,
        status
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )

      RETURNING
        user_id,
        username,
        role,
        last_login,
        status
      `,
      [
        username,
        hashedPassword,
        role || "admin",
        status || "active",
      ]
    );

    res.status(201).json({
      message:
        "Admin created successfully",

      admin:
        formatAdmin(
          result.rows[0]
        ),
    });
  } catch (err) {
    console.error(
      "Create admin error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// =========================================
// UPDATE ADMIN
// =========================================

router.put("/:id", async (req, res) => {
  const {
    username,
    password,
    role,
    status,
  } = req.body;

  try {
    let hashedPassword = null;

    if (password) {
      hashedPassword =
        await bcrypt.hash(
          password,
          10
        );
    }

    const result = await pool.query(
      `
      UPDATE admin

      SET
        username =
          COALESCE(
            $1,
            username
          ),

        password =
          COALESCE(
            $2,
            password
          ),

        role =
          COALESCE(
            $3,
            role
          ),

        status =
          COALESCE(
            $4,
            status
          )

      WHERE user_id = $5

      RETURNING
        user_id,
        username,
        role,
        last_login,
        status
      `,
      [
        username || null,
        hashedPassword,
        role || null,
        status || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Admin not found",
      });
    }

    res.json({
      message:
        "Admin updated successfully",

      admin:
        formatAdmin(
          result.rows[0]
        ),
    });
  } catch (err) {
    console.error(
      "Update admin error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// =========================================
// DELETE ADMIN
// =========================================

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM admin

      WHERE user_id = $1

      RETURNING user_id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Admin not found",
      });
    }

    res.json({
      message:
        "Admin deleted successfully",

      user_id:
        result.rows[0].user_id,

      admin_id:
        result.rows[0].user_id,
    });
  } catch (err) {
    console.error(
      "Delete admin error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// =========================================
// LOGIN
// =========================================

router.post("/login", async (req, res) => {
  const {
    username,
    password,
  } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        error:
          "Username and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT *

      FROM admin

      WHERE username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error:
          "Invalid username or password",
      });
    }

    const admin =
      result.rows[0];

    const match =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!match) {
      return res.status(401).json({
        error:
          "Invalid username or password",
      });
    }

    // Update last login
    const updatedResult =
      await pool.query(
        `
        UPDATE admin

        SET last_login = NOW()

        WHERE user_id = $1

        RETURNING
          user_id,
          username,
          role,
          last_login,
          status
        `,
        [admin.user_id]
      );

    const loggedInAdmin =
      formatAdmin(
        updatedResult.rows[0]
      );

    res.status(200).json({
      message:
        "Login successful",

      admin:
        loggedInAdmin,
    });
  } catch (err) {
    console.error(
      "Admin login error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;