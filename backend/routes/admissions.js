const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================
// GET ALL ADMISSIONS
// =====================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ad.*,

        p.name AS patient_name,
        p.email AS patient_email,
        p.phone AS patient_phone,
        p.gender,
        p.blood_group,

        r.room_id,
        r.room_type,
        r.status AS room_status,

        d.name AS doctor_name,

        a.appt_date,
        a.appt_time

      FROM admission ad

      LEFT JOIN patient p
        ON ad.patient_id = p.patient_id

      LEFT JOIN room r
        ON ad.room_id = r.room_id

      LEFT JOIN doctor d
        ON ad.doctor_id = d.doctor_id

      LEFT JOIN appointment a
        ON ad.appt_id = a.appt_id

      ORDER BY
        ad.adm_date DESC NULLS FIRST,
        ad.adm_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(
      "Get admissions error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// GET PENDING ADMISSION REQUESTS
// Staff Dashboard
// =====================================

router.get(
  "/pending/all",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          ad.*,

          p.name AS patient_name,
          p.email AS patient_email,
          p.phone AS patient_phone,
          p.gender,
          p.blood_group,

          d.name AS doctor_name,

          a.appt_date,
          a.appt_time,
          a.reason

        FROM admission ad

        LEFT JOIN patient p
          ON ad.patient_id = p.patient_id

        LEFT JOIN doctor d
          ON ad.doctor_id = d.doctor_id

        LEFT JOIN appointment a
          ON ad.appt_id = a.appt_id

        WHERE ad.status = 'pending'

        ORDER BY ad.adm_id DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Pending admissions error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET ADMISSIONS OF ONE DOCTOR
// =====================================

router.get(
  "/doctor/:doctorId",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          ad.*,

          p.name AS patient_name,
          p.phone AS patient_phone,
          p.gender,
          p.blood_group,

          r.room_type,

          a.appt_date,
          a.appt_time

        FROM admission ad

        LEFT JOIN patient p
          ON ad.patient_id = p.patient_id

        LEFT JOIN room r
          ON ad.room_id = r.room_id

        LEFT JOIN appointment a
          ON ad.appt_id = a.appt_id

        WHERE ad.doctor_id = $1

        ORDER BY
          ad.adm_id DESC
        `,
        [req.params.doctorId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Doctor admissions error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET ADMISSIONS OF ONE PATIENT
// =====================================

router.get(
  "/patient/:patientId",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          ad.*,

          r.room_type,
          r.status AS room_status,

          d.name AS doctor_name,

          a.appt_date,
          a.appt_time

        FROM admission ad

        LEFT JOIN room r
          ON ad.room_id = r.room_id

        LEFT JOIN doctor d
          ON ad.doctor_id = d.doctor_id

        LEFT JOIN appointment a
          ON ad.appt_id = a.appt_id

        WHERE ad.patient_id = $1

        ORDER BY ad.adm_id DESC
        `,
        [req.params.patientId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Patient admissions error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// DOCTOR RECOMMEND ADMISSION
// =====================================

router.post(
  "/doctor/recommend",
  async (req, res) => {
    const {
      doctor_id,
      appt_id,
      notes,
    } = req.body;

    try {
      if (
        !doctor_id ||
        !appt_id
      ) {
        return res.status(400).json({
          error:
            "doctor_id and appt_id are required",
        });
      }

      // Make sure appointment belongs
      // to this doctor
      const appointmentResult =
        await pool.query(
          `
          SELECT
            a.appt_id,
            a.patient_id,
            a.doctor_id,
            a.status,
            p.name AS patient_name

          FROM appointment a

          LEFT JOIN patient p
            ON a.patient_id = p.patient_id

          WHERE
            a.appt_id = $1
            AND a.doctor_id = $2
          `,
          [
            appt_id,
            doctor_id,
          ]
        );

      if (
        appointmentResult.rows.length ===
        0
      ) {
        return res.status(403).json({
          error:
            "This appointment does not belong to this doctor",
        });
      }

      const appointment =
        appointmentResult.rows[0];

      if (
        appointment.status ===
          "rejected" ||
        appointment.status ===
          "cancelled"
      ) {
        return res.status(400).json({
          error:
            "Admission cannot be recommended for a rejected or cancelled appointment",
        });
      }

      // Avoid duplicate admission request
      const existing =
        await pool.query(
          `
          SELECT adm_id, status

          FROM admission

          WHERE appt_id = $1
          `,
          [appt_id]
        );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          error:
            "Admission request already exists for this appointment",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO admission
          (
            patient_id,
            room_id,
            adm_date,
            discharge_date,
            status,
            charge,
            notes,
            doctor_id,
            appt_id
          )

          VALUES
          (
            $1,
            NULL,
            NULL,
            NULL,
            'pending',
            NULL,
            $2,
            $3,
            $4
          )

          RETURNING *
          `,
          [
            appointment.patient_id,
            notes || null,
            doctor_id,
            appt_id,
          ]
        );

      res.status(201).json({
        message:
          "Admission recommended successfully",

        admission:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "Recommend admission error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// STAFF ADMITS PATIENT
// Assign Room
// =====================================

router.patch(
  "/:id/staff-admit",
  async (req, res) => {
    const {
      room_id,
      adm_date,
      charge,
      notes,
    } = req.body;

    const client =
      await pool.connect();

    try {
      if (!room_id) {
        return res.status(400).json({
          error:
            "Room is required",
        });
      }

      await client.query("BEGIN");

      // Admission must be pending
      const admissionResult =
        await client.query(
          `
          SELECT *

          FROM admission

          WHERE adm_id = $1

          FOR UPDATE
          `,
          [req.params.id]
        );

      if (
        admissionResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          error:
            "Admission request not found",
        });
      }

      const admission =
        admissionResult.rows[0];

      if (
        admission.status !==
        "pending"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          error:
            "Only pending admission requests can be admitted",
        });
      }

      // Check room availability
      const roomResult =
        await client.query(
          `
          SELECT *

          FROM room

          WHERE room_id = $1

          FOR UPDATE
          `,
          [room_id]
        );

      if (
        roomResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          error: "Room not found",
        });
      }

      const room =
        roomResult.rows[0];

      if (
        String(
          room.status
        ).toLowerCase() !==
        "available"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          error:
            "Selected room is not available",
        });
      }

      // Update admission
      const updated =
        await client.query(
          `
          UPDATE admission

          SET
            room_id = $1,

            adm_date =
              COALESCE(
                $2,
                CURRENT_DATE
              ),

            charge =
              COALESCE(
                $3,
                charge
              ),

            notes =
              COALESCE(
                $4,
                notes
              ),

            status = 'admitted'

          WHERE adm_id = $5

          RETURNING *
          `,
          [
            room_id,
            adm_date || null,
            charge ?? null,
            notes ?? null,
            req.params.id,
          ]
        );

      // Occupy room
      await client.query(
        `
        UPDATE room

        SET status = 'occupied'

        WHERE room_id = $1
        `,
        [room_id]
      );

      await client.query("COMMIT");

      res.json({
        message:
          "Patient admitted successfully",

        admission:
          updated.rows[0],
      });
    } catch (err) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Staff admit error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    } finally {
      client.release();
    }
  }
);


// =====================================
// STAFF DISCHARGE PATIENT
// =====================================

router.patch(
  "/:id/discharge",
  async (req, res) => {
    const {
      discharge_date,
      notes,
    } = req.body;

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      const admissionResult =
        await client.query(
          `
          SELECT *

          FROM admission

          WHERE adm_id = $1

          FOR UPDATE
          `,
          [req.params.id]
        );

      if (
        admissionResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          error:
            "Admission not found",
        });
      }

      const admission =
        admissionResult.rows[0];

      if (
        admission.status !==
        "admitted"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          error:
            "Only admitted patients can be discharged",
        });
      }

      const updated =
        await client.query(
          `
          UPDATE admission

          SET
            discharge_date =
              COALESCE(
                $1,
                CURRENT_DATE
              ),

            status =
              'discharged',

            notes =
              COALESCE(
                $2,
                notes
              )

          WHERE adm_id = $3

          RETURNING *
          `,
          [
            discharge_date || null,
            notes ?? null,
            req.params.id,
          ]
        );

      // Free room
      if (admission.room_id) {
        await client.query(
          `
          UPDATE room

          SET status = 'available'

          WHERE room_id = $1
          `,
          [
            admission.room_id,
          ]
        );
      }

      await client.query("COMMIT");

      res.json({
        message:
          "Patient discharged successfully",

        admission:
          updated.rows[0],
      });
    } catch (err) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Discharge error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    } finally {
      client.release();
    }
  }
);


// =====================================
// GET SINGLE ADMISSION
// Keep this AFTER special routes
// =====================================

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ad.*,

        p.name AS patient_name,
        p.email AS patient_email,
        p.phone AS patient_phone,
        p.gender,
        p.blood_group,

        r.room_type,
        r.status AS room_status,

        d.name AS doctor_name,

        a.appt_date,
        a.appt_time,
        a.reason

      FROM admission ad

      LEFT JOIN patient p
        ON ad.patient_id = p.patient_id

      LEFT JOIN room r
        ON ad.room_id = r.room_id

      LEFT JOIN doctor d
        ON ad.doctor_id = d.doctor_id

      LEFT JOIN appointment a
        ON ad.appt_id = a.appt_id

      WHERE ad.adm_id = $1
      `,
      [req.params.id]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Admission not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(
      "Get admission error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// NORMAL CREATE ADMISSION
// Existing CRUD support
// =====================================

router.post("/", async (req, res) => {
  const {
    patient_id,
    room_id,
    adm_date,
    discharge_date,
    status,
    charge,
    notes,
    doctor_id,
    appt_id,
  } = req.body;

  try {
    const result =
      await pool.query(
        `
        INSERT INTO admission
        (
          patient_id,
          room_id,
          adm_date,
          discharge_date,
          status,
          charge,
          notes,
          doctor_id,
          appt_id
        )

        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,$8,$9
        )

        RETURNING *
        `,
        [
          patient_id,
          room_id || null,
          adm_date || null,
          discharge_date || null,
          status || "admitted",
          charge ?? null,
          notes || null,
          doctor_id || null,
          appt_id || null,
        ]
      );

    if (
      room_id &&
      (status || "admitted") ===
        "admitted"
    ) {
      await pool.query(
        `
        UPDATE room
        SET status = 'occupied'
        WHERE room_id = $1
        `,
        [room_id]
      );
    }

    res.status(201).json(
      result.rows[0]
    );
  } catch (err) {
    console.error(
      "Create admission error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// NORMAL UPDATE ADMISSION
// =====================================

router.put("/:id", async (req, res) => {
  const {
    patient_id,
    room_id,
    adm_date,
    discharge_date,
    status,
    charge,
    notes,
    doctor_id,
    appt_id,
  } = req.body;

  try {
    const result =
      await pool.query(
        `
        UPDATE admission

        SET
          patient_id =
            COALESCE(
              $1,
              patient_id
            ),

          room_id =
            COALESCE(
              $2,
              room_id
            ),

          adm_date =
            COALESCE(
              $3,
              adm_date
            ),

          discharge_date =
            COALESCE(
              $4,
              discharge_date
            ),

          status =
            COALESCE(
              $5,
              status
            ),

          charge =
            COALESCE(
              $6,
              charge
            ),

          notes =
            COALESCE(
              $7,
              notes
            ),

          doctor_id =
            COALESCE(
              $8,
              doctor_id
            ),

          appt_id =
            COALESCE(
              $9,
              appt_id
            )

        WHERE adm_id = $10

        RETURNING *
        `,
        [
          patient_id,
          room_id,
          adm_date,
          discharge_date,
          status,
          charge,
          notes,
          doctor_id,
          appt_id,
          req.params.id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Admission not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(
      "Update admission error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// DELETE ADMISSION
// =====================================

router.delete("/:id", async (req, res) => {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const admission =
      await client.query(
        `
        SELECT room_id
        FROM admission
        WHERE adm_id = $1
        `,
        [req.params.id]
      );

    if (
      admission.rows.length === 0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        error:
          "Admission not found",
      });
    }

    const roomId =
      admission.rows[0].room_id;

    await client.query(
      `
      DELETE FROM admission
      WHERE adm_id = $1
      `,
      [req.params.id]
    );

    if (roomId) {
      await client.query(
        `
        UPDATE room
        SET status = 'available'
        WHERE room_id = $1
        `,
        [roomId]
      );
    }

    await client.query("COMMIT");

    res.json({
      message:
        "Admission deleted successfully",
    });
  } catch (err) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Delete admission error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;