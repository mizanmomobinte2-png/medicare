const express = require("express");
const router = express.Router();
const pool = require("../db");

console.log("TIME SLOT ROUTE FILE LOADED");

// =====================================
// GET ALL TIME SLOTS
// =====================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ts.slot_id,
        ts.doctor_id,
        ts.slot_date,
        ts.start_time,
        ts.end_time,
        ts.status,
        ts.room,
        d.name AS doctor_name,
        d.specialization
      FROM time_slot ts
      LEFT JOIN doctor d
        ON ts.doctor_id = d.doctor_id
      ORDER BY ts.slot_date, ts.start_time
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Get time slots error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// GET ONE DOCTOR'S TIME SLOTS
// =====================================
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        slot_id,
        doctor_id,
        slot_date,
        start_time,
        end_time,
        status,
        room
      FROM time_slot
      WHERE doctor_id = $1
      ORDER BY slot_date, start_time
      `,
      [req.params.doctorId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Doctor time slots error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// AVAILABLE SLOTS OF ONE DOCTOR
// =====================================
router.get("/doctor/:doctorId/available", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        slot_id,
        doctor_id,
        slot_date,
        start_time,
        end_time,
        status,
        room
      FROM time_slot
      WHERE
        doctor_id = $1
        AND status = 'available'
        AND slot_date >= CURRENT_DATE
      ORDER BY slot_date, start_time
      `,
      [req.params.doctorId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Available time slots error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// TIME SLOT SUMMARY
// =====================================
router.get("/doctor/:doctorId/summary", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total_slots,

        COUNT(*) FILTER (
          WHERE status = 'available'
        ) AS available_slots,

        COUNT(*) FILTER (
          WHERE status = 'booked'
        ) AS booked_slots,

        COUNT(*) FILTER (
          WHERE slot_date = CURRENT_DATE
        ) AS today_slots

      FROM time_slot
      WHERE doctor_id = $1
      `,
      [req.params.doctorId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Time slot summary error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// GET SINGLE TIME SLOT
// =====================================
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ts.*,
        d.name AS doctor_name
      FROM time_slot ts
      LEFT JOIN doctor d
        ON ts.doctor_id = d.doctor_id
      WHERE ts.slot_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Time slot not found"
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// CREATE TIME SLOT
// =====================================
router.post("/", async (req, res) => {
  const {
    doctor_id,
    slot_date,
    start_time,
    end_time,
    room
  } = req.body;

  try {
    if (!doctor_id || !slot_date || !start_time || !end_time) {
      return res.status(400).json({
        error: "Doctor, date, start time and end time are required"
      });
    }

    const conflict = await pool.query(
      `
      SELECT slot_id
      FROM time_slot
      WHERE
        doctor_id = $1
        AND slot_date = $2
        AND start_time < $4
        AND end_time > $3
      `,
      [
        doctor_id,
        slot_date,
        start_time,
        end_time
      ]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({
        error: "This time overlaps with another time slot"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO time_slot
      (
        doctor_id,
        slot_date,
        start_time,
        end_time,
        status,
        room
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        doctor_id,
        slot_date,
        start_time,
        end_time,
        "available",
        room || null
      ]
    );

    res.status(201).json({
      message: "Time slot created successfully",
      time_slot: result.rows[0]
    });
  } catch (err) {
    console.error("Create time slot error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// UPDATE TIME SLOT
// =====================================
router.put("/:id", async (req, res) => {
  const {
    slot_date,
    start_time,
    end_time,
    status,
    room
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE time_slot
      SET
        slot_date = COALESCE($1, slot_date),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        status = COALESCE($4, status),
        room = COALESCE($5, room)
      WHERE slot_id = $6
      RETURNING *
      `,
      [
        slot_date,
        start_time,
        end_time,
        status,
        room,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Time slot not found"
      });
    }

    res.json({
      message: "Time slot updated successfully",
      time_slot: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// UPDATE SLOT STATUS
// =====================================
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;

  try {
    if (!["available", "booked", "unavailable"].includes(status)) {
      return res.status(400).json({
        error: "Invalid time slot status"
      });
    }

    const result = await pool.query(
      `
      UPDATE time_slot
      SET status = $1
      WHERE slot_id = $2
      RETURNING *
      `,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Time slot not found"
      });
    }

    res.json({
      message: "Time slot status updated successfully",
      time_slot: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================
// DELETE TIME SLOT
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM time_slot
      WHERE slot_id = $1
      RETURNING slot_id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Time slot not found"
      });
    }

    res.json({
      message: "Time slot deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;