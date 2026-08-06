import { useState, useEffect } from "react";
import api from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div>Loading dashboard...</div>;

  const cards = [
    { label: "Total Patients", value: stats.total_patients },
    { label: "Active Doctors", value: stats.total_doctors },
    { label: "Pending Appointments", value: stats.pending_appointments },
    { label: "Current Admissions", value: stats.current_admissions },
    { label: "Unpaid Bills", value: stats.unpaid_bills },
    { label: "Open Complaints", value: stats.open_complaints },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>MediCare Hospital Management System Overview</p>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <h3>{card.value}</h3>
            <p>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>About This System</h3>
        <p style={{ lineHeight: 1.6, color: "#555" }}>
          This Hospital Management System covers all entities from the ERD including
          Patients, Doctors, Staff, Departments, Appointments, Prescriptions, Lab Tests,
          Surgeries, Admissions, Billing, Payments, Insurance, Blood Bank, and Complaints.
          Use the sidebar to manage each module.
        </p>
      </div>
    </div>
  );
}
