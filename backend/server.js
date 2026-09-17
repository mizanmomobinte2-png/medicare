require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================
// MIDDLEWARE
// =========================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Uploads folder
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// =========================================
// ROUTES
// =========================================

app.use(
  "/api/admin",
  require("./routes/admin")
);

app.use(
  "/api/departments",
  require("./routes/departments")
);

app.use(
  "/api/staff",
  require("./routes/staff")
);

app.use(
  "/api/doctors",
  require("./routes/doctors")
);

app.use(
  "/api/patients",
  require("./routes/patients")
);

app.use(
  "/api/patient-dashboard",
  require("./routes/patientDashboard")
);

app.use(
  "/api/wards",
  require("./routes/wards")
);

app.use(
  "/api/rooms",
  require("./routes/rooms")
);

app.use(
  "/api/blood-bank",
  require("./routes/bloodBank")
);

app.use(
  "/api/time-slots",
  require("./routes/timeSlots")
);

app.use(
  "/api/appointments",
  require("./routes/appointments")
);

app.use(
  "/api/medical-items",
  require("./routes/medicalItems")
);

app.use(
  "/api/prescriptions",
  require("./routes/prescriptions")
);

app.use(
  "/api/lab-tests",
  require("./routes/labTests")
);

app.use(
  "/api/surgeries",
  require("./routes/surgeries")
);

app.use(
  "/api/admissions",
  require("./routes/admissions")
);

app.use(
  "/api/complaints",
  require("./routes/complaints")
);

app.use(
  "/api/insurance",
  require("./routes/insurance")
);

app.use(
  "/api/billing",
  require("./routes/billing")
);

app.use(
  "/api/payments",
  require("./routes/payments")
);

// =========================================
// ROOT
// =========================================

app.get("/", (req, res) => {
  res.json({
    message: "MediCare backend is running",
  });
});

// =========================================
// HEALTH CHECK
// =========================================

app.get(
  "/api/health",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          current_database() AS database,
          CURRENT_TIMESTAMP AS time
      `);

      res.json({
        success: true,
        message: "MediCare API is running",
        database: result.rows[0].database,
        time: result.rows[0].time,
      });
    } catch (error) {
      console.error(
        "Health check error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: error.message,
      });
    }
  }
);

// =========================================
// SYSTEM DASHBOARD STATS
// =========================================

app.get(
  "/api/dashboard",
  async (req, res) => {
    try {
      const [
        patientResult,
        doctorResult,
        staffResult,
        appointmentResult,
        admissionResult,
        billResult,
      ] = await Promise.all([
        pool.query(`
          SELECT COUNT(*) AS count
          FROM patient
        `),

        pool.query(`
          SELECT COUNT(*) AS count
          FROM doctor
        `),

        pool.query(`
          SELECT COUNT(*) AS count
          FROM staff
        `),

        pool.query(`
          SELECT COUNT(*) AS count
          FROM appointment
        `),

        pool.query(`
          SELECT COUNT(*) AS count
          FROM admission
        `),

        pool.query(`
          SELECT COUNT(*) AS count
          FROM billing
        `),
      ]);

      res.json({
        patients: Number(
          patientResult.rows[0].count
        ),

        doctors: Number(
          doctorResult.rows[0].count
        ),

        staff: Number(
          staffResult.rows[0].count
        ),

        appointments: Number(
          appointmentResult.rows[0].count
        ),

        admissions: Number(
          admissionResult.rows[0].count
        ),

        bills: Number(
          billResult.rows[0].count
        ),
      });
    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// =========================================
// 404 - MUST STAY AFTER ALL ROUTES
// =========================================

app.use((req, res) => {
  res.status(404).json({
    error: "API route not found",
  });
});

// =========================================
// SERVER
// =========================================

app.listen(
  PORT,
  async () => {
    console.log(
      `MediCare API running on http://localhost:${PORT}`
    );

    try {
      await pool.query(
        "SELECT NOW()"
      );

      console.log(
        "Database connection successful"
      );
    } catch (error) {
      console.error(
        "Database connection failed:",
        error.message
      );
    }
  }
);