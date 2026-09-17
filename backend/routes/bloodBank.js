const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================
// GET ALL BLOOD BANK STOCK
// =====================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM blood_bank
      ORDER BY bank_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(
      "Get blood bank error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// GET ALL WARD BLOOD SUPPLIES
// =====================================

router.get(
  "/supplies/all",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          ws.*,
          w.ward_id,
          bb.blood_group,
          d.dept_name

        FROM ward_blood_supply ws

        JOIN ward w
          ON ws.ward_id = w.ward_id

        JOIN blood_bank bb
          ON ws.bank_id = bb.bank_id

        LEFT JOIN department d
          ON w.dept_id = d.dept_id

        ORDER BY ws.supply_id
      `);

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Get ward blood supplies error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET ALL BLOOD REQUESTS
// =====================================

router.get(
  "/requests/all",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          br.*,
          s.name AS staff_name,
          bb.blood_group,
          bb.available_quantity,
          bb.storage_location

        FROM blood_request br

        LEFT JOIN staff s
          ON br.staff_id = s.staff_id

        LEFT JOIN blood_bank bb
          ON br.bank_id = bb.bank_id

        ORDER BY br.request_id DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Get all blood requests error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET BLOOD REQUESTS OF ONE STAFF
// =====================================

router.get(
  "/requests/staff/:staffId",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          br.request_id,
          br.staff_id,
          br.bank_id,
          br.quantity,
          br.status,

          bb.blood_group,
          bb.available_quantity,
          bb.storage_location,
          bb.expiry_date

        FROM blood_request br

        LEFT JOIN blood_bank bb
          ON br.bank_id = bb.bank_id

        WHERE br.staff_id = $1

        ORDER BY br.request_id DESC
        `,
        [req.params.staffId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(
        "Staff blood requests error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// GET SINGLE BLOOD BANK RECORD
// =====================================

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM blood_bank
      WHERE bank_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          "Blood bank record not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// CREATE BLOOD BANK RECORD
// =====================================

router.post("/", async (req, res) => {
  const {
    blood_group,
    available_quantity,
    storage_location,
    expiry_date,
  } = req.body;

  try {
    if (!blood_group) {
      return res.status(400).json({
        error: "Blood group is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO blood_bank
      (
        blood_group,
        available_quantity,
        storage_location,
        expiry_date
      )

      VALUES ($1,$2,$3,$4)

      RETURNING *
      `,
      [
        blood_group,
        available_quantity || 0,
        storage_location || null,
        expiry_date || null,
      ]
    );

    res.status(201).json(
      result.rows[0]
    );
  } catch (err) {
    console.error(
      "Create blood bank record error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// UPDATE BLOOD BANK RECORD
// =====================================

router.put("/:id", async (req, res) => {
  const {
    blood_group,
    available_quantity,
    storage_location,
    expiry_date,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE blood_bank

      SET
        blood_group =
          COALESCE($1, blood_group),

        available_quantity =
          COALESCE(
            $2,
            available_quantity
          ),

        storage_location =
          COALESCE(
            $3,
            storage_location
          ),

        last_updated =
          CURRENT_TIMESTAMP,

        expiry_date =
          COALESCE(
            $4,
            expiry_date
          )

      WHERE bank_id = $5

      RETURNING *
      `,
      [
        blood_group,
        available_quantity,
        storage_location,
        expiry_date,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          "Blood bank record not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(
      "Update blood bank error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// DELETE BLOOD BANK RECORD
// =====================================

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM blood_bank
      WHERE bank_id = $1
      RETURNING bank_id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          "Blood bank record not found",
      });
    }

    res.json({
      message:
        "Blood bank record deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// CREATE WARD BLOOD SUPPLY
// =====================================

router.post(
  "/supplies",
  async (req, res) => {
    const {
      ward_id,
      bank_id,
      quantity,
    } = req.body;

    try {
      if (
        !ward_id ||
        !bank_id ||
        !quantity
      ) {
        return res.status(400).json({
          error:
            "ward_id, bank_id and quantity are required",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO ward_blood_supply
        (
          ward_id,
          bank_id,
          quantity
        )

        VALUES ($1,$2,$3)

        RETURNING *
        `,
        [
          ward_id,
          bank_id,
          quantity,
        ]
      );

      res.status(201).json(
        result.rows[0]
      );
    } catch (err) {
      console.error(
        "Create ward blood supply error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// =====================================
// CREATE STAFF BLOOD REQUEST
// =====================================

router.post(
  "/requests",
  async (req, res) => {
    const {
      staff_id,
      bank_id,
      quantity,
      status,
    } = req.body;

    try {
      if (!staff_id) {
        return res.status(400).json({
          error: "staff_id is required",
        });
      }

      if (!bank_id) {
        return res.status(400).json({
          error: "bank_id is required",
        });
      }

      if (
        !quantity ||
        Number(quantity) <= 0
      ) {
        return res.status(400).json({
          error:
            "Valid quantity is required",
        });
      }

      const staffCheck =
        await pool.query(
          `
          SELECT staff_id
          FROM staff
          WHERE staff_id = $1
          `,
          [staff_id]
        );

      if (
        staffCheck.rows.length === 0
      ) {
        return res.status(404).json({
          error: "Staff not found",
        });
      }

      const bankCheck =
        await pool.query(
          `
          SELECT
            bank_id,
            blood_group,
            available_quantity
          FROM blood_bank
          WHERE bank_id = $1
          `,
          [bank_id]
        );

      if (
        bankCheck.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Blood bank record not found",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO blood_request
        (
          staff_id,
          bank_id,
          quantity,
          status
        )

        VALUES ($1,$2,$3,$4)

        RETURNING *
        `,
        [
          staff_id,
          bank_id,
          quantity,
          status || "pending",
        ]
      );

      res.status(201).json({
        message:
          "Blood request submitted successfully",

        request:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "Create blood request error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

module.exports = router;