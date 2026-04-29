/* ============================================================
   UPRESSease Admin Portal – Shared Script
   ============================================================ */

// ── Shared State ──
// Stored in sessionStorage so it persists across page navigations
// within the same browser tab.
const STORAGE_KEY = "upressease_state";

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveState(s) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (_) {}
}

const defaultState = {
  users: [],
  pricing: { bw: 3.0, color: 2.0, surcharge: 5.0 },
  policies: { qrCode: true, discounts: false },
  settings: {
    institution: "Western Mindanao State University",
    address: "Normal Road, Baliwasan, Zamboanga City",
    email: "upressease@wmsu.edu.ph",
    phone: "+63 123 456 7890",
    hours: "Monday - Friday: 8:00 AM - 5:00 PM",
    maintenance: false,
    maintenanceMsg: "System under maintenance. Please try again later.",
  },
};

const state = Object.assign({}, defaultState, loadState());

// Persist state on every change via a Proxy-based auto-save helper
function persistState() {
  saveState({
    users: state.users,
    pricing: state.pricing,
    policies: state.policies,
    settings: state.settings,
  });
}

// ── Toast ──
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");
let toastTimer;

function showToast(msg, duration = 3000) {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ── Sidebar Mobile ──
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const hamburger = document.getElementById("hamburger");
const sidebarClose = document.getElementById("sidebarClose");

hamburger.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("open");
});

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("open");
}

sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// ── Logout ──
document.getElementById("logoutBtn").addEventListener("click", () => {
  showToast("Logged out successfully.");
  setTimeout(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = "dashboard.html";
  }, 1200);
});

// ── Active Nav Item ──
// Each page sets its own data-page on <body> and this marks the nav item active.
(function markActiveNav() {
  const currentPage = document.body.dataset.page || "";
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === currentPage);
    item.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
      const page = item.dataset.page;
      const map = {
        dashboard: "dashboard.html",
        users: "manage-users.html",
        pricing: "pricing-settings.html",
        policies: "policies.html",
        reports: "reports.html",
        settings: "system-settings.html",
      };
      if (map[page]) window.location.href = map[page];
    });
  });
})();

// ── SVG Icon Helpers (shared across pages) ──
function iconBox() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
}
function iconBox2() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
}
function iconDollar() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
}
function iconClock() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
}
function iconCheck() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
}
function iconCheck2() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
}
function iconTrend() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
}

// ── Shared Helpers ──
function statCard(label, value, desc, iconColor, accent, icon) {
  return `
    <div class="stat-card ${accent}">
      <div class="stat-top">
        <div class="stat-label">${label}</div>
        <div class="stat-icon ${iconColor}">${icon}</div>
      </div>
      <div class="stat-value">${value}</div>
      <div class="stat-desc">${desc}</div>
    </div>
  `;
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
