import { Navigate } from "react-router-dom";

function isExpired(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return Boolean(payload.exp) && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// NOTE: this only decides which screen to show.
// Real security is enforced by the backend on every request.
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || isExpired(token)) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
