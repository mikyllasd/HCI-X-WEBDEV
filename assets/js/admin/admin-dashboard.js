/* ==========================================================
   UPRESSease Admin Portal — admin-dashboard.js
   Sections:
   1.  Sample Data
   2.  Navigation
   3.  Sidebar Toggle (mobile)
   4.  Student Verification — render, filter, modal
   5.  Orders Table — render, filter, modal
   6.  Payment Verification — render, filter, modal
   7.  Reports — render, tab switch, chart
   8.  Active Accounts — render, filter
   9.  Add Service — dynamic options, form submit
   10. Charts (Chart.js, lazy init)
   11. QR Scanner
   12. Dashboard helpers
   13. Toast notification
   14. Utility helpers
   15. Event listeners & init
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
 * Payment submissions — derived from orders that have a payment method selected.
 * In production this would be a separate payments collection from the API.
 */
const PAYMENT_SUBMISSIONS = [
  {
    id: "PAY-2026-001",
    orderId: "ORD-2026-102",
    email: "student@wmsu.edu.ph",
    amount: 150,
    method: "Online Payment",
    reference: "GCash-78421",
    submitted: "Apr 4, 2026",
    status: "pending",
    proofUrl: null,
  },
  {
    id: "PAY-2026-002",
    orderId: "ORD-2026-104",
    email: "student@wmsu.edu.ph",
    amount: 1000,
    method: "Online Payment",
    reference: "Maya-99132",
    submitted: "Apr 1, 2026",
    status: "verified",
    proofUrl: null,
  },
  {
    id: "PAY-2026-003",
    orderId: "ORD-2026-004",
    email: "anna.lopez@wmsu.edu.ph",
    amount: 750,
    method: "Online Payment",
    reference: "GCash-55098",
    submitted: "Feb 19, 2026",
    status: "verified",
    proofUrl: null,
  },
  {
    id: "PAY-2026-004",
    orderId: "ORD-2026-001",
    email: "juan.delacruz@wmsu.edu.ph",
    amount: 150,
    method: "Online Payment",
    reference: "BDO-34412",
    submitted: "Feb 19, 2026",
    status: "pending",
    proofUrl: null,
  },
  {
    id: "PAY-2026-005",
    orderId: "ORD-2026-005",
    email: "carlo.garcia@wmsu.edu.ph",
    amount: 750,
    method: "Pay Onsite",
    reference: "Cash",
    submitted: "Feb 18, 2026",
    status: "verified",
    proofUrl: null,
  },
  {
    id: "PAY-2026-006",
    orderId: "ORD-2026-002",
    email: "maria.santos@wmsu.edu.ph",
    amount: 400,
    method: "Pay Onsite",
    reference: "Cash",
    submitted: "Feb 19, 2026",
    status: "rejected",
    proofUrl: null,
  },
];

/**
 * Student accounts with registration/COR dates.
 * expiryDays is computed relative to today (positive = still valid, negative = expired).
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
 * Maps each page key to its section element ID.
 * @type {Object.<string, {id: string}>}
 */
const PAGE_MAP = {
  dashboard:              { id: "page-dashboard" },
  "student-verification": { id: "page-student-verification" },
  orders:                 { id: "page-orders" },
  "payment-verification": { id: "page-payment-verification" },
  reports:                { id: "page-reports" },
  "qr-scanner":           { id: "page-qr-scanner" },
  "active-accounts":      { id: "page-active-accounts" },
  "add-service":          { id: "page-add-service" },
};

/** Tracks which Chart.js instances have been initialised */
const chartInstances = {};

/**
 * Navigate to a named page.
 * Hides all sections, shows the target, updates the sidebar active
 * state, then runs any page-specific init.
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

  /* Close mobile sidebar */
  closeSidebar();

  /* Page-specific lazy initialisers */
  if (pageKey === "payment-verification") renderPaymentVerificationTable();
  if (pageKey === "reports")              initReportsPage();

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
  document.getElementById("hamburger-btn").setAttribute("aria-expanded", "true");
}

/** Closes the mobile sidebar drawer */
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.add("hidden");
  document.getElementById("hamburger-btn").setAttribute("aria-expanded", "false");
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
  const query = (document.getElementById("sv-search")?.value || "").toLowerCase();
  const list  = document.getElementById("sv-list");
  if (!list) return;

  const filtered = VERIFICATION_REQUESTS.filter((req) => {
    const matchStatus = svFilter === "all" || req.status === svFilter;
    const matchQuery  =
      !query ||
      req.name.toLowerCase().includes(query)      ||
      req.studentId.toLowerCase().includes(query) ||
      req.email.toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  setText(
    "sv-count",
    `${filtered.length} request${filtered.length !== 1 ? "s" : ""} found`,
  );

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
        </li>`,
          )
          .join("");

  list.querySelectorAll(".request-item__view").forEach((btn) => {
    btn.addEventListener("click", () => openVerificationModal(btn.dataset.id));
  });
}

/**
 * Opens the student verification detail modal for a given request ID.
 * @param {string} requestId
 */
function openVerificationModal(requestId) {
  const req = VERIFICATION_REQUESTS.find((r) => r.id === requestId);
  if (!req) return;

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
  const pending  = VERIFICATION_REQUESTS.filter((r) => r.status === "pending").length;
  const approved = VERIFICATION_REQUESTS.filter((r) => r.status === "approved").length;
  const rejected = VERIFICATION_REQUESTS.filter((r) => r.status === "rejected").length;
  setText("sv-total",    VERIFICATION_REQUESTS.length);
  setText("sv-pending",  pending);
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
  const query = (document.getElementById("orders-search")?.value || "").toLowerCase();

  const filtered = ORDERS.filter((o) => {
    const matchStatus = ordersFilter === "all" || o.status === ordersFilter;
    const matchQuery  =
      !query ||
      o.id.toLowerCase().includes(query)      ||
      o.email.toLowerCase().includes(query)   ||
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
   6. PAYMENT VERIFICATION
   ---------------------------------------------------------- */

/** Currently active filter for the payment verification table */
let pvFilter = "all";

/**
 * Renders the payment submissions table, applying the active
 * status filter and any search query.
 */
function renderPaymentVerificationTable() {
  const query  = (document.getElementById("pv-search")?.value || "").toLowerCase();
  const empty  = document.getElementById("pv-empty");
  const table  = document.getElementById("pv-table");
  const tbody  = document.getElementById("pv-table-body");
  if (!tbody) return;

  const filtered = PAYMENT_SUBMISSIONS.filter((p) => {
    const matchStatus = pvFilter === "all" || p.status === pvFilter;
    const matchQuery  =
      !query ||
      p.orderId.toLowerCase().includes(query)    ||
      p.email.toLowerCase().includes(query)      ||
      p.reference.toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  /* Update count label */
  setText("pv-count", `${filtered.length} submission${filtered.length !== 1 ? "s" : ""} found`);

  if (filtered.length === 0) {
    empty?.classList.remove("hidden");
    table?.classList.add("hidden");
    refreshPaymentCounters();
    return;
  }

  empty?.classList.add("hidden");
  table?.classList.remove("hidden");

  tbody.innerHTML = filtered
    .map(
      (p) => `
      <tr>
        <td><strong>${escHtml(p.orderId)}</strong></td>
        <td>${escHtml(p.email)}</td>
        <td style="color:var(--clr-primary);font-weight:600">₱${p.amount.toFixed(2)}</td>
        <td>${escHtml(p.method)}</td>
        <td><code>${escHtml(p.reference)}</code></td>
        <td>${escHtml(p.submitted)}</td>
        <td>${paymentStatusBadgeHTML(p.status)}</td>
        <td>
          ${
            p.status === "pending"
              ? `<div class="action-btns">
                   <button class="btn btn--success btn--sm pv-verify-btn" data-id="${p.id}" aria-label="Verify payment ${p.id}">Verify</button>
                   <button class="btn btn--danger  btn--sm pv-reject-btn" data-id="${p.id}" aria-label="Reject payment ${p.id}">Reject</button>
                 </div>`
              : `<button class="btn--view pv-view-btn" data-id="${p.id}" aria-label="View payment ${p.id}">
                   ${eyeIconSVG(14)} View
                 </button>`
          }
        </td>
      </tr>`,
    )
    .join("");

  /* Attach action button handlers */
  tbody.querySelectorAll(".pv-verify-btn").forEach((btn) => {
    btn.addEventListener("click", () => setPaymentStatus(btn.dataset.id, "verified"));
  });
  tbody.querySelectorAll(".pv-reject-btn").forEach((btn) => {
    btn.addEventListener("click", () => setPaymentStatus(btn.dataset.id, "rejected"));
  });
  tbody.querySelectorAll(".pv-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => openPaymentModal(btn.dataset.id));
  });

  refreshPaymentCounters();
}

/**
 * Updates a payment submission's status, then re-renders the table.
 * @param {string} id
 * @param {'verified'|'rejected'} newStatus
 */
function setPaymentStatus(id, newStatus) {
  const payment = PAYMENT_SUBMISSIONS.find((p) => p.id === id);
  if (!payment) return;

  payment.status = newStatus;

  /* If verified, also mark the linked order as processing */
  if (newStatus === "verified") {
    const order = ORDERS.find((o) => o.id === payment.orderId);
    if (order && order.status === "pending") order.status = "processing";
  }

  renderPaymentVerificationTable();
  showToast(`Payment ${payment.id} has been ${newStatus}.`);
}

/**
 * Opens the payment detail modal.
 * @param {string} paymentId
 */
function openPaymentModal(paymentId) {
  const p = PAYMENT_SUBMISSIONS.find((p) => p.id === paymentId);
  if (!p) return;

  document.getElementById("order-modal-body").innerHTML = `
    <dl>
      <div class="detail-row"><dt>Payment ID</dt>      <dd><strong>${escHtml(p.id)}</strong></dd></div>
      <div class="detail-row"><dt>Order ID</dt>        <dd>${escHtml(p.orderId)}</dd></div>
      <div class="detail-row"><dt>Student Email</dt>   <dd>${escHtml(p.email)}</dd></div>
      <div class="detail-row"><dt>Amount</dt>
        <dd style="color:var(--clr-primary);font-weight:700">₱${p.amount.toFixed(2)}</dd>
      </div>
      <div class="detail-row"><dt>Method</dt>          <dd>${escHtml(p.method)}</dd></div>
      <div class="detail-row"><dt>Reference No.</dt>   <dd><code>${escHtml(p.reference)}</code></dd></div>
      <div class="detail-row"><dt>Submitted</dt>       <dd>${escHtml(p.submitted)}</dd></div>
      <div class="detail-row"><dt>Status</dt>          <dd>${paymentStatusBadgeHTML(p.status)}</dd></div>
    </dl>`;

  document.getElementById("order-modal-overlay").classList.remove("hidden");
}

/** Recomputes and updates the four payment summary counter cards */
function refreshPaymentCounters() {
  const total    = PAYMENT_SUBMISSIONS.length;
  const pending  = PAYMENT_SUBMISSIONS.filter((p) => p.status === "pending").length;
  const verified = PAYMENT_SUBMISSIONS.filter((p) => p.status === "verified").length;
  const rejected = PAYMENT_SUBMISSIONS.filter((p) => p.status === "rejected").length;
  setText("pv-total",    total);
  setText("pv-pending",  pending);
  setText("pv-verified", verified);
  setText("pv-rejected", rejected);
}

/**
 * Returns the HTML for a payment-specific status badge.
 * @param {string} status
 * @returns {string}
 */
function paymentStatusBadgeHTML(status) {
  const map = {
    pending:  "yellow",
    verified: "green",
    rejected: "red",
  };
  const colour = map[status] || "gray";
  return `<span class="status-badge status-badge--${colour === "red" ? "red-solid" : colour}">${capitalise(status)}</span>`;
}

/* ----------------------------------------------------------
   7. REPORTS
   ---------------------------------------------------------- */

/** Currently selected report period tab */
let reportsTab = "daily";

/**
 * Initialises the Reports page: sets up tab handlers (once),
 * then renders the current period's data and chart.
 */
function initReportsPage() {
  /* Attach tab click handlers only once */
  if (!document.getElementById("page-reports")?._tabsReady) {
    document.querySelectorAll("#page-reports .tab-btn[data-report]").forEach((btn) => {
      btn.addEventListener("click", () => {
        reportsTab = btn.dataset.report;
        document.querySelectorAll("#page-reports .tab-btn[data-report]").forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        renderReportsData();
      });
    });
    if (document.getElementById("page-reports"))
      document.getElementById("page-reports")._tabsReady = true;
  }

  renderReportsData();
}

/**
 * Renders summary stats, the chart, and the transaction table
 * for the currently selected report period.
 */
function renderReportsData() {
  const now   = new Date();
  const today = now.toDateString();

  /* Filter orders to relevant period */
  let periodOrders = [];

  if (reportsTab === "daily") {
    /* Orders placed today — use the sample data date field as a rough proxy */
    periodOrders = ORDERS.filter((o) => {
      const d = new Date(o.date);
      return d.toDateString() === today;
    });
  } else if (reportsTab === "monthly") {
    periodOrders = ORDERS.filter((o) => {
      const d = new Date(o.date);
      return (
        d.getMonth()    === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  } else {
    /* yearly */
    periodOrders = ORDERS.filter((o) => {
      const d = new Date(o.date);
      return d.getFullYear() === now.getFullYear();
    });
  }

  const completed = periodOrders.filter(
    (o) => o.status === "completed" || o.status === "ready",
  );
  const totalIncome = completed.reduce((sum, o) => sum + o.amount, 0);
  const avgValue    = completed.length ? totalIncome / completed.length : 0;

  setText("rpt-orders",    periodOrders.length);
  setText("rpt-income",   `₱${totalIncome.toFixed(2)}`);
  setText("rpt-completed", completed.length);
  setText("rpt-avg",      `₱${avgValue.toFixed(2)}`);

  /* ---- Chart ---- */
  renderReportsChart(periodOrders);

  /* ---- Transaction table ---- */
  const empty = document.getElementById("rpt-empty");
  const table = document.getElementById("rpt-table");
  const tbody = document.getElementById("rpt-table-body");

  if (!tbody) return;

  if (periodOrders.length === 0) {
    empty?.classList.remove("hidden");
    table?.classList.add("hidden");
    return;
  }

  empty?.classList.add("hidden");
  table?.classList.remove("hidden");

  tbody.innerHTML = periodOrders
    .map(
      (o) => `
      <tr>
        <td><strong>${escHtml(o.id)}</strong></td>
        <td>${escHtml(o.email)}</td>
        <td>${escHtml(o.service)}</td>
        <td style="color:var(--clr-primary);font-weight:600">₱${o.amount.toFixed(2)}</td>
        <td>${statusBadgeHTML(o.status)}</td>
        <td>${escHtml(o.date)}</td>
      </tr>`,
    )
    .join("");
}

/**
 * Renders (or re-renders) the Reports bar chart using Chart.js.
 * @param {Array} periodOrders - filtered order array for the current period
 */
function renderReportsChart(periodOrders) {
  let labels   = [];
  let orderCounts  = [];
  let incomeValues = [];

  if (reportsTab === "daily") {
    /* Group by hour (0–23) */
    const hourOrders  = new Array(24).fill(0);
    const hourIncome  = new Array(24).fill(0);
    periodOrders.forEach((o) => {
      const h = new Date(o.date).getHours();
      hourOrders[h]++;
      if (o.status === "completed" || o.status === "ready") hourIncome[h] += o.amount;
    });
    /* Show only 6-hour blocks for readability */
    labels      = ["12am–6am","6am–12pm","12pm–6pm","6pm–12am"];
    orderCounts = [
      hourOrders.slice(0, 6).reduce((a, b) => a + b, 0),
      hourOrders.slice(6, 12).reduce((a, b) => a + b, 0),
      hourOrders.slice(12, 18).reduce((a, b) => a + b, 0),
      hourOrders.slice(18, 24).reduce((a, b) => a + b, 0),
    ];
    incomeValues = [
      hourIncome.slice(0, 6).reduce((a, b) => a + b, 0),
      hourIncome.slice(6, 12).reduce((a, b) => a + b, 0),
      hourIncome.slice(12, 18).reduce((a, b) => a + b, 0),
      hourIncome.slice(18, 24).reduce((a, b) => a + b, 0),
    ];
  } else if (reportsTab === "monthly") {
    /* Group by week of month (W1–W5) */
    const weeks = 5;
    const wOrders = new Array(weeks).fill(0);
    const wIncome = new Array(weeks).fill(0);
    periodOrders.forEach((o) => {
      const day = new Date(o.date).getDate();
      const w   = Math.min(Math.floor((day - 1) / 7), weeks - 1);
      wOrders[w]++;
      if (o.status === "completed" || o.status === "ready") wIncome[w] += o.amount;
    });
    labels      = ["Week 1","Week 2","Week 3","Week 4","Week 5"];
    orderCounts = wOrders;
    incomeValues = wIncome;
  } else {
    /* Group by month (Jan–Dec) */
    const mOrders = new Array(12).fill(0);
    const mIncome = new Array(12).fill(0);
    periodOrders.forEach((o) => {
      const m = new Date(o.date).getMonth();
      mOrders[m]++;
      if (o.status === "completed" || o.status === "ready") mIncome[m] += o.amount;
    });
    labels      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    orderCounts = mOrders;
    incomeValues = mIncome;
  }

  makeChart("reports-chart", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Orders",
          data: orderCounts,
          backgroundColor: C_RED,
          borderRadius: 4,
          yAxisID: "y",
        },
        {
          label: "Income (₱)",
          data: incomeValues,
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
          title: { display: true, text: "Orders", font: { family: "Inter" } },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: { display: true, text: "Income (₱)", font: { family: "Inter" } },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

/* ----------------------------------------------------------
   8. ACTIVE ACCOUNTS
   ---------------------------------------------------------- */

/** Currently active filter for the accounts table */
let aaFilter = "all";

/**
 * Computes how many days until (or since) expiration for a given
 * last-COR-upload date string (YYYY-MM-DD).
 * Accounts expire 365 days after the last COR upload.
 * @param {string} lastCOR
 * @returns {number}
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
  if (days < 0)   return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

/**
 * Builds the expiration text shown in the "Days Until Expiration" column.
 * @param {number} days
 * @returns {string}
 */
function expirationText(days) {
  if (days < 0)
    return `<span class="exp-expired">Expired ${Math.abs(days)} days ago</span>`;
  if (days <= 30)
    return `<span class="exp-expiring">${days} days</span>`;
  return `<span class="exp-active">${days} days</span>`;
}

/** Renders the accounts table based on the active filter and search query */
function renderAccountsTable() {
  const tbody = document.getElementById("aa-table-body");
  if (!tbody) return;
  const query = (document.getElementById("aa-search")?.value || "").toLowerCase();

  const filtered = ACCOUNTS.filter((acc) => {
    const days   = daysUntilExpiry(acc.lastCOR);
    const status = accountStatus(days);
    const matchFilter = aaFilter === "all" || status === aaFilter;
    const matchQuery  =
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
            const days   = daysUntilExpiry(acc.lastCOR);
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

  refreshAccountCounters();
}

/** Recomputes and updates the four account summary cards */
function refreshAccountCounters() {
  let active = 0, expiring = 0, expired = 0;
  ACCOUNTS.forEach((acc) => {
    const s = accountStatus(daysUntilExpiry(acc.lastCOR));
    if (s === "active")   active++;
    if (s === "expiring") expiring++;
    if (s === "expired")  expired++;
  });
  setText("aa-total",    ACCOUNTS.length);
  setText("aa-active",   active);
  setText("aa-expiring", expiring);
  setText("aa-expired",  expired);
}

/* ----------------------------------------------------------
   9. ADD SERVICE
   ---------------------------------------------------------- */

/** Adds a new option row to the Service Options container */
function addServiceOption() {
  const container = document.getElementById("options-container");
  if (!container) return;

  const index = optionRowCount++;
  const row   = document.createElement("div");
  row.className    = "option-row";
  row.dataset.index = index;
  row.innerHTML = `
    <input type="text"   class="form-input option-name"  placeholder="Option name (e.g., Size: Small)" aria-label="Option name"/>
    <input type="number" class="form-input option-price" placeholder="Price" min="0" step="0.01" aria-label="Option price"/>
    <button type="button" class="option-remove" aria-label="Remove this option">
      <i data-lucide="x" aria-hidden="true"></i>
    </button>`;

  container.appendChild(row);
  updateOptionRemoveButtons();
  if (typeof lucide !== "undefined") lucide.createIcons();

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

/** Validates and submits the Add Service form */
function handleCreateService() {
  const name     = document.getElementById("svc-name")?.value.trim();
  const category = document.getElementById("svc-category")?.value;
  const price    = document.getElementById("svc-price")?.value;

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

  const options = [];
  document.querySelectorAll("#options-container .option-row").forEach((row) => {
    const oName  = row.querySelector(".option-name")?.value.trim();
    const oPrice = row.querySelector(".option-price")?.value;
    if (oName) options.push({ name: oName, price: parseFloat(oPrice) || 0 });
  });

  CREATED_SERVICES.push({
    name,
    category,
    desc:  document.getElementById("svc-description")?.value.trim(),
    price: parseFloat(price),
    options,
  });

  /* Reset form */
  document.getElementById("svc-name").value        = "";
  document.getElementById("svc-category").value    = "";
  document.getElementById("svc-description").value = "";
  document.getElementById("svc-price").value        = "";

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
   10. CHARTS (Chart.js — lazy-initialised per page visit)
   ---------------------------------------------------------- */

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        font: { family: "Inter", size: 12 },
        usePointStyle: true,
        padding: 20,
      },
    },
  },
};

const C_RED   = "#8B0000";
const C_GREEN = "#10B981";
const C_BLUE  = "#2563EB";

/**
 * Creates (or re-creates) a Chart.js chart on a given canvas.
 * @param {string} canvasId
 * @param {object} config
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
        y:  { beginAtZero: true, title: { display: true, text: "Orders",     font: { family: "Inter" } } },
        y1: { beginAtZero: true, position: "right", title: { display: true, text: "Income (₱)", font: { family: "Inter" } }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

/** Monthly Analytics — last 12 months grouped bar chart */
function initMonthlyChart() {
  makeChart("monthly-chart", {
    type: "bar",
    data: {
      labels: ["May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr"],
      datasets: [
        { label: "Orders",      data: [0,0,0,0,0,0,0,0,0,5,0,4],       backgroundColor: C_RED,   borderRadius: 4 },
        { label: "Income (₱)", data: [0,0,0,0,0,0,0,0,0,750,0,1000], backgroundColor: C_GREEN, borderRadius: 4, yAxisID: "y1" },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y:  { beginAtZero: true, title: { display: true, text: "Orders",     font: { family: "Inter" } } },
        y1: { beginAtZero: true, position: "right", title: { display: true, text: "Income (₱)", font: { family: "Inter" } }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

/** Yearly Analytics — last 5 years grouped bar chart */
function initYearlyChart() {
  makeChart("yearly-chart", {
    type: "bar",
    data: {
      labels: ["2022","2023","2024","2025","2026"],
      datasets: [
        { label: "Orders",      data: [0,0,0,0,9],    backgroundColor: C_RED,   borderRadius: 4 },
        { label: "Income (₱)", data: [0,0,0,0,1750], backgroundColor: C_GREEN, borderRadius: 4, yAxisID: "y1" },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y:  { beginAtZero: true, title: { display: true, text: "Orders",     font: { family: "Inter" } } },
        y1: { beginAtZero: true, position: "right", title: { display: true, text: "Income (₱)", font: { family: "Inter" } }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

/** Annual Statistics — three charts */
function initAnnualCharts() {
  makeChart("annual-line-chart", {
    type: "line",
    data: {
      labels: ["2026"],
      datasets: [
        { label: "Transactions", data: [9],    borderColor: C_RED,   pointBackgroundColor: C_RED,   backgroundColor: "transparent", pointRadius: 6 },
        { label: "Revenue (₱)", data: [1750], borderColor: C_GREEN, pointBackgroundColor: C_GREEN, backgroundColor: "transparent", pointRadius: 6, yAxisID: "y1" },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y:  { beginAtZero: true, title: { display: true, text: "Transactions", font: { family: "Inter" } } },
        y1: { beginAtZero: true, position: "right", title: { display: true, text: "Revenue (₱)", font: { family: "Inter" } }, grid: { drawOnChartArea: false } },
      },
    },
  });

  makeChart("annual-volume-chart", {
    type: "bar",
    data: {
      labels: ["2026"],
      datasets: [{ label: "Transactions", data: [9], backgroundColor: C_RED, borderRadius: 4 }],
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });

  makeChart("annual-users-chart", {
    type: "bar",
    data: {
      labels: ["2024","2025","2026"],
      datasets: [{ label: "New Users", data: [15, 25, 8], backgroundColor: C_BLUE, borderRadius: 4 }],
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

/* ----------------------------------------------------------
   11. QR SCANNER
   ---------------------------------------------------------- */

let cameraStream = null;

/** Requests camera access and pipes the stream to the <video> element */
async function activateCamera() {
  const video       = document.getElementById("qr-video");
  const placeholder = document.querySelector(".qr-placeholder");
  const btn         = document.getElementById("activate-camera-btn");

  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Camera access is not supported in this browser.");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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

/** Searches for an order by the ID typed in the QR manual input */
function searchOrderById() {
  const input  = document.getElementById("qr-order-input");
  const result = document.getElementById("qr-result");
  const query  = input?.value.trim().toUpperCase();

  if (!query) {
    result.className = "qr-result hidden";
    return;
  }

  const order = ORDERS.find((o) => o.id.toUpperCase() === query);

  if (order) {
    result.className = "qr-result found";
    result.innerHTML = `
      <strong>Order found</strong><br>
      <strong>Order ID:</strong> ${escHtml(order.id)}<br>
      <strong>Student:</strong> ${escHtml(order.email)}<br>
      <strong>Service:</strong> ${escHtml(order.service)}<br>
      <strong>Amount:</strong> ₱${order.amount.toFixed(2)}<br>
      <strong>Status:</strong> ${statusBadgeHTML(order.status)}<br>
      <strong>Payment:</strong> ${escHtml(order.payment)}<br>
      ${order.status === "ready"
        ? `<button class="btn btn--success btn--sm mt-3" onclick="releaseOrder('${order.id}')">Release Order</button>`
        : ""}`;
  } else {
    result.className = "qr-result not-found";
    result.innerHTML = `
      <strong>Order not found</strong><br>
      No order matching <code>${escHtml(query)}</code> was found in the system.`;
  }
}

/**
 * Marks an order as completed from the QR scanner result panel.
 * @param {string} orderId
 */
function releaseOrder(orderId) {
  const order = ORDERS.find((o) => o.id === orderId);
  if (order) {
    order.status = "completed";
    searchOrderById();
    renderOrdersTable();
    showToast(`Order ${orderId} marked as completed.`);
  }
}
window.releaseOrder = releaseOrder;

/* ----------------------------------------------------------
   12. DASHBOARD HELPERS
   ---------------------------------------------------------- */

/** Sets the dashboard date subtitle to today's formatted date */
function setDashboardDate() {
  const el = document.getElementById("dash-date");
  if (!el) return;
  const now = new Date();
  el.textContent = `Today's Overview – ${now.toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  })}`;
}

/** Sets the daily analytics date label */
function setDailyDate() {
  const el = document.getElementById("da-date");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });
}

/* ----------------------------------------------------------
   13. TOAST NOTIFICATION
   ---------------------------------------------------------- */

let toastTimer = null;

/**
 * Displays a brief toast notification.
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  const span  = document.getElementById("toast-message");
  if (!toast || !span) return;

  span.textContent = message;
  toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}
window.showToast = showToast;

/* ----------------------------------------------------------
   14. UTILITY HELPERS
   ---------------------------------------------------------- */

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
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
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
    pending:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    approved: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    rejected: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  return icons[status] || "";
}

function eyeIconSVG(size = 18) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;
}

function mailIconSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/>
  </svg>`;
}

function calIconSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`;
}

/* ----------------------------------------------------------
   15. EVENT LISTENERS & INIT
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
          sessionStorage.clear();
          localStorage.removeItem("adminUser");
          localStorage.removeItem("adminRole");
          window.location.href = link.getAttribute("href");
        }
        return;
      }
      navigateTo(page);
    });
  });

  /* ---- Mobile hamburger + overlay ---- */
  document.getElementById("hamburger-btn")?.addEventListener("click", openSidebar);
  document.getElementById("sidebar-overlay")?.addEventListener("click", closeSidebar);

  /* ---- Student Verification search ---- */
  document.getElementById("sv-search")?.addEventListener("input", renderVerificationList);

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
  document.getElementById("sv-modal-close")?.addEventListener("click", closeVerificationModal);
  document.getElementById("sv-modal-overlay")?.addEventListener("click", (e) => {
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
  document.getElementById("orders-search")?.addEventListener("input", renderOrdersTable);

  /* ---- Order modal close (shared with payment detail modal) ---- */
  document.getElementById("order-modal-close")?.addEventListener("click", closeOrderModal);
  document.getElementById("order-modal-overlay")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeOrderModal();
  });

  /* ---- Payment Verification search ---- */
  document.getElementById("pv-search")?.addEventListener("input", renderPaymentVerificationTable);

  /* ---- Payment Verification filter tabs ---- */
  document.querySelectorAll("#page-payment-verification .filter-tab[data-filter]").forEach((tab) => {
    tab.addEventListener("click", () => {
      pvFilter = tab.dataset.filter;
      document.querySelectorAll("#page-payment-verification .filter-tab[data-filter]").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      renderPaymentVerificationTable();
    });
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
  document.getElementById("aa-search")?.addEventListener("input", renderAccountsTable);

  /* ---- Add Service: Add Option button ---- */
  document.getElementById("add-option-btn")?.addEventListener("click", addServiceOption);

  /* ---- Add Service: remove button on the first (static) option row ---- */
  document.querySelector("#options-container .option-remove")?.addEventListener("click", function () {
    this.closest(".option-row")?.remove();
    updateOptionRemoveButtons();
  });

  /* ---- Add Service: Create Service button ---- */
  document.getElementById("svc-create-btn")?.addEventListener("click", handleCreateService);

  /* ---- Add Service: Cancel button ---- */
  document.getElementById("svc-cancel-btn")?.addEventListener("click", () => navigateTo("dashboard"));

  /* ---- QR Scanner ---- */
  document.getElementById("activate-camera-btn")?.addEventListener("click", activateCamera);
  document.getElementById("qr-search-btn")?.addEventListener("click", searchOrderById);
  document.getElementById("qr-order-input")?.addEventListener("keydown", (e) => {
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
  refreshPaymentCounters();
  renderVerificationList();
  renderOrdersTable();
  renderAccountsTable();

  /* ---- Start on the Dashboard ---- */
  navigateTo("dashboard");
});
      // Wire up the Report Type select to update the chart label and
      // trigger whatever the external JS expects from tab-btn clicks.
      (function () {
        const select = document.getElementById('rpt-type-select');
        if (!select) return;

        const labelMap = {
          daily: 'Daily Report',
          monthly: 'Monthly Report',
          yearly: 'Yearly Report'
        };

        select.addEventListener('change', function () {
          const val = this.value;
          // Update chart sub-label
          const lbl = document.getElementById('rpt-chart-label');
          if (lbl) lbl.textContent = labelMap[val] || '';

          // If external JS exposes a function to reload the report section, call it
          if (typeof window.loadReportData === 'function') {
            window.loadReportData(val);
          }
          // Fallback: simulate a click on any hidden tab-btn the external JS may still listen to
          const fakeTab = document.querySelector(`.tab-btn[data-report="${val}"]`);
          if (fakeTab) fakeTab.click();
        });
      })();

      // ── Reports Performance Chart (Figma-matching style) ──────────────
      (function () {
        // Wait for the external JS to finish (it may init its own charts first),
        // then build / rebuild the reports chart with the correct Figma styling.
        function buildReportsChart(type) {
          const canvas = document.getElementById('reports-chart');
          if (!canvas) return;

          // Destroy any existing Chart.js instance on this canvas
          const existing = Chart.getChart(canvas);
          if (existing) existing.destroy();

          // ── Data sets per report type ───────────────────────────────────
          const configs = {
            daily: {
              labels: ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
              orders:  [0, 0, 0, 0, 0, 0, 0],
              income:  [0, 0, 0, 0, 0, 0, 0],
              yLabel: 'Orders',
              y2Label: 'Income (₱)',
            },
            monthly: {
              labels: ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
              orders:  [0,0,0,0,0,0,0,0,0,0,0,4],
              income:  [0,0,0,0,0,0,0,0,0,0,0,1000],
              yLabel: 'Orders',
              y2Label: 'Income (₱)',
            },
            yearly: {
              labels: ['2022','2023','2024','2025','2026'],
              orders:  [0, 0, 0, 0, 9],
              income:  [0, 0, 0, 0, 1750],
              yLabel: 'Orders',
              y2Label: 'Income (₱)',
            }
          };

          const cfg = configs[type] || configs.daily;

          // ── Chart.js config matching Figma ──────────────────────────────
          new Chart(canvas, {
            type: 'line',
            data: {
              labels: cfg.labels,
              datasets: [
                {
                  label: 'Orders',
                  data: cfg.orders,
                  borderColor: '#1a1a1a',
                  backgroundColor: 'transparent',
                  pointBackgroundColor: '#ffffff',
                  pointBorderColor: '#1a1a1a',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  borderWidth: 2,
                  tension: 0,
                  yAxisID: 'yLeft',
                },
                {
                  label: 'Income (₱)',
                  data: cfg.income,
                  borderColor: '#10B981',
                  backgroundColor: 'transparent',
                  pointBackgroundColor: '#ffffff',
                  pointBorderColor: '#10B981',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  borderWidth: 2,
                  tension: 0,
                  yAxisID: 'yRight',
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  align: 'center',
                  labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { family: "'Inter', sans-serif", size: 13 },
                    color: '#374151',
                  }
                },
                tooltip: {
                  backgroundColor: '#fff',
                  borderColor: '#e5e7eb',
                  borderWidth: 1,
                  titleColor: '#111827',
                  bodyColor: '#6B7280',
                  padding: 10,
                  callbacks: {
                    label: function(ctx) {
                      if (ctx.dataset.label === 'Income (₱)') {
                        return ' Income: ₱' + ctx.parsed.y.toFixed(2);
                      }
                      return ' Orders: ' + ctx.parsed.y;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: {
                    color: '#e5e7eb',
                    lineWidth: 1,
                    drawTicks: false,
                  },
                  border: { dash: [4, 4] },
                  ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#6B7280',
                    padding: 8,
                  }
                },
                yLeft: {
                  type: 'linear',
                  position: 'left',
                  beginAtZero: true,
                  grid: {
                    color: '#e5e7eb',
                    lineWidth: 1,
                    drawTicks: false,
                  },
                  border: { dash: [4, 4] },
                  ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#6B7280',
                    padding: 8,
                    stepSize: 1,
                    precision: 0,
                  },
                  title: { display: false }
                },
                yRight: {
                  type: 'linear',
                  position: 'right',
                  beginAtZero: true,
                  grid: { drawOnChartArea: false },
                  ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#10B981',
                    padding: 8,
                    callback: function(val) {
                      // Show as plain number (matching Figma right axis 0–4 scale)
                      return val;
                    }
                  },
                  title: { display: false }
                }
              }
            }
          });
        }

        // Build with default "daily" on load (after external JS runs)
        window.addEventListener('load', function () {
          buildReportsChart('daily');
        });

        // Rebuild when the report type select changes
        const select = document.getElementById('rpt-type-select');
        if (select) {
          select.addEventListener('change', function () {
            buildReportsChart(this.value);
            const labelMap = { daily: 'Daily Report', monthly: 'Monthly Report', yearly: 'Yearly Report' };
            const lbl = document.getElementById('rpt-chart-label');
            if (lbl) lbl.textContent = labelMap[this.value] || '';
          });
        }

        // Also expose so external JS can call it
        window.buildReportsChart = buildReportsChart;
      })();
      /* =============================================================
   PAYMENT VERIFICATION MODAL — pv-modal.js
   openPvModal / closePvModal / handlePvVerify / handlePvInvalid
   Reads data-pv-* attributes from the clicked .pv-card element.
============================================================= */

"use strict";

/** Holds reference to the card currently being reviewed */
let _pvCurrentCard = null;

/**
 * Opens the Payment Verification modal and populates it
 * with data from the given .pv-card element's data attributes.
 * @param {HTMLElement} card - the .pv-card element
 */
function openPvModal(card) {
  if (!card) return;
  _pvCurrentCard = card;

  /* Populate fields */
  document.getElementById('pv-m-id').textContent     = card.dataset.pvId     || '—';
  document.getElementById('pv-m-name').textContent   = card.dataset.pvName   || '—';
  document.getElementById('pv-m-amount').textContent = card.dataset.pvAmount || '—';
  document.getElementById('pv-m-method').textContent = card.dataset.pvMethod || '—';
  document.getElementById('pv-m-ref').textContent    = card.dataset.pvRef    || '—';

  /* Payment proof image (if a URL was attached via data-pv-proof) */
  const proofUrl    = card.dataset.pvProof || '';
  const img         = document.getElementById('pv-proof-img');
  const placeholder = document.getElementById('pv-proof-placeholder');
  if (proofUrl) {
    img.src = proofUrl;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    img.src = '';
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }

  /* Show / hide action buttons based on current card status */
  const status     = card.dataset.pvStatus || 'pending';
  const verifyBtn  = document.getElementById('pv-verify-btn');
  const invalidBtn = document.getElementById('pv-invalid-btn');
  const footer     = document.querySelector('.pv-modal-footer');
  if (status === 'pending') {
    verifyBtn.classList.remove('hidden');
    invalidBtn.classList.remove('hidden');
    if (footer) footer.classList.remove('hidden');
  } else {
    verifyBtn.classList.add('hidden');
    invalidBtn.classList.add('hidden');
  }

  /* Open overlay */
  document.getElementById('pv-modal-overlay').classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Closes the Payment Verification modal */
function closePvModal() {
  document.getElementById('pv-modal-overlay').classList.add('hidden');
  _pvCurrentCard = null;
}

/**
 * Marks the current payment as Verified, moves the card to
 * the Verified section, and updates the counters.
 */
function handlePvVerify() {
  if (!_pvCurrentCard) return;
  _pvCurrentCard.dataset.pvStatus = 'verified';
  _movePvCard(_pvCurrentCard, 'verified');
  _updatePvCounters();
  closePvModal();
  if (typeof showToast === 'function')
    showToast('Payment verified successfully.');
}

/**
 * Marks the current payment as Invalid, moves the card to
 * the Invalid section, and updates the counters.
 */
function handlePvInvalid() {
  if (!_pvCurrentCard) return;
  _pvCurrentCard.dataset.pvStatus = 'invalid';
  _movePvCard(_pvCurrentCard, 'invalid');
  _updatePvCounters();
  closePvModal();
  if (typeof showToast === 'function')
    showToast('Payment marked as invalid.');
}

/**
 * Moves a .pv-card DOM element to the Verified or Invalid grid,
 * swaps its badge, and removes the Review button.
 * @param {HTMLElement} card
 * @param {'verified'|'invalid'} dest
 */
function _movePvCard(card, dest) {
  /* Update badge */
  const badge = card.querySelector('.pv-badge');
  if (badge) {
    badge.className   = `pv-badge pv-badge--${dest}`;
    badge.textContent = dest === 'verified' ? 'Verified' : 'Invalid';
  }

  /* Remove the Review button */
  card.querySelector('.pv-review-btn')?.remove();

  /* Move card to destination grid and reveal its section */
  const destGrid    = document.getElementById(`pv-${dest}-grid`);
  const destSection = document.getElementById(`pv-${dest}-section`);
  if (destGrid) {
    destGrid.appendChild(card);
    destSection?.classList.remove('hidden');
  }

  /* If pending grid is now empty, show a placeholder message */
  const pendingGrid = document.getElementById('pv-pending-grid');
  if (pendingGrid && pendingGrid.children.length === 0) {
    const h2 = pendingGrid.closest('.sp')?.querySelector('h2');
    if (h2 && !h2.nextElementSibling?.classList.contains('pv-empty-msg')) {
      h2.insertAdjacentHTML(
        'afterend',
        '<p class="pv-empty-msg text-muted" style="margin-top:.5rem;">No pending submissions.</p>'
      );
    }
  }
}

/** Recomputes and updates the Pending / Verified / Invalid counter cards */
function _updatePvCounters() {
  const pending  = document.querySelectorAll('#pv-pending-grid .pv-card').length;
  const verified = document.querySelectorAll('#pv-verified-grid .pv-card').length;
  const invalid  = document.querySelectorAll('#pv-invalid-grid .pv-card').length;

  const elPending  = document.getElementById('pv-pending');
  const elVerified = document.getElementById('pv-verified');
  const elInvalid  = document.getElementById('pv-invalid');
  if (elPending)  elPending.textContent  = pending;
  if (elVerified) elVerified.textContent = verified;
  if (elInvalid)  elInvalid.textContent  = invalid;
}

/* Close modal when clicking the backdrop */
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('pv-modal-overlay')
    ?.addEventListener('click', function (e) {
      if (e.target === this) closePvModal();
    });
});
      