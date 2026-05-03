/* ============================================================
   UPRESSease Admin Portal – Main Script
   ============================================================ */

const STORAGE_KEY = "upressease_state";

// ── State ──
const state = {
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
  currentPage: "dashboard",
  reportType: "daily",
  chartInstance: null,
};

function persistPortalState() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        users: state.users,
        pricing: state.pricing,
        policies: state.policies,
        settings: state.settings,
      }),
    );
  } catch (_) {}
  if (window.UPressPricing && state.pricing) {
    UPressPricing.mirrorPublicPricing(state.pricing);
  }
}

(function hydratePortalFromSession() {
  if (!window.UPressPricing) return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.pricing = UPressPricing.normalizePricing(state.pricing);
      return;
    }
    const s = JSON.parse(raw);
    if (Array.isArray(s.users)) state.users = s.users;
    if (s.pricing) state.pricing = UPressPricing.normalizePricing(s.pricing);
    else state.pricing = UPressPricing.normalizePricing(state.pricing);
    if (s.policies && typeof s.policies === "object") {
      state.policies = Object.assign({}, state.policies, s.policies);
    }
    if (s.settings && typeof s.settings === "object") {
      state.settings = Object.assign({}, state.settings, s.settings);
    }
  } catch (_) {
    state.pricing = UPressPricing.normalizePricing(state.pricing);
  }
  if (state.pricing) UPressPricing.mirrorPublicPricing(state.pricing);
})();

const reportData = {
  daily: {
    labels: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"],
    orders: [0, 0, 0, 0, 0, 0, 0],
    income: [0, 0, 0, 0, 0, 0, 0],
  },
  monthly: {
    labels: [
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
    ],
    orders: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    income: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1000],
  },
  yearly: {
    labels: ["2022", "2023", "2024", "2025", "2026"],
    orders: [0, 0, 0, 0, 9],
    income: [0, 0, 0, 0, 1750],
  },
};

// ── DOM Refs ──
const pageContainer = document.getElementById("pageContainer");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const hamburger = document.getElementById("hamburger");
const sidebarClose = document.getElementById("sidebarClose");
const modalBackdrop = document.getElementById("modalBackdrop");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

document.querySelectorAll(".nav-link[data-page]").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    if (!page || page === "logout") return;
    navigateTo(page);
    closeSidebar();
  });
});

function navigateTo(page) {
  state.currentPage = page;
  document.querySelectorAll(".nav-link[data-page]").forEach((n) => {
    if (n.dataset.page === "logout") return;
    n.classList.toggle("active", n.dataset.page === page);
  });
  renderPage(page);
}

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

const logoutBtnEl = document.getElementById("logoutBtn");
if (logoutBtnEl) {
  logoutBtnEl.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Logged out successfully.");
    try {
      localStorage.removeItem("currentUser");
    } catch (_) {}
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.replace("../../../index.html");
  });
}

// ── Toast ──
let toastTimer;
function showToast(msg, duration = 3000) {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ── Modal ──
function openModal() {
  modalBackdrop.classList.add("open");
}
function closeModal() {
  modalBackdrop.classList.remove("open");
  clearModalForm();
}
function clearModalForm() {
  ["newUsername", "newFullName", "newEmail", "newPassword"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("newRole").value = "Admin";
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalCancel").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

document.getElementById("togglePassword").addEventListener("click", () => {
  const pw = document.getElementById("newPassword");
  pw.type = pw.type === "password" ? "text" : "password";
});

document.getElementById("modalSubmit").addEventListener("click", () => {
  const username = document.getElementById("newUsername").value.trim();
  const fullName = document.getElementById("newFullName").value.trim();
  const email = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

  // Highlight empty username
  const usernameInput = document.getElementById("newUsername");
  if (!username) {
    usernameInput.style.borderColor = "var(--red)";
    usernameInput.focus();
    return;
  }
  if (!fullName) {
    document.getElementById("newFullName").focus();
    return;
  }
  if (!email) {
    document.getElementById("newEmail").focus();
    return;
  }
  if (!password) {
    document.getElementById("newPassword").focus();
    return;
  }

  usernameInput.style.borderColor = "";

  state.users.push({ username, fullName, email, role });
  persistPortalState();
  closeModal();
  showToast("User added successfully!");
  if (state.currentPage === "users") renderPage("users");
});

// ============================================================
// PAGE RENDERERS
// ============================================================

function renderPage(page) {
  // Kill chart if leaving reports
  if (state.chartInstance && page !== "reports") {
    state.chartInstance.destroy();
    state.chartInstance = null;
  }
  const renderers = {
    dashboard,
    users,
    pricing,
    policies,
    reports,
    settings,
  };
  pageContainer.innerHTML = "";
  (renderers[page] || dashboard)();
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ── DASHBOARD ──
function dashboard() {
  pageContainer.innerHTML = `
    <header class="sd-header">
      <h1 class="sd-title">Dashboard</h1>
      <div class="sd-subtitle">Today's Overview – ${formatDate(new Date())}</div>
    </header>

    <section class="sd-metrics" aria-label="Dashboard metrics">
      ${statCard("Today's Orders", "0", "Total orders today", "red", "accent-red", iconBox())}
      ${statCard("Today's Income", "₱0.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Pending/Paid", "0", "Awaiting processing", "yellow", "accent-yellow", iconClock())}
      ${statCard("Processing", "0", "Currently being processed", "purple", "accent-purple", iconBox2())}
      ${statCard("Ready for Pickup", "0", "Ready to be claimed", "green", "accent-green", iconCheck())}
      ${statCard("Completed", "0", "Successfully completed", "gray", "accent-gray", iconCheck2())}
    </section>

    <section class="sd-panel" aria-label="Today's transactions">
      <div class="sd-panel__head">
        <div>
          <div class="sd-panel__title">
            <span class="sd-panel__titleIcon" aria-hidden="true">≡</span>
            <span>Today's Transactions</span>
          </div>
          <div class="sd-panel__sub">All orders placed today</div>
        </div>
        <button type="button" class="sd-panel__cta" onclick="navigateTo('reports')">
          <span class="sd-panel__ctaIcon" aria-hidden="true">≡</span>
          <span>View All</span>
        </button>
      </div>
      <div class="sd-empty">
        <div class="sd-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path
              d="M3.27 6.96 12 12l8.73-5.04M12 22V12"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="sd-empty__title">No transactions today</div>
        <div class="sd-empty__sub">Orders placed today will appear here</div>
      </div>
    </section>

    <section class="sd-hero" aria-label="Performance analytics">
      <div class="sd-hero__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16l5-6 4 3 7-9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
      <div class="sd-hero__text">
        <div class="sd-hero__title">Performance Analytics</div>
        <div class="sd-hero__sub">
          View detailed daily, monthly, and yearly performance reports
        </div>
      </div>
      <button type="button" class="sd-hero__cta" onclick="navigateTo('reports')">View Analytics</button>
    </section>
  `;
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

// ── MANAGE USERS ──
function users() {
  const usersHTML =
    state.users.length === 0
      ? `<div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <div class="empty-title">No users yet</div>
        <div class="empty-desc">Add admin or staff users to get started</div>
       </div>`
      : `<div class="users-grid">${state.users.map((u, i) => userCard(u, i)).join("")}</div>`;

  pageContainer.innerHTML = `
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
      <div>
        <h1 class="page-title">Manage Users</h1>
        <p class="page-sub">Add, edit, suspend, or delete admin and staff accounts</p>
      </div>
      <button class="btn btn-primary" id="addUserBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        Add User
      </button>
    </div>
    <div class="card"><div class="card-body" style="padding:0">${usersHTML}</div></div>
  `;

  document.getElementById("addUserBtn").addEventListener("click", openModal);

  // Wire delete/suspend/edit buttons
  pageContainer.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      state.users.splice(idx, 1);
      persistPortalState();
      showToast("User removed.");
      renderPage("users");
    });
  });

  pageContainer.querySelectorAll(".action-btn.suspend").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      state.users[idx].suspended = !state.users[idx].suspended;
      persistPortalState();
      showToast(
        state.users[idx].suspended ? "User suspended." : "User restored.",
      );
      renderPage("users");
    });
  });
}

function userCard(u, i) {
  const roleClass = u.role === "Admin" ? "admin" : "staff";
  const suspendedStyle = u.suspended ? "opacity:0.55;" : "";
  return `
    <div class="user-card" style="${suspendedStyle}">
      <div class="user-card-top">
        <div>
          <div class="user-name">${u.fullName.toUpperCase()}</div>
          <div class="user-handle-sm">@${u.username}</div>
        </div>
        <span class="role-badge ${roleClass}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${u.role}
        </span>
      </div>
      <div class="user-email">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        ${u.email}
      </div>
      <div class="user-actions">
        <button class="action-btn edit" data-idx="${i}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="action-btn suspend" data-idx="${i}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          ${u.suspended ? "Restore" : "Suspend"}
        </button>
        <button class="action-btn delete" data-idx="${i}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
    </div>
  `;
}

// ── PRICING ──
function pricing() {
  if (window.UPressPricing) {
    state.pricing = UPressPricing.normalizePricing(state.pricing);
    pageContainer.innerHTML = UPressPricing.buildPricingSettingsHTML(state.pricing);
    UPressPricing.bindPricingSettingsForm(pageContainer, {
      setPricing: (p) => {
        state.pricing = p;
      },
      persist: persistPortalState,
      showToast: showToast,
    });
    return;
  }
  pageContainer.innerHTML =
    '<div class="page-header"><h1 class="page-title">Pricing Settings</h1><p class="page-sub">Load site-pricing.js to configure rates.</p></div>';
}

// ── POLICIES ──
function policies() {
  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Policies</h1>
      <p class="page-sub">Configure system policies and discount settings</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
        </div>
        <div>
          <div class="settings-section-title">QR Code Pickup System</div>
          <div class="settings-section-sub">Enable or disable QR code scanning for order pickup verification</div>
        </div>
      </div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-label">QR Code Feature</div>
          <div class="toggle-desc" id="qrDesc">${state.policies.qrCode ? "QR codes are required for order pickup" : "QR code feature is disabled"}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="qrToggle" ${state.policies.qrCode ? "checked" : ""} />
          <span class="toggle-track"></span>
        </label>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Time-Based Discounts</div>
          <div class="settings-section-sub">Set up automatic discounts for specific time periods</div>
        </div>
      </div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-label">Enable Discounts</div>
          <div class="toggle-desc" id="discountDesc">${state.policies.discounts ? "Discount feature is active" : "Discount feature is disabled"}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="discountToggle" ${state.policies.discounts ? "checked" : ""} />
          <span class="toggle-track"></span>
        </label>
      </div>
    </div>

    <div class="summary-block">
      <div class="summary-title">Policy Summary</div>
      <div class="summary-row">
        <span class="summary-key">QR Code Pickup:</span>
        <span class="summary-val ${state.policies.qrCode ? "enabled" : "disabled"}" id="sumQR">
          ${state.policies.qrCode ? "Enabled" : "Inactive"}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Discount System:</span>
        <span class="summary-val ${state.policies.discounts ? "enabled" : "disabled"}" id="sumDiscount">
          ${state.policies.discounts ? "Enabled" : "Inactive"}
        </span>
      </div>
    </div>

    <div class="sticky-save">
      <button class="btn btn-primary" id="savePolicies">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Changes
      </button>
    </div>
  `;

  document.getElementById("qrToggle").addEventListener("change", (e) => {
    state.policies.qrCode = e.target.checked;
    document.getElementById("qrDesc").textContent = state.policies.qrCode
      ? "QR codes are required for order pickup"
      : "QR code feature is disabled";
    const el = document.getElementById("sumQR");
    el.textContent = state.policies.qrCode ? "Enabled" : "Inactive";
    el.className = `summary-val ${state.policies.qrCode ? "enabled" : "disabled"}`;
  });

  document.getElementById("discountToggle").addEventListener("change", (e) => {
    state.policies.discounts = e.target.checked;
    document.getElementById("discountDesc").textContent = state.policies
      .discounts
      ? "Discount feature is active"
      : "Discount feature is disabled";
    const el = document.getElementById("sumDiscount");
    el.textContent = state.policies.discounts ? "Enabled" : "Inactive";
    el.className = `summary-val ${state.policies.discounts ? "enabled" : "disabled"}`;
  });

  document.getElementById("savePolicies").addEventListener("click", () => {
    persistPortalState();
    showToast("Policy settings saved!");
  });
}

// ── REPORTS ──
function reports() {
  pageContainer.innerHTML = `
    <div class="page-header page-header--row">
      <div class="page-header__intro">
        <h1 class="page-title">Reports</h1>
        <p class="page-sub">View and analyze system performance over time</p>
      </div>
      <button
        type="button"
        class="btn btn-primary page-header__action"
        id="superReportsExportBtn"
        aria-label="Export Report"
      >
        <i data-lucide="download" aria-hidden="true"></i>
        Export Report
      </button>
    </div>

    <div class="reports-header-section">
      <div class="reports-filter-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Report Filters
      </div>
      <div class="reports-filter-sub">Select time period and date range for reports</div>
      <div class="filter-grid">
        <div>
          <div class="filter-label">Report Type</div>
          <select class="form-input form-select" id="reportType">
            <option value="daily" ${state.reportType === "daily" ? "selected" : ""}>Daily (Last 7 Days)</option>
            <option value="monthly" ${state.reportType === "monthly" ? "selected" : ""}>Monthly (Last 12 Months)</option>
            <option value="yearly" ${state.reportType === "yearly" ? "selected" : ""}>Yearly (Last 5 Years)</option>
          </select>
        </div>
        <div>
          <div class="filter-label">Start Date (Optional)</div>
          <input type="date" class="form-input" id="startDate" />
        </div>
        <div>
          <div class="filter-label">End Date (Optional)</div>
          <input type="date" class="form-input" id="endDate" />
        </div>
      </div>
    </div>

    <section class="sd-metrics" aria-label="Report summary">
      ${statCard("Total Orders", "9", "Across selected period", "red", "accent-red", iconBox())}
      ${statCard("Total Income", "₱1,750.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Avg Order Value", "₱194.44", "Per completed order", "blue", "accent-blue", iconTrend())}
    </section>

    <div class="card sp">
      <div class="card-title-group">
        <i data-lucide="bar-chart-2" aria-hidden="true"></i>
        <div>
          <h2 class="card-title">Performance Chart</h2>
          <p class="card-subtitle" id="rpt-chart-label">Daily Report</p>
        </div>
      </div>
      <div style="position:relative;height:300px;margin-top:1rem;">
        <canvas id="reports-chart" aria-label="Reports performance chart"></canvas>
      </div>
    </div>
  `;

  // Build chart
  buildChart(state.reportType);

  document.getElementById("superReportsExportBtn").addEventListener("click", () => {
    showToast("Export prepared (demo).");
  });

  document.getElementById("reportType").addEventListener("change", (e) => {
    state.reportType = e.target.value;
    const subtitles = {
      daily: "Daily Report",
      monthly: "Monthly Report",
      yearly: "Yearly Report",
    };
    const lbl = document.getElementById("rpt-chart-label");
    if (lbl) lbl.textContent = subtitles[e.target.value];
    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }
    buildChart(e.target.value);
  });
}

function buildChart(type) {
  const canvas = document.getElementById("reports-chart");
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  state.chartInstance = null;

  const data = reportData[type] || reportData.daily;

  state.chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Orders",
          data: data.orders,
          borderColor: "#1a1a1a",
          backgroundColor: "transparent",
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#1a1a1a",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          tension: 0,
          yAxisID: "yLeft",
        },
        {
          label: "Income (₱)",
          data: data.income,
          borderColor: "#10B981",
          backgroundColor: "transparent",
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#10B981",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          tension: 0,
          yAxisID: "yRight",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          align: "center",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,
            font: { family: "'Inter', sans-serif", size: 13 },
            color: "#374151",
          },
        },
        tooltip: {
          backgroundColor: "#fff",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          titleColor: "#111827",
          bodyColor: "#6B7280",
          padding: 10,
          callbacks: {
            label(ctx) {
              if (ctx.dataset.label === "Income (₱)") {
                return " Income: ₱" + ctx.parsed.y.toFixed(2);
              }
              return " Orders: " + ctx.parsed.y;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "#e5e7eb",
            lineWidth: 1,
            drawTicks: false,
          },
          border: { dash: [4, 4] },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 12 },
            color: "#6B7280",
            padding: 8,
          },
        },
        yLeft: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          grid: {
            color: "#e5e7eb",
            lineWidth: 1,
            drawTicks: false,
          },
          border: { dash: [4, 4] },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 12 },
            color: "#6B7280",
            padding: 8,
            stepSize: 1,
            precision: 0,
          },
          title: { display: false },
        },
        yRight: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 12 },
            color: "#10B981",
            padding: 8,
            callback(val) {
              return val;
            },
          },
          title: { display: false },
        },
      },
    },
  });
}

// ── SYSTEM SETTINGS ──
function settings() {
  const s = state.settings;
  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
      <p class="page-sub">Configure system-wide settings and information</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Institution Information</div>
          <div class="settings-section-sub">Basic information about your institution</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Institution Name</label>
        <input type="text" class="form-input" id="sInstitution" value="${s.institution}" />
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Address</label>
        <textarea class="form-input" id="sAddress" rows="2" style="resize:vertical">${s.address}</textarea>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Contact Information</div>
          <div class="settings-section-sub">Contact details displayed to users</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Contact Email</label>
        <div class="input-icon-wrap">
          <input type="email" class="form-input" id="sEmail" value="${s.email}" style="padding-left:42px"/>
          <span class="input-icon-btn" style="left:12px;right:auto;pointer-events:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Contact Phone</label>
        <div class="input-icon-wrap">
          <input type="tel" class="form-input" id="sPhone" value="${s.phone}" style="padding-left:42px"/>
          <span class="input-icon-btn" style="left:12px;right:auto;pointer-events:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6.29 6.29l1.61-1.61a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Operating Hours</div>
          <div class="settings-section-sub">Service availability hours</div>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Hours of Operation</label>
        <input type="text" class="form-input" id="sHours" value="${s.hours}" />
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon orange">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Maintenance Mode</div>
          <div class="settings-section-sub">Temporarily disable the system for maintenance</div>
        </div>
      </div>

      <div class="maintenance-alert ${s.maintenance ? "active" : "normal"}" id="maintenanceAlert">
        <div class="maintenance-alert-text">
          <strong id="maintenanceStatus">${s.maintenance ? "Maintenance mode active" : "System operating normally"}</strong>
          <span id="maintenanceSubStatus">${s.maintenance ? "Students cannot access the system" : "System is available to all users"}</span>
        </div>
        <button class="btn btn-sm ${s.maintenance ? "btn-danger" : "btn-ghost"}" id="maintenanceToggleBtn">
          ${s.maintenance ? "Disable" : "Enable"}
        </button>
      </div>

      <div id="maintenanceMsgWrap" style="${s.maintenance ? "" : "display:none"}">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Maintenance Message</label>
          <textarea class="form-input" id="sMaintenanceMsg" rows="2" style="resize:vertical">${s.maintenanceMsg}</textarea>
        </div>
      </div>
    </div>

    <div class="sticky-save">
      <button class="btn btn-primary" id="saveSettings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Settings
      </button>
    </div>
  `;

  document
    .getElementById("maintenanceToggleBtn")
    .addEventListener("click", () => {
      s.maintenance = !s.maintenance;
      const alert = document.getElementById("maintenanceAlert");
      const statusEl = document.getElementById("maintenanceStatus");
      const subStatusEl = document.getElementById("maintenanceSubStatus");
      const btn = document.getElementById("maintenanceToggleBtn");
      const msgWrap = document.getElementById("maintenanceMsgWrap");

      if (s.maintenance) {
        alert.className = "maintenance-alert active";
        statusEl.textContent = "Maintenance mode active";
        subStatusEl.textContent = "Students cannot access the system";
        btn.className = "btn btn-sm btn-danger";
        btn.textContent = "Disable";
        msgWrap.style.display = "";
        msgWrap.style.marginTop = "16px";
      } else {
        alert.className = "maintenance-alert normal";
        statusEl.textContent = "System Operating Normally";
        subStatusEl.textContent = "System is available to all users";
        btn.className = "btn btn-sm btn-ghost";
        btn.textContent = "Enable";
        msgWrap.style.display = "none";
      }
    });

  document.getElementById("saveSettings").addEventListener("click", () => {
    s.institution = document.getElementById("sInstitution").value;
    s.address = document.getElementById("sAddress").value;
    s.email = document.getElementById("sEmail").value;
    s.phone = document.getElementById("sPhone").value;
    s.hours = document.getElementById("sHours").value;
    if (document.getElementById("sMaintenanceMsg"))
      s.maintenanceMsg = document.getElementById("sMaintenanceMsg").value;
    persistPortalState();
    showToast("System settings saved!");
  });
}

// ============================================================
// SVG Icons
// ============================================================
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

// ── Helpers ──
function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Init ──
renderPage("dashboard");
if (typeof lucide !== "undefined" && lucide.createIcons) {
  lucide.createIcons();
}
