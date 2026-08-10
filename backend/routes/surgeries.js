const express = require("express");
const router = express.Router();
const pool = require("../db");

// =========================================
// GET ALL SURGERIES
// =========================================

router.get("/", async (req, res) => {
  try {
    const result =
      await pool.query(`
        SELECT
          s.*,

          p.name AS patient_name,
          p.email AS patient_email,
          p.phone AS patient_phone,

          d.name AS doctor_name,
          d.specialization,

          st.name AS staff_name

        FROM surgery s

        LEFT JOIN patient p
          ON s.patient_id =
             p.patient_id

        LEFT JOIN doctor d
          ON s.doctor_id =
             d.doctor_id

        LEFT JOIN staffs st
          ON s.staff_id =
             st.staff_id

        ORDER BY
          s.date DESC NULLS FIRST,
          s.surgery_id DESC
      `);

    res.json(result.rows);
  } catch (err) {
    console.error(
      "Get surgeries error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =========================================
// GET SURGERY REQUESTS FOR STAFF
// =========================================

router.get(
  "/requests/all",
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            s.*,

            p.name AS patient_name,
            p.phone AS patient_phone,
            p.blood_group,

            d.name AS doctor_name,

            st.name AS staff_name

          FROM surgery s

          LEFT JOIN patient p
            ON s.patient_id =
               p.patient_id

          LEFT JOIN doctor d
            ON s.doctor_id =
               d.doctor_id

          LEFT JOIN staffs st
            ON s.staff_id =
               st.staff_id

          WHERE s.status IN (
            'recommended',
            'scheduled'
          )

          ORDER BY
            s.surgery_id DESC
        `);

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Surgery requests error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// GET SURGERIES OF DOCTOR
// =========================================

router.get(
  "/doctor/:doctorId",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            s.*,

            p.name AS patient_name,
            p.email AS patient_email,
            p.phone AS patient_phone,
            p.gender,
            p.blood_group,

            st.name AS staff_name

          FROM surgery s

          LEFT JOIN patient p
            ON s.patient_id =
               p.patient_id

          LEFT JOIN staffs st
            ON s.staff_id =
               st.staff_id

          WHERE s.doctor_id = $1

          ORDER BY
            s.surgery_id DESC
          `,
          [req.params.doctorId]
        );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Doctor surgeries error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// GET PATIENT SURGERIES
// =========================================

router.get(
  "/patient/:patientId",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            s.*,

            d.name AS doctor_name,

            st.name AS staff_name

          FROM surgery s

          LEFT JOIN doctor d
            ON s.doctor_id =
               d.doctor_id

          LEFT JOIN staffs st
            ON s.staff_id =
               st.staff_id

          WHERE s.patient_id = $1

          ORDER BY
            s.surgery_id DESC
          `,
          [req.params.patientId]
        );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Patient surgeries error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// DOCTOR RECOMMENDS SURGERY
// =========================================

router.post(
  "/doctor/recommend",
  async (req, res) => {
    const {
      patient_id,
      doctor_id,
      surgery_name,
      type,
    } = req.body;

    try {
      if (
        !patient_id ||
        !doctor_id ||
        !surgery_name
      ) {
        return res.status(400).json({
          error:
            "Patient, doctor and surgery name are required",
        });
      }

      const patientCheck =
        await pool.query(
          `
          SELECT patient_id
          FROM patient
          WHERE patient_id = $1
          `,
          [patient_id]
        );

      if (
        patientCheck.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Patient not found",
        });
      }

      const doctorCheck =
        await pool.query(
          `
          SELECT doctor_id
          FROM doctor
          WHERE doctor_id = $1
          `,
          [doctor_id]
        );

      if (
        doctorCheck.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Doctor not found",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO surgery
          (
            patient_id,
            doctor_id,
            staff_id,
            surgery_name,
            date,
            type,
            status
          )

          VALUES
          (
            $1,
            $2,
            NULL,
            $3,
            NULL,
            $4,
            'recommended'
          )

          RETURNING *
          `,
          [
            patient_id,
            doctor_id,
            surgery_name,
            type || null,
          ]
        );

      res.status(201).json({
        message:
          "Surgery recommended successfully",

        surgery:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "Recommend surgery error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// STAFF SCHEDULES SURGERY
// =========================================

router.patch(
  "/:id/staff-schedule",
  async (req, res) => {
    const {
      staff_id,
      date,
    } = req.body;

    try {
      if (
        !staff_id ||
        !date
      ) {
        return res.status(400).json({
          error:
            "Staff and surgery date are required",
        });
      }

      const staffCheck =
        await pool.query(
          `
          SELECT staff_id
          FROM staffs
          WHERE staff_id = $1
          `,
          [staff_id]
        );

      if (
        staffCheck.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Staff not found",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE surgery

          SET
            staff_id = $1,
            date = $2,
            status = 'scheduled'

          WHERE
            surgery_id = $3
            AND status IN (
              'recommended',
              'scheduled'
            )

          RETURNING *
          `,
          [
            staff_id,
            date,
            req.params.id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Surgery request not found or cannot be scheduled",
        });
      }

      res.json({
        message:
          "Surgery scheduled successfully",

        surgery:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "Schedule surgery error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// DOCTOR COMPLETES SURGERY
// =========================================

router.patch(
  "/:id/doctor-complete",
  async (req, res) => {
    const {
      doctor_id,
    } = req.body;

    try {
      if (!doctor_id) {
        return res.status(400).json({
          error:
            "doctor_id is required",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE surgery

          SET status = 'completed'

          WHERE
            surgery_id = $1
            AND doctor_id = $2
            AND status = 'scheduled'

          RETURNING *
          `,
          [
            req.params.id,
            doctor_id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Scheduled surgery not found or does not belong to this doctor",
        });
      }

      res.json({
        message:
          "Surgery marked completed",

        surgery:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "Complete surgery error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// DOCTOR SURGERY SUMMARY
// =========================================

router.get(
  "/doctor/:doctorId/summary",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT

            COUNT(*) AS total_surgeries,

            COUNT(*) FILTER (
              WHERE status =
                'recommended'
            ) AS recommended_surgeries,

            COUNT(*) FILTER (
              WHERE status =
                'scheduled'
            ) AS scheduled_surgeries,

            COUNT(*) FILTER (
              WHERE status =
                'completed'
            ) AS completed_surgeries

          FROM surgery

          WHERE doctor_id = $1
          `,
          [req.params.doctorId]
        );

      res.json(
        result.rows[0]
      );
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =========================================
// GET SINGLE SURGERY
// =========================================

router.get("/:id", async (req, res) => {
  try {
    const result =
      await pool.query(
        `
        SELECT
          s.*,

          p.name AS patient_name,
          p.email AS patient_email,
          p.phone AS patient_phone,
          p.gender,
          p.blood_group,

          d.name AS doctor_name,

          st.name AS staff_name

        FROM surgery s

        LEFT JOIN patient p
          ON s.patient_id =
             p.patient_id

        LEFT JOIN doctor d
          ON s.doctor_id =
             d.doctor_id

        LEFT JOIN staffs st
          ON s.staff_id =
             st.staff_id

        WHERE s.surgery_id = $1
        `,
        [req.params.id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Surgery not found",
      });
    }

    res.json(
      result.rows[0]
    );
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// =========================================
// NORMAL CREATE
// =========================================

router.post("/", async (req, res) => {
  const {
    patient_id,
    doctor_id,
    staff_id,
    surgery_name,
    date,
    type,
    status,
  } = req.body;

  try {
    const result =
      await pool.query(
        `
        INSERT INTO surgery
        (
          patient_id,
          doctor_id,
          staff_id,
          surgery_name,
          date,
          type,
          status
        )

        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7
        )

        RETURNING *
        `,
        [
          patient_id,
          doctor_id,
          staff_id || null,
          surgery_name,
          date || null,
          type || null,
          status ||
            "recommended",
        ]
      );

    res.status(201).json(
      result.rows[0]
    );
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// =========================================
// NORMAL UPDATE
// =========================================

router.put("/:id", async (req, res) => {
  const {
    patient_id,
    doctor_id,
    staff_id,
    surgery_name,
    date,
    type,
    status,
  } = req.body;

  try {
    const result =
      await pool.query(
        `
        UPDATE surgery

        SET
          patient_id =
            COALESCE(
              $1,
              patient_id
            ),

          doctor_id =
            COALESCE(
              $2,
              doctor_id
            ),

          staff_id =
            COALESCE(
              $3,
              staff_id
            ),

          surgery_name =
            COALESCE(
              $4,
              surgery_name
            ),

          date =
            COALESCE(
              $5,
              date
            ),

          type =
            COALESCE(
              $6,
              type
            ),

          status =
            COALESCE(
              $7,
              status
            )

        WHERE surgery_id = $8

        RETURNING *
        `,
        [
          patient_id,
          doctor_id,
          staff_id,
          surgery_name,
          date,
          type,
          status,
          req.params.id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Surgery not found",
      });
    }

    res.json(
      result.rows[0]
    );
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// =========================================
// DELETE
// =========================================

router.delete("/:id", async (req, res) => {
  try {
    const result =
      await pool.query(
        `
        DELETE FROM surgery

        WHERE surgery_id = $1

        RETURNING surgery_id
        `,
        [req.params.id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Surgery not found",
      });
    }

    res.json({
      message:
        "Surgery deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;