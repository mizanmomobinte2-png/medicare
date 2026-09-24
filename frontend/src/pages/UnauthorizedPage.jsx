import React from "react";
import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "64px", margin: 0, color: "#ef4444" }}>403</h1>
      <h2 style={{ fontSize: "24px", color: "#0f172a" }}>Access Denied</h2>
      <p style={{ color: "#64748b", maxWidth: "400px" }}>
        Apnar ei department / section access korar permission nei. Apnar assigned module check korun.
      </p>
      <Link
        to="/staff-dashboard"
        style={{
          marginTop: "16px",
          padding: "10px 20px",
          backgroundColor: "#2563eb",
          color: "white",
          textDecoration: "none",
          borderRadius: "6px",
          fontWeight: "600",
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;