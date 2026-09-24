// Import this ONCE at the very top of src/main.jsx:   import "./authFetch";
//
// Every PROTECTED request to the backend now carries the JWT automatically, so all
// dashboards (admin, doctor, staff, patient) satisfy the "authentication on every
// request" rule without editing each page. If the server answers 401
// (token missing / expired) the user is sent back to the login page.
//
// PUBLIC requests (login, registration, register-form lookups) are sent WITHOUT a
// token on purpose, so an old or other-role token left in the browser can never
// interfere with logging in or registering.

const API_ORIGIN = "http://localhost:5000";
const nativeFetch = window.fetch.bind(window);

// keep in sync with PUBLIC_API in backend/server.js
const PUBLIC_API = [
  ["GET", "/api/health"],
  ["GET", "/api/departments"],
  ["GET", "/api/staff/work-roles"],
  ["POST", "/api/admin/login"],
  ["POST", "/api/doctors/login"],
  ["POST", "/api/staff/login"],
  ["POST", "/api/patients/login"],
  ["POST", "/api/staff"],
  ["POST", "/api/patients"],
];

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;

  const isApi = url.startsWith(`${API_ORIGIN}/api`) || url.startsWith("/api");

  if (!isApi) {
    return nativeFetch(input, init);
  }

  const method = (
    init.method ||
    (typeof input !== "string" && input.method) ||
    "GET"
  ).toUpperCase();

  const path = new URL(url, window.location.origin).pathname.replace(/\/+$/, "");

  const isPublic = PUBLIC_API.some(([m, p]) => m === method && p === path);

  if (isPublic) {
    return nativeFetch(input, init);
  }

  const token = localStorage.getItem("token");

  const headers = new Headers(
    init.headers || (typeof input !== "string" ? input.headers : undefined)
  );

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await nativeFetch(input, { ...init, headers });

  if (response.status === 401 && token) {
    localStorage.clear();

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return response;
};