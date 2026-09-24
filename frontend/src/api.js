const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(url, options = {}) {
  const token = getToken();

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // Token expired or invalid -> back to login
  if (response.status === 401 && token) {
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

export const api = {
  get: (url) => request(url),

  post: (url, body) =>
    request(url, { method: "POST", body: JSON.stringify(body) }),

  put: (url, body) =>
    request(url, { method: "PUT", body: JSON.stringify(body) }),

  patch: (url, body) =>
    request(url, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (url) => request(url, { method: "DELETE" }),
};

export default api;