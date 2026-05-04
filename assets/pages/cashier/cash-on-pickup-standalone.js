// Cash on Pickup JavaScript - Standalone Version

document.addEventListener("DOMContentLoaded", function () {
  initializeCashOnPickup();
});

// Global variables
let currentPage = 1;
let ordersPerPage = 10;
let allOrders = [];
let filteredOrders = [];

// Initialize the cash on pickup section
function initializeCashOnPickup() {
  setupEventListeners();
  loadOrders();
  updateStats();
  initializeSampleData();
  setDefaultPickupDate();
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

  // New order form
  const newOrderForm = document.getElementById("newOrderForm");
  newOrderForm.addEventListener("submit", handleNewOrderSubmit);

  // Search and filter
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");

  searchInput.addEventListener("input", handleSearch);
  statusFilter.addEventListener("change", handleFilter);
}

// Set default pickup date to today
function setDefaultPickupDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("pickupDate").value = today;
}

// Show new order modal
function showNewOrderModal() {
  const modal = document.getElementById("newOrderModal");
  modal.classList.add("show");
  document.getElementById("orderCustomerName").focus();
}

// Close new order modal
function closeNewOrderModal() {
  const modal = document.getElementById("newOrderModal");
  modal.classList.remove("show");
  document.getElementById("newOrderForm").reset();
  setDefaultPickupDate();
}

// Handle new order form submission
function handleNewOrderSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const order = {
    id: generateOrderId(),
    customerName: formData.get("customerName").trim(),
    contactNumber: formData.get("contactNumber").trim(),
    amount: parseFloat(formData.get("amount")),
    serviceType: formData.get("serviceType"),
    notes: formData.get("notes").trim(),
    pickupDate: formData.get("pickupDate"),
    orderDate: new Date().toISOString(),
    status: "ready", // Ready for Pickup
    statusHistory: [
      {
        status: "ready",
        timestamp: new Date().toISOString(),
        note: "Order created",
      },
    ],
  };

  // Validate required fields
  if (
    !order.customerName ||
    !order.contactNumber ||
    !order.amount ||
    !order.serviceType ||
    !order.pickupDate
  ) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  // Save order
  saveOrder(order);

  // Update UI
  loadOrders();
  updateStats();
  closeNewOrderModal();

  showToast("Order created successfully!", "success");
}

// Generate unique order ID
function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `COP-${timestamp}-${random}`;
}

// Save order to localStorage
function saveOrder(order) {
  const orders = getFromStorage("cashOnPickupOrders") || [];
  orders.unshift(order); // Add to beginning of array
  saveToStorage("cashOnPickupOrders", orders);
}

// Load orders from localStorage
function loadOrders() {
  allOrders = getFromStorage("cashOnPickupOrders") || [];
  filteredOrders = [...allOrders];
  applyFilters();
  displayOrders();
  updatePagination();
}

// Apply search and status filters
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;

  filteredOrders = allOrders.filter((order) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      order.customerName.toLowerCase().includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm) ||
      order.serviceType.toLowerCase().includes(searchTerm) ||
      order.contactNumber.includes(searchTerm) ||
      order.notes.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

// Handle search input
function handleSearch() {
  currentPage = 1;
  applyFilters();
  displayOrders();
  updatePagination();
}

// Handle status filter change
function handleFilter() {
  currentPage = 1;
  applyFilters();
  displayOrders();
  updatePagination();
}

// Display orders in table
function displayOrders() {
  const tbody = document.getElementById("ordersBody");
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const ordersToShow = filteredOrders.slice(startIndex, endIndex);

  if (ordersToShow.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="package"></i>
          </div>
          <h3>No orders found</h3>
          <p>Orders will appear here after creation</p>
        </td>
      </tr>
    `;
    return;
  }

  const html = ordersToShow
    .map(
      (order) => `
    <tr>
      <td>
        <span class="order-id">${order.id}</span>
      </td>
      <td>
        <div class="customer-name">${order.customerName}</div>
        <div style="font-size: 12px; color: var(--gray-500);">${order.contactNumber}</div>
      </td>
      <td>
        <span class="service-type ${order.serviceType}">${getServiceIcon(order.serviceType)} ${order.serviceType}</span>
      </td>
      <td>
        <span class="amount">₱${formatCurrency(order.amount)}</span>
      </td>
      <td>
        <span class="status-badge ${order.status}">${getStatusIcon(order.status)} ${getStatusLabel(order.status)}</span>
      </td>
      <td>
        <div class="order-date">${formatDate(order.orderDate)}</div>
      </td>
      <td>
        <div class="pickup-date">${formatDate(order.pickupDate)}</div>
      </td>
      <td>
        <div class="actions">
          <button class="btn-action view" onclick="viewOrder('${order.id}')" title="View Details">
            <i data-lucide="eye"></i>
          </button>
          ${getActionButtons(order)}
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

// Get action buttons based on order status
function getActionButtons(order) {
  switch (order.status) {
    case "ready":
      return `
        <button class="btn-action verify" onclick="updateOrderStatus('${order.id}', 'verified')" title="Mark Payment Verified">
          <i data-lucide="check-circle"></i>
        </button>
        <button class="btn-action cancel" onclick="cancelOrder('${order.id}')" title="Cancel Order">
          <i data-lucide="x"></i>
        </button>
      `;
    case "verified":
      return `
        <button class="btn-action complete" onclick="updateOrderStatus('${order.id}', 'completed')" title="Mark as Completed">
          <i data-lucide="check-circle-2"></i>
        </button>
      `;
    case "completed":
      return `<span style="font-size: 12px; color: var(--gray-500);">Completed</span>`;
    default:
      return "";
  }
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
  const orders = getFromStorage("cashOnPickupOrders") || [];
  const orderIndex = orders.findIndex((o) => o.id === orderId);

  if (orderIndex === -1) return;

  const order = orders[orderIndex];
  const oldStatus = order.status;

  // Update status
  order.status = newStatus;
  order.lastUpdated = new Date().toISOString();

  // Add status history
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: `Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`,
  });

  // Save updated orders
  saveToStorage("cashOnPickupOrders", orders);

  // Update UI
  loadOrders();
  updateStats();

  showToast(`Order ${getStatusLabel(newStatus).toLowerCase()}!`, "success");
}

// Cancel order
function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  const orders = getFromStorage("cashOnPickupOrders") || [];
  const orderIndex = orders.findIndex((o) => o.id === orderId);

  if (orderIndex === -1) return;

  orders.splice(orderIndex, 1); // Remove order
  saveToStorage("cashOnPickupOrders", orders);

  loadOrders();
  updateStats();
  showToast("Order cancelled", "warning");
}

// View order details
function viewOrder(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById("orderDetailsModal");
  const content = document.getElementById("orderDetailsContent");
  const actions = document.getElementById("orderActions");

  content.innerHTML = `
    <div class="order-detail-row">
      <span class="detail-label">Order ID:</span>
      <span class="detail-value">${order.id}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Customer:</span>
      <span class="detail-value">${order.customerName}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Contact:</span>
      <span class="detail-value">${order.contactNumber}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Service:</span>
      <span class="detail-value">${order.serviceType}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Amount:</span>
      <span class="detail-value large">₱${formatCurrency(order.amount)}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Status:</span>
      <span class="detail-value status ${order.status}">${getStatusLabel(order.status)}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Order Date:</span>
      <span class="detail-value">${formatDateTime(order.orderDate)}</span>
    </div>
    <div class="order-detail-row">
      <span class="detail-label">Pickup Date:</span>
      <span class="detail-value">${formatDate(order.pickupDate)}</span>
    </div>
    ${
      order.notes
        ? `
    <div class="order-detail-row">
      <span class="detail-label">Notes:</span>
      <span class="detail-value">${order.notes}</span>
    </div>
    `
        : ""
    }
    ${
      order.statusHistory
        ? `
    <div class="order-detail-row">
      <span class="detail-label">Status History:</span>
      <span class="detail-value">
        ${order.statusHistory.map((h) => `${getStatusLabel(h.status)} (${formatDateTime(h.timestamp)})`).join("<br>")}
      </span>
    </div>
    `
        : ""
    }
  `;

  actions.innerHTML = getDetailActionButtons(order);

  modal.classList.add("show");
}

// Get action buttons for order details modal
function getDetailActionButtons(order) {
  switch (order.status) {
    case "ready":
      return `
        <button class="btn btn-primary" onclick="updateOrderStatus('${order.id}', 'verified'); closeOrderDetailsModal();">
          <i data-lucide="check-circle"></i>
          Mark Payment Verified
        </button>
        <button class="btn btn-outline" onclick="closeOrderDetailsModal()">Close</button>
      `;
    case "verified":
      return `
        <button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'completed'); closeOrderDetailsModal();">
          <i data-lucide="check-circle-2"></i>
          Mark as Completed
        </button>
        <button class="btn btn-outline" onclick="closeOrderDetailsModal()">Close</button>
      `;
    case "completed":
      return `
        <button class="btn btn-outline" onclick="closeOrderDetailsModal()">Close</button>
      `;
    default:
      return `<button class="btn btn-outline" onclick="closeOrderDetailsModal()">Close</button>`;
  }
}

// Close order details modal
function closeOrderDetailsModal() {
  const modal = document.getElementById("orderDetailsModal");
  modal.classList.remove("show");
}

// Update statistics
function updateStats() {
  const orders = getFromStorage("cashOnPickupOrders") || [];
  const today = new Date().toDateString();

  // Ready for Pickup
  const readyOrders = orders.filter((o) => o.status === "ready");
  document.getElementById("readyCount").textContent = readyOrders.length;
  document.getElementById("readyAmount").textContent =
    `₱${formatCurrency(readyOrders.reduce((sum, o) => sum + o.amount, 0))}`;

  // Payment Verified
  const verifiedOrders = orders.filter((o) => o.status === "verified");
  document.getElementById("verifiedCount").textContent = verifiedOrders.length;
  document.getElementById("verifiedAmount").textContent =
    `₱${formatCurrency(verifiedOrders.reduce((sum, o) => sum + o.amount, 0))}`;

  // Completed Today
  const completedToday = orders.filter(
    (o) =>
      o.status === "completed" &&
      new Date(o.lastUpdated || o.orderDate).toDateString() === today,
  );
  document.getElementById("completedCount").textContent = completedToday.length;
  document.getElementById("completedAmount").textContent =
    `₱${formatCurrency(completedToday.reduce((sum, o) => sum + o.amount, 0))}`;
}

// Refresh orders
function refreshOrders() {
  loadOrders();
  updateStats();
  showToast("Orders refreshed", "success");
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
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

  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = Math.min(startIndex + ordersPerPage, filteredOrders.length);
  showingCount.textContent =
    filteredOrders.length > 0 ? `${startIndex + 1}-${endIndex}` : "0";
  totalCount.textContent = filteredOrders.length;
}

// Change page
function changePage(delta) {
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const newPage = currentPage + delta;

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayOrders();
    updatePagination();
  }
}

// Initialize sample data
function initializeSampleData() {
  const existing = getFromStorage("cashOnPickupOrders");
  if (!existing || existing.length === 0) {
    const sampleOrders = [
      {
        id: "COP-1703123456789-001",
        customerName: "Ana Santos",
        contactNumber: "09181234567",
        amount: 250.0,
        serviceType: "printing",
        notes: "Color printing, 100 pages, urgent",
        pickupDate: new Date().toISOString().split("T")[0],
        orderDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        status: "ready",
        statusHistory: [
          {
            status: "ready",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            note: "Order created",
          },
        ],
      },
      {
        id: "COP-1703123456790-002",
        customerName: "Carlos Reyes",
        contactNumber: "09987654321",
        amount: 180.5,
        serviceType: "binding",
        notes: "Thesis binding, 200 pages",
        pickupDate: new Date().toISOString().split("T")[0],
        orderDate: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        status: "verified",
        lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        statusHistory: [
          {
            status: "ready",
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            note: "Order created",
          },
          {
            status: "verified",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            note: "Status changed from Ready for Pickup to Payment Verified",
          },
        ],
      },
      {
        id: "COP-1703123456791-003",
        customerName: "Maria Cruz",
        contactNumber: "09175551234",
        amount: 95.0,
        serviceType: "lanyard",
        notes: "Custom school lanyards, 50 pieces",
        pickupDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
        orderDate: new Date().toISOString(),
        status: "completed",
        lastUpdated: new Date().toISOString(),
        statusHistory: [
          {
            status: "ready",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            note: "Order created",
          },
          {
            status: "verified",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            note: "Status changed from Ready for Pickup to Payment Verified",
          },
          {
            status: "completed",
            timestamp: new Date().toISOString(),
            note: "Status changed from Payment Verified to Completed",
          },
        ],
      },
    ];
    saveToStorage("cashOnPickupOrders", sampleOrders);
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

function getStatusIcon(status) {
  const icons = {
    ready: "package",
    verified: "check-circle",
    completed: "check-circle-2",
  };
  return `<i data-lucide="${icons[status] || "circle"}"></i>`;
}

function getStatusLabel(status) {
  switch (status) {
    case "ready":
      return "Ready for Pickup";
    case "verified":
      return "Payment Verified";
    case "completed":
      return "Completed";
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

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
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
