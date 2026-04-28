/* ==========================================================
   UPRESSease Admin Portal — app.js
   Sections:
   1.  Sample Data
   2.  Navigation
   3.  Sidebar Toggle (mobile)
   4.  Student Verification — render, filter, modal
   5.  Orders Table — render, filter, modal
   6.  Active Accounts — render, filter
   7.  Add Service — dynamic options, form submit
   8.  Charts (Chart.js, lazy init)
   9.  QR Scanner
   10. Dashboard helpers
   11. Toast notification
   12. Utility helpers
   13. Event listeners & init
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   1. SAMPLE DATA
   In production these would come from an API / database.
   ---------------------------------------------------------- */

/** Student verification requests */
const VERIFICATION_REQUESTS = [
  {
    id: "VR-001",
    name: "Maria Santos",
    studentId: "2024-00123",
    program: "Computer Science",
    yearLevel: "3rd Year",
    email: "maria.santos@university.edu",
    submitted: "4/26/2026, 9:53:09 PM",
    status: "pending",
  },
  {
    id: "VR-002",
    name: "Juan Dela Cruz",
    studentId: "2024-00124",
    program: "Information Technology",
    yearLevel: "2nd Year",
    email: "juan.delacruz@university.edu",
    submitted: "4/26/2026, 6:53:09 PM",
    status: "pending",
  },
  {
    id: "VR-003",
    name: "Ana Reyes",
    studentId: "2024-00125",
    program: "Business Administration",
    yearLevel: "4th Year",
    email: "ana.reyes@university.edu",
    submitted: "4/25/2026, 11:53:09 PM",
    status: "approved",
  },
  {
    id: "VR-004",
    name: "Pedro Garcia",
    studentId: "2024-00126",
    program: "Engineering",
    yearLevel: "1st Year",
    email: "pedro.garcia@university.edu",
    submitted: "4/24/2026, 11:53:09 PM",
    status: "rejected",
  },
];

/** All student orders */
const ORDERS = [
  {
    id: "ORD-2026-101",
    email: "student@wmsu.edu.ph",
    service: "Printing",
    amount: 60,
    status: "pending",
    payment: "Not selected",
    date: "Apr 5, 2026",
  },
  {
    id: "ORD-2026-102",
    email: "student@wmsu.edu.ph",
    service: "Binding",
    amount: 150,
    status: "processing",
    payment: "Online Payment",
    date: "Apr 4, 2026",
  },
  {
    id: "ORD-2026-103",
    email: "student@wmsu.edu.ph",
    service: "Lanyards",
    amount: 300,
    status: "ready",
    payment: "Pay Onsite",
    date: "Apr 3, 2026",
  },
  {
    id: "ORD-2026-104",
    email: "student@wmsu.edu.ph",
    service: "Mug Printing",
    amount: 1000,
    status: "completed",
    payment: "Online Payment",
    date: "Apr 1, 2026",
  },
  {
    id: "ORD-2026-004",
    email: "anna.lopez@wmsu.edu.ph",
    service: "Lanyards",
    amount: 750,
    status: "paid",
    payment: "Online Payment",
    date: "Feb 19, 2026",
  },
  {
    id: "ORD-2026-003",
    email: "pedro.reyes@wmsu.edu.ph",
    service: "Printing",
    amount: 170,
    status: "pending",
    payment: "Not selected",
    date: "Feb 19, 2026",
  },
  {
    id: "ORD-2026-002",
    email: "maria.santos@wmsu.edu.ph",
    service: "Mug Printing",
    amount: 400,
    status: "processing",
    payment: "Pay Onsite",
    date: "Feb 19, 2026",
  },
  {
    id: "ORD-2026-001",
    email: "juan.delacruz@wmsu.edu.ph",
    service: "Printing",
    amount: 150,
    status: "ready",
    payment: "Online Payment",
    date: "Feb 19, 2026",
  },
  {
    id: "ORD-2026-005",
    email: "carlo.garcia@wmsu.edu.ph",
    service: "Merchandise",
    amount: 750,
    status: "completed",
    payment: "Pay Onsite",
    date: "Feb 18, 2026",
  },
];

/**
 * Student accounts with registration/COR dates.
 * expiryDays is computed relative to today (positive = still valid, negative = expired).
 * We store registrationDate as a string and compute days dynamically.
 */
const ACCOUNTS = [
  {
    name: "Juan Dela Cruz",
    email: "juan.delacruz@wmsu.edu.ph",
    registrationDate: "2025-03-01",
    lastCOR: "2025-03-01",
  },
  {
    name: "Maria Santos",
    email: "maria.santos@wmsu.edu.ph",
    registrationDate: "2025-06-15",
    lastCOR: "2025-06-15",
  },
  {
    name: "Pedro Reyes",
    email: "pedro.reyes@wmsu.edu.ph",
    registrationDate: "2025-09-20",
    lastCOR: "2025-09-20",
  },
  {
    name: "Anna Lopez",
    email: "anna.lopez@wmsu.edu.ph",
    registrationDate: "2025-01-10",
    lastCOR: "2025-01-10",
  },
  {
    name: "Carlo Garcia",
    email: "carlo.garcia@wmsu.edu.ph",
    registrationDate: "2024-12-05",
    lastCOR: "2024-12-05",
  },
];

/** Services created via Add Service form (starts empty) */
const CREATED_SERVICES = [];

/** Option row counter for Add Service dynamic rows */
let optionRowCount = 1;

/* ----------------------------------------------------------
   2. NAVIGATION
   ---------------------------------------------------------- */

/**
 * Maps each page key to its section element ID and topbar label.
 * @type {Object.<string, {id: string, label: string}>}
 */
const PAGE_MAP = {
  dashboard: { id: "page-dashboard", label: "Dashboard" },
  "student-verification": {
    id: "page-student-verification",
    label: "Student Verification",
  },
  orders: { id: "page-orders", label: "Orders Management" },
  "qr-scanner": { id: "page-qr-scanner", label: "QR Code Scanner" },
  "daily-analytics": { id: "page-daily-analytics", label: "Daily Analytics" },
  "monthly-analytics": {
    id: "page-monthly-analytics",
    label: "Monthly Analytics",
  },
  "yearly-analytics": {
    id: "page-yearly-analytics",
    label: "Yearly Analytics",
  },
  "annual-statistics": {
    id: "page-annual-statistics",
    label: "Annual Statistics",
  },
  "transaction-history": {
    id: "page-transaction-history",
    label: "Transaction History",
  },
  "active-accounts": { id: "page-active-accounts", label: "Active Accounts" },
  "add-service": { id: "page-add-service", label: "Add Service" },
};

/** Tracks which Chart.js instances have been initialised */
const chartInstances = {};

/**
 * Navigate to a named page.
 * Hides all sections, shows the target, updates the sidebar active
 * state and topbar title, then runs any page-specific init.
 * @param {string} pageKey - Key from PAGE_MAP
 */
function navigateTo(pageKey) {
  if (!PAGE_MAP[pageKey]) return;

  /* Hide every page section */
  document
    .querySelectorAll(".page-section")
    .forEach((s) => s.classList.remove("active"));

  /* Show target section */
  const target = document.getElementById(PAGE_MAP[pageKey].id);
  if (target) target.classList.add("active");

  /* Update sidebar active link */
  document.querySelectorAll(".nav-link").forEach((link) => {
    const isActive = link.dataset.page === pageKey;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  /* Update topbar title */
  setText("topbar-title", PAGE_MAP[pageKey].label);

  /* Close mobile sidebar */
  closeSidebar();

  /* Page-specific lazy initialisers */
  if (pageKey === "daily-analytics") initDailyChart();
  if (pageKey === "monthly-analytics") initMonthlyChart();
  if (pageKey === "yearly-analytics") initYearlyChart();
  if (pageKey === "annual-statistics") initAnnualCharts();

  /* Scroll main area to top */
  const main = document.getElementById("main-content");
  if (main) main.scrollTop = 0;
}

/* Make navigateTo available from inline onclick attributes in HTML */
window.navigateTo = navigateTo;

/* ----------------------------------------------------------
   3. SIDEBAR TOGGLE (mobile)
   ---------------------------------------------------------- */

/** Opens the mobile sidebar drawer */
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.remove("hidden");
  document
    .getElementById("hamburger-btn")
    .setAttribute("aria-expanded", "true");
}

/** Closes the mobile sidebar drawer */
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.add("hidden");
  document
    .getElementById("hamburger-btn")
    .setAttribute("aria-expanded", "false");
}

/* ----------------------------------------------------------
   4. STUDENT VERIFICATION
   ---------------------------------------------------------- */

/** Currently active status filter for the verification list */
let svFilter = "all";

/**
 * Renders the verification request list based on the active
 * status filter and search query.
 */
function renderVerificationList() {
  const query = (
    document.getElementById("sv-search")?.value || ""
  ).toLowerCase();
  const list = document.getElementById("sv-list");
  if (!list) return;

  /* Apply filter + search */
  const filtered = VERIFICATION_REQUESTS.filter((req) => {
    const matchStatus = svFilter === "all" || req.status === svFilter;
    const matchQuery =
      !query ||
      req.name.toLowerCase().includes(query) ||
      req.studentId.toLowerCase().includes(query) ||
      req.email.toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  /* Update count label */
  setText(
    "sv-count",
    `${filtered.length} request${filtered.length !== 1 ? "s" : ""} found`,
  );

  /* Build list HTML */
  list.innerHTML =
    filtered.length === 0
      ? `<li class="empty-state">
         <p class="empty-state__title">No requests found</p>
         <p class="empty-state__sub">Try adjusting your search or filter.</p>
       </li>`
      : filtered
          .map(
            (req) => `
        <li class="request-item" data-id="${req.id}">
          <div class="request-item__body">
            <p class="request-item__name">
              ${escHtml(req.name)}
              <span class="status-badge status-badge--${req.status}">
                ${statusIconSVG(req.status)} ${capitalise(req.status)}
              </span>
            </p>
            <div class="request-item__meta">
              <span><strong>Student ID:</strong> ${escHtml(req.studentId)}</span>
              <span><strong>Program:</strong> ${escHtml(req.program)}</span>
              <span><strong>Year Level:</strong> ${escHtml(req.yearLevel)}</span>
              <span><strong>Email:</strong> ${escHtml(req.email)}</span>
              <span><strong>Submitted:</strong> ${escHtml(req.submitted)}</span>
            </div>
          </div>
          <button class="request-item__view" data-id="${req.id}" aria-label="View details for ${escHtml(req.name)}">
            ${eyeIconSVG()}
          </button>
        </li>
      `,
          )
          .join("");

  /* Attach view-button click handlers */
  list.querySelectorAll(".request-item__view").forEach((btn) => {
    btn.addEventListener("click", () => openVerificationModal(btn.dataset.id));
  });
}

/**
 * Opens the student verification detail modal for a given request ID.
 * Shows Approve / Reject buttons only for pending requests.
 * @param {string} requestId
 */
function openVerificationModal(requestId) {
  const req = VERIFICATION_REQUESTS.find((r) => r.id === requestId);
  if (!req) return;

  /* Build detail rows */
  document.getElementById("sv-modal-body").innerHTML = `
    <dl>
      <div class="detail-row"><dt>Full Name</dt>    <dd>${escHtml(req.name)}</dd></div>
      <div class="detail-row"><dt>Student ID</dt>   <dd>${escHtml(req.studentId)}</dd></div>
      <div class="detail-row"><dt>Program</dt>      <dd>${escHtml(req.program)}</dd></div>
      <div class="detail-row"><dt>Year Level</dt>   <dd>${escHtml(req.yearLevel)}</dd></div>
      <div class="detail-row"><dt>Email</dt>        <dd>${escHtml(req.email)}</dd></div>
      <div class="detail-row"><dt>Submitted</dt>    <dd>${escHtml(req.submitted)}</dd></div>
      <div class="detail-row"><dt>Status</dt>
        <dd><span class="status-badge status-badge--${req.status}">${capitalise(req.status)}</span></dd>
      </div>
    </dl>`;

  /* Footer buttons */
  const footer = document.getElementById("sv-modal-footer");
  if (req.status === "pending") {
    footer.innerHTML = `
      <button class="btn btn--danger btn--sm"  id="sv-reject-btn">Reject</button>
      <button class="btn btn--success btn--sm" id="sv-approve-btn">Approve</button>`;

    document.getElementById("sv-approve-btn").onclick = () => {
      setVerificationStatus(requestId, "approved");
      closeVerificationModal();
    };
    document.getElementById("sv-reject-btn").onclick = () => {
      setVerificationStatus(requestId, "rejected");
      closeVerificationModal();
    };
  } else {
    footer.innerHTML = `
      <button class="btn btn--outline btn--sm" id="sv-close-footer">Close</button>`;
    document.getElementById("sv-close-footer").onclick = closeVerificationModal;
  }

  document.getElementById("sv-modal-overlay").classList.remove("hidden");
}

/** Closes the student verification detail modal */
function closeVerificationModal() {
  document.getElementById("sv-modal-overlay").classList.add("hidden");
}

/**
 * Updates a verification request's status, then refreshes counters and list.
 * @param {string} id
 * @param {'approved'|'rejected'} newStatus
 */
function setVerificationStatus(id, newStatus) {
  const req = VERIFICATION_REQUESTS.find((r) => r.id === id);
  if (req) {
    req.status = newStatus;
    refreshVerificationCounters();
    renderVerificationList();
    showToast(`Request for ${req.name} has been ${newStatus}.`);
  }
}

/** Recomputes and updates the four summary counter cards */
function refreshVerificationCounters() {
  const pending = VERIFICATION_REQUESTS.filter(
    (r) => r.status === "pending",
  ).length;
  const approved = VERIFICATION_REQUESTS.filter(
    (r) => r.status === "approved",
  ).length;
  const rejected = VERIFICATION_REQUESTS.filter(
    (r) => r.status === "rejected",
  ).length;
  setText("sv-total", VERIFICATION_REQUESTS.length);
  setText("sv-pending", pending);
  setText("sv-approved", approved);
  setText("sv-rejected", rejected);
}

/* ----------------------------------------------------------
   5. ORDERS TABLE
   ---------------------------------------------------------- */

/** Currently active status filter for the orders table */
let ordersFilter = "all";

/**
 * Renders the orders data table, applying the active status
 * filter and any search query from the orders-search input.
 */
function renderOrdersTable() {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;
  const query = (
    document.getElementById("orders-search")?.value || ""
  ).toLowerCase();

  const filtered = ORDERS.filter((o) => {
    const matchStatus = ordersFilter === "all" || o.status === ordersFilter;
    const matchQuery =
      !query ||
      o.id.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query) ||
      o.service.toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  tbody.innerHTML =
    filtered.length === 0
      ? `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">No orders found</td></tr>`
      : filtered
          .map(
            (o) => `
        <tr>
          <td><strong>${escHtml(o.id)}</strong></td>
          <td>${escHtml(o.email)}</td>
          <td>${escHtml(o.service)}</td>
          <td style="color:var(--clr-primary);font-weight:600">₱${o.amount.toFixed(2)}</td>
          <td>${statusBadgeHTML(o.status)}</td>
          <td>${escHtml(o.payment)}</td>
          <td>${escHtml(o.date)}</td>
          <td>
            <button class="btn--view" data-order-id="${escHtml(o.id)}" aria-label="View order ${escHtml(o.id)}">
              ${eyeIconSVG(14)} View
            </button>
          </td>
        </tr>`,
          )
          .join("");

  /* Attach View button handlers */
  tbody.querySelectorAll(".btn--view").forEach((btn) => {
    btn.addEventListener("click", () => openOrderModal(btn.dataset.orderId));
  });
}

/**
 * Opens the order detail modal for a given order ID.
 * @param {string} orderId
 */
function openOrderModal(orderId) {
  const o = ORDERS.find((o) => o.id === orderId);
  if (!o) return;

  document.getElementById("order-modal-body").innerHTML = `
    <dl>
      <div class="detail-row"><dt>Order ID</dt>      <dd><strong>${escHtml(o.id)}</strong></dd></div>
      <div class="detail-row"><dt>Student Email</dt> <dd>${escHtml(o.email)}</dd></div>
      <div class="detail-row"><dt>Service</dt>       <dd>${escHtml(o.service)}</dd></div>
      <div class="detail-row"><dt>Amount</dt>
        <dd style="color:var(--clr-primary);font-weight:700">₱${o.amount.toFixed(2)}</dd>
      </div>
      <div class="detail-row"><dt>Status</dt>        <dd>${statusBadgeHTML(o.status)}</dd></div>
      <div class="detail-row"><dt>Payment</dt>       <dd>${escHtml(o.payment)}</dd></div>
      <div class="detail-row"><dt>Date</dt>          <dd>${escHtml(o.date)}</dd></div>
    </dl>`;

  document.getElementById("order-modal-overlay").classList.remove("hidden");
}

/** Closes the order detail modal */
function closeOrderModal() {
  document.getElementById("order-modal-overlay").classList.add("hidden");
}

/* ----------------------------------------------------------
   6. ACTIVE ACCOUNTS
   ---------------------------------------------------------- */

/** Currently active filter for the accounts table */
let aaFilter = "all";

/**
 * Computes how many days until (or since) expiration for a given
 * last-COR-upload date string (YYYY-MM-DD).
 * Accounts expire 365 days after the last COR upload.
 * @param {string} lastCOR  - ISO date string e.g. '2025-06-15'
 * @returns {number} positive = days remaining, negative = days expired
 */
function daysUntilExpiry(lastCOR) {
  const expiryDate = new Date(lastCOR);
  expiryDate.setDate(expiryDate.getDate() + 365);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  return Math.round((expiryDate - today) / (1000 * 60 * 60 * 24));
}

/**
 * Returns the account status string for a given days-until-expiry value.
 * @param {number} days
 * @returns {'active'|'expiring'|'expired'}
 */
function accountStatus(days) {
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

/**
 * Builds the expiration text shown in the "Days Until Expiration" column.
 * @param {number} days
 * @returns {string} HTML string
 */
function expirationText(days) {
  if (days < 0)
    return `<span class="exp-expired">Expired ${Math.abs(days)} days ago</span>`;
  if (days <= 30) return `<span class="exp-expiring">${days} days</span>`;
  return `<span class="exp-active">${days} days</span>`;
}

/**
 * Renders the accounts table based on the active filter and search query.
 */
function renderAccountsTable() {
  const tbody = document.getElementById("aa-table-body");
  if (!tbody) return;
  const query = (
    document.getElementById("aa-search")?.value || ""
  ).toLowerCase();

  const filtered = ACCOUNTS.filter((acc) => {
    const days = daysUntilExpiry(acc.lastCOR);
    const status = accountStatus(days);
    const matchFilter = aaFilter === "all" || status === aaFilter;
    const matchQuery =
      !query ||
      acc.name.toLowerCase().includes(query) ||
      acc.email.toLowerCase().includes(query);
    return matchFilter && matchQuery;
  });

  tbody.innerHTML =
    filtered.length === 0
      ? `<tr><td colspan="6" class="text-center text-muted" style="padding:32px">No accounts found</td></tr>`
      : filtered
          .map((acc) => {
            const days = daysUntilExpiry(acc.lastCOR);
            const status = accountStatus(days);
            const regFmt = formatDate(acc.registrationDate);
            const corFmt = formatDate(acc.lastCOR);
            return `
          <tr>
            <td><strong>${escHtml(acc.name)}</strong></td>
            <td>
              <span class="email-cell">
                ${mailIconSVG()}
                ${escHtml(acc.email)}
              </span>
            </td>
            <td>
              <span class="date-cell">
                ${calIconSVG()}
                ${regFmt}
              </span>
            </td>
            <td>${corFmt}</td>
            <td>${expirationText(days)}</td>
            <td>${accountBadgeHTML(status)}</td>
          </tr>`;
          })
          .join("");

  /* Update summary counter cards */
  refreshAccountCounters();
}

/** Recomputes and updates the four account summary cards */
function refreshAccountCounters() {
  let active = 0,
    expiring = 0,
    expired = 0;
  ACCOUNTS.forEach((acc) => {
    const s = accountStatus(daysUntilExpiry(acc.lastCOR));
    if (s === "active") active++;
    if (s === "expiring") expiring++;
    if (s === "expired") expired++;
  });
  setText("aa-total", ACCOUNTS.length);
  setText("aa-active", active);
  setText("aa-expiring", expiring);
  setText("aa-expired", expired);
}

/* ----------------------------------------------------------
   7. ADD SERVICE
   ---------------------------------------------------------- */

/**
 * Adds a new option row to the Service Options container.
 * Each row has a name input, price input, and a remove button.
 */
function addServiceOption() {
  const container = document.getElementById("options-container");
  if (!container) return;

  const index = optionRowCount++;
  const row = document.createElement("div");
  row.className = "option-row";
  row.dataset.index = index;
  row.innerHTML = `
    <input type="text"   class="form-input option-name"  placeholder="Option name (e.g., Size: Small)" aria-label="Option name"/>
    <input type="number" class="form-input option-price" placeholder="Price" min="0" step="0.01" aria-label="Option price"/>
    <button type="button" class="option-remove" aria-label="Remove this option">
      <i data-lucide="x" aria-hidden="true"></i>
    </button>`;

  container.appendChild(row);

  /* Show remove button on all rows when there is more than one */
  updateOptionRemoveButtons();

  /* Re-render Lucide icons for the newly inserted row */
  if (typeof lucide !== "undefined") lucide.createIcons();

  /* Attach remove handler */
  row.querySelector(".option-remove").addEventListener("click", () => {
    row.remove();
    updateOptionRemoveButtons();
  });
}

/**
 * Shows or hides the remove button on each option row.
 * The button is hidden when there is only one row remaining.
 */
function updateOptionRemoveButtons() {
  const rows = document.querySelectorAll("#options-container .option-row");
  rows.forEach((r) => {
    const btn = r.querySelector(".option-remove");
    if (btn) btn.classList.toggle("hidden", rows.length === 1);
  });
}

/**
 * Validates and submits the Add Service form.
 * On success shows a toast and resets the form.
 */
function handleCreateService() {
  const name = document.getElementById("svc-name")?.value.trim();
  const category = document.getElementById("svc-category")?.value;
  const price = document.getElementById("svc-price")?.value;
  const desc = document.getElementById("svc-description")?.value.trim();

  /* Basic validation */
  if (!name) {
    alert("Please enter a Service Name.");
    document.getElementById("svc-name").focus();
    return;
  }
  if (!category) {
    alert("Please select a Category.");
    document.getElementById("svc-category").focus();
    return;
  }
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    alert("Please enter a valid Base Price.");
    document.getElementById("svc-price").focus();
    return;
  }

  /* Collect options */
  const options = [];
  document.querySelectorAll("#options-container .option-row").forEach((row) => {
    const oName = row.querySelector(".option-name")?.value.trim();
    const oPrice = row.querySelector(".option-price")?.value;
    if (oName) options.push({ name: oName, price: parseFloat(oPrice) || 0 });
  });

  /* Store created service */
  const service = { name, category, desc, price: parseFloat(price), options };
  CREATED_SERVICES.push(service);

  /* Reset form */
  document.getElementById("svc-name").value = "";
  document.getElementById("svc-category").value = "";
  document.getElementById("svc-description").value = "";
  document.getElementById("svc-price").value = "";

  /* Reset options to a single blank row */
  const container = document.getElementById("options-container");
  container.innerHTML = `
    <div class="option-row" data-index="0">
      <input type="text"   class="form-input option-name"  placeholder="Option name (e.g., Size: Small)" aria-label="Option name"/>
      <input type="number" class="form-input option-price" placeholder="Price" min="0" step="0.01" aria-label="Option price"/>
      <button type="button" class="option-remove hidden" aria-label="Remove option">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>`;
  optionRowCount = 1;
  if (typeof lucide !== "undefined") lucide.createIcons();

  showToast(`Service "${escHtml(name)}" created successfully!`);
}

/* ----------------------------------------------------------
   8. CHARTS (Chart.js — lazy-initialised per page visit)
   ---------------------------------------------------------- */

/** Shared Chart.js plugin defaults */
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        font: { family: "DM Sans", size: 12 },
        usePointStyle: true,
        padding: 20,
      },
    },
  },
};

/* Brand colour constants for charts */
const C_RED = "#8B0000";
const C_GREEN = "#10B981";
const C_BLUE = "#2563EB";

/**
 * Creates (or re-creates) a Chart.js chart on a given canvas.
 * Destroys any existing instance first to avoid duplicates.
 * @param {string} canvasId - ID of the <canvas> element
 * @param {object} config   - Chart.js configuration object
 * @returns {Chart|null}
 */
function makeChart(canvasId, config) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const chart = new Chart(canvas, config);
  chartInstances[canvasId] = chart;
  return chart;
}

/** Daily Analytics — last 7 days line chart */
function initDailyChart() {
  makeChart("daily-chart", {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Orders",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: C_RED,
          backgroundColor: "transparent",
          tension: 0.35,
          pointBackgroundColor: C_RED,
          pointRadius: 4,
        },
        {
          label: "Income (₱)",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: C_GREEN,
          backgroundColor: "transparent",
          tension: 0.35,
          pointBackgroundColor: C_GREEN,
          pointRadius: 4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Orders", font: { family: "DM Sans" } },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Income (₱)",
            font: { family: "DM Sans" },
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

/** Monthly Analytics — last 12 months grouped bar chart */
function initMonthlyChart() {
  makeChart("monthly-chart", {
    type: "bar",
    data: {
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
      datasets: [
        {
          label: "Orders",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 4],
          backgroundColor: C_RED,
          borderRadius: 4,
        },
        {
          label: "Income (₱)",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 750, 0, 1000],
          backgroundColor: C_GREEN,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Orders", font: { family: "DM Sans" } },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Income (₱)",
            font: { family: "DM Sans" },
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

/** Yearly Analytics — last 5 years grouped bar chart */
function initYearlyChart() {
  makeChart("yearly-chart", {
    type: "bar",
    data: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      datasets: [
        {
          label: "Orders",
          data: [0, 0, 0, 0, 9],
          backgroundColor: C_RED,
          borderRadius: 4,
        },
        {
          label: "Income (₱)",
          data: [0, 0, 0, 0, 1750],
          backgroundColor: C_GREEN,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Orders", font: { family: "DM Sans" } },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Income (₱)",
            font: { family: "DM Sans" },
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

/** Annual Statistics — three charts (line + two bar charts) */
function initAnnualCharts() {
  /* Transactions by Year — line chart */
  makeChart("annual-line-chart", {
    type: "line",
    data: {
      labels: ["2026"],
      datasets: [
        {
          label: "Transactions",
          data: [9],
          borderColor: C_RED,
          pointBackgroundColor: C_RED,
          backgroundColor: "transparent",
          pointRadius: 6,
        },
        {
          label: "Revenue (₱)",
          data: [1750],
          borderColor: C_GREEN,
          pointBackgroundColor: C_GREEN,
          backgroundColor: "transparent",
          pointRadius: 6,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Transactions",
            font: { family: "DM Sans" },
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Revenue (₱)",
            font: { family: "DM Sans" },
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });

  /* Annual Transaction Volume — single bar chart */
  makeChart("annual-volume-chart", {
    type: "bar",
    data: {
      labels: ["2026"],
      datasets: [
        {
          label: "Transactions",
          data: [9],
          backgroundColor: C_RED,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  /* User Registrations by Year — blue bar chart */
  makeChart("annual-users-chart", {
    type: "bar",
    data: {
      labels: ["2024", "2025", "2026"],
      datasets: [
        {
          label: "New Users",
          data: [15, 25, 8],
          backgroundColor: C_BLUE,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

/* ----------------------------------------------------------
   9. QR SCANNER
   ---------------------------------------------------------- */

/** Holds the active MediaStream so we can stop it later */
let cameraStream = null;

/**
 * Requests camera access and pipes the stream to the <video> element.
 * Gracefully alerts if the browser doesn't support getUserMedia.
 */
async function activateCamera() {
  const video = document.getElementById("qr-video");
  const placeholder = document.querySelector(".qr-placeholder");
  const btn = document.getElementById("activate-camera-btn");

  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Camera access is not supported in this browser.");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    video.srcObject = cameraStream;
    video.classList.remove("hidden");
    placeholder.classList.add("hidden");
    btn.textContent = "Deactivate Camera";
    btn.onclick = deactivateCamera;
  } catch (err) {
    alert(`Could not access camera: ${err.message}`);
  }
}

/** Stops the camera feed and restores the placeholder UI */
function deactivateCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  const video = document.getElementById("qr-video");
  video.srcObject = null;
  video.classList.add("hidden");
  document.querySelector(".qr-placeholder")?.classList.remove("hidden");
  const btn = document.getElementById("activate-camera-btn");
  btn.textContent = "Activate Camera";
  btn.onclick = activateCamera;
}

/**
 * Searches for an order by the ID typed in the QR manual input.
 * Renders a result card below the input field.
 */
function searchOrderById() {
  const input = document.getElementById("qr-order-input");
  const result = document.getElementById("qr-result");
  const query = input?.value.trim().toUpperCase();

  if (!query) {
    result.className = "qr-result hidden";
    return;
  }

  const order = ORDERS.find((o) => o.id.toUpperCase() === query);

  if (order) {
    result.className = "qr-result found";
    result.innerHTML = `
      <strong>✓ Order Found</strong><br>
      <strong>Order ID:</strong> ${escHtml(order.id)}<br>
      <strong>Student:</strong> ${escHtml(order.email)}<br>
      <strong>Service:</strong> ${escHtml(order.service)}<br>
      <strong>Amount:</strong> ₱${order.amount.toFixed(2)}<br>
      <strong>Status:</strong> ${statusBadgeHTML(order.status)}<br>
      <strong>Payment:</strong> ${escHtml(order.payment)}<br>
      ${
        order.status === "ready"
          ? `<button class="btn btn--success btn--sm mt-3" onclick="releaseOrder('${order.id}')">Release Order</button>`
          : ""
      }`;
  } else {
    result.className = "qr-result not-found";
    result.innerHTML = `
      <strong>✗ Order Not Found</strong><br>
      No order matching <code>${escHtml(query)}</code> was found in the system.`;
  }
}

/**
 * Marks an order as completed from the QR scanner result panel,
 * then re-renders the result so the Release button disappears.
 * @param {string} orderId
 */
function releaseOrder(orderId) {
  const order = ORDERS.find((o) => o.id === orderId);
  if (order) {
    order.status = "completed";
    searchOrderById(); /* re-render result with updated status */
    renderOrdersTable();
    showToast(`Order ${orderId} marked as completed.`);
  }
}
window.releaseOrder = releaseOrder;

/* ----------------------------------------------------------
   10. DASHBOARD HELPERS
   ---------------------------------------------------------- */

/** Sets the dashboard date subtitle to today's formatted date */
function setDashboardDate() {
  const el = document.getElementById("dash-date");
  if (!el) return;
  const now = new Date();
  el.textContent = `Today's Overview – ${now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;
}

/** Sets the daily analytics date label */
function setDailyDate() {
  const el = document.getElementById("da-date");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ----------------------------------------------------------
   11. TOAST NOTIFICATION
   ---------------------------------------------------------- */

/** Timer reference so rapid calls cancel the previous hide timeout */
let toastTimer = null;

/**
 * Displays a brief toast notification at the bottom-right of the screen.
 * @param {string} message - Plain text or simple HTML
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  const span = document.getElementById("toast-message");
  if (!toast || !span) return;

  span.textContent = message;
  toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}
window.showToast = showToast;

/* ----------------------------------------------------------
   12. UTILITY HELPERS
   ---------------------------------------------------------- */

/**
 * Sets the textContent of an element by ID.
 * @param {string} id
 * @param {string|number} val
 */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Capitalises the first letter of a string.
 * @param {string} s
 * @returns {string}
 */
function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Formats a YYYY-MM-DD string into a human-readable date.
 * @param {string} iso - e.g. '2025-06-15'
 * @returns {string}   - e.g. 'Jun 15, 2025'
 */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Returns the HTML string for a status badge.
 * @param {string} status
 * @returns {string}
 */
function statusBadgeHTML(status) {
  const label = capitalise(status.replace(/-/g, " "));
  return `<span class="status-badge status-badge--${status}">${label}</span>`;
}

/**
 * Returns the HTML string for an account status badge.
 * @param {'active'|'expiring'|'expired'} status
 * @returns {string}
 */
function accountBadgeHTML(status) {
  return `<span class="status-badge status-badge--account-${status}">${capitalise(status)}</span>`;
}

/**
 * Returns a small inline SVG representing the given request status.
 * @param {string} status
 * @returns {string}
 */
function statusIconSVG(status) {
  const icons = {
    pending: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    approved: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    rejected: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  return icons[status] || "";
}

/**
 * Returns an eye icon SVG string (used in view buttons).
 * @param {number} [size=18]
 * @returns {string}
 */
function eyeIconSVG(size = 18) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;
}

/**
 * Returns a small mail icon SVG (used in the accounts table email column).
 * @returns {string}
 */
function mailIconSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/>
  </svg>`;
}

/**
 * Returns a small calendar icon SVG (used in the accounts table date columns).
 * @returns {string}
 */
function calIconSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`;
}

/* ----------------------------------------------------------
   13. EVENT LISTENERS & INIT
   ---------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Initialise Lucide icon set ---- */
  if (typeof lucide !== "undefined") lucide.createIcons();

  /* ---- Sidebar navigation links ---- */
  document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page === "logout") {
        if (confirm("Are you sure you want to log out?")) {
          /* Clear any stored session / auth data */
          sessionStorage.clear();
          localStorage.removeItem("adminUser");
          localStorage.removeItem("adminRole");

          /* Redirect to login — path is taken directly from the
             href already set on the logout anchor in the HTML. */
          const loginHref = link.getAttribute("href");
          window.location.href = loginHref;
        }
        return;
      }
      navigateTo(page);
    });
  });

  /* ---- Mobile hamburger + overlay ---- */
  document
    .getElementById("hamburger-btn")
    ?.addEventListener("click", openSidebar);
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", closeSidebar);

  /* ---- Student Verification search ---- */
  document
    .getElementById("sv-search")
    ?.addEventListener("input", renderVerificationList);

  /* ---- Student Verification filter tabs ---- */
  document.querySelectorAll(".filter-tab[data-filter]").forEach((tab) => {
    tab.addEventListener("click", () => {
      svFilter = tab.dataset.filter;
      document.querySelectorAll(".filter-tab[data-filter]").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      renderVerificationList();
    });
  });

  /* ---- Verification modal close ---- */
  document
    .getElementById("sv-modal-close")
    ?.addEventListener("click", closeVerificationModal);
  document
    .getElementById("sv-modal-overlay")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeVerificationModal();
    });

  /* ---- Orders filter tabs ---- */
  document.querySelectorAll(".tab-btn[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ordersFilter = btn.dataset.status;
      document.querySelectorAll(".tab-btn[data-status]").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      renderOrdersTable();
    });
  });

  /* ---- Orders search ---- */
  document
    .getElementById("orders-search")
    ?.addEventListener("input", renderOrdersTable);

  /* ---- Order modal close ---- */
  document
    .getElementById("order-modal-close")
    ?.addEventListener("click", closeOrderModal);
  document
    .getElementById("order-modal-overlay")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeOrderModal();
    });

  /* ---- Active Accounts filter tabs ---- */
  document.querySelectorAll(".filter-tab[data-aa-filter]").forEach((tab) => {
    tab.addEventListener("click", () => {
      aaFilter = tab.dataset.aaFilter;
      document.querySelectorAll(".filter-tab[data-aa-filter]").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      renderAccountsTable();
    });
  });

  /* ---- Active Accounts search ---- */
  document
    .getElementById("aa-search")
    ?.addEventListener("input", renderAccountsTable);

  /* ---- Add Service: Add Option button ---- */
  document
    .getElementById("add-option-btn")
    ?.addEventListener("click", addServiceOption);

  /* ---- Add Service: remove button on the first (static) option row ---- */
  document
    .querySelector("#options-container .option-remove")
    ?.addEventListener("click", function () {
      this.closest(".option-row")?.remove();
      updateOptionRemoveButtons();
    });

  /* ---- Add Service: Create Service button ---- */
  document
    .getElementById("svc-create-btn")
    ?.addEventListener("click", handleCreateService);

  /* ---- Add Service: Cancel button ---- */
  document
    .getElementById("svc-cancel-btn")
    ?.addEventListener("click", () => navigateTo("dashboard"));

  /* ---- QR Scanner ---- */
  document
    .getElementById("activate-camera-btn")
    ?.addEventListener("click", activateCamera);
  document
    .getElementById("qr-search-btn")
    ?.addEventListener("click", searchOrderById);
  document
    .getElementById("qr-order-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchOrderById();
    });

  /* ---- Global Escape key: close any open modal or sidebar ---- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeVerificationModal();
      closeOrderModal();
      closeSidebar();
    }
  });

  /* ---- Initial renders & date labels ---- */
  setDashboardDate();
  setDailyDate();
  refreshVerificationCounters();
  renderVerificationList();
  renderOrdersTable();
  renderAccountsTable();

  /* ---- Start on the Dashboard ---- */
  navigateTo("dashboard");
});