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
  pricing: window.UPressPricing
    ? window.UPressPricing.getDefaultPricing()
    : { bw: 3, color: 2, surcharge: 5 },
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

const state = Object.assign({}, defaultState, loadState() || {});
if (window.UPressPricing) {
  state.pricing = window.UPressPricing.normalizePricing(state.pricing);
  window.UPressPricing.mirrorPublicPricing(state.pricing);
}

function persistState() {
  saveState({
    users: state.users,
    pricing: state.pricing,
    policies: state.policies,
    settings: state.settings,
  });
  if (window.UPressPricing && state.pricing) {
    window.UPressPricing.mirrorPublicPricing(state.pricing);
  }
}

const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");
let toastTimer;

function showToast(msg, duration = 3000) {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const hamburger = document.getElementById("hamburger");
const sidebarClose = document.getElementById("sidebarClose");

if (hamburger && sidebar) {
  hamburger.addEventListener("click", () => {
    sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("open");
  });
}

function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove("open");
  if (sidebarOverlay) sidebarOverlay.classList.remove("open");
}

if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Logged out successfully.");
    setTimeout(() => {
      sessionStorage.removeItem(STORAGE_KEY);
      try {
        localStorage.removeItem("currentUser");
      } catch (_) {}
      window.location.replace("../../pages/admin-login-entry-point.html");
    }, 1200);
  });
}

(function markActiveNav() {
  const currentPage = document.body.dataset.page || "";
  document.querySelectorAll(".nav-link[data-page]").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === currentPage);
  });
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
})();

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

function statCardSdTone(accent) {
  const m = {
    "accent-red": "sd-card--red",
    "accent-green": "sd-card--green",
    "accent-yellow": "sd-card--amber",
    "accent-purple": "sd-card--purple",
    "accent-blue": "sd-card--blue",
    "accent-gray": "sd-card--gray",
  };
  return m[accent] || "sd-card--gray";
}

function statCard(label, value, desc, _iconColor, accent, icon) {
  const tone = statCardSdTone(accent);
  return `
    <article class="sd-card ${tone}" aria-label="${label}">
      <div class="sd-card__top">
        <div class="sd-card__label">${label}</div>
        <div class="sd-card__icon" aria-hidden="true">${icon}</div>
      </div>
      <div class="sd-card__value">${value}</div>
      <div class="sd-card__hint">${desc}</div>
    </article>
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
