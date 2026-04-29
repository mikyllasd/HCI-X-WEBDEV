"use strict";

/* ==========================================================
   GLOBAL UTILITIES — loaded by every page
   ========================================================== */

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalise(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

let toastTimer = null;
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  const span = document.getElementById("toast-message");
  if (!toast || !span) return;
  span.textContent = message;
  toast.classList.toggle("toast--error", isError);
  toast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

function statusBadgeHTML(status) {
  const label = capitalise(status.replace(/-/g, " "));
  return `<span class="status-badge status-badge--${status}">${label}</span>`;
}

function accountBadgeHTML(status) {
  return `<span class="status-badge status-badge--account-${status}">${capitalise(status)}</span>`;
}

function statusIconSVG(status) {
  const icons = {
    pending: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    approved: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    rejected: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  return icons[status] || "";
}

function eyeIconSVG(size = 18) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function mailIconSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>`;
}

function calIconSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
}

function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("sidebar-overlay")?.classList.remove("hidden");
  document
    .getElementById("hamburger-btn")
    ?.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.add("hidden");
  document
    .getElementById("hamburger-btn")
    ?.setAttribute("aria-expanded", "false");
}

/* Expose for inline onclick usage */
window.setText = setText;
window.escHtml = escHtml;
window.showToast = showToast;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

document.addEventListener("DOMContentLoaded", () => {
  /* Auth guard — redirect to login if not superadmin */
  const _cu = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  })();
  if (!_cu || _cu.role !== "superadmin") {
    window.location.href = "../admin-login-entry-point.html";
    return;
  }

  if (typeof lucide !== "undefined") lucide.createIcons();

  document
    .getElementById("hamburger-btn")
    ?.addEventListener("click", openSidebar);
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("currentUser");
      window.location.href = "../admin-login-entry-point.html";
    }
  });
});
