import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside
      style={{
        width: "250px",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        minHeight: "100vh",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ paddingBottom: "16px", borderBottom: "1px solid #334155", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#38bdf8" }}>
            MediCare
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
            Role: {user.role || "Staff"}
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
            Dept: {user.department || "Cardiology"}
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Link to="/staff-dashboard" style={linkStyle}>
            Dashboard
          </Link>
          <Link to="/staff-dashboard/profile" style={linkStyle}>
            My Profile
          </Link>
          <Link to="/staff-dashboard/appointments" style={linkStyle}>
            Appointments
          </Link>
          <Link to="/staff-dashboard/unassigned-appointments" style={linkStyle}>
            Unassigned Appointments
          </Link>
          <Link to="/staff-dashboard/admissions" style={linkStyle}>
            Admissions
          </Link>
          <Link to="/staff-dashboard/wards" style={linkStyle}>
            Wards
          </Link>
          <Link to="/staff-dashboard/rooms" style={linkStyle}>
            Rooms
          </Link>
        </nav>
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: "10px",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Logout
      </button>
    </aside>
  );
};

const linkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: "6px",
  backgroundColor: "transparent",
  fontSize: "14px",
  fontWeight: "500",
};

export default Sidebar;