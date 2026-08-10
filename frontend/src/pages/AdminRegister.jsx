import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AdminRegister.css";

export default function AdminRegister() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
            role: "admin",
            status: "active",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Registration failed.");
        return;
      }

      alert("Admin registered successfully.");
      navigate("/admin-login");
    } catch (error) {
      setMessage("Cannot connect to server.");
    }
  };

  return (
    <div className="admin-register-page">
      <header className="simple-header">
        <h2>MediCare</h2>
      </header>

      <div className="register-container">
        <div className="register-box">
          <h1>Admin Registration</h1>

          <form onSubmit={handleSubmit}>
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label>Confirm Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />

            {message && (
              <p className="message">{message}</p>
            )}

            <button type="submit">
              Register
            </button>
          </form>

          <p className="login-text">
            Already registered?{" "}
            <Link to="/admin-login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
