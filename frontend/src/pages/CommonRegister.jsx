import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AdminRegister.css";

function CommonRegister() {
  const navigate = useNavigate();

  const [role, setRole] = useState("admin");
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Admin
    username: "",

    // Common
    password: "",
    full_name: "",
    email: "",
    phone_number: "",

    // Doctor
    specialization: "",
    department_id: "",

    // Staff
    salary: "",

    // Patient
    dob: "",
    gender: "",
    blood_group: "",
    address: "",
  });

  // =========================
  // GET DEPARTMENTS
  // =========================
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/departments"
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setDepartments(data);
        }
      } catch (error) {
        console.error("Department fetch error:", error);
      }
    };

    fetchDepartments();
  }, []);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setMessage("");
  };

  // =========================
  // HANDLE ROLE CHANGE
  // =========================
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setMessage("");
  };

  // =========================
  // REGISTER
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      let url = "";
      let body = {};

      // =====================
      // ADMIN
      // =====================
      if (role === "admin") {
        url = "http://localhost:5000/api/admin";

        body = {
          username: formData.username.trim(),
          password: formData.password,
          role: "admin",
          status: "active",
        };
      }

      // =====================
      // DOCTOR
      // =====================
      else if (role === "doctor") {
        url = "http://localhost:5000/api/doctors";

        body = {
          name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone_number.trim(),
          specialization: formData.specialization.trim(),
          dept_id: Number(formData.department_id),
          salary: null,
          status: "active",
        };
      }

      // =====================
      // STAFF
      // =====================
      else if (role === "staff") {
        url = "http://localhost:5000/api/staff";

        body = {
          name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          dept_id: Number(formData.department_id),
          salary: formData.salary
            ? Number(formData.salary)
            : null,
          phone: formData.phone_number.trim(),
        };
      }

      // =====================
      // PATIENT
      // =====================
      else if (role === "patient") {
        url = "http://localhost:5000/api/patients";

        body = {
          name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone_number.trim(),
          dob: formData.dob || null,
          gender: formData.gender,
          blood_group: formData.blood_group,
          address: formData.address.trim(),
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Registration failed"
        );

        return;
      }

      alert(`${role} registration successful.`);

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);

      setMessage(
        "Server connection failed. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-page">

      {/* HEADER */}
      <header className="simple-header">
        <h2>MediCare</h2>
      </header>

      <div className="register-container">
        <div className="register-box">

          <h1>Registration</h1>

          <form onSubmit={handleSubmit}>

            {/* =========================
                ROLE
            ========================== */}

            <label>Select Role</label>

            <select
              value={role}
              onChange={handleRoleChange}
            >
              <option value="admin">
                Admin
              </option>

              <option value="doctor">
                Doctor
              </option>

              <option value="staff">
                Staff
              </option>

              <option value="patient">
                Patient
              </option>
            </select>


            {/* =========================
                ADMIN FORM
            ========================== */}

            {role === "admin" && (
              <>
                <label>Username</label>

                <input
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </>
            )}


            {/* =========================
                DOCTOR FORM
            ========================== */}

            {role === "doctor" && (
              <>
                <label>Full Name</label>

                <input
                  type="text"
                  name="full_name"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />

                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <label>Phone Number</label>

                <input
                  type="text"
                  name="phone_number"
                  placeholder="Enter phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />

                <label>Specialization</label>

                <input
                  type="text"
                  name="specialization"
                  placeholder="Enter specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                />

                <label>Department</label>

                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.dept_id}
                      value={department.dept_id}
                    >
                      {department.dept_name}
                    </option>
                  ))}
                </select>
              </>
            )}


            {/* =========================
                STAFF FORM
            ========================== */}

            {role === "staff" && (
              <>
                <label>Full Name</label>

                <input
                  type="text"
                  name="full_name"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />

                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <label>Phone Number</label>

                <input
                  type="text"
                  name="phone_number"
                  placeholder="Enter phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />

                <label>Department</label>

                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.dept_id}
                      value={department.dept_id}
                    >
                      {department.dept_name}
                    </option>
                  ))}
                </select>

                <label>Salary</label>

                <input
                  type="number"
                  name="salary"
                  placeholder="Enter salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                />
              </>
            )}


            {/* =========================
                PATIENT FORM
            ========================== */}

            {role === "patient" && (
              <>
                <label>Full Name</label>

                <input
                  type="text"
                  name="full_name"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />

                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <label>Phone Number</label>

                <input
                  type="text"
                  name="phone_number"
                  placeholder="Enter phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />

                <label>Date of Birth</label>

                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />

                <label>Gender</label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

                <label>Blood Group</label>

                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Blood Group
                  </option>

                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

                <label>Address</label>

                <input
                  type="text"
                  name="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </>
            )}


            {/* ERROR MESSAGE */}

            {message && (
              <p className="message">
                {message}
              </p>
            )}


            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Registering..."
                : "Register"}
            </button>

          </form>


          {/* LOGIN LINK */}

          <p className="login-text">
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default CommonRegister;