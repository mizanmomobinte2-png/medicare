import { useState, useEffect } from "react";
import api from "../api";

// Reusable CRUD page - works for any entity
export default function CrudPage({ title, description, endpoint, idField, columns, fields, lookups = {} }) {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lookupData, setLookupData] = useState({});

  // Load data and lookup options
  useEffect(() => {
    loadData();
    loadLookups();
  }, [endpoint]);

  async function loadData() {
    try {
      const result = await api.get(endpoint);
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadLookups() {
    const loaded = {};
    for (const [key, lookupEndpoint] of Object.entries(lookups)) {
      try {
        const result = await api.get(lookupEndpoint);
        loaded[key] = result;
      } catch (err) {
        loaded[key] = [];
      }
    }
    setLookupData(loaded);
  }

  function getEmptyForm() {
    const empty = {};
    fields.forEach((f) => {
      empty[f.name] = f.default || "";
    });
    return empty;
  }

  function handleAdd() {
    setForm(getEmptyForm());
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function handleEdit(row) {
    const editForm = {};
    fields.forEach((f) => {
      editForm[f.name] = row[f.name] ?? "";
    });
    setForm(editForm);
    setEditingId(row[idField]);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      setSuccess("Record deleted successfully");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const body = { ...form };
      // Convert empty strings to null for optional fields
      fields.forEach((f) => {
        if (body[f.name] === "" && f.type !== "text" && f.type !== "textarea") {
          body[f.name] = null;
        }
        if (f.type === "number" && body[f.name] !== null && body[f.name] !== "") {
          body[f.name] = parseFloat(body[f.name]);
        }
      });

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, body);
        setSuccess("Record updated successfully");
      } else {
        await api.post(endpoint, body);
        setSuccess("Record created successfully");
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderField(field) {
    const value = form[field.name] ?? "";

    if (field.type === "select" && field.lookup) {
      const options = lookupData[field.lookup] || [];
      return (
        <select
          value={value}
          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
        >
          <option value="">-- Select --</option>
          {options.map((opt) => (
            <option key={opt[field.optionValue]} value={opt[field.optionValue]}>
              {opt[field.optionLabel]}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <select
          value={value}
          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
        >
          <option value="">-- Select --</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
        />
      );
    }

    return (
      <input
        type={field.type || "text"}
        value={value}
        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
      />
    );
  }

  function formatCell(row, col) {
    const val = row[col.key];
    if (col.type === "badge" && val) {
      return <span className={`badge badge-${val}`}>{val}</span>;
    }
    if (col.type === "date" && val) {
      return new Date(val).toLocaleDateString();
    }
    if (col.type === "money" && val != null) {
      return `৳${parseFloat(val).toFixed(2)}`;
    }
    return val ?? "-";
  }

  return (
    <div>
      <div className="page-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="top-bar">
        <span>{data.length} records</span>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add New
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingId ? "Edit" : "Add New"} {title.slice(0, -1)}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {fields.map((field) => (
                <div className="form-group" key={field.name}>
                  <label>{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingId ? "Update" : "Save"}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {data.length === 0 ? (
          <div className="empty-state">No records found. Click "Add New" to create one.</div>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row[idField]}>
                  {columns.map((col) => (
                    <td key={col.key}>{formatCell(row, col)}</td>
                  ))}
                  <td className="table-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(row)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row[idField])}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
