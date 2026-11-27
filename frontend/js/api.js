const API_BASE = window.EMS_CONFIG?.apiBaseUrl || "http://localhost:5000/api";

function getToken() {
  return (
    sessionStorage.getItem("ems_token") ||
    localStorage.getItem("ems_token")
  );
}

function setSession(token, user, rememberMe = false) {
  clearSession();

  const storage = rememberMe
    ? localStorage
    : sessionStorage;

  storage.setItem("ems_token", token);
  storage.setItem("ems_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("ems_token");
  localStorage.removeItem("ems_user");

  sessionStorage.removeItem("ems_token");
  sessionStorage.removeItem("ems_user");
}

function getCurrentUser() {
  const raw =
    sessionStorage.getItem("ems_user") ||
    localStorage.getItem("ems_user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    clearSession();
    return null;
  }
}


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
if (auth && response.status === 401) {
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
