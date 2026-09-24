import React, { useState } from "react";

const UnassignedAppointmentsPage = () => {
  const [unassignedList, setUnassignedList] = useState([
    {
      id: 101,
      patientName: "Kamrul Islam",
      phone: "01711223344",
      department: "Cardiology",
      appointmentDate: "2026-09-25",
      timeSlot: "10:00 AM - 10:30 AM",
      reason: "Chest pain and mild dizziness",
    },
    {
      id: 102,
      patientName: "Sabina Yasmin",
      phone: "01822334455",
      department: "Neurology",
      appointmentDate: "2026-09-25",
      timeSlot: "11:30 AM - 12:00 PM",
      reason: "Chronic migraine",
    },
    {
      id: 103,
      patientName: "Rafiqul Islam",
      phone: "01933445566",
      department: "Orthopedics",
      appointmentDate: "2026-09-26",
      timeSlot: "02:00 PM - 02:30 PM",
      reason: "Joint pain in right knee",
    },
  ]);

  const doctorsList = [
    { id: 1, name: "Dr. A. K. Azad", department: "Cardiology" },
    { id: 2, name: "Dr. Nusrat Jahan", department: "Neurology" },
    { id: 3, name: "Dr. Mahmudul Hasan", department: "Orthopedics" },
    { id: 4, name: "Dr. Farhana Ahmed", department: "Cardiology" },
  ];

  const [selectedDoctors, setSelectedDoctors] = useState({});

  const handleDoctorSelect = (appointmentId, doctorId) => {
    setSelectedDoctors((prev) => ({
      ...prev,
      [appointmentId]: doctorId,
    }));
  };

  const handleAssign = (appointmentId) => {
    const doctorId = selectedDoctors[appointmentId];
    if (!doctorId) {
      alert("Please select a doctor before assigning!");
      return;
    }

    const assignedDoc = doctorsList.find((d) => d.id === Number(doctorId));
    alert(`Appointment #${appointmentId} successfully assigned to ${assignedDoc.name}!`);

    // Remove from unassigned list
    setUnassignedList((prev) => prev.filter((item) => item.id !== appointmentId));
  };

  return (
    <div style={{ maxWidth: "1000px", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#0f172a", margin: 0 }}>
          Unassigned Appointments
        </h1>
        <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
          Review pending patient requests and assign appropriate doctors
        </p>
      </div>

      {/* STATS BADGE */}
      <div
        style={{
          display: "inline-block",
          backgroundColor: "#fef3c7",
          border: "1px solid #fde68a",
          color: "#92400e",
          padding: "8px 16px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "14px",
          marginBottom: "20px",
        }}
      >
        ⚠️ Pending Assignments: {unassignedList.length}
      </div>

      {/* TABLE */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Patient Info</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Assign Doctor</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {unassignedList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                  🎉 All appointments have been assigned!
                </td>
              </tr>
            ) : (
              unassignedList.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>#{item.id}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{item.patientName}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{item.phone}</div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "3px 8px",
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {item.department}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div>{item.appointmentDate}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{item.timeSlot}</div>
                  </td>
                  <td style={{ ...tdStyle, color: "#475569", maxWidth: "180px" }}>{item.reason}</td>
                  <td style={tdStyle}>
                    <select
                      value={selectedDoctors[item.id] || ""}
                      onChange={(e) => handleDoctorSelect(item.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        width: "100%",
                      }}
                    >
                      <option value="">-- Select Doctor --</option>
                      {doctorsList
                        .filter((d) => d.department === item.department)
                        .map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      onClick={() => handleAssign(item.id)}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: "12px 16px",
  fontWeight: "600",
};

const tdStyle = {
  padding: "12px 16px",
  color: "#334155",
};

export default UnassignedAppointmentsPage;