/* ============================================================
   UPRESSease Admin Portal – Main Script
   ============================================================ */

const STORAGE_KEY = "upressease_state";

// ── State ──
const state = {
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
  currentPage: "dashboard",
  reportType: "daily",
  chartInstance: null,
};

// ── Mock report data ──
const reportData = {
  daily: {
    labels: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"],
    orders: [4, 3, 0, 0, 2, 0, 0],
    income: [780, 620, 0, 0, 350, 0, 0],
  },
  monthly: {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    orders: [12, 8, 22, 9, 15, 18, 6, 9, 11, 14, 7, 0],
    income: [
      2400, 1600, 4400, 1800, 3000, 3600, 1200, 1800, 2200, 2800, 1400, 0,
    ],
  },
  yearly: {
    labels: ["2022", "2023", "2024", "2025", "2026"],
    orders: [85, 132, 168, 201, 9],
    income: [17000, 26400, 33600, 40200, 1750],
  },
};

// ── DOM Refs ──
const pageContainer = document.getElementById("pageContainer");
const topbarTitle = document.getElementById("topbarTitle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const hamburger = document.getElementById("hamburger");
const sidebarClose = document.getElementById("sidebarClose");
const modalBackdrop = document.getElementById("modalBackdrop");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

// ── Navigation ──
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    navigateTo(page);
    closeSidebar();
  });
});

function navigateTo(page) {
  state.currentPage = page;
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.toggle("active", n.dataset.page === page));
  const titles = {
    dashboard: "Dashboard",
    users: "Manage Users",
    pricing: "Pricing Settings",
    policies: "Policies",
    reports: "Reports",
    settings: "System Settings",
  };
  topbarTitle.textContent = titles[page] || "Dashboard";
  renderPage(page);
}

// ── Sidebar Mobile ──
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
  try {
    localStorage.removeItem("currentUser");
  } catch (_) {}
  sessionStorage.removeItem(STORAGE_KEY);
  window.location.replace("../../../index.html");
});

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
}

// ── DASHBOARD ──
function dashboard() {
  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">Today's Overview – ${formatDate(new Date())}</p>
    </div>

    <div class="stats-grid">
      ${statCard("Today's Orders", "0", "Total orders today", "red", "accent-red", iconBox())}
      ${statCard("Today's Income", "₱0.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Pending/Paid", "0", "Awaiting processing", "yellow", "accent-yellow", iconClock())}
      ${statCard("Processing", "0", "Currently being processed", "purple", "accent-purple", iconBox2())}
      ${statCard("Ready for Pickup", "0", "Ready to be claimed", "green", "accent-green", iconCheck())}
      ${statCard("Completed", "0", "Successfully completed", "gray", "accent-gray", iconCheck2())}
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <div>
          <div class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Today's Transactions
          </div>
          <div class="card-sub">All orders placed today</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('reports')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
          View All Orders
        </button>
      </div>
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <div class="empty-title">No transactions today</div>
        <div class="empty-desc">Orders placed today will appear here</div>
      </div>
    </div>

    <div class="promo-banner">
      <div class="promo-left">
        <div class="promo-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div>
          <div class="promo-title">Performance Analytics</div>
          <div class="promo-desc">View detailed daily, monthly, and yearly performance reports</div>
        </div>
      </div>
      <button class="btn btn-promo" onclick="navigateTo('reports')">View Analytics</button>
    </div>
  `;
}

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
      showToast("User removed.");
      renderPage("users");
    });
  });

  pageContainer.querySelectorAll(".action-btn.suspend").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      state.users[idx].suspended = !state.users[idx].suspended;
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
  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Pricing Settings</h1>
      <p class="page-sub">Configure base prices and additional charges for printing services</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Base Price Per Page</div>
          <div class="settings-section-sub">Standard charge for black and white printing per page</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Price (₱)</label>
        <div class="price-input-wrap">
          <span class="price-currency">₱</span>
          <input type="number" class="form-input" id="priceBW" value="${state.pricing.bw.toFixed(2)}" step="0.50" min="0" />
        </div>
        <div class="form-help" id="helpBW">Current: ₱${state.pricing.bw.toFixed(2)} per page</div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Color Printing Charge</div>
          <div class="settings-section-sub">Additional charge for color printing (added to base price)</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Additional Price (₱)</label>
        <div class="price-input-wrap">
          <span class="price-currency">₱</span>
          <input type="number" class="form-input" id="priceColor" value="${state.pricing.color.toFixed(2)}" step="0.50" min="0" />
        </div>
        <div class="form-help" id="helpColor">Total color price: ₱${(state.pricing.bw + state.pricing.color).toFixed(2)} per page</div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Large Image Surcharge</div>
          <div class="settings-section-sub">Extra charge for documents containing large images or graphics</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Surcharge (₱)</label>
        <div class="price-input-wrap">
          <span class="price-currency">₱</span>
          <input type="number" class="form-input" id="priceSurcharge" value="${state.pricing.surcharge.toFixed(2)}" step="0.50" min="0" />
        </div>
        <div class="form-help">Applied when images exceed 30% of page content</div>
      </div>
    </div>

    <div class="summary-block" id="pricingSummary">
      <div class="summary-title">Pricing Summary</div>
      <div class="summary-row">
        <span class="summary-key">B&W Printing:</span>
        <span class="summary-val" id="sumBW">₱${state.pricing.bw.toFixed(2)} /page</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Color Printing:</span>
        <span class="summary-val" id="sumColor">₱${(state.pricing.bw + state.pricing.color).toFixed(2)} /page</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Large Image Surcharge:</span>
        <span class="summary-val" id="sumSurcharge">+₱${state.pricing.surcharge.toFixed(2)}</span>
      </div>
    </div>

    <div class="sticky-save">
      <button class="btn btn-primary" id="savePricing">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Changes
      </button>
    </div>
  `;

  // Live update helpers
  function updateSummary() {
    const bw = parseFloat(document.getElementById("priceBW").value) || 0;
    const col = parseFloat(document.getElementById("priceColor").value) || 0;
    const sur =
      parseFloat(document.getElementById("priceSurcharge").value) || 0;
    document.getElementById("helpBW").textContent =
      `Current: ₱${bw.toFixed(2)} per page`;
    document.getElementById("helpColor").textContent =
      `Total color price: ₱${(bw + col).toFixed(2)} per page`;
    document.getElementById("sumBW").textContent = `₱${bw.toFixed(2)} /page`;
    document.getElementById("sumColor").textContent =
      `₱${(bw + col).toFixed(2)} /page`;
    document.getElementById("sumSurcharge").textContent = `+₱${sur.toFixed(2)}`;
  }

  ["priceBW", "priceColor", "priceSurcharge"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateSummary);
  });

  document.getElementById("savePricing").addEventListener("click", () => {
    state.pricing.bw =
      parseFloat(document.getElementById("priceBW").value) || 0;
    state.pricing.color =
      parseFloat(document.getElementById("priceColor").value) || 0;
    state.pricing.surcharge =
      parseFloat(document.getElementById("priceSurcharge").value) || 0;
    showToast("Pricing settings saved!");
  });
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
    showToast("Policy settings saved!");
  });
}

// ── REPORTS ──
function reports() {
  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Reports</h1>
      <p class="page-sub">View and analyze system performance over time</p>
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
            <option value="monthly" ${state.reportType === "monthly" ? "selected" : ""}>Monthly (This Year)</option>
            <option value="yearly" ${state.reportType === "yearly" ? "selected" : ""}>Yearly (All Time)</option>
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

    <div class="stats-grid" style="margin-bottom:20px">
      ${statCard("Total Orders", "9", "Across selected period", "red", "accent-red", iconBox())}
      ${statCard("Total Income", "₱1,750.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Avg Order Value", "₱194.44", "Per completed order", "blue", "accent-blue", iconTrend())}
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Performance Chart</div>
          <div class="card-sub" id="chartSubtitle">Daily Report</div>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-container">
          <canvas id="perfChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Build chart
  buildChart(state.reportType);

  document.getElementById("reportType").addEventListener("change", (e) => {
    state.reportType = e.target.value;
    const subtitles = {
      daily: "Daily Report",
      monthly: "Monthly Report",
      yearly: "Yearly Report",
    };
    document.getElementById("chartSubtitle").textContent =
      subtitles[e.target.value];
    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }
    buildChart(e.target.value);
  });
}

function buildChart(type) {
  const data = reportData[type];
  const ctx = document.getElementById("perfChart").getContext("2d");

  state.chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Orders",
          data: data.orders,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.08)",
          borderWidth: 2,
          pointBackgroundColor: "#ef4444",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Income (₱)",
          data: data.income,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.06)",
          borderWidth: 2,
          pointBackgroundColor: "#22c55e",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: "600",
            },
            usePointStyle: true,
            pointStyleWidth: 8,
            padding: 20,
            color: "#5a6170",
          },
        },
        tooltip: {
          backgroundColor: "white",
          titleColor: "#1a1d23",
          bodyColor: "#5a6170",
          borderColor: "#e4e8ef",
          borderWidth: 1,
          padding: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          titleFont: {
            family: "'Plus Jakarta Sans', sans-serif",
            weight: "700",
            size: 13,
          },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.label === "Income (₱)")
                return `Income (₱) : ${ctx.parsed.y.toLocaleString()}`;
              return `Orders : ${ctx.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
            color: "#9aa1b0",
          },
        },
        y: {
          position: "left",
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
            color: "#ef4444",
            stepSize: 1,
          },
          title: { display: false },
        },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
            color: "#22c55e",
          },
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
