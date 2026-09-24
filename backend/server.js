require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./db");

// =========================================
// EXPLICIT TRANSACTION CONTROL FOR EVERY DML
// Every INSERT / UPDATE / DELETE sent through pool.query() now runs as
//   BEGIN -> statement -> COMMIT      (ROLLBACK if it fails)
// Multi-step workflows use their own BEGIN/COMMIT/ROLLBACK (see routes/staffWork.js
// and routes/admissions.js). Must stay ABOVE the route imports.
// =========================================

const rawQuery = pool.query.bind(pool);
const DML_START = /^\s*(INSERT|UPDATE|DELETE)\b/i;

pool.query = async function (text, params) {
  const sql = typeof text === "string" ? text : text && text.text;

  if (!sql || !DML_START.test(sql)) {
    return rawQuery(text, params); // SELECT etc. - nothing to commit
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(text, params);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
};
const { verifyToken } = require("./middleware/authMiddleware");
const authorize = require("./middleware/roleMiddleware");

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================================
// LOG EVERY 401 / 403 so a wrongly blocked request is easy to find
// (prints e.g.  [DENIED 403] GET /api/staff/5 role=doctor id=3 )
// =========================================

app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log(
        `[DENIED ${res.statusCode}] ${req.method} ${req.originalUrl} ` +
          `role=${req.user?.role || "none"} id=${req.user?.id ?? "-"}`
      );
    }
  });
  next();
});

// =========================================
// AUTHENTICATION ON EVERY API REQUEST
// A valid JWT is required for everything under /api except the
// public list below (login, registration, register-form lookups).
// =========================================

const PUBLIC_API = [
  ["GET", "/api/health"],
  ["GET", "/api/departments"],
  ["GET", "/api/staff/work-roles"],
  ["POST", "/api/admin/login"],
  ["POST", "/api/doctors/login"],
  ["POST", "/api/staff/login"],
  ["POST", "/api/patients/login"],
  ["POST", "/api/staff"],
  ["POST", "/api/patients"],
];

app.use("/api", (req, res, next) => {
  const cleanPath = req.originalUrl.split("?")[0].replace(/\/+$/, "");

  const isPublic = PUBLIC_API.some(
    ([method, route]) => req.method === method && cleanPath === route
  );

  if (isPublic) return next();

  verifyToken(req, res, next);
});

// =========================================
// OLD STAFF ENDPOINTS: ROLE RESTRICTED
// The staff dashboard now uses /api/staff-work (token + work role).
// The older open endpoints below are limited to the roles that
// legitimately need them, so a staff member cannot bypass work roles
// and a patient cannot call them at all.
//   [method, path pattern, allowed roles]
// =========================================

const LEGACY_STAFF_ROUTES = [
  ["PATCH", /^\/api\/appointments\/\d+\/staff-update$/, ["admin"]],
  ["PATCH", /^\/api\/lab-tests\/\d+\/staff-schedule$/, ["admin"]],
  ["PATCH", /^\/api\/surgeries\/\d+\/staff-schedule$/, ["admin"]],
  ["PATCH", /^\/api\/admissions\/\d+\/staff-admit$/, ["admin"]],
  ["PATCH", /^\/api\/admissions\/\d+\/discharge$/, ["admin", "doctor"]],
  ["POST", /^\/api\/blood-bank\/requests$/, ["admin"]],
  ["POST", /^\/api\/billing\/staff\/create$/, ["admin"]],
  ["PATCH", /^\/api\/billing\/\d+\/staff-approve$/, ["admin"]],

  // read-only lists: any hospital user except patients
  ["GET", /^\/api\/appointments\/unassigned\/all$/, ["admin", "doctor", "staff"]],
  ["GET", /^\/api\/lab-tests\/requests\/all$/, ["admin", "doctor", "staff"]],
  ["GET", /^\/api\/surgeries\/requests\/all$/, ["admin", "doctor", "staff"]],
  ["GET", /^\/api\/admissions\/pending\/all$/, ["admin", "doctor", "staff"]],
];

// runs after the global authentication guard, so req.user is already set
app.use((req, res, next) => {
  const rule = LEGACY_STAFF_ROUTES.find(
    ([method, pattern]) => req.method === method && pattern.test(req.path)
  );

  if (!rule) return next();

  authorize(...rule[2])(req, res, next);
});

// =========================================
// ROUTES
// =========================================

app.use("/api/admin", require("./routes/admin"));

app.use("/api/departments", require("./routes/departments"));

app.use("/api/staff", require("./routes/staff"));

// Role-based staff dashboard API (new)
app.use("/api/staff-work", require("./routes/staffWork"));

// Admin analytics (complex queries)
app.use("/api/analytics", require("./routes/analytics"));

app.use("/api/doctors", require("./routes/doctors"));

app.use("/api/patients", require("./routes/patients"));

app.use("/api/patient-dashboard", require("./routes/patientDashboard"));

app.use("/api/wards", require("./routes/wards"));

app.use("/api/rooms", require("./routes/rooms"));

app.use("/api/blood-bank", require("./routes/bloodBank"));

app.use("/api/time-slots", require("./routes/timeSlots"));

app.use("/api/appointments", require("./routes/appointments"));

app.use("/api/medical-items", require("./routes/medicalItems"));

app.use("/api/prescriptions", require("./routes/prescriptions"));

app.use("/api/lab-tests", require("./routes/labTests"));

app.use("/api/surgeries", require("./routes/surgeries"));

app.use("/api/admissions", require("./routes/admissions"));

app.use("/api/complaints", require("./routes/complaints"));

app.use("/api/insurance", require("./routes/insurance"));

app.use("/api/billing", require("./routes/billing"));

app.use("/api/payments", require("./routes/payments"));

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

app.get("/api/health", async (req, res) => {
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
    console.error("Health check error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// =========================================
// SYSTEM DASHBOARD STATS
// =========================================

app.get("/api/dashboard", async (req, res) => {
  try {
    const [
      patientResult,
      doctorResult,
      staffResult,
      appointmentResult,
      admissionResult,
      billResult,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM patient`),
      pool.query(`SELECT COUNT(*) AS count FROM doctor`),
      pool.query(`SELECT COUNT(*) AS count FROM staff`),
      pool.query(`SELECT COUNT(*) AS count FROM appointment`),
      pool.query(`SELECT COUNT(*) AS count FROM admission`),
      pool.query(`SELECT COUNT(*) AS count FROM billing`),
    ]);

    res.json({
      patients: Number(patientResult.rows[0].count),
      doctors: Number(doctorResult.rows[0].count),
      staff: Number(staffResult.rows[0].count),
      appointments: Number(appointmentResult.rows[0].count),
      admissions: Number(admissionResult.rows[0].count),
      bills: Number(billResult.rows[0].count),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

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

app.listen(PORT, async () => {
  console.log(`MediCare API running on http://localhost:${PORT}`);

  try {
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});