const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// =========================================
// HELPER
// =========================================

const safeQuery = async (
  sql,
  params = []
) => {
  try {
    const result =
      await pool.query(
        sql,
        params
      );

    return result.rows;
  } catch (error) {
    console.error(
      "Optional query failed:",
      error.message
    );

    return [];
  }
};

const getTableColumns = async (
  tableName
) => {
  const result =
    await pool.query(
      `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default

      FROM information_schema.columns

      WHERE
        table_schema = 'public'
        AND table_name = $1

      ORDER BY ordinal_position
      `,
      [tableName]
    );

  return result.rows;
};


// =========================================
// GET INSURANCE FORM SCHEMA
// =========================================

router.get(
  "/insurance-schema",
  async (req, res) => {
    try {
      const columns =
        await getTableColumns(
          "insurance"
        );

      const editable =
        columns.filter(
          (column) =>
            column.column_name !==
              "insurance_id" &&
            column.column_name !==
              "patient_id"
        );

      res.json(editable);
    } catch (error) {
      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);


// =========================================
// UPDATE PATIENT PROFILE
// =========================================

router.put(
  "/profile/:patientId",
  async (req, res) => {
    const {
      name,
      email,
      password,
      phone,
      dob,
      gender,
      blood_group,
      address,
    } = req.body;

    try {
      let hashedPassword =
        null;

      if (password) {
        hashedPassword =
          await bcrypt.hash(
            password,
            10
          );
      }

      const result =
        await pool.query(
          `
          UPDATE patient

          SET
            name =
              COALESCE(
                $1,
                name
              ),

            email =
              COALESCE(
                $2,
                email
              ),

            password =
              COALESCE(
                $3,
                password
              ),

            phone =
              COALESCE(
                $4,
                phone
              ),

            dob =
              COALESCE(
                $5,
                dob
              ),

            gender =
              COALESCE(
                $6,
                gender
              ),

            blood_group =
              COALESCE(
                $7,
                blood_group
              ),

            address =
              COALESCE(
                $8,
                address
              )

          WHERE patient_id = $9

          RETURNING
            patient_id,
            name,
            email,
            phone,
            dob,
            gender,
            blood_group,
            address
          `,
          [
            name || null,
            email || null,
            hashedPassword,
            phone || null,
            dob || null,
            gender || null,
            blood_group || null,
            address || null,
            req.params.patientId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            error:
              "Patient not found",
          });
      }

      res.json({
        message:
          "Profile updated successfully",

        patient:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Patient profile update error:",
        error
      );

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);


// =========================================
// PATIENT BOOK APPOINTMENT USING SLOT
// =========================================

router.post(
  "/appointments/book",
  async (req, res) => {
    const {
      patient_id,
      doctor_id,
      slot_id,
      reason,
      notes,
    } = req.body;

    const client =
      await pool.connect();

    try {
      if (
        !patient_id ||
        !doctor_id ||
        !slot_id
      ) {
        return res
          .status(400)
          .json({
            error:
              "Patient, doctor and time slot are required",
          });
      }

      await client.query(
        "BEGIN"
      );

      const patientResult =
        await client.query(
          `
          SELECT patient_id

          FROM patient

          WHERE patient_id = $1
          `,
          [patient_id]
        );

      if (
        patientResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            error:
              "Patient not found",
          });
      }

      const doctorResult =
        await client.query(
          `
          SELECT doctor_id

          FROM doctor

          WHERE doctor_id = $1
          `,
          [doctor_id]
        );

      if (
        doctorResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            error:
              "Doctor not found",
          });
      }

      const slotResult =
        await client.query(
          `
          SELECT
            slot_id,
            doctor_id,
            slot_date,
            start_time,
            end_time,
            room,
            status

          FROM time_slot

          WHERE
            slot_id = $1
            AND doctor_id = $2

          FOR UPDATE
          `,
          [
            slot_id,
            doctor_id,
          ]
        );

      if (
        slotResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            error:
              "Time slot not found",
          });
      }

      const slot =
        slotResult.rows[0];

      if (
        String(
          slot.status
        ).toLowerCase() !==
        "available"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(409)
          .json({
            error:
              "This time slot is no longer available",
          });
      }

      const duplicate =
        await client.query(
          `
          SELECT appt_id

          FROM appointment

          WHERE
            patient_id = $1
            AND doctor_id = $2
            AND appt_date = $3
            AND appt_time = $4
            AND status NOT IN (
              'cancelled',
              'rejected'
            )
          `,
          [
            patient_id,
            doctor_id,
            slot.slot_date,
            slot.start_time,
          ]
        );

      if (
        duplicate.rows.length >
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(409)
          .json({
            error:
              "You already have this appointment",
          });
      }

      const appointment =
        await client.query(
          `
          INSERT INTO appointment
          (
            patient_id,
            doctor_id,
            staff_id,
            appt_date,
            appt_time,
            status,
            reason,
            notes
          )

          VALUES
          (
            $1,
            $2,
            NULL,
            $3,
            $4,
            'pending',
            $5,
            $6
          )

          RETURNING *
          `,
          [
            patient_id,
            doctor_id,
            slot.slot_date,
            slot.start_time,
            reason || null,
            notes || null,
          ]
        );

      await client.query(
        `
        UPDATE time_slot

        SET status = 'booked'

        WHERE slot_id = $1
        `,
        [slot_id]
      );

      await client.query(
        "COMMIT"
      );

      res
        .status(201)
        .json({
          message:
            "Appointment booked successfully",

          appointment:
            appointment.rows[0],
        });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Patient booking error:",
        error
      );

      res.status(500).json({
        error:
          error.message,
      });
    } finally {
      client.release();
    }
  }
);


// =========================================
// PATIENT CREATE COMPLAINT
// Supports current complaint schema
// and common doctor/staff column names.
// =========================================

router.post(
  "/complaints/:patientId",
  async (req, res) => {
    const {
      target_type,
      target_id,
      complaint_type,
      description,
    } = req.body;

    try {
      if (
        !complaint_type ||
        !description
      ) {
        return res
          .status(400)
          .json({
            error:
              "Complaint type and description are required",
          });
      }

      const columnRows =
        await getTableColumns(
          "complaint"
        );

      const columns =
        new Set(
          columnRows.map(
            (column) =>
              column.column_name
          )
        );

      const insertColumns =
        [];

      const values = [];

      const addValue = (
        column,
        value
      ) => {
        if (
          columns.has(column)
        ) {
          insertColumns.push(
            column
          );

          values.push(value);

          return true;
        }

        return false;
      };

      // Filed by patient
      if (
        !addValue(
          "patient_id",
          Number(
            req.params.patientId
          )
        )
      ) {
        addValue(
          "filed_by_patient_id",
          Number(
            req.params.patientId
          )
        );
      }

      // Complaint target
      if (
        target_type ===
          "staff" &&
        target_id
      ) {
        if (
          !addValue(
            "staff_id",
            Number(target_id)
          )
        ) {
          addValue(
            "against_staff_id",
            Number(target_id)
          );
        }
      }

      if (
        target_type ===
          "doctor" &&
        target_id
      ) {
        if (
          !addValue(
            "doctor_id",
            Number(target_id)
          )
        ) {
          addValue(
            "against_doctor_id",
            Number(target_id)
          );
        }
      }

      addValue(
        "complaint_type",
        complaint_type
      );

      addValue(
        "description",
        description
      );

      if (
        columns.has("date")
      ) {
        addValue(
          "date",
          new Date()
            .toISOString()
            .slice(0, 10)
        );
      }

      if (
        columns.has(
          "complaint_date"
        )
      ) {
        addValue(
          "complaint_date",
          new Date()
            .toISOString()
            .slice(0, 10)
        );
      }

      if (
        columns.has("status")
      ) {
        addValue(
          "status",
          "pending"
        );
      }

      if (
        columns.has(
          "complaint_status"
        )
      ) {
        addValue(
          "complaint_status",
          "pending"
        );
      }

      const placeholders =
        values.map(
          (_, index) =>
            `$${index + 1}`
        );

      const result =
        await pool.query(
          `
          INSERT INTO complaint
          (
            ${insertColumns.join(
              ", "
            )}
          )

          VALUES
          (
            ${placeholders.join(
              ", "
            )}
          )

          RETURNING *
          `,
          values
        );

      res
        .status(201)
        .json({
          message:
            "Complaint submitted successfully",

          complaint:
            result.rows[0],
        });
    } catch (error) {
      console.error(
        "Patient complaint error:",
        error
      );

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);


// =========================================
// PATIENT ADD INSURANCE
// Uses actual insurance columns.
// =========================================

router.post(
  "/insurance/:patientId",
  async (req, res) => {
    try {
      const columnRows =
        await getTableColumns(
          "insurance"
        );

      const available =
        new Set(
          columnRows.map(
            (column) =>
              column.column_name
          )
        );

      if (
        !available.has(
          "patient_id"
        )
      ) {
        return res
          .status(500)
          .json({
            error:
              "Insurance table does not contain patient_id",
          });
      }

      const insertColumns = [
        "patient_id",
      ];

      const values = [
        Number(
          req.params.patientId
        ),
      ];

      for (
        const [key, value]
        of Object.entries(
          req.body
        )
      ) {
        if (
          key ===
            "insurance_id" ||
          key ===
            "patient_id" ||
          !available.has(key)
        ) {
          continue;
        }

        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          continue;
        }

        insertColumns.push(
          key
        );

        values.push(value);
      }

      const placeholders =
        values.map(
          (_, index) =>
            `$${index + 1}`
        );

      const result =
        await pool.query(
          `
          INSERT INTO insurance
          (
            ${insertColumns.join(
              ", "
            )}
          )

          VALUES
          (
            ${placeholders.join(
              ", "
            )}
          )

          RETURNING *
          `,
          values
        );

      res
        .status(201)
        .json({
          message:
            "Insurance information added successfully",

          insurance:
            result.rows[0],
        });
    } catch (error) {
      console.error(
        "Insurance create error:",
        error
      );

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);


// =========================================
// LOAD ALL PATIENT DASHBOARD DATA
// =========================================

router.get(
  "/data/:patientId",
  async (req, res) => {
    const patientId =
      Number(
        req.params.patientId
      );

    try {
      // -----------------------------
      // PROFILE
      // -----------------------------

      const profileResult =
        await pool.query(
          `
          SELECT
            patient_id,
            name,
            email,
            phone,
            dob,
            gender,
            blood_group,
            address

          FROM patient

          WHERE patient_id = $1
          `,
          [patientId]
        );

      if (
        profileResult.rows
          .length === 0
      ) {
        return res
          .status(404)
          .json({
            error:
              "Patient not found",
          });
      }

      // -----------------------------
      // APPOINTMENTS
      // -----------------------------

      const appointments =
        await safeQuery(
          `
          SELECT
            a.*,

            d.name AS doctor_name,
            d.specialization,

            s.name AS staff_name

          FROM appointment a

          LEFT JOIN doctor d
            ON a.doctor_id =
               d.doctor_id

          LEFT JOIN staffs s
            ON a.staff_id =
               s.staff_id

          WHERE
            a.patient_id = $1

          ORDER BY
            a.appt_date DESC,
            a.appt_time DESC
          `,
          [patientId]
        );

      // -----------------------------
      // PRESCRIPTIONS
      // -----------------------------

      const prescriptions =
        await safeQuery(
          `
          SELECT
            pr.*,
            d.name AS doctor_name

          FROM prescription pr

          LEFT JOIN doctor d
            ON pr.doctor_id =
               d.doctor_id

          WHERE
            pr.patient_id = $1

          ORDER BY
            pr.pres_id DESC
          `,
          [patientId]
        );

      // -----------------------------
      // PRESCRIPTION ITEMS
      // -----------------------------

      const prescriptionItems =
        await safeQuery(
          `
          SELECT
            pi.*,
            mi.item_name

          FROM prescription_item pi

          JOIN prescription pr
            ON pi.pres_id =
               pr.pres_id

          LEFT JOIN medical_item mi
            ON pi.item_id =
               mi.item_id

          WHERE
            pr.patient_id = $1

          ORDER BY
            pi.pres_id DESC
          `,
          [patientId]
        );

      // -----------------------------
      // LAB TESTS
      // -----------------------------

      const labTests =
        await safeQuery(
          `
          SELECT *

          FROM labtest

          WHERE patient_id = $1

          ORDER BY
            date DESC,
            test_id DESC
          `,
          [patientId]
        );

      // -----------------------------
      // SURGERIES
      // -----------------------------

      const surgeries =
        await safeQuery(
          `
          SELECT
            s.*,
            d.name AS doctor_name

          FROM surgery s

          LEFT JOIN doctor d
            ON s.doctor_id =
               d.doctor_id

          WHERE
            s.patient_id = $1

          ORDER BY
            s.date DESC,
            s.surgery_id DESC
          `,
          [patientId]
        );

      // -----------------------------
      // ADMISSIONS
      // -----------------------------

      const admissions =
        await safeQuery(
          `
          SELECT
            ad.*,

            r.room_type,
            r.status AS room_status,

            d.name AS doctor_name

          FROM admission ad

          LEFT JOIN room r
            ON ad.room_id =
               r.room_id

          LEFT JOIN doctor d
            ON ad.doctor_id =
               d.doctor_id

          WHERE
            ad.patient_id = $1

          ORDER BY
            ad.adm_id DESC
          `,
          [patientId]
        );

      // -----------------------------
      // INSURANCE
      // -----------------------------

      const insurance =
        await safeQuery(
          `
          SELECT *

          FROM insurance

          WHERE patient_id = $1
          `,
          [patientId]
        );

      // -----------------------------
      // COMPLAINTS
      // -----------------------------

      let complaints = [];

      try {
        const complaintColumns =
          await getTableColumns(
            "complaint"
          );

        const complaintSet =
          new Set(
            complaintColumns.map(
              (column) =>
                column.column_name
            )
          );

        let patientColumn =
          null;

        if (
          complaintSet.has(
            "patient_id"
          )
        ) {
          patientColumn =
            "patient_id";
        } else if (
          complaintSet.has(
            "filed_by_patient_id"
          )
        ) {
          patientColumn =
            "filed_by_patient_id";
        }

        let orderColumn =
          "complaint_id";

        if (
          complaintSet.has(
            "date"
          )
        ) {
          orderColumn = "date";
        } else if (
          complaintSet.has(
            "complaint_date"
          )
        ) {
          orderColumn =
            "complaint_date";
        }

        if (patientColumn) {
          complaints =
            await safeQuery(
              `
              SELECT *

              FROM complaint

              WHERE
                ${patientColumn} = $1

              ORDER BY
                ${orderColumn} DESC
              `,
              [patientId]
            );
        }
      } catch (error) {
        console.error(
          "Complaint load error:",
          error.message
        );
      }

      res.json({
        profile:
          profileResult.rows[0],

        appointments,

        prescriptions,

        prescription_items:
          prescriptionItems,

        lab_tests:
          labTests,

        surgeries,

        admissions,

        insurance,

        complaints,
      });
    } catch (error) {
      console.error(
        "Patient dashboard data error:",
        error
      );

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

module.exports = router;