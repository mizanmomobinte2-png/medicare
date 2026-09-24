import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const th = { padding: "12px 16px", fontWeight: 600, textAlign: "left" };
const td = { padding: "12px 16px", color: "#334155" };
const select = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

export default function StaffRoleManagementPage({ embedded = false }) {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [staffList, roleList] = await Promise.all([
        api.get("/staff"),
        api.get("/staff/work-roles"),
      ]);
      setStaff(staffList);
      setRoles(roleList);
      setEdits({});
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const valueOf = (row, field) =>
    edits[row.staff_id]?.[field] ?? row[field] ?? "";

  const change = (row, field, value) =>
    setEdits((prev) => ({
      ...prev,
      [row.staff_id]: { ...prev[row.staff_id], [field]: value },
    }));

  async function save(row) {
    const changes = edits[row.staff_id];
    if (!changes) return;

    try {
      await api.put(`/staff/${row.staff_id}`, changes);
      setMessage({ type: "ok", text: `${row.name} updated.` });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  const banner = {
    padding: "10px 14px",
    borderRadius: 6,
    marginBottom: 16,
    background: message.type === "error" ? "#fee2e2" : "#dcfce7",
    color: message.type === "error" ? "#b91c1c" : "#166534",
  };

  return (
    <div
      style={
        embedded
          ? { maxWidth: 1050 }
          : { maxWidth: 1050, margin: "32px auto", padding: "0 20px" }
      }
    >
      {!embedded && <Link to="/admin-dashboard">&larr; Back to dashboard</Link>}

      <h1 style={{ fontSize: 28, margin: "12px 0 4px" }}>Staff Work Roles</h1>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Each staff member sees only the work of their role. Changes apply on the
        staff member's next action.
      </p>

      {message.text && <div style={banner}>{message.text}</div>}

      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", color: "#475569" }}>
              <th style={th}>ID</th>
              <th style={th}>Staff</th>
              <th style={th}>Department</th>
              <th style={th}>Work Role</th>
              <th style={th}>Status</th>
              <th style={th}></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td style={td} colSpan={6}>Loading...</td>
              </tr>
            )}

            {!loading && staff.length === 0 && (
              <tr>
                <td style={td} colSpan={6}>No staff found.</td>
              </tr>
            )}

            {staff.map((row) => {
              const dirty = Boolean(edits[row.staff_id]);

              return (
                <tr key={row.staff_id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={td}>{row.staff_id}</td>

                  <td style={td}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{row.email}</div>
                  </td>

                  <td style={td}>{row.dept_name || "-"}</td>

                  <td style={td}>
                    <select
                      style={select}
                      value={valueOf(row, "staff_role")}
                      onChange={(e) => change(row, "staff_role", e.target.value)}
                    >
                      <option value="">-- No role --</option>
                      {roles.map((role) => (
                        <option key={role.key} value={role.key}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={td}>
                    <select
                      style={select}
                      value={valueOf(row, "status") || "active"}
                      onChange={(e) => change(row, "status", e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </td>

                  <td style={td}>
                    <button
                      disabled={!dirty}
                      onClick={() => save(row)}
                      style={{
                        padding: "6px 14px",
                        border: "none",
                        borderRadius: 6,
                        color: "#fff",
                        background: dirty ? "#2563eb" : "#94a3b8",
                        cursor: dirty ? "pointer" : "default",
                      }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
