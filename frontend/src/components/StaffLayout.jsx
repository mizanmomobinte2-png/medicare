import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const StaffLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/staff-dashboard" },
    { label: "My Profile", path: "/staff-dashboard/profile" },
    { label: "Appointments", path: "/staff-dashboard/appointments" },
    { label: "Unassigned Appointments", path: "/staff-dashboard/unassigned-appointments" },
    { label: "Admissions", path: "/staff-dashboard/admissions" },
    { label: "Wards", path: "/staff-dashboard/wards" },
    { label: "Rooms", path: "/staff-dashboard/rooms" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "sans-serif" }}>
      {/* SINGLE MAIN SIDEBAR */}
      <div
        style={{
          width: "260px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0
        }}
      >
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", margin: "0 0 16px 8px" }}>
            MediCare
          </h2>
          <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px", paddingLeft: "8px" }}>
            <p style={{ margin: "2px 0" }}>Role: <strong>Staff</strong></p>
            <p style={{ margin: "2px 0" }}>Dept: <strong>CARDIOLOGY</strong></p>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#2563eb" : "#334155",
                    fontWeight: isActive ? "600" : "500",
                    border: "none",
                    textAlign: "left",
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "24px",
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
};

export default StaffLayout;