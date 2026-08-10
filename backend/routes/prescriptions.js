const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================
// GET ALL PRESCRIPTIONS
// =====================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pr.pres_id,
        pr.patient_id,
        pr.doctor_id,
        pr.date,
        pr.diagnosis,
        pr.advice,
        pr.note,
        p.name AS patient_name,
        p.email AS patient_email,
        d.name AS doctor_name
      FROM prescription pr
      LEFT JOIN patient p
        ON pr.patient_id = p.patient_id
      LEFT JOIN doctor d
        ON pr.doctor_id = d.doctor_id
      ORDER BY pr.pres_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Get prescriptions error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// GET ONE DOCTOR'S PRESCRIPTIONS
// =====================================
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        pr.pres_id,
        pr.patient_id,
        pr.doctor_id,
        pr.date,
        pr.diagnosis,
        pr.advice,
        pr.note,

        p.name AS patient_name,
        p.email AS patient_email,
        p.phone AS patient_phone,
        p.gender,
        p.blood_group

      FROM prescription pr

      LEFT JOIN patient p
        ON pr.patient_id = p.patient_id

      WHERE pr.doctor_id = $1

      ORDER BY pr.date DESC, pr.pres_id DESC
      `,
      [req.params.doctorId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Doctor prescriptions error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// DOCTOR PRESCRIPTION SUMMARY
// =====================================
router.get("/doctor/:doctorId/summary", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total_prescriptions,

        COUNT(*) FILTER (
          WHERE date = CURRENT_DATE
        ) AS today_prescriptions

      FROM prescription
      WHERE doctor_id = $1
      `,
      [req.params.doctorId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Prescription summary error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// GET SINGLE PRESCRIPTION WITH ITEMS
// =====================================
router.get("/:id", async (req, res) => {
  try {
    const prescriptionResult = await pool.query(
      `
      SELECT
        pr.*,
        p.name AS patient_name,
        p.email AS patient_email,
        p.phone AS patient_phone,
        d.name AS doctor_name

      FROM prescription pr

      LEFT JOIN patient p
        ON pr.patient_id = p.patient_id

      LEFT JOIN doctor d
        ON pr.doctor_id = d.doctor_id

      WHERE pr.pres_id = $1
      `,
      [req.params.id]
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        error: "Prescription not found",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        pi.id,
        pi.pres_id,
        pi.item_id,
        pi.quantity,
        pi.dosage,
        mi.item_name,
        mi.category,
        mi.unit_price,
        mi.manufacturer

      FROM prescription_item pi

      JOIN medical_item mi
        ON pi.item_id = mi.item_id

      WHERE pi.pres_id = $1

      ORDER BY pi.id
      `,
      [req.params.id]
    );

    res.json({
      ...prescriptionResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error("Get prescription error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// CREATE PRESCRIPTION + ITEMS
// =====================================
router.post("/", async (req, res) => {
  const {
    patient_id,
    doctor_id,
    date,
    diagnosis,
    advice,
    note,
    items,
  } = req.body;

  if (!patient_id || !doctor_id) {
    return res.status(400).json({
      error: "Patient and doctor are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const prescriptionResult = await client.query(
      `
      INSERT INTO prescription
      (
        patient_id,
        doctor_id,
        date,
        diagnosis,
        advice,
        note
      )

      VALUES
      ($1,$2,$3,$4,$5,$6)

      RETURNING *
      `,
      [
        patient_id,
        doctor_id,
        date || null,
        diagnosis || null,
        advice || null,
        note || null,
      ]
    );

    const prescription = prescriptionResult.rows[0];

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await client.query(
          `
          INSERT INTO prescription_item
          (
            pres_id,
            item_id,
            quantity,
            dosage
          )
          VALUES ($1,$2,$3,$4)
          `,
          [
            prescription.pres_id,
            item.item_id,
            item.quantity || 1,
            item.dosage || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Create prescription error:", err);

    res.status(500).json({
      error: err.message,
    });
  } finally {
    client.release();
  }
});

// =====================================
// UPDATE PRESCRIPTION
// =====================================
router.put("/:id", async (req, res) => {
  const {
    patient_id,
    doctor_id,
    date,
    diagnosis,
    advice,
    note,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE prescription

      SET
        patient_id = COALESCE($1, patient_id),
        doctor_id = COALESCE($2, doctor_id),
        date = COALESCE($3, date),
        diagnosis = COALESCE($4, diagnosis),
        advice = COALESCE($5, advice),
        note = COALESCE($6, note)

      WHERE pres_id = $7

      RETURNING *
      `,
      [
        patient_id,
        doctor_id,
        date,
        diagnosis,
        advice,
        note,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Prescription not found",
      });
    }

    res.json({
      message: "Prescription updated successfully",
      prescription: result.rows[0],
    });
  } catch (err) {
    console.error("Update prescription error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// ADD ITEM TO EXISTING PRESCRIPTION
// =====================================
router.post("/:id/items", async (req, res) => {
  const {
    item_id,
    quantity,
    dosage,
  } = req.body;

  try {
    if (!item_id) {
      return res.status(400).json({
        error: "Medical item is required",
      });
    }

    const prescriptionCheck = await pool.query(
      `
      SELECT pres_id
      FROM prescription
      WHERE pres_id = $1
      `,
      [req.params.id]
    );

    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Prescription not found",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO prescription_item
      (
        pres_id,
        item_id,
        quantity,
        dosage
      )

      VALUES ($1,$2,$3,$4)

      RETURNING *
      `,
      [
        req.params.id,
        item_id,
        quantity || 1,
        dosage || null,
      ]
    );

    res.status(201).json({
      message: "Prescription item added successfully",
      item: result.rows[0],
    });
  } catch (err) {
    console.error("Add prescription item error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// DELETE PRESCRIPTION ITEM
// =====================================
router.delete("/:presId/items/:itemRowId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM prescription_item

      WHERE
        id = $1
        AND pres_id = $2

      RETURNING id
      `,
      [
        req.params.itemRowId,
        req.params.presId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Prescription item not found",
      });
    }

    res.json({
      message: "Prescription item deleted successfully",
    });
  } catch (err) {
    console.error("Delete prescription item error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================
// DELETE PRESCRIPTION
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM prescription
      WHERE pres_id = $1
      RETURNING pres_id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Prescription not found",
      });
    }

    res.json({
      message: "Prescription deleted successfully",
    });
  } catch (err) {
    console.error("Delete prescription error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;