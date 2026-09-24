import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StaffDashboard.css";

const API = "http://localhost:5000/api/staff-work";

const PAGES = {
  overview: "Dashboard",
  profile: "My Profile",
  appointments: "My Appointments",
  unassigned: "Unassigned Appointments",
  admissions: "Admissions",
  rooms: "Ward & Rooms",
  labtests: "Lab Tests",
  surgeries: "Surgeries",
  blood: "Blood Requests",
  billing: "Billing",
  payments: "Payments",
  complaints: "Complaints",
  department: "My Department",
  admin: "Admin Relation",
};

// which API calls each module needs: [stateKey, path]
const LOADERS = {
  appointments: [["appointments", "/appointments/mine"]],
  unassigned: [["unassigned", "/appointments/unassigned"]],
  admissions: [
    ["admissions", "/admissions"],
    ["wardRooms", "/ward-rooms"],
  ],
  rooms: [["wardRooms", "/ward-rooms"]],
  labtests: [["labtests", "/lab-tests"]],
  surgeries: [["surgeries", "/surgeries"]],
  blood: [
    ["bank", "/blood/bank"],
    ["bloodRequests", "/blood/requests"],
  ],
  billing: [
    ["bills", "/billing/bills"],
    ["items", "/billing/items"],
  ],
  payments: [["payments", "/billing/payments"]],
  admin: [["adminRel", "/admin-relations"]],
  complaints: [["complaints", "/complaints"]],
};

const ITEM_KEY = {
  appointment: "appointments",
  admission: "admissions",
  surgery: "surgeries",
  labtest: "labtests",
};

// ---------- helpers ----------

async function call(path, method = "GET", body) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

const dateOnly = (v) => (v ? String(v).slice(0, 10) : "");
const timeOnly = (v) => (v ? String(v).slice(0, 5) : "");
const money = (v) => Number(v || 0).toFixed(2);
const today = new Date().toLocaleDateString("en-CA");

function Table({ cols, rows, rowKey, empty = "No records." }) {
  return (
    <div className="staff-table-wrapper">
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.h}>{c.h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row[rowKey]}>
                {cols.map((c) => (
                  <td key={c.h}>{c.r(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- component ----------

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [page, setPage] = useState("overview");
  const [data, setData] = useState({});
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [bloodForm, setBloodForm] = useState({ bank_id: "", quantity: "" });
  const [billForm, setBillForm] = useState({
    source_type: "appointment",
    source_id: "",
    amount: "",
    discount: "0",
    tax: "0",
  });

  const list = (key) => (Array.isArray(data[key]) ? data[key] : []);
  const has = (module) => Boolean(me?.modules?.includes(module));
  const mine = (row) => row.staff_id === me?.staff_id;

  const val = (key, field, fallback = "") =>
    forms[key] && forms[key][field] !== undefined
      ? forms[key][field]
      : fallback;

  const setF = (key, field, value) =>
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  async function loadModules(modules) {
    const jobs = modules.flatMap((m) => LOADERS[m] || []);
    const unique = [...new Map(jobs.map((j) => [j[0], j])).values()];

    const results = await Promise.allSettled(
      unique.map(([, path]) => call(path))
    );

    const next = {};
    let failure = "";

    results.forEach((r, i) => {
      if (r.status === "fulfilled") next[unique[i][0]] = r.value;
      else failure = failure || r.reason.message;
    });

    setData((prev) => ({ ...prev, ...next }));
    if (failure) setMessage(failure);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "staff") {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const profile = await call("/me");

        setMe(profile);
        setProfileForm({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          password: "",
        });

        await loadModules(profile.modules);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // run an action, show the message, then refresh lists
  // (refresh also happens on failure, so a list never stays stale)
  async function act(path, method, body, okMessage) {
    try {
      const result = await call(path, method, body);
      setMessage(okMessage);
      return result || true;
    } catch (err) {
      setMessage(err.message);
      return null;
    } finally {
      await loadModules(me.modules);
    }
  }

  const claim = (kind, id, text) =>
    act(`/${kind}/${id}/claim`, "POST", undefined, text);

  // ---------- profile ----------

  async function updateProfile(e) {
    e.preventDefault();
    const result = await act("/profile", "PUT", profileForm, "Profile updated successfully.");

    if (result) {
      const updated = await call("/me");
      setMe(updated);
      setProfileForm((p) => ({ ...p, password: "" }));

      const stored = JSON.parse(localStorage.getItem("staff") || "{}");
      localStorage.setItem(
        "staff",
        JSON.stringify({ ...stored, name: updated.name, email: updated.email, phone: updated.phone })
      );
    }
  }

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  // ---------- appointments ----------

  const saveAppointment = (a) => {
    const k = `appt:${a.appt_id}`;
    return act(
      `/appointments/${a.appt_id}`,
      "PATCH",
      {
        appt_date: val(k, "appt_date", dateOnly(a.appt_date)) || null,
        appt_time: val(k, "appt_time", timeOnly(a.appt_time)) || null,
        notes: val(k, "notes", a.notes || ""),
      },
      "Appointment updated."
    );
  };

  // ---------- admissions ----------

  const wardRooms = data.wardRooms || { wards: [], rooms: [] };
  const wardName = (w) => `Ward ${w.ward_id}${w.dept_name ? ` - ${w.dept_name}` : ""}`;
  const roomName = (r) => `Room ${r.room_id}${r.room_type ? ` (${r.room_type})` : ""}`;
  const freeRooms = (wardId) =>
    wardRooms.rooms.filter(
      (r) =>
        String(r.status).toLowerCase() === "available" &&
        (!wardId || Number(r.ward_id) === Number(wardId))
    );

  const admit = (a) => {
    const k = `adm:${a.adm_id}`;
    const roomId = val(k, "room_id");

    if (!roomId) {
      setMessage("Select ward and room.");
      return;
    }

    const charge = val(k, "charge");

    return act(
      `/admissions/${a.adm_id}/admit`,
      "PATCH",
      {
        room_id: Number(roomId),
        adm_date: val(k, "adm_date", today),
        charge: charge === "" ? null : Number(charge),
      },
      "Patient admitted successfully."
    );
  };

  const discharge = (a) => {
    if (!window.confirm("Discharge this patient?")) return;
    return act(`/admissions/${a.adm_id}/discharge`, "PATCH", {}, "Patient discharged.");
  };

  // ---------- lab tests / surgeries ----------

  const scheduleLab = (t) => {
    const k = `lab:${t.test_id}`;
    const date = val(k, "date", dateOnly(t.date));

    if (!date) {
      setMessage("Please select lab test date.");
      return;
    }

    const price = val(k, "price", t.unit_price ?? "");

    return act(
      `/lab-tests/${t.test_id}/schedule`,
      "PATCH",
      { date, unit_price: price === "" ? null : Number(price) },
      "Lab test scheduled."
    );
  };

  const scheduleSurgery = (s) => {
    const k = `sur:${s.surgery_id}`;
    const date = val(k, "date", dateOnly(s.date));

    if (!date) {
      setMessage("Please select surgery date.");
      return;
    }

    return act(`/surgeries/${s.surgery_id}/schedule`, "PATCH", { date }, "Surgery scheduled.");
  };

  // ---------- blood ----------

  async function createBloodRequest(e) {
    e.preventDefault();

    const result = await act(
      "/blood/requests",
      "POST",
      { bank_id: Number(bloodForm.bank_id), quantity: Number(bloodForm.quantity) },
      "Blood request submitted."
    );

    if (result) setBloodForm({ bank_id: "", quantity: "" });
  }

  const decide = (r, decision) =>
    act(`/blood/requests/${r.request_id}/decision`, "PATCH", { decision }, `Request ${decision}.`);

  // ---------- billing ----------

  const billItems = (data.items || {})[ITEM_KEY[billForm.source_type]] || [];

  function pickBillItem(id) {
    const item = billItems.find((i) => String(i.id) === String(id));

    setBillForm((prev) => ({
      ...prev,
      source_id: id,
      amount: prev.amount || (item?.amount ? String(item.amount) : ""),
    }));
  }

  async function createBill(e) {
    e.preventDefault();

    const result = await act(
      "/billing/create",
      "POST",
      {
        source_type: billForm.source_type,
        source_id: Number(billForm.source_id),
        amount: Number(billForm.amount),
        discount: Number(billForm.discount) || 0,
        tax: Number(billForm.tax) || 0,
      },
      "Bill created. Approve it so the patient can pay."
    );

    if (result) {
      setBillForm({ ...billForm, source_id: "", amount: "", discount: "0", tax: "0" });
    }
  }

  const approveBill = (id) =>
    act(`/billing/${id}/approve`, "PATCH", {}, "Bill approved. Patient can pay now.");

  // ---------- complaints ----------

  const setComplaintStatus = (c, status) =>
    act(`/complaints/${c.complaint_id}/status`, "PATCH", { status }, `Complaint ${status.replace("_", " ")}.`);

  // ---------- render ----------

  if (loading) {
    return <div className="staff-loading">Loading staff dashboard...</div>;
  }

  if (!me) {
    return (
      <div className="staff-loading">
        {message || "Could not load your account."}{" "}
        <button onClick={logout}>Back to login</button>
      </div>
    );
  }

  const menu = Object.keys(PAGES).filter((p) => has(p));
  const noRole = !me.staff_role;

  const summary = [];
  if (has("appointments")) summary.push(["My Appointments", list("appointments").length]);
  if (has("unassigned")) summary.push(["Unassigned Appointments", list("unassigned").length]);
  if (has("admissions")) {
    summary.push(["Admission Requests", list("admissions").filter((a) => a.status === "pending").length]);
    summary.push(["Current Admissions", list("admissions").filter((a) => a.status === "admitted").length]);
  }
  if (has("labtests")) {
    summary.push(["Open Lab Requests", list("labtests").filter((t) => !t.staff_id).length]);
    summary.push(["My Lab Tests", list("labtests").filter(mine).length]);
  }
  if (has("surgeries")) {
    summary.push(["Open Surgery Requests", list("surgeries").filter((s) => !s.staff_id).length]);
    summary.push(["My Surgeries", list("surgeries").filter(mine).length]);
  }
  if (has("blood")) summary.push(["Pending Blood Requests", list("bloodRequests").filter((r) => r.status === "pending").length]);
  if (has("billing")) summary.push(["Pending Bills", list("bills").filter((b) => b.status === "pending").length]);
  if (has("payments")) summary.push(["Payments", list("payments").length]);
  if (has("complaints")) {
    summary.push(["Open Complaints", list("complaints").filter((c) => !c.staff_id).length]);
    summary.push(["My Complaints", list("complaints").filter(mine).length]);
  }

  const assignedTo = (r) => r.staff_name || "-";

  return (
    <div className="staff-dashboard">
      <aside className="staff-sidebar">
        <h2>MediCare</h2>
        <p>{me.name}</p>
        <p>{me.role_label || "No work role"}</p>

        {menu.map((p) => (
          <button key={p} onClick={() => setPage(p)}>
            {PAGES[p]}
          </button>
        ))}

        <button className="staff-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="staff-main">
        {message && <div className="staff-message">{message}</div>}

        {noRole && (
          <div className="staff-message">
            No work role is assigned to your account yet. Please ask the admin to
            assign one.
          </div>
        )}

        {page === "overview" && (
          <>
            <h1>Staff Dashboard</h1>
            <div className="staff-summary-grid">
              {summary.map(([label, count]) => (
                <div className="staff-summary-box" key={label}>
                  <h3>{label}</h3>
                  <p>{count}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {page === "profile" && (
          <section className="staff-section">
            <h1>My Profile</h1>
            <form className="staff-form" onSubmit={updateProfile}>
              <label>Name</label>
              <input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
              <label>Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
              <label>Phone</label>
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
              <label>New Password (leave empty to keep)</label>
              <input
                type="password"
                value={profileForm.password}
                onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
              />
              <button type="submit">Update Profile</button>
            </form>
          </section>
        )}

        {page === "appointments" && (
          <section className="staff-section">
            <h1>My Appointments</h1>
            <Table
              rowKey="appt_id"
              empty="No appointments assigned to you yet."
              rows={list("appointments")}
              cols={[
                { h: "Patient", r: (a) => a.patient_name || "-" },
                { h: "Doctor", r: (a) => a.doctor_name || "-" },
                {
                  h: "Date",
                  r: (a) => (
                    <input
                      type="date"
                      value={val(`appt:${a.appt_id}`, "appt_date", dateOnly(a.appt_date))}
                      onChange={(e) => setF(`appt:${a.appt_id}`, "appt_date", e.target.value)}
                    />
                  ),
                },
                {
                  h: "Time",
                  r: (a) => (
                    <input
                      type="time"
                      value={val(`appt:${a.appt_id}`, "appt_time", timeOnly(a.appt_time))}
                      onChange={(e) => setF(`appt:${a.appt_id}`, "appt_time", e.target.value)}
                    />
                  ),
                },
                { h: "Status", r: (a) => a.status },
                {
                  h: "Notes",
                  r: (a) => (
                    <input
                      value={val(`appt:${a.appt_id}`, "notes", a.notes || "")}
                      onChange={(e) => setF(`appt:${a.appt_id}`, "notes", e.target.value)}
                    />
                  ),
                },
                { h: "Action", r: (a) => <button onClick={() => saveAppointment(a)}>Save</button> },
              ]}
            />
          </section>
        )}

        {page === "unassigned" && (
          <section className="staff-section">
            <h1>Unassigned Appointments</h1>
            <Table
              rowKey="appt_id"
              empty="No unassigned appointments."
              rows={list("unassigned")}
              cols={[
                { h: "Patient", r: (a) => a.patient_name || "-" },
                { h: "Doctor", r: (a) => a.doctor_name || "-" },
                { h: "Date", r: (a) => dateOnly(a.appt_date) },
                { h: "Time", r: (a) => timeOnly(a.appt_time) || "-" },
                { h: "Reason", r: (a) => a.reason || "-" },
                {
                  h: "Action",
                  r: (a) => (
                    <button onClick={() => claim("appointments", a.appt_id, "Appointment assigned to you.")}>
                      Assign to Me
                    </button>
                  ),
                },
              ]}
            />
          </section>
        )}

        {page === "admissions" && (
          <>
            <section className="staff-section">
              <h1>Pending Admissions</h1>
              <Table
                rowKey="adm_id"
                empty="No pending admission requests."
                rows={list("admissions").filter((a) => a.status === "pending")}
                cols={[
                  { h: "Patient", r: (a) => a.patient_name || "-" },
                  { h: "Doctor", r: (a) => a.doctor_name || "-" },
                  {
                    h: "Ward",
                    r: (a) => (
                      <select
                        value={val(`adm:${a.adm_id}`, "ward_id")}
                        onChange={(e) => {
                          setF(`adm:${a.adm_id}`, "ward_id", e.target.value);
                          setF(`adm:${a.adm_id}`, "room_id", "");
                        }}
                      >
                        <option value="">Select</option>
                        {wardRooms.wards.map((w) => (
                          <option key={w.ward_id} value={w.ward_id}>
                            {wardName(w)}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    h: "Room",
                    r: (a) => (
                      <select
                        value={val(`adm:${a.adm_id}`, "room_id")}
                        onChange={(e) => setF(`adm:${a.adm_id}`, "room_id", e.target.value)}
                      >
                        <option value="">Select</option>
                        {freeRooms(val(`adm:${a.adm_id}`, "ward_id")).map((r) => (
                          <option key={r.room_id} value={r.room_id}>
                            {roomName(r)}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    h: "Date",
                    r: (a) => (
                      <input
                        type="date"
                        value={val(`adm:${a.adm_id}`, "adm_date", today)}
                        onChange={(e) => setF(`adm:${a.adm_id}`, "adm_date", e.target.value)}
                      />
                    ),
                  },
                  {
                    h: "Charge",
                    r: (a) => (
                      <input
                        type="number"
                        value={val(`adm:${a.adm_id}`, "charge")}
                        onChange={(e) => setF(`adm:${a.adm_id}`, "charge", e.target.value)}
                      />
                    ),
                  },
                  { h: "Action", r: (a) => <button onClick={() => admit(a)}>Admit</button> },
                ]}
              />
            </section>

            <section className="staff-section">
              <h2>Current Admissions</h2>
              <Table
                rowKey="adm_id"
                empty="No admitted patients."
                rows={list("admissions").filter((a) => a.status === "admitted")}
                cols={[
                  { h: "Patient", r: (a) => a.patient_name || "-" },
                  { h: "Doctor", r: (a) => a.doctor_name || "-" },
                  { h: "Room", r: (a) => (a.room_id ? `Room ${a.room_id}${a.room_type ? ` (${a.room_type})` : ""}` : "-") },
                  { h: "Date", r: (a) => dateOnly(a.adm_date) },
                  { h: "Charge", r: (a) => money(a.charge) },
                  { h: "Admitted By", r: assignedTo },
                  { h: "Action", r: (a) => <button onClick={() => discharge(a)}>Discharge</button> },
                ]}
              />
            </section>
          </>
        )}

        {page === "rooms" && (
          <section className="staff-section">
            <h1>Ward & Rooms</h1>
            <Table
              rowKey="room_id"
              rows={wardRooms.rooms}
              cols={[
                { h: "Room ID", r: (r) => r.room_id },
                {
                  h: "Ward",
                  r: (r) => {
                    const w = wardRooms.wards.find((x) => x.ward_id === r.ward_id);
                    return w ? wardName(w) : r.ward_id || "-";
                  },
                },
                { h: "Type", r: (r) => r.room_type || "-" },
                { h: "Capacity", r: (r) => r.capacity ?? "-" },
                { h: "Status", r: (r) => r.status },
              ]}
            />
          </section>
        )}

        {page === "labtests" && (
          <section className="staff-section">
            <h1>Lab Test Requests</h1>
            <Table
              rowKey="test_id"
              empty="No lab test requests."
              rows={list("labtests")}
              cols={[
                { h: "Patient", r: (t) => t.patient_name || "-" },
                { h: "Doctor", r: (t) => t.doctor_name || "-" },
                { h: "Test", r: (t) => t.test_name || "-" },
                { h: "Type", r: (t) => t.type || "-" },
                {
                  h: "Date",
                  r: (t) =>
                    mine(t) ? (
                      <input
                        type="date"
                        value={val(`lab:${t.test_id}`, "date", dateOnly(t.date))}
                        onChange={(e) => setF(`lab:${t.test_id}`, "date", e.target.value)}
                      />
                    ) : (
                      dateOnly(t.date) || "-"
                    ),
                },
                {
                  h: "Price",
                  r: (t) =>
                    mine(t) ? (
                      <input
                        type="number"
                        value={val(`lab:${t.test_id}`, "price", t.unit_price ?? "")}
                        onChange={(e) => setF(`lab:${t.test_id}`, "price", e.target.value)}
                      />
                    ) : (
                      t.unit_price ?? "-"
                    ),
                },
                { h: "Status", r: (t) => t.status },
                { h: "Assigned To", r: assignedTo },
                {
                  h: "Action",
                  r: (t) =>
                    mine(t) ? (
                      <button onClick={() => scheduleLab(t)}>Schedule</button>
                    ) : (
                      <button onClick={() => claim("lab-tests", t.test_id, "Lab test assigned to you.")}>
                        Assign to Me
                      </button>
                    ),
                },
              ]}
            />
          </section>
        )}

        {page === "surgeries" && (
          <section className="staff-section">
            <h1>Surgery Requests</h1>
            <Table
              rowKey="surgery_id"
              empty="No surgery requests."
              rows={list("surgeries")}
              cols={[
                { h: "Patient", r: (s) => s.patient_name || "-" },
                { h: "Doctor", r: (s) => s.doctor_name || "-" },
                { h: "Surgery", r: (s) => s.surgery_name || "-" },
                { h: "Type", r: (s) => s.type || "-" },
                {
                  h: "Date",
                  r: (s) =>
                    mine(s) ? (
                      <input
                        type="date"
                        value={val(`sur:${s.surgery_id}`, "date", dateOnly(s.date))}
                        onChange={(e) => setF(`sur:${s.surgery_id}`, "date", e.target.value)}
                      />
                    ) : (
                      dateOnly(s.date) || "-"
                    ),
                },
                { h: "Status", r: (s) => s.status },
                { h: "Assigned To", r: assignedTo },
                {
                  h: "Action",
                  r: (s) =>
                    mine(s) ? (
                      <button onClick={() => scheduleSurgery(s)}>Schedule</button>
                    ) : (
                      <button onClick={() => claim("surgeries", s.surgery_id, "Surgery assigned to you.")}>
                        Assign to Me
                      </button>
                    ),
                },
              ]}
            />
          </section>
        )}

        {page === "blood" && (
          <>
            <section className="staff-section">
              <h1>Blood Request</h1>
              <form className="staff-form" onSubmit={createBloodRequest}>
                <select
                  value={bloodForm.bank_id}
                  onChange={(e) => setBloodForm({ ...bloodForm, bank_id: e.target.value })}
                  required
                >
                  <option value="">Select Blood</option>
                  {list("bank").map((b) => (
                    <option key={b.bank_id} value={b.bank_id}>
                      {b.blood_group} - {b.available_quantity} available
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={bloodForm.quantity}
                  onChange={(e) => setBloodForm({ ...bloodForm, quantity: e.target.value })}
                  required
                />
                <button type="submit">Submit Request</button>
              </form>
            </section>

            <section className="staff-section">
              <h2>All Blood Requests</h2>
              <Table
                rowKey="request_id"
                empty="No blood requests."
                rows={list("bloodRequests")}
                cols={[
                  { h: "ID", r: (r) => r.request_id },
                  { h: "Blood", r: (r) => r.blood_group || "-" },
                  { h: "Quantity", r: (r) => r.quantity },
                  { h: "In Stock", r: (r) => r.available_quantity ?? "-" },
                  { h: "Requested By", r: (r) => r.staff_name || "-" },
                  { h: "Status", r: (r) => r.status },
                  { h: "Handled By", r: (r) => r.handled_by_name || "-" },
                  {
                    h: "Action",
                    r: (r) =>
                      r.status === "pending" ? (
                        <>
                          <button onClick={() => decide(r, "approved")}>Approve</button>{" "}
                          <button onClick={() => decide(r, "rejected")}>Reject</button>
                        </>
                      ) : (
                        "-"
                      ),
                  },
                ]}
              />
            </section>
          </>
        )}

        {page === "billing" && (
          <>
            <section className="staff-section">
              <h1>Billing</h1>
              <form className="staff-form" onSubmit={createBill}>
                <label>Bill Type</label>
                <select
                  value={billForm.source_type}
                  onChange={(e) =>
                    setBillForm({ ...billForm, source_type: e.target.value, source_id: "", amount: "" })
                  }
                >
                  <option value="appointment">Appointment</option>
                  <option value="admission">Admission</option>
                  <option value="surgery">Surgery</option>
                  <option value="labtest">Lab Test</option>
                </select>

                <label>Select Item</label>
                <select value={billForm.source_id} onChange={(e) => pickBillItem(e.target.value)} required>
                  <option value="">Select</option>
                  {billItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>

                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  required
                />

                <label>Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={billForm.discount}
                  onChange={(e) => setBillForm({ ...billForm, discount: e.target.value })}
                />

                <label>Tax</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={billForm.tax}
                  onChange={(e) => setBillForm({ ...billForm, tax: e.target.value })}
                />

                <button type="submit">Create Bill</button>
              </form>
            </section>

            <section className="staff-section">
              <h2>Bills</h2>
              <Table
                rowKey="bill_id"
                empty="No bills yet."
                rows={list("bills")}
                cols={[
                  { h: "ID", r: (b) => b.bill_id },
                  { h: "Patient", r: (b) => b.patient_name || "-" },
                  { h: "Type", r: (b) => b.source_type },
                  { h: "Source", r: (b) => b.source_id ?? "-" },
                  { h: "Net", r: (b) => money(b.net_amount) },
                  { h: "Paid", r: (b) => money(b.paid_amount) },
                  { h: "Status", r: (b) => b.status },
                  { h: "Created By", r: assignedTo },
                  {
                    h: "Action",
                    r: (b) =>
                      b.status === "pending" ? (
                        <button onClick={() => approveBill(b.bill_id)}>Approve</button>
                      ) : (
                        "-"
                      ),
                  },
                ]}
              />
            </section>
          </>
        )}

        {page === "payments" && (
          <section className="staff-section">
            <h1>Payments</h1>
            <Table
              rowKey="payment_id"
              empty="No payments yet."
              rows={list("payments")}
              cols={[
                { h: "Patient", r: (p) => p.patient_name || "-" },
                { h: "Bill ID", r: (p) => p.bill_id },
                { h: "Type", r: (p) => p.source_type || "-" },
                { h: "Paid", r: (p) => money(p.amount) },
                { h: "Date", r: (p) => dateOnly(p.payment_date) },
                { h: "Method", r: (p) => p.method || "-" },
                { h: "Bill Status", r: (p) => p.bill_status || "-" },
              ]}
            />
          </section>
        )}

        {page === "complaints" && (
          <section className="staff-section">
            <h1>Complaints</h1>
            <Table
              rowKey="complaint_id"
              empty="No complaints."
              rows={list("complaints")}
              cols={[
                { h: "Patient", r: (c) => c.patient_name || "-" },
                { h: "Type", r: (c) => c.complaint_type || "-" },
                { h: "Description", r: (c) => c.description || "-" },
                { h: "Status", r: (c) => c.status || "-" },
                { h: "Assigned To", r: assignedTo },
                {
                  h: "Action",
                  r: (c) => {
                    if (!c.staff_id) {
                      return (
                        <button onClick={() => claim("complaints", c.complaint_id, "Complaint assigned to you.")}>
                          Assign to Me
                        </button>
                      );
                    }

                    if (mine(c) && !["resolved", "closed"].includes(c.status)) {
                      return (
                        <>
                          <button onClick={() => setComplaintStatus(c, "resolved")}>Resolve</button>{" "}
                          <button onClick={() => setComplaintStatus(c, "closed")}>Close</button>
                        </>
                      );
                    }

                    return "-";
                  },
                },
              ]}
            />
          </section>
        )}

        {page === "department" && (
          <section className="staff-section">
            <h1>My Department</h1>
            <p>
              <strong>ID:</strong> {me.dept_id || "-"}
            </p>
            <p>
              <strong>Name:</strong> {me.dept_name || "-"}
            </p>
          </section>
        )}

        {page === "admin" && (
          <section className="staff-section">
            <h1>Admin Relation</h1>
            {list("adminRel").length === 0 && <p>No admin is linked to your account.</p>}
            {list("adminRel").map((rel) => (
              <p key={rel.admin_id}>
                Admin ID: {rel.admin_id}
                {rel.username ? ` (${rel.username})` : ""}
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
