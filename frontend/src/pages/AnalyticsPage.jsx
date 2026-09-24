import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const num = (v) => Number(v || 0).toLocaleString();
const money = (v) => Number(v || 0).toFixed(2);
const day = (v) => (v ? String(v).slice(0, 10) : "-");
const time = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "-");

const SECTIONS = [
  {
    key: "top-doctors",
    title: "Top Doctors",
    note: "Most appointments (doctor + department + appointment)",
    cols: [
      ["Doctor", (r) => r.name],
      ["Specialization", (r) => r.specialization || "-"],
      ["Department", (r) => r.dept_name || "-"],
      ["Total", (r) => num(r.total_appointments)],
      ["Completed", (r) => num(r.completed)],
      ["Unique Patients", (r) => num(r.unique_patients)],
      ["Last 30 Days", (r) => num(r.last_30_days)],
    ],
  },
  {
    key: "monthly-revenue",
    title: "Monthly Revenue",
    note: "Billed vs collected (billing + payment)",
    cols: [
      ["Month", (r) => r.month],
      ["Bills", (r) => num(r.bills)],
      ["Billed", (r) => money(r.billed)],
      ["Collected", (r) => money(r.collected)],
      ["Outstanding", (r) => money(r.outstanding)],
    ],
  },
  {
    key: "ward-occupancy",
    title: "Ward Occupancy",
    note: "Rooms occupied per ward (function fn_ward_occupancy)",
    cols: [
      ["Ward", (r) => `Ward ${r.ward_id}`],
      ["Department", (r) => r.dept_name || "-"],
      ["Rooms", (r) => num(r.total_rooms)],
      ["Occupied", (r) => num(r.occupied_rooms)],
      ["Occupancy %", (r) => `${r.occupancy_pct}%`],
    ],
  },
  {
    key: "staff-workload",
    title: "Staff Workload",
    note: "Items handled by each staff member",
    cols: [
      ["Staff", (r) => r.name],
      ["Work Role", (r) => r.staff_role || "-"],
      ["Appointments", (r) => num(r.appointments)],
      ["Lab", (r) => num(r.lab_tests)],
      ["Surgery", (r) => num(r.surgeries)],
      ["Admissions", (r) => num(r.admissions)],
      ["Complaints", (r) => num(r.complaints)],
      ["Bills", (r) => num(r.bills)],
      ["Total", (r) => num(r.total)],
    ],
  },
  {
    key: "outstanding-balances",
    title: "Highest Outstanding Balances",
    note: "Unpaid amount per patient (function fn_bill_balance)",
    cols: [
      ["Patient", (r) => r.name],
      ["Phone", (r) => r.phone || "-"],
      ["Open Bills", (r) => num(r.open_bills)],
      ["Balance", (r) => money(r.balance)],
    ],
  },
  {
    key: "blood-demand",
    title: "Blood Stock vs Demand",
    note: "Available units against pending and approved requests",
    cols: [
      ["Blood Group", (r) => r.blood_group],
      ["In Stock", (r) => num(r.available_quantity)],
      ["Pending Units", (r) => num(r.pending_units)],
      ["Approved Units", (r) => num(r.approved_units)],
      ["Requests", (r) => num(r.total_requests)],
      ["Expiry", (r) => day(r.expiry_date)],
    ],
  },
  {
    key: "billing-audit",
    title: "Billing Audit Log",
    note: "Written automatically by trigger trg_billing_audit",
    cols: [
      ["Bill", (r) => r.bill_id],
      ["Action", (r) => r.action],
      ["Status", (r) => `${r.old_status || "-"} → ${r.new_status || "-"}`],
      ["Amount", (r) => `${money(r.old_amount)} → ${money(r.new_amount)}`],
      ["DB User", (r) => r.changed_by],
      ["When", (r) => time(r.changed_at)],
    ],
  },
];

const th = { padding: "10px 14px", textAlign: "left", fontWeight: 600 };
const td = { padding: "10px 14px", color: "#334155" };

export default function AnalyticsPage({ embedded = false }) {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled(
        SECTIONS.map((s) => api.get(`/analytics/${s.key}`))
      );

      const nextData = {};
      const nextErrors = {};

      results.forEach((r, i) => {
        const key = SECTIONS[i].key;
        if (r.status === "fulfilled") nextData[key] = r.value;
        else nextErrors[key] = r.reason.message;
      });

      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    })();
  }, []);

  return (
    <div
      style={
        embedded
          ? { maxWidth: 1100 }
          : { maxWidth: 1100, margin: "32px auto", padding: "0 20px" }
      }
    >
      {!embedded && <Link to="/admin-dashboard">&larr; Back to dashboard</Link>}

      <h1 style={{ fontSize: 28, margin: "12px 0 4px" }}>Hospital Analytics</h1>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Live reports calculated by the database.
      </p>

      {loading && <p>Loading...</p>}

      {SECTIONS.map((section) => {
        const rows = data[section.key] || [];

        return (
          <div
            key={section.key}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              marginBottom: 24,
              overflowX: "auto",
            }}
          >
            <div style={{ padding: "14px 16px 6px" }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{section.title}</h2>
              <div style={{ fontSize: 12, color: "#64748b" }}>{section.note}</div>
            </div>

            {errors[section.key] && (
              <p style={{ color: "#b91c1c", padding: "0 16px" }}>
                {errors[section.key]}
              </p>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569" }}>
                  {section.cols.map(([label]) => (
                    <th key={label} style={th}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 && !errors[section.key] && (
                  <tr>
                    <td style={td} colSpan={section.cols.length}>
                      No data yet.
                    </td>
                  </tr>
                )}

                {rows.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                    {section.cols.map(([label, render]) => (
                      <td key={label} style={td}>
                        {render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
