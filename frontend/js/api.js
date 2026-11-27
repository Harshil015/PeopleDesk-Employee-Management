// js/api.js
//
// Every network call the frontend makes goes through this one
// file. Centralizing it means: (1) the base URL lives in one
// place, (2) the Authorization header is attached automatically,
// and (3) a 401 response (expired/invalid token) automatically
// bounces the user back to the login page - exactly like an
// ASP.NET Core app redirecting to /Account/Login when a cookie
// expires.

const API_BASE = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("ems_token");
}

function setSession(token, user) {
  localStorage.setItem("ems_token", token);
  localStorage.setItem("ems_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("ems_token");
  localStorage.removeItem("ems_user");
}

function getCurrentUser() {
  const raw = localStorage.getItem("ems_user");
  return raw ? JSON.parse(raw) : null;
}

// Core request helper. `auth` defaults to true because almost
// every call in this app (everything except /auth/login) needs
// the token attached.
async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token missing/expired/invalid -> send the user back to login.
  if (response.status === 401) {
    clearSession();
    window.location.href = "index.html";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

const api = {
  login: (username, password) =>
    apiRequest("/auth/login", { method: "POST", body: { username, password }, auth: false }),

  getEmployees: () => apiRequest("/employees"),
  getEmployeeById: (id) => apiRequest(`/employees/${id}`),
  addEmployee: (payload) => apiRequest("/employees", { method: "POST", body: payload }),
  updateEmployee: (id, payload) => apiRequest(`/employees/${id}`, { method: "PUT", body: payload }),
  deleteEmployee: (id) => apiRequest(`/employees/${id}`, { method: "DELETE" }),
};
