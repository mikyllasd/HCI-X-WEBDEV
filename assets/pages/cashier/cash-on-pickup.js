// Cash on Pickup JavaScript

document.addEventListener("DOMContentLoaded", function () {
  initializeCashOnPickup();
});

function initializeCashOnPickup() {
  loadPickupOrders();
  loadCompletedPickups();
  setupPickupModal();
}

function setupPickupModal() {
  const cashReceivedInput = document.getElementById("pickupCashReceived");
  cashReceivedInput.addEventListener("input", updatePickupSummary);
}

function loadPickupOrders() {
  // In a real app, this would fetch from an API
  // For demo, we'll create sample orders
  const orders =
    getFromStorage("pickupOrders") || initializeSamplePickupOrders();

  const readyOrders = orders.filter((order) => order.status === "ready");

  const container = document.getElementById("pickupOrders");

  if (readyOrders.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="package"></i>
        </div>
        <h3 class="sd-empty__title">No orders ready for pickup</h3>
        <p class="sd-empty__sub">Orders ready for pickup will appear here</p>
      </div>
    `;
    return;
  }

  const html = readyOrders
    .map(
      (order) => `
    <div class="order-status-card">
      <div class="order-header">
        <div class="order-id">${order.id}</div>
        <div class="order-status ready">Ready for Pickup</div>
      </div>
      <div class="order-details">
        <div><strong>Customer:</strong> ${order.customerName}</div>
        <div><strong>Service:</strong> ${order.service}</div>
        <div><strong>Amount:</strong> ${formatCurrency(order.amount)}</div>
        <div><strong>Order Date:</strong> ${formatDate(order.orderDate)}</div>
      </div>
      <div class="order-actions">
        <button class="btn btn-primary" onclick="processPickup('${order.id}')">
          <i data-lucide="credit-card"></i>
          Process Payment
        </button>
        <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">
          <i data-lucide="eye"></i>
          View Details
        </button>
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = html;
}

function loadCompletedPickups() {
  const orders = getFromStorage("pickupOrders") || [];
  const today = new Date().toDateString();
  const completedToday = orders.filter(
    (order) =>
      order.status === "completed" &&
      new Date(order.completedDate).toDateString() === today,
  );

  const container = document.getElementById("completedPickups");

  if (completedToday.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="check-circle"></i>
        </div>
        <h3 class="sd-empty__title">No completed pickups today</h3>
        <p class="sd-empty__sub">Completed pickup transactions will appear here</p>
      </div>
    `;
    return;
  }

  const html = completedToday
    .map(
      (order) => `
    <div class="order-status-card">
      <div class="order-header">
        <div class="order-id">${order.id}</div>
        <div class="order-status completed">Completed</div>
      </div>
      <div class="order-details">
        <div><strong>Customer:</strong> ${order.customerName}</div>
        <div><strong>Service:</strong> ${order.service}</div>
        <div><strong>Amount:</strong> ${formatCurrency(order.amount)}</div>
        <div><strong>Completed:</strong> ${formatDate(order.completedDate)}</div>
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = html;
}

function processPickup(orderId) {
  const orders = getFromStorage("pickupOrders") || [];
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    showToast("Order not found", "error");
    return;
  }

  // Populate modal
  document.getElementById("pickupDetails").innerHTML = `
    <div class="order-summary">
      <h4>Order ${order.id}</h4>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Service:</strong> ${order.service}</p>
      <p><strong>Description:</strong> ${order.description}</p>
      <p><strong>Total Amount:</strong> ${formatCurrency(order.amount)}</p>
    </div>
  `;

  document.getElementById("pickupTotal").textContent = formatCurrency(
    order.amount,
  );
  document.getElementById("pickupCashReceived").value = "";
  document.getElementById("pickupReceived").textContent = "₱0.00";
  document.getElementById("pickupChange").textContent = "₱0.00";

  // Store current order
  window.currentPickupOrder = order;

  // Show modal
  document.getElementById("pickupModal").classList.add("open");
}

function updatePickupSummary() {
  const order = window.currentPickupOrder;
  if (!order) return;

  const received =
    parseFloat(document.getElementById("pickupCashReceived").value) || 0;
  const change = received - order.amount;

  document.getElementById("pickupReceived").textContent =
    formatCurrency(received);
  document.getElementById("pickupChange").textContent = formatCurrency(change);

  const confirmBtn = document.getElementById("confirmPickupBtn");
  confirmBtn.disabled = change < 0;

  // Update change styling
  const changeElement = document.getElementById("pickupChange");
  if (change < 0) {
    changeElement.style.color = "#ef4444";
  } else {
    changeElement.style.color = "";
  }
}

function confirmPickup() {
  const order = window.currentPickupOrder;
  if (!order) return;

  const cashReceived = parseFloat(
    document.getElementById("pickupCashReceived").value,
  );
  const change = cashReceived - order.amount;

  if (change < 0) {
    showToast("Insufficient payment amount", "error");
    return;
  }

  // Update order status
  const orders = getFromStorage("pickupOrders") || [];
  const orderIndex = orders.findIndex((o) => o.id === order.id);

  if (orderIndex !== -1) {
    orders[orderIndex].status = "completed";
    orders[orderIndex].completedDate = new Date().toISOString();
    orders[orderIndex].cashReceived = cashReceived;
    orders[orderIndex].change = change;

    saveToStorage("pickupOrders", orders);

    // Create transaction record
    const transaction = {
      id: generateReferenceNumber(),
      orderId: order.id,
      customerName: order.customerName,
      amount: order.amount,
      cashReceived: cashReceived,
      change: change,
      paymentMethod: "cash",
      status: "completed",
      timestamp: new Date().toISOString(),
      type: "pickup",
    };

    const transactions = getFromStorage("transactions") || [];
    transactions.push(transaction);
    saveToStorage("transactions", transactions);
  }

  closePickupModal();
  loadPickupOrders();
  loadCompletedPickups();

  showToast("Pickup payment processed successfully");
}

function closePickupModal() {
  document.getElementById("pickupModal").classList.remove("open");
  window.currentPickupOrder = null;
}

function viewOrderDetails(orderId) {
  const orders = getFromStorage("pickupOrders") || [];
  const order = orders.find((o) => o.id === orderId);

  if (order) {
    alert(
      `Order Details:\n\nID: ${order.id}\nCustomer: ${order.customerName}\nService: ${order.service}\nAmount: ${formatCurrency(order.amount)}\nStatus: ${order.status}\nOrder Date: ${formatDate(order.orderDate)}`,
    );
  }
}

function initializeSamplePickupOrders() {
  const sampleOrders = [
    {
      id: "ORD-001",
      customerName: "John Doe",
      service: "Printing",
      description: "Color printing - 50 pages",
      amount: 250.0,
      status: "ready",
      orderDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "ORD-002",
      customerName: "Jane Smith",
      service: "Binding",
      description: "Thesis binding - hardcover",
      amount: 150.0,
      status: "ready",
      orderDate: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    },
    {
      id: "ORD-003",
      customerName: "Bob Johnson",
      service: "Lanyard",
      description: "Custom lanyard printing",
      amount: 75.0,
      status: "completed",
      orderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedDate: new Date().toISOString(),
      cashReceived: 100.0,
      change: 25.0,
    },
  ];

  saveToStorage("pickupOrders", sampleOrders);
  return sampleOrders;
}
