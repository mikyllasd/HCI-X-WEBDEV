// Payment Types JavaScript

document.addEventListener("DOMContentLoaded", function () {
  initializePaymentTypes();
});

function initializePaymentTypes() {
  loadPaymentSettings();
  loadActivities();
}

function selectPaymentType(type) {
  // Store selected payment type
  saveToStorage("selectedPaymentType", type);

  // Navigate to appropriate section
  switch (type) {
    case "gcash":
      // Navigate to payment verification
      document.querySelector('[data-page="payment-verification"]').click();
      break;
    case "cash":
      // Navigate to walk-in payment
      document.querySelector('[data-page="walkin-payment"]').click();
      break;
    case "pickup":
      // Navigate to cash on pickup
      document.querySelector('[data-page="cash-on-pickup"]').click();
      break;
  }

  showToast(`${type.toUpperCase()} payment type selected`);
}

function savePaymentSettings() {
  const settings = {
    gcashAccount: document.getElementById("gcashAccount").value,
    refFormat: document.getElementById("refFormat").value,
    autoVerify: document.getElementById("autoVerify").checked,
  };

  saveToStorage("paymentSettings", settings);
  showToast("Payment settings saved");
}

function loadPaymentSettings() {
  const settings = getFromStorage("paymentSettings") || {};

  document.getElementById("gcashAccount").value = settings.gcashAccount || "";
  document.getElementById("refFormat").value =
    settings.refFormat || "TXN-{date}-{number}";
  document.getElementById("autoVerify").checked = settings.autoVerify !== false;
}

function loadActivities() {
  const transactions = getFromStorage("transactions") || [];
  const activities = transactions.slice(0, 10); // Last 10 activities

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
    <div class="activity-item">
      <div class="activity-icon">
        <i data-lucide="${getActivityIcon(activity.paymentMethod)}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-title">${activity.paymentMethod} Payment</div>
        <div class="activity-desc">${formatCurrency(activity.amount)} - ${activity.id}</div>
        <div class="activity-time">${formatDate(activity.timestamp)}</div>
      </div>
      <div class="activity-status status-${activity.status}">
        ${activity.status}
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = `<div class="activities-grid">${html}</div>`;
}

function getActivityIcon(method) {
  switch (method) {
    case "GCash":
      return "smartphone";
    case "cash":
      return "wallet";
    case "pickup":
      return "package";
    default:
      return "credit-card";
  }
}

// Generate reference number
function generateReferenceNumber() {
  const settings = getFromStorage("paymentSettings") || {};
  const format = settings.refFormat || "TXN-{date}-{number}";

  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const timestamp = now.getTime();

  return format
    .replace("{date}", date)
    .replace("{number}", timestamp.toString().slice(-6));
}

// Export for use in other modules
window.generateReferenceNumber = generateReferenceNumber;
