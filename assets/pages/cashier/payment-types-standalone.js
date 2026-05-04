// Payment Types JavaScript - Standalone Version

document.addEventListener("DOMContentLoaded", function () {
  initializePaymentTypes();
});

// Global variables
let selectedPaymentType = null;

// Initialize the payment types section
function initializePaymentTypes() {
  setupEventListeners();
  loadPaymentSettings();
  loadActivities();
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
}

// Payment type selection
function selectPaymentType(type) {
  // Remove previous selection
  document.querySelectorAll(".payment-type-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selection to clicked card
  const selectedCard = document.querySelector(`[data-type="${type}"]`);
  selectedCard.classList.add("selected");

  // Store selection
  selectedPaymentType = type;
  saveToStorage("selectedPaymentType", type);

  // Show selection feedback
  showToast(`${getPaymentTypeName(type)} selected successfully!`);

  // Navigate to appropriate section (in a real app, this would redirect)
  setTimeout(() => {
    switch (type) {
      case "gcash":
        showToast("Redirecting to Payment Verification...");
        break;
      case "cash":
        showToast("Redirecting to Walk-in Payment...");
        break;
      case "pickup":
        showToast("Redirecting to Cash on Pickup...");
        break;
    }
  }, 1000);
}

// Get human-readable payment type name
function getPaymentTypeName(type) {
  switch (type) {
    case "gcash":
      return "GCash";
    case "cash":
      return "Cash (Walk-in)";
    case "pickup":
      return "Cash on Pickup";
    default:
      return type;
  }
}

// Save payment settings
function savePaymentSettings() {
  const settings = {
    gcashAccount: document.getElementById("gcashAccount").value.trim(),
    refFormat:
      document.getElementById("refFormat").value.trim() ||
      "TXN-{date}-{number}",
    autoVerify: document.getElementById("autoVerify").checked,
    lastUpdated: new Date().toISOString(),
  };

  saveToStorage("paymentSettings", settings);
  showToast("Payment settings saved successfully!");
}

// Load payment settings
function loadPaymentSettings() {
  const settings = getFromStorage("paymentSettings") || {};

  document.getElementById("gcashAccount").value = settings.gcashAccount || "";
  document.getElementById("refFormat").value =
    settings.refFormat || "TXN-{date}-{number}";
  document.getElementById("autoVerify").checked = settings.autoVerify !== false;
}

// Load and display recent activities
function loadActivities() {
  const transactions = getFromStorage("transactions") || [];
  const activities = transactions.slice(0, 10); // Show last 10 activities

  const container = document.getElementById("activitiesList");

  if (activities.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="activity"></i>
        </div>
        <h3 class="sd-empty__title">No recent activities</h3>
        <p class="sd-empty__sub">Payment activities will appear here</p>
      </div>
    `;
    return;
  }

  const html = activities
    .map(
      (activity) => `
    <div class="activity-item ${activity.paymentMethod?.toLowerCase() || "cash"}">
      <div class="activity-icon">
        <i data-lucide="${getActivityIcon(activity.paymentMethod)}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-title">${getPaymentTypeName(activity.paymentMethod)} Payment</div>
        <div class="activity-desc">${formatCurrency(activity.amount)} - ${activity.id || "N/A"}</div>
        <div class="activity-time">${formatDate(activity.timestamp)}</div>
      </div>
      <div class="activity-status ${activity.status || "completed"}">
        ${activity.status || "completed"}
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = html;
}

// Get icon for activity type
function getActivityIcon(method) {
  switch (method?.toLowerCase()) {
    case "gcash":
      return "smartphone";
    case "cash":
      return "wallet";
    case "pickup":
    case "cash on pickup":
      return "package";
    default:
      return "credit-card";
  }
}

// Initialize sample data for demonstration
function initializeSampleData() {
  const existing = getFromStorage("transactions");
  if (!existing || existing.length === 0) {
    const sampleTransactions = [
      {
        id: "TXN-001",
        amount: 150.0,
        paymentMethod: "GCash",
        status: "completed",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: "TXN-002",
        amount: 200.0,
        paymentMethod: "cash",
        status: "completed",
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      },
      {
        id: "TXN-003",
        amount: 75.5,
        paymentMethod: "cash",
        status: "pending",
        timestamp: new Date().toISOString(),
      },
    ];
    saveToStorage("transactions", sampleTransactions);
  }
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

// Utility functions
function saveToStorage(key, data) {
  localStorage.setItem(`cashier_${key}`, JSON.stringify(data));
}

function getFromStorage(key) {
  const data = localStorage.getItem(`cashier_${key}`);
  return data ? JSON.parse(data) : null;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

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
