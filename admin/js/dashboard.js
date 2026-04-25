// dashboard.js
import { adminFetch } from "./api.js";

const content = document.getElementById("dashboard-content");
const tabs = document.querySelectorAll(".admin-tabs button");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadTab(btn.dataset.tab);
  });
});

async function loadTab(tab) {
  content.innerHTML = "Loading...";

  const data = await adminFetch(tab);

  if (!data.length) {
    content.innerHTML = "No records.";
    return;
  }

  const cols = Object.keys(data[0]);

  let html = "<table><thead><tr>";
  cols.forEach(c => html += `<th>${c}</th>`);
  html += "</tr></thead><tbody>";

  data.forEach(row => {
    html += "<tr>";
    cols.forEach(c => html += `<td>${escapeHtml(row[c])}</td>`);
    html += "</tr>";
  });

  html += "</tbody></table>";

  content.innerHTML = html;
}

function escapeHtml(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Load default tab
loadTab("messages");
