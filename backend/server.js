const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import all route files
app.use("/api/admin", require("./routes/admin"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/patients", require("./routes/patients"));
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

// Dashboard stats
app.get("/api/dashboard", async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM patient) AS total_patients,
        (SELECT COUNT(*) FROM doctor WHERE status = 'active') AS total_doctors,
        (SELECT COUNT(*) FROM appointment WHERE status = 'pending') AS pending_appointments,
        (SELECT COUNT(*) FROM admission WHERE status = 'admitted') AS current_admissions,
        (SELECT COUNT(*) FROM billing WHERE status = 'unpaid') AS unpaid_bills,
        (SELECT COUNT(*) FROM complaint WHERE status = 'open') AS open_complaints
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MediCare API running on http://localhost:${PORT}`);
});
