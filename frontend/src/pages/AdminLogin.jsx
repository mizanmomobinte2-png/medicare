import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AdminRegister.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid username or password");
        return;
      }

      if (data.admin) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
      }

      navigate("/admin");
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

          <h1>Admin Login</h1>

          <form onSubmit={handleSubmit}>

            <label>Username</label>

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            <Link to="/admin-register">
              Register
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default AdminLogin;