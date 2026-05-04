// Payment Verification JavaScript - Standalone Version

document.addEventListener("DOMContentLoaded", function () {
  initializePaymentVerification();
});

// Global variables
let currentPage = 1;
let paymentsPerPage = 10;
let allPayments = [];
let filteredPayments = [];
let selectedPayments = new Set();
let paymentRules = null; // Payment rules instance

// Initialize the payment verification section
function initializePaymentVerification() {
  // Initialize payment rules
  if (typeof PaymentRules !== "undefined") {
    paymentRules = new PaymentRules();
  } else {
    console.warn(
      "PaymentRules module not loaded. Downpayment validation will be disabled.",
    );
  }

  setupEventListeners();
  loadPayments();
  updateStats();
  initializeSampleData();
}

// Setup event listeners
function setupEventListeners() {
  // Sidebar toggle
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  hamburger?.addEventListener("click", () => {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("open");
  });

  sidebarClose?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("open");
  });

  sidebarOverlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("open");
  });

  // Navigation
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href") !== "#") {
        // External navigation
        return;
      }
      e.preventDefault();
      const page = this.getAttribute("data-page");

      if (page === "logout") {
        handleLogout();
        return;
      }

      // For demo purposes, just show a message
      showToast(`Navigate to ${page} section`);
    });
  });

  // Search and filter
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");

  searchInput.addEventListener("input", handleSearch);
  statusFilter.addEventListener("change", handleFilter);
}

// Load payments from localStorage
function loadPayments() {
  allPayments = getFromStorage("paymentVerifications") || [];
  filteredPayments = [...allPayments];
  applyFilters();
  displayPayments();
  updatePagination();
  updateSelectionInfo();
}

// Apply search and status filters
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;

  filteredPayments = allPayments.filter((payment) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      payment.customerName.toLowerCase().includes(searchTerm) ||
      payment.referenceNumber.toLowerCase().includes(searchTerm) ||
      payment.paymentMethod.toLowerCase().includes(searchTerm) ||
      payment.id.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

// Handle search input
function handleSearch() {
  currentPage = 1;
  applyFilters();
  displayPayments();
  updatePagination();
  updateSelectionInfo();
}

// Handle status filter change
function handleFilter() {
  currentPage = 1;
  selectedPayments.clear();
  applyFilters();
  displayPayments();
  updatePagination();
  updateSelectionInfo();
}

// Display payments in table
function displayPayments() {
  const tbody = document.getElementById("paymentsBody");
  const startIndex = (currentPage - 1) * paymentsPerPage;
  const endIndex = startIndex + paymentsPerPage;
  const paymentsToShow = filteredPayments.slice(startIndex, endIndex);

  if (paymentsToShow.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="credit-card"></i>
          </div>
          <h3>No payment verifications found</h3>
          <p>Payment verifications will appear here after submission</p>
        </td>
      </tr>
    `;
    return;
  }

  const html = paymentsToShow
    .map(
      (payment) => `
    <tr>
      <td>
        <input type="checkbox" class="checkbox-input" value="${payment.id}"
               onchange="togglePaymentSelection('${payment.id}')"
               ${selectedPayments.has(payment.id) ? "checked" : ""}>
      </td>
      <td>
        <span class="reference-number">${payment.referenceNumber}</span>
      </td>
      <td>
        <div class="customer-name">${payment.customerName}</div>
      </td>
      <td>
        <span class="amount">₱${formatCurrency(payment.amount)}</span>
      </td>
      <td>
        <span class="payment-method ${payment.paymentMethod}">${getPaymentIcon(payment.paymentMethod)} ${payment.paymentMethod}</span>
      </td>
      <td>
        <span class="proof-status ${payment.proofStatus}">${getProofIcon(payment.proofStatus)} ${payment.proofStatus}</span>
        ${payment.proofImage ? `<br><a href="#" class="proof-link" onclick="previewProof('${payment.id}')">View Proof</a>` : ""}
      </td>
      <td>
        <span class="status-badge ${payment.status}">${getStatusIcon(payment.status)} ${getStatusLabel(payment.status)}</span>
      </td>
      <td>
        <div class="submitted-date">${formatDateTime(payment.submittedAt)}</div>
      </td>
      <td>
        <div class="actions">
          ${getActionButtons(payment)}
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  tbody.innerHTML = html;

  // Re-initialize Lucide icons for new content
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Get action buttons based on payment status
function getActionButtons(payment) {
  switch (payment.status) {
    case "pending":
      return `
        <button class="btn-action verify" onclick="verifyPayment('${payment.id}')" title="Verify Payment">
          <i data-lucide="search"></i>
        </button>
        <button class="btn-action approve" onclick="quickApprove('${payment.id}')" title="Quick Approve">
          <i data-lucide="check-circle"></i>
        </button>
        <button class="btn-action reject" onclick="quickReject('${payment.id}')" title="Quick Reject">
          <i data-lucide="x-circle"></i>
        </button>
      `;
    case "processing":
      return `
        <button class="btn-action approve" onclick="approvePayment('${payment.id}')" title="Approve">
          <i data-lucide="check-circle"></i>
        </button>
        <button class="btn-action reject" onclick="rejectPayment('${payment.id}')" title="Reject">
          <i data-lucide="x-circle"></i>
        </button>
      `;
    case "approved":
    case "rejected":
      return `
        <button class="btn-action view" onclick="viewPayment('${payment.id}')" title="View Details">
          <i data-lucide="eye"></i>
        </button>
      `;
    default:
      return "";
  }
}

// Toggle payment selection
function togglePaymentSelection(paymentId) {
  if (selectedPayments.has(paymentId)) {
    selectedPayments.delete(paymentId);
  } else {
    selectedPayments.add(paymentId);
  }
  updateSelectionInfo();
}

// Toggle select all
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById("selectAll");
  const checkboxes = document.querySelectorAll(".checkbox-input");

  if (selectAllCheckbox.checked) {
    selectedPayments.clear();
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      selectedPayments.add(checkbox.value);
    });
  } else {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    selectedPayments.clear();
  }

  updateSelectionInfo();
}

// Update selection info
function updateSelectionInfo() {
  const selectedCount = document.getElementById("selectedCount");
  const totalCount = document.getElementById("totalCount");

  selectedCount.textContent = selectedPayments.size;
  totalCount.textContent = filteredPayments.length;
}

// Verify payment (detailed verification)
function verifyPayment(paymentId) {
  const payment = allPayments.find((p) => p.id === paymentId);
  if (!payment) return;

  const modal = document.getElementById("verificationModal");
  const content = document.getElementById("verificationContent");
  const actions = document.getElementById("verificationActions");

  // Check downpayment requirements
  let downpaymentInfo = "";
  let canApprove = true;

  if (paymentRules) {
    const downpaymentStatus = paymentRules.getDownpaymentStatus(
      payment.amount,
      payment.downpaymentAmount || 0,
    );

    if (downpaymentStatus.required) {
      downpaymentInfo = `
        <div class="verification-detail-row">
          <span class="detail-label">Downpayment Required:</span>
          <span class="detail-value">₱${formatCurrency(downpaymentStatus.requiredAmount)}</span>
        </div>
        <div class="verification-detail-row">
          <span class="detail-label">Downpayment Paid:</span>
          <span class="detail-value ${downpaymentStatus.status === "completed" ? "status approved" : downpaymentStatus.status === "partial" ? "status processing" : "status rejected"}">
            ₱${formatCurrency(downpaymentStatus.paidAmount || 0)}
          </span>
        </div>
        <div class="verification-detail-row">
          <span class="detail-label">Downpayment Status:</span>
          <span class="detail-value">${downpaymentStatus.message}</span>
        </div>
      `;

      if (!downpaymentStatus.status === "completed") {
        canApprove = false;
      }
    } else {
      downpaymentInfo = `
        <div class="verification-detail-row">
          <span class="detail-label">Downpayment:</span>
          <span class="detail-value">Not required for this amount</span>
        </div>
      `;
    }
  }

  content.innerHTML = `
    <div class="verification-detail-row">
      <span class="detail-label">Payment ID:</span>
      <span class="detail-value">${payment.id}</span>
    </div>
    <div class="verification-detail-row">
      <span class="detail-label">Reference Number:</span>
      <span class="detail-value">${payment.referenceNumber}</span>
    </div>
    <div class="verification-detail-row">
      <span class="detail-label">Customer:</span>
      <span class="detail-value">${payment.customerName}</span>
    </div>
    <div class="verification-detail-row">
      <span class="detail-label">Amount:</span>
      <span class="detail-value large">₱${formatCurrency(payment.amount)}</span>
    </div>
    <div class="verification-detail-row">
      <span class="detail-label">Payment Method:</span>
      <span class="detail-value">${payment.paymentMethod}</span>
    </div>
    ${downpaymentInfo}
    <div class="verification-detail-row">
      <span class="detail-label">Status:</span>
      <span class="detail-value status ${payment.status}">${getStatusLabel(payment.status)}</span>
    </div>
    <div class="verification-detail-row">
      <span class="detail-label">Submitted:</span>
      <span class="detail-value">${formatDateTime(payment.submittedAt)}</span>
    </div>
    ${
      payment.notes
        ? `
    <div class="verification-detail-row">
      <span class="detail-label">Notes:</span>
      <span class="detail-value">${payment.notes}</span>
    </div>
    `
        : ""
    }
    <div class="reference-validation ${validateReferenceNumber(payment.referenceNumber)}">
      <strong>Reference Validation:</strong> ${getValidationMessage(payment.referenceNumber)}
    </div>
    ${
      payment.proofImage
        ? `
    <div class="proof-preview">
      <p><strong>Payment Proof:</strong></p>
      <img src="${payment.proofImage}" alt="Payment Proof" class="proof-image" onclick="previewProof('${payment.id}')">
    </div>
    `
        : "<p><strong>No proof uploaded</strong></p>"
    }
  `;

  // Set action buttons based on downpayment status
  let approveButtonText = "Approve Payment";
  let approveButtonDisabled = "";

  if (!canApprove && paymentRules) {
    approveButtonText = "Cannot Approve - Downpayment Required";
    approveButtonDisabled = "disabled";
  }

  actions.innerHTML = `
    <button class="btn btn-success" onclick="approvePayment('${payment.id}'); closeVerificationModal();" ${approveButtonDisabled}>
      <i data-lucide="check-circle"></i>
      ${approveButtonText}
    </button>
    <button class="btn btn-danger" onclick="rejectPayment('${payment.id}'); closeVerificationModal();">
      <i data-lucide="x-circle"></i>
      Reject Payment
    </button>
    <button class="btn btn-outline" onclick="closeVerificationModal()">Cancel</button>
  `;

  modal.classList.add("show");
}

// Validate reference number
function validateReferenceNumber(refNumber) {
  // Simple validation - check if it matches expected format
  const expectedFormats = [
    /^TXN-\d{10}-\d{3}$/, // TXN-{date}-{number}
    /^GCASH-\d{13}$/, // GCASH-{timestamp}
    /^PAY-\d{8}-\d{4}$/, // PAY-{date}-{number}
  ];

  for (const format of expectedFormats) {
    if (format.test(refNumber)) {
      return "valid";
    }
  }

  return "invalid";
}

// Get validation message
function getValidationMessage(refNumber) {
  const validation = validateReferenceNumber(refNumber);
  switch (validation) {
    case "valid":
      return "Reference number format is valid ✓";
    case "invalid":
      return "Reference number format is invalid ✗";
    default:
      return "Checking reference number...";
  }
}

// Preview proof image
function previewProof(paymentId) {
  const payment = allPayments.find((p) => p.id === paymentId);
  if (!payment || !payment.proofImage) return;

  const modal = document.getElementById("imagePreviewModal");
  const image = document.getElementById("proofImage");

  image.src = payment.proofImage;
  modal.classList.add("show");
}

// Close image preview modal
function closeImagePreviewModal() {
  const modal = document.getElementById("imagePreviewModal");
  modal.classList.remove("show");
}

// Approve payment
function approvePayment(paymentId) {
  const payment = allPayments.find((p) => p.id === paymentId);
  if (!payment) return;

  // Check downpayment requirements if rules are available
  if (paymentRules) {
    const verificationResult = paymentRules.canVerifyPayment(payment);
    if (!verificationResult.canVerify) {
      showToast(verificationResult.message, "error");
      return;
    }
  }

  updatePaymentStatus(paymentId, "approved");
  showToast("Payment approved successfully!", "success");
}

// Reject payment
function rejectPayment(paymentId) {
  updatePaymentStatus(paymentId, "rejected");
  showToast("Payment rejected", "warning");
}

// Quick approve
function quickApprove(paymentId) {
  updatePaymentStatus(paymentId, "approved");
  showToast("Payment approved successfully!", "success");
}

// Quick reject
function quickReject(paymentId) {
  updatePaymentStatus(paymentId, "rejected");
  showToast("Payment rejected", "warning");
}

// Update payment status
function updatePaymentStatus(paymentId, newStatus) {
  const payments = getFromStorage("paymentVerifications") || [];
  const paymentIndex = payments.findIndex((p) => p.id === paymentId);

  if (paymentIndex === -1) return;

  const payment = payments[paymentIndex];
  payment.status = newStatus;
  payment.verifiedAt = new Date().toISOString();
  payment.verifiedBy = "Cashier"; // In a real app, this would be the current user

  saveToStorage("paymentVerifications", payments);
  loadPayments();
  updateStats();
}

// View payment details
function viewPayment(paymentId) {
  verifyPayment(paymentId); // Reuse the verification modal for viewing
}

// Show bulk actions modal
function showBulkActions() {
  const modal = document.getElementById("bulkActionsModal");
  const message = document.getElementById("bulkActionMessage");
  const buttons = document.getElementById("bulkButtons");

  if (selectedPayments.size === 0) {
    message.textContent = "No payments selected";
    buttons.style.display = "none";
  } else {
    message.textContent = `${selectedPayments.size} payment(s) selected`;
    buttons.style.display = "flex";
  }

  modal.classList.add("show");
}

// Close bulk actions modal
function closeBulkActionsModal() {
  const modal = document.getElementById("bulkActionsModal");
  modal.classList.remove("show");
}

// Bulk approve selected payments
function bulkApprove() {
  selectedPayments.forEach((paymentId) => {
    updatePaymentStatus(paymentId, "approved");
  });

  selectedPayments.clear();
  closeBulkActionsModal();
  showToast(
    `${selectedPayments.size} payments approved successfully!`,
    "success",
  );
}

// Bulk reject selected payments
function bulkReject() {
  selectedPayments.forEach((paymentId) => {
    updatePaymentStatus(paymentId, "rejected");
  });

  selectedPayments.clear();
  closeBulkActionsModal();
  showToast(`${selectedPayments.size} payments rejected`, "warning");
}

// Close verification modal
function closeVerificationModal() {
  const modal = document.getElementById("verificationModal");
  modal.classList.remove("show");
}

// Update statistics
function updateStats() {
  const payments = getFromStorage("paymentVerifications") || [];
  const today = new Date().toDateString();

  // Pending verifications
  const pendingPayments = payments.filter((p) => p.status === "pending");
  document.getElementById("pendingCount").textContent = pendingPayments.length;
  document.getElementById("pendingAmount").textContent =
    `₱${formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}`;

  // Approved today
  const approvedToday = payments.filter(
    (p) =>
      p.status === "approved" &&
      new Date(p.verifiedAt || p.submittedAt).toDateString() === today,
  );
  document.getElementById("approvedCount").textContent = approvedToday.length;
  document.getElementById("approvedAmount").textContent =
    `₱${formatCurrency(approvedToday.reduce((sum, p) => sum + p.amount, 0))}`;

  // Rejected today
  const rejectedToday = payments.filter(
    (p) =>
      p.status === "rejected" &&
      new Date(p.verifiedAt || p.submittedAt).toDateString() === today,
  );
  document.getElementById("rejectedCount").textContent = rejectedToday.length;
  document.getElementById("rejectedAmount").textContent =
    `₱${formatCurrency(rejectedToday.reduce((sum, p) => sum + p.amount, 0))}`;

  // Processing
  const processingPayments = payments.filter((p) => p.status === "processing");
  document.getElementById("processingCount").textContent =
    processingPayments.length;
  document.getElementById("processingAmount").textContent =
    `₱${formatCurrency(processingPayments.reduce((sum, p) => sum + p.amount, 0))}`;
}

// Refresh payments
function refreshPayments() {
  loadPayments();
  updateStats();
  showToast("Payments refreshed", "success");
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const currentPageSpan = document.getElementById("currentPage");
  const totalPagesSpan = document.getElementById("totalPages");

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  currentPageSpan.textContent = currentPage;
  totalPagesSpan.textContent = totalPages || 1;
}

// Change page
function changePage(delta) {
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  const newPage = currentPage + delta;

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayPayments();
    updatePagination();
  }
}

// Initialize sample data
function initializeSampleData() {
  const existing = getFromStorage("paymentVerifications");
  // For demo purposes, always load sample data
  if (true) {
    const samplePayments = [
      {
        id: "PV-1703123456789-001",
        referenceNumber: "TXN-20231201-001",
        customerName: "Maria Santos",
        amount: 150.0,
        paymentMethod: "gcash",
        proofStatus: "uploaded",
        proofImage:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjdiODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QQVlNRU5UIFBST09GPC90ZXh0Pgo8L3N2Zz4K", // Base64 encoded SVG placeholder
        status: "pending",
        submittedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        notes: "Payment for printing services",
      },
      {
        id: "PV-1703123456790-002",
        referenceNumber: "GCASH-17031234567",
        customerName: "Juan Dela Cruz",
        amount: 250.5,
        paymentMethod: "gcash",
        proofStatus: "uploaded",
        proofImage:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjdiODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HQ0FTSCBQUk9PRjwvdGV4dD4KPC9zdmc+", // Base64 encoded SVG placeholder
        status: "approved",
        submittedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        verifiedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        verifiedBy: "Cashier",
        notes: "Payment for binding services",
      },
      {
        id: "PV-1703123456791-003",
        referenceNumber: "PAY-20231201-0001",
        customerName: "Ana Reyes",
        amount: 75.25,
        paymentMethod: "paymaya",
        proofStatus: "pending",
        status: "pending",
        submittedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        notes: "Payment for ID printing",
      },
      {
        id: "PV-1703123456792-004",
        referenceNumber: "INVALID-REF-123",
        customerName: "Pedro Garcia",
        amount: 200.0,
        paymentMethod: "card",
        proofStatus: "missing",
        status: "rejected",
        submittedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        verifiedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        verifiedBy: "Cashier",
        notes: "Invalid reference number format",
      },
      {
        id: "PV-1703123456793-005",
        referenceNumber: "TXN-20231201-002",
        customerName: "Carlos Mendoza",
        amount: 750.0, // Above threshold - requires 20% downpayment (₱150)
        paymentMethod: "gcash",
        proofStatus: "uploaded",
        proofImage:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjdiODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ESUdJVEFMIFBST0pFQ1QPC90ZXh0Pgo8L3N2Zz4K",
        status: "pending",
        downpaymentAmount: 150.0, // Full downpayment paid
        submittedAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        notes: "Payment for digital project - downpayment collected",
      },
      {
        id: "PV-1703123456794-006",
        referenceNumber: "TXN-20231201-003",
        customerName: "Elena Torres",
        amount: 1200.0, // Above threshold - requires 20% downpayment (₱240)
        paymentMethod: "gcash",
        proofStatus: "uploaded",
        proofImage:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjdiODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5X0VCIERFVkVMT1BNzwvdGV4dD4KPC9zdmc+",
        status: "pending",
        downpaymentAmount: 100.0, // Partial downpayment - insufficient
        submittedAt: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
        notes: "Payment for web development - partial downpayment collected",
      },
      {
        id: "PV-1703123456795-007",
        referenceNumber: "TXN-20231201-004",
        customerName: "Roberto Silva",
        amount: 600.0, // Above threshold - requires 20% downpayment (₱120)
        paymentMethod: "paymaya",
        proofStatus: "uploaded",
        proofImage:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjdiODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BUFBMSUNBVElPTjwvdGV4dD4KPC9zdmc+",
        status: "pending",
        downpaymentAmount: 0, // No downpayment collected
        submittedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        notes: "Payment for mobile application - downpayment pending",
      },
    ];
    saveToStorage("paymentVerifications", samplePayments);
  }
}

// Utility functions
function getPaymentIcon(method) {
  const icons = {
    gcash: "smartphone",
    paymaya: "credit-card",
    card: "credit-card",
  };
  return `<i data-lucide="${icons[method] || "credit-card"}"></i>`;
}

function getProofIcon(status) {
  const icons = {
    uploaded: "image",
    pending: "clock",
    missing: "x",
  };
  return `<i data-lucide="${icons[status] || "circle"}"></i>`;
}

function getStatusIcon(status) {
  const icons = {
    pending: "clock",
    processing: "loader",
    approved: "check-circle",
    rejected: "x-circle",
  };
  return `<i data-lucide="${icons[status] || "circle"}"></i>`;
}

function getStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateString) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

// Handle logout
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    // Clear session data
    localStorage.removeItem("cashier_session");
    showToast("Logged out successfully");

    // In a real app, redirect to login page
    setTimeout(() => {
      showToast("Redirecting to login...");
    }, 1000);
  }
}

// Storage utilities
function saveToStorage(key, data) {
  localStorage.setItem(`cashier_${key}`, JSON.stringify(data));
}

function getFromStorage(key) {
  const data = localStorage.getItem(`cashier_${key}`);
  return data ? JSON.parse(data) : null;
}

// Toast notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");

  toastMsg.textContent = message;
  toast.className = `toast ${type}`;

  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// Initialize Lucide icons
if (window.lucide) {
  document.addEventListener("DOMContentLoaded", function () {
    lucide.createIcons();
  });
}
