import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AdminRegister.css";

function DoctorRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    qualification: "",
    specification: "",
    medical_registration_no: "",
    department_id: "",
    new_patient_fee: "",
    followup_fee: "",
    max_patient_num: "",
  });

  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState("");

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/doctors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.full_name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone_number,
            qualification: formData.qualification,
            specification: formData.specification,
            medical_registration_no:
              formData.medical_registration_no,
            department_id: Number(formData.department_id),
            new_patient_fee: Number(formData.new_patient_fee),
            followup_fee: Number(formData.followup_fee),
            max_patient_num: Number(formData.max_patient_num),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || data.message || "Registration failed");
        return;
      }

      alert("Doctor registration successful.");

      navigate("/doctor-login");
    } catch (error) {
      console.error(error);
      setMessage("Server connection failed");
    }
  };

  return (
    <div className="admin-register-page">
      <header className="simple-header">
        <h2>MediCare</h2>
      </header>

      <div className="register-container">
        <div className="register-box">
          <h1>Doctor Registration</h1>

          <form onSubmit={handleSubmit}>
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
              required
            />

            <label>Qualification</label>
            <input
              type="text"
              name="qualification"
              placeholder="Enter qualification"
              value={formData.qualification}
              onChange={handleChange}
              required
            />

            <label>Specification</label>
            <input
              type="text"
              name="specification"
              placeholder="Enter specification"
              value={formData.specification}
              onChange={handleChange}
              required
            />

            <label>Medical Registration No</label>
            <input
              type="text"
              name="medical_registration_no"
              placeholder="Enter medical registration number"
              value={formData.medical_registration_no}
              onChange={handleChange}
              required
            />

            <label>Department</label>

            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option
                  key={department.dept_id}
                  value={department.dept_id}
                >
                  {department.dept_name}
                </option>
              ))}
            </select>

            <label>New Patient Fee</label>
            <input
              type="number"
              name="new_patient_fee"
              placeholder="Enter new patient fee"
              value={formData.new_patient_fee}
              onChange={handleChange}
              required
            />

            <label>Follow-up Fee</label>
            <input
              type="number"
              name="followup_fee"
              placeholder="Enter follow-up fee"
              value={formData.followup_fee}
              onChange={handleChange}
              required
            />

            <label>Maximum Patient Number</label>
            <input
              type="number"
              name="max_patient_num"
              placeholder="Enter maximum patient number"
              value={formData.max_patient_num}
              onChange={handleChange}
              required
            />

            {message && <p className="message">{message}</p>}

            <button type="submit">Register</button>
          </form>

          <p className="login-text">
            Already have an account?{" "}
            <Link to="/doctor-login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorRegistration;