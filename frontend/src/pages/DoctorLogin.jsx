import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AdminRegister.css";

function DoctorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/doctors/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Invalid email or password"
        );
        return;
      }

      if (data.doctor) {
        localStorage.setItem(
          "doctor",
          JSON.stringify(data.doctor)
        );
      }

      alert("Doctor login successful.");

      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Doctor login error:", error);
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
          <h1>Doctor Login</h1>

          <form onSubmit={handleSubmit}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {message && (
              <p className="message">{message}</p>
            )}

            <button type="submit">
              Login
            </button>
          </form>

          <p className="login-text">
            Don't have an account?{" "}
            <Link to="/doctor-registration">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorLogin;