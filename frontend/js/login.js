const loginForm = document.getElementById("loginForm");
const errorBox = document.getElementById("errorBox");
const loginBtn = document.getElementById("loginBtn");

// If someone is already logged in and lands on the login page
// again, just send them straight to the dashboard.
if (getToken()) {
  window.location.href = "employees.html";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("visible");
}

function hideError() {
  errorBox.classList.remove("visible");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the browser's default full-page form submit
  hideError();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // --- Client-side mandatory-field validation ---
  if (!username || !password) {
    showError("Please enter both username and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
const result = await api.login(username, password);
const rememberMe = document.getElementById("rememberMe").checked;
setSession(result.token, result.user, rememberMe);
window.location.href = "employees.html";
  } catch (err) {
    showError(err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";
  }
});
