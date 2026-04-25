// auth.js

// Save token
export function setToken(token) {
  sessionStorage.setItem("admin_token", token);
}

// Get token
export function getToken() {
  return sessionStorage.getItem("admin_token");
}

// Remove token
export function logout() {
  sessionStorage.removeItem("admin_token");
  window.location.href = "/admin/login.html";
}

// Protect dashboard
if (window.location.pathname.endsWith("index.html")) {
  if (!getToken()) {
    window.location.href = "/admin/login.html";
  }
}

// Login logic (only runs on login page)
if (window.location.pathname.endsWith("login.html")) {
  document.getElementById("login-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const status = document.getElementById("login-status");

    status.textContent = "Logging in...";

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      status.textContent = "Invalid login.";
      return;
    }

    setToken(data.token);
    window.location.href = "/admin/index.html";
  });
}

// Logout button
document.getElementById("logout-btn")?.addEventListener("click", logout);
