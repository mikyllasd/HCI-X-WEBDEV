// Walk-in Payment JavaScript - Standalone Version

document.addEventListener("DOMContentLoaded", function () {
  initializeWalkInPayment();
});

// Global variables
let currentPage = 1;
let recordsPerPage = 10;
let allRecords = [];
let filteredRecords = [];

// Initialize the walk-in payment section
function initializeWalkInPayment() {
  setupEventListeners();
  loadRecords();
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

  // Payment form
  const paymentForm = document.getElementById("paymentForm");
  paymentForm.addEventListener("submit", handlePaymentSubmit);

  // Search and filter
  const searchInput = document.getElementById("searchInput");
  const filterDate = document.getElementById("filterDate");

  searchInput.addEventListener("input", handleSearch);
  filterDate.addEventListener("change", handleFilter);

  // Pagination
  document
    .getElementById("prevPage")
    .addEventListener("click", () => changePage(-1));
  document
    .getElementById("nextPage")
    .addEventListener("click", () => changePage(1));
}

// Show payment form modal
function showPaymentForm() {
  const modal = document.getElementById("paymentModal");
  modal.classList.add("show");
  document.getElementById("customerName").focus();
}

// Close payment form modal
function closePaymentForm() {
  const modal = document.getElementById("paymentModal");
  modal.classList.remove("show");
  document.getElementById("paymentForm").reset();
}

// Handle payment form submission
function handlePaymentSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const payment = {
    id: generateTransactionId(),
    customerName: formData.get("customerName").trim(),
    contactNumber: formData.get("contactNumber").trim(),
    amount: parseFloat(formData.get("amount")),
    paymentMethod: formData.get("paymentMethod"),
    serviceType: formData.get("serviceType"),
    notes: formData.get("notes").trim(),
    timestamp: new Date().toISOString(),
    status: "completed",
  };

  // Validate required fields
  if (!payment.customerName || !payment.amount) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  // Save payment
  savePayment(payment);

  // Update UI
  loadRecords();
  updateStats();
  closePaymentForm();

  showToast("Payment recorded successfully!", "success");
}

// Generate unique transaction ID
function generateTransactionId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `WIP-${timestamp}-${random}`;
}

// Save payment to localStorage
function savePayment(payment) {
  const payments = getFromStorage("walkInPayments") || [];
  payments.unshift(payment); // Add to beginning of array
  saveToStorage("walkInPayments", payments);
}

// Load records from localStorage
function loadRecords() {
  allRecords = getFromStorage("walkInPayments") || [];
  filteredRecords = [...allRecords];
  applyFilters();
  displayRecords();
  updatePagination();
}

// Apply search and date filters
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const dateFilter = document.getElementById("filterDate").value;

  filteredRecords = allRecords.filter((record) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      record.customerName.toLowerCase().includes(searchTerm) ||
      record.id.toLowerCase().includes(searchTerm) ||
      record.serviceType.toLowerCase().includes(searchTerm) ||
      record.notes.toLowerCase().includes(searchTerm);

    // Date filter
    const recordDate = new Date(record.timestamp);
    const now = new Date();
    let matchesDate = true;

    switch (dateFilter) {
      case "today":
        matchesDate = recordDate.toDateString() === now.toDateString();
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = recordDate >= weekAgo;
        break;
      case "month":
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        matchesDate = recordDate >= monthAgo;
        break;
      case "all":
      default:
        matchesDate = true;
        break;
    }

    return matchesSearch && matchesDate;
  });
}

// Handle search input
function handleSearch() {
  currentPage = 1;
  applyFilters();
  displayRecords();
  updatePagination();
}

// Handle date filter change
function handleFilter() {
  currentPage = 1;
  applyFilters();
  displayRecords();
  updatePagination();
}

// Display records in table
function displayRecords() {
  const tbody = document.getElementById("recordsBody");
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const recordsToShow = filteredRecords.slice(startIndex, endIndex);

  if (recordsToShow.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="receipt"></i>
          </div>
          <h3>No payment records found</h3>
          <p>Records will appear here after processing payments</p>
        </td>
      </tr>
    `;
    return;
  }

  const html = recordsToShow
    .map(
      (record) => `
    <tr>
      <td>
        <span class="transaction-id">${record.id}</span>
      </td>
      <td>
        <div class="customer-name">${record.customerName}</div>
        ${record.contactNumber ? `<div style="font-size: 12px; color: var(--gray-500);">${record.contactNumber}</div>` : ""}
      </td>
      <td>
        <span class="amount">₱${formatCurrency(record.amount)}</span>
      </td>
      <td>
        <span class="service-type ${record.serviceType}">${getServiceIcon(record.serviceType)} ${record.serviceType}</span>
      </td>
      <td>
        <span class="payment-method ${record.paymentMethod}">${getPaymentIcon(record.paymentMethod)} ${record.paymentMethod}</span>
      </td>
      <td>
        <div class="timestamp">${formatDateTime(record.timestamp)}</div>
      </td>
      <td>
        <span class="status ${record.status}">${getStatusIcon(record.status)} ${record.status}</span>
      </td>
      <td>
        <div class="actions">
          <button class="btn-action view" onclick="viewRecord('${record.id}')" title="View Details">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn-action edit" onclick="editRecord('${record.id}')" title="Edit">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-action delete" onclick="deleteRecord('${record.id}')" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
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

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const currentPageSpan = document.getElementById("currentPage");
  const totalPagesSpan = document.getElementById("totalPages");
  const showingCount = document.getElementById("showingCount");
  const totalCount = document.getElementById("totalCount");

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  currentPageSpan.textContent = currentPage;
  totalPagesSpan.textContent = totalPages || 1;

  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(
    startIndex + recordsPerPage,
    filteredRecords.length,
  );
  showingCount.textContent =
    filteredRecords.length > 0 ? `${startIndex + 1}-${endIndex}` : "0";
  totalCount.textContent = filteredRecords.length;
}

// Change page
function changePage(delta) {
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const newPage = currentPage + delta;

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayRecords();
    updatePagination();
  }
}

// Update statistics
function updateStats() {
  const records = getFromStorage("walkInPayments") || [];
  const today = new Date().toDateString();
  const todayRecords = records.filter(
    (r) => new Date(r.timestamp).toDateString() === today,
  );

  // Today's total
  const totalAmount = todayRecords.reduce((sum, r) => sum + r.amount, 0);
  document.getElementById("totalAmount").textContent =
    `₱${formatCurrency(totalAmount)}`;

  // Total transactions
  document.getElementById("totalTransactions").textContent =
    todayRecords.length;

  // Unique customers
  const uniqueCustomers = new Set(todayRecords.map((r) => r.customerName)).size;
  document.getElementById("uniqueCustomers").textContent = uniqueCustomers;

  // Average transaction
  const avgTransaction =
    todayRecords.length > 0 ? totalAmount / todayRecords.length : 0;
  document.getElementById("avgTransaction").textContent =
    `₱${formatCurrency(avgTransaction)}`;
}

// View record details
function viewRecord(id) {
  const record = allRecords.find((r) => r.id === id);
  if (!record) return;

  const details = `
    Transaction ID: ${record.id}
    Customer: ${record.customerName}
    Contact: ${record.contactNumber || "N/A"}
    Amount: ₱${formatCurrency(record.amount)}
    Service: ${record.serviceType}
    Payment Method: ${record.paymentMethod}
    Date/Time: ${formatDateTime(record.timestamp)}
    Status: ${record.status}
    Notes: ${record.notes || "None"}
  `;

  alert(details);
}

// Edit record
function editRecord(id) {
  const record = allRecords.find((r) => r.id === id);
  if (!record) return;

  // For demo purposes, just show a message
  showToast(
    "Edit functionality would open the form with pre-filled data",
    "warning",
  );
}

// Delete record
function deleteRecord(id) {
  if (!confirm("Are you sure you want to delete this payment record?")) {
    return;
  }

  const payments = getFromStorage("walkInPayments") || [];
  const updatedPayments = payments.filter((p) => p.id !== id);
  saveToStorage("walkInPayments", updatedPayments);

  loadRecords();
  updateStats();
  showToast("Payment record deleted", "success");
}

// Export records
function exportRecords() {
  const records = getFromStorage("walkInPayments") || [];
  if (records.length === 0) {
    showToast("No records to export", "warning");
    return;
  }

  // Create CSV content
  const headers = [
    "Transaction ID",
    "Customer Name",
    "Contact",
    "Amount",
    "Service Type",
    "Payment Method",
    "Date/Time",
    "Status",
    "Notes",
  ];
  const csvContent = [
    headers.join(","),
    ...records.map((record) =>
      [
        record.id,
        `"${record.customerName}"`,
        `"${record.contactNumber || ""}"`,
        record.amount,
        record.serviceType,
        record.paymentMethod,
        record.timestamp,
        record.status,
        `"${record.notes || ""}"`,
      ].join(","),
    ),
  ].join("\n");

  // Download CSV
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `walk-in-payments-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Records exported successfully!", "success");
}

// Initialize sample data
function initializeSampleData() {
  const existing = getFromStorage("walkInPayments");
  if (!existing || existing.length === 0) {
    const samplePayments = [
      {
        id: "WIP-1703123456789-001",
        customerName: "Juan Dela Cruz",
        contactNumber: "09123456789",
        amount: 150.0,
        paymentMethod: "cash",
        serviceType: "printing",
        notes: "Black and white printing, 50 pages",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        status: "completed",
      },
      {
        id: "WIP-1703123456790-002",
        customerName: "Maria Santos",
        contactNumber: "09987654321",
        amount: 75.5,
        paymentMethod: "cash",
        serviceType: "binding",
        notes: "Spiral binding for thesis",
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        status: "completed",
      },
      {
        id: "WIP-1703123456791-003",
        customerName: "Pedro Reyes",
        contactNumber: "",
        amount: 200.0,
        paymentMethod: "card",
        serviceType: "lanyard",
        notes: "Custom lanyard printing",
        timestamp: new Date().toISOString(),
        status: "completed",
      },
    ];
    saveToStorage("walkInPayments", samplePayments);
  }
}

// Utility functions
function getServiceIcon(service) {
  const icons = {
    printing: "printer",
    binding: "book-open",
    lanyard: "user",
    mug: "coffee",
    "id-printing": "id-card",
    other: "file-text",
  };
  return `<i data-lucide="${icons[service] || "file-text"}"></i>`;
}

function getPaymentIcon(method) {
  const icons = {
    cash: "dollar-sign",
    card: "credit-card",
    check: "file-text",
  };
  return `<i data-lucide="${icons[method] || "dollar-sign"}"></i>`;
}

function getStatusIcon(status) {
  const icons = {
    completed: "check-circle",
    pending: "clock",
    cancelled: "x-circle",
  };
  return `<i data-lucide="${icons[status] || "circle"}"></i>`;
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
