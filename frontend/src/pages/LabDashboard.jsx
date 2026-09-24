import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api/lab-tests";

export default function LabDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);

  // Form states for scheduling/completing
  const [scheduleDate, setScheduleDate] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [testResult, setTestResult] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [message, setMessage] = useState("");

  // Get logged in staff's staff_id
  const loggedUser = JSON.parse(
    localStorage.getItem("staff") || localStorage.getItem("user") || "{}"
  );
  const staffId = loggedUser.staff_id || loggedUser.id;

  // Fetch pending requests for Lab Staff
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/requests/all`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Error fetching lab requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Open modal / setup form
  const handleSelectTest = (test) => {
    setSelectedTest(test);
    setScheduleDate(test.date ? test.date.split("T")[0] : "");
    setUnitPrice(test.unit_price || "");
    setTestResult(test.result || "");
    setStatus(test.status || "scheduled");
    setMessage("");
  };

  // 1. Schedule Lab Test (PATCH /:id/staff-schedule)
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!staffId) {
      setMessage("Staff ID missing! Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${selectedTest.test_id}/staff-schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffId,
          date: scheduleDate,
          unit_price: unitPrice || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Lab test scheduled successfully!");
        setSelectedTest(null);
        fetchRequests();
      } else {
        setMessage(data.error || "Failed to schedule test.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server connection error.");
    }
  };

  // 2. Update Result & Complete (PUT /:id)
  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/${selectedTest.test_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: testResult,
          status: status,
        }),
      });

      if (res.ok) {
        setMessage("Lab test updated/completed successfully!");
        setSelectedTest(null);
        fetchRequests();
      } else {
        setMessage("Failed to update test.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server connection error.");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#0f172a", marginBottom: "4px" }}>
        🧪 Lab Workstation
      </h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Manage lab test requests, schedule dates, assign pricing, and publish results.
      </p>

      {message && (
        <div style={{ padding: "12px", backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "6px", marginBottom: "16px" }}>
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading lab requests...</p>
      ) : requests.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ textAlign: "center", color: "#64748b", margin: 0 }}>
            No pending lab requests right now.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Patient Name</th>
                <th style={thStyle}>Test Name</th>
                <th style={thStyle}>Doctor</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.test_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>#{item.test_id}</td>
                  <td style={tdStyle}>
                    <strong>{item.patient_name || "N/A"}</strong>
                    {item.patient_phone && <div style={{ fontSize: "12px", color: "#64748b" }}>{item.patient_phone}</div>}
                  </td>
                  <td style={tdStyle}>{item.test_name}</td>
                  <td style={tdStyle}>{item.doctor_name || "Self/Direct"}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(item.status)}>{item.status}</span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleSelectTest(item)} style={btnStyle}>
                      Manage Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Action */}
      {selectedTest && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Manage Test #{selectedTest.test_id}</h3>
            <p style={{ fontSize: "14px", color: "#475569" }}>
              <strong>Patient:</strong> {selectedTest.patient_name} | <strong>Test:</strong> {selectedTest.test_name}
            </p>

            <hr style={{ border: "0.5px solid #e2e8f0", margin: "16px 0" }} />

            {/* Schedule Section */}
            <form onSubmit={handleSchedule} style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>1. Schedule & Price</h4>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Unit Price ($)"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button type="submit" style={{ ...btnStyle, backgroundColor: "#0284c7", width: "100%" }}>
                Update Schedule & Price
              </button>
            </form>

            <hr style={{ border: "0.5px solid #e2e8f0", margin: "16px 0" }} />

            {/* Complete / Result Section */}
            <form onSubmit={handleComplete}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>2. Test Result & Status</h4>
              <textarea
                rows="3"
                placeholder="Enter lab findings / report..."
                value={testResult}
                onChange={(e) => setTestResult(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: "10px" }}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: "12px" }}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSelectedTest(null)} style={cancelBtnStyle}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnStyle, backgroundColor: "#16a34a" }}>
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles
const cardStyle = { backgroundColor: "#fff", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden" };
const thStyle = { padding: "12px", textAlign: "left", fontSize: "14px", color: "#475569" };
const tdStyle = { padding: "12px", fontSize: "14px", color: "#1e293b" };
const inputStyle = { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "14px" };
const btnStyle = { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" };
const cancelBtnStyle = { backgroundColor: "#64748b", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", cursor: "pointer" };

const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" };
const modalBox = { backgroundColor: "#fff", padding: "24px", borderRadius: "8px", width: "460px", maxWidth: "90%" };

const badgeStyle = (st) => ({
  backgroundColor: st === "completed" ? "#d1fae5" : st === "scheduled" ? "#e0f2fe" : "#fef3c7",
  color: st === "completed" ? "#047857" : st === "scheduled" ? "#0369a1" : "#b45309",
  padding: "3px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "bold",
});