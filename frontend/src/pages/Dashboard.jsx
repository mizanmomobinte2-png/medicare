import { useEffect, useState } from "react";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load dashboard"
          );
        }

        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-status">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-status dashboard-error">
        {error}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Patients",
      value: stats.total_patients,
      icon: "👥",
    },
    {
      label: "Active Doctors",
      value: stats.total_doctors,
      icon: "🩺",
    },
    {
      label: "Pending Appointments",
      value: stats.pending_appointments,
      icon: "📅",
    },
    {
      label: "Current Admissions",
      value: stats.current_admissions,
      icon: "🏥",
    },
    {
      label: "Unpaid Bills",
      value: stats.unpaid_bills,
      icon: "💳",
    },
    {
      label: "Open Complaints",
      value: stats.open_complaints,
      icon: "📋",
    },
  ];

  const storedAdmin = localStorage.getItem("admin");

  const admin = storedAdmin
    ? JSON.parse(storedAdmin)
    : null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-label">
            ADMIN DASHBOARD
          </p>

          <h1>
            Welcome
            {admin?.username
              ? `, ${admin.username}`
              : ""}
          </h1>

          <p>
            MediCare Hospital Management System Overview
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div
            className="stat-card"
            key={card.label}
          >
            <div className="stat-card-top">
              <span className="stat-icon">
                {card.icon}
              </span>

              <span className="stat-value">
                {card.value ?? 0}
              </span>
            </div>

            <p>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-info-card">
        <h2>Hospital Administration</h2>

        <p>
          Use the sidebar to manage doctors,
          staff, patients, departments,
          appointments, admissions, complaints,
          billing, payments and other hospital
          services.
        </p>
      </div>
    </div>
  );
}