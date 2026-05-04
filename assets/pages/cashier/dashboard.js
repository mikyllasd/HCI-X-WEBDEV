// Helper function to get from storage (compatible with simple localStorage approach)
function getFromStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading from storage: ${key}`, error);
    return null;
  }
}

// Helper function to save to storage
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to storage: ${key}`, error);
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'N/A';
  }
}

// Show toast notification
function showToast(message) {
  // Simple implementation - can be enhanced with a toast library
  console.log('Toast:', message);
}

function initializeDashboard() {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  loadDashboardData();
  setupEventListeners();
}

function setupEventListeners() {
  const periodFilter = document.getElementById("periodFilter");
  const refreshBtn = document.getElementById("refreshBtn");

  periodFilter?.addEventListener("change", () => {
    loadDashboardData();
  });

  refreshBtn?.addEventListener("click", () => {
    loadDashboardData();
    showToast("Dashboard refreshed");
  });
}

function loadDashboardData() {
  const period = document.getElementById("periodFilter")?.value || "daily";

  // Load data from all sources
  const walkInPayments = getFromStorage("walkInPayments") || [];
  const paymentVerifications = getFromStorage("paymentVerifications") || [];
  const cashOnPickupOrders = getFromStorage("cashOnPickupOrders") || [];
  const generalTransactions = getFromStorage("transactions") || [];

  console.log('Loaded data:', {
    walkInPayments,
    paymentVerifications,
    cashOnPickupOrders,
    generalTransactions
  });

  // Combine all transaction data
  const allTransactions = [
    ...walkInPayments.map(p => ({ ...p, source: 'walkIn' })),
    ...paymentVerifications.map(p => ({ ...p, source: 'verification' })),
    ...cashOnPickupOrders.map(o => ({ ...o, source: 'cashOnPickup' })),
    ...generalTransactions.map(t => ({ ...t, source: 'general' }))
  ];

  console.log('All transactions:', allTransactions);

  // Filter by period
  const filteredTransactions = filterTransactionsByPeriod(allTransactions, period);

  updateMetrics(filteredTransactions);
  updateTransactionsList(filteredTransactions.slice(0, 10)); // Show last 10
  updatePaymentBreakdown(filteredTransactions);
}

function filterTransactionsByPeriod(transactions, period) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case "daily":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      startDate.setDate(now.getDate() - 7);
      break;
    case "monthly":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "semester":
      startDate.setMonth(now.getMonth() - 6);
      break;
  }

  return transactions.filter((t) => {
    // Handle different timestamp field names
    const timestamp = t.timestamp || t.submittedAt || t.orderDate || t.createdAt;
    if (!timestamp) return false;

    const transactionDate = new Date(timestamp);
    return transactionDate >= startDate;
  });
}

function updateMetrics(transactions) {
  // POS Sales Summary - completed walk-in payments and cash-on-pickup orders
  const posSales = transactions
    .filter((t) =>
      (t.source === 'walkIn' && t.status === 'completed') ||
      (t.source === 'cashOnPickup' && t.status === 'completed')
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Cash on Hand - all cash payments (walk-in and cash-on-pickup)
  const cashOnHand = transactions
    .filter((t) =>
      t.paymentMethod === 'cash' &&
      ((t.source === 'walkIn' && t.status === 'completed') ||
       (t.source === 'cashOnPickup' && t.status === 'completed'))
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Online Payments - approved payment verifications
  const onlinePayments = transactions
    .filter((t) =>
      t.source === 'verification' &&
      t.status === 'approved' &&
      t.paymentMethod !== 'cash'
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Unpaid Transactions - pending payments and incomplete orders
  const unpaidTransactions = transactions
    .filter((t) =>
      (t.source === 'verification' && t.status === 'pending') ||
      (t.source === 'cashOnPickup' && t.status !== 'completed')
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  document.getElementById("totalSales").textContent = formatCurrency(posSales);
  document.getElementById("cashOnHand").textContent = formatCurrency(cashOnHand);
  document.getElementById("onlinePayments").textContent = formatCurrency(onlinePayments);
  document.getElementById("unpaidTransactions").textContent = formatCurrency(unpaidTransactions);
}

function updateTransactionsList(transactions) {
  const container = document.getElementById("transactionsList");

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="receipt"></i>
        </div>
        <h3 class="sd-empty__title">No transactions yet</h3>
        <p class="sd-empty__sub">Recent payment transactions will appear here</p>
      </div>
    `;
    return;
  }

  const html = transactions
    .map((transaction) => {
      // Get appropriate fields based on source
      const id = transaction.id;
      const amount = transaction.amount || 0;
      const customerName = transaction.customerName || transaction.name || 'Unknown';
      const timestamp = transaction.timestamp || transaction.submittedAt || transaction.orderDate || transaction.createdAt;
      const status = transaction.status || 'unknown';
      const paymentMethod = transaction.paymentMethod || 'unknown';
      const serviceType = transaction.serviceType || transaction.type || 'General';

      // Format status for display
      const statusLabel = getStatusLabel(status);
      const methodLabel = getMethodLabel(paymentMethod, transaction.source);

      return `
        <div class="transaction-item">
          <div class="transaction-info">
            <div class="transaction-id">${id}</div>
            <div class="transaction-customer">${customerName}</div>
            <div class="transaction-service">${serviceType}</div>
          </div>
          <div class="transaction-details">
            <div class="transaction-amount">${formatCurrency(amount)}</div>
            <div class="transaction-method">${methodLabel}</div>
            <div class="transaction-date">${formatDate(timestamp)}</div>
          </div>
          <div class="transaction-status status-${status}">
            ${statusLabel}
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = html;
}
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = `<div class="transactions-grid">${html}</div>`;
}

function updatePaymentBreakdown(transactions) {
  const container = document.getElementById("paymentBreakdown");

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="bar-chart-3"></i>
        </div>
        <h3 class="sd-empty__title">No payment data</h3>
        <p class="sd-empty__sub">Payment method statistics will appear here</p>
      </div>
    `;
    return;
  }

  const breakdown = {};
  transactions.forEach((t) => {
    breakdown[t.paymentMethod] =
      (breakdown[t.paymentMethod] || 0) + (t.amount || 0);
  });

  const total = Object.values(breakdown).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  const html = Object.entries(breakdown)
    .map(([method, amount]) => {
      const percentage = ((amount / total) * 100).toFixed(1);
      return `
      <div class="breakdown-item">
        <div class="breakdown-label">
          <span class="breakdown-method">${method}</span>
          <span class="breakdown-amount">${formatCurrency(amount)}</span>
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-fill" style="width: ${percentage}%"></div>
        </div>
        <span class="breakdown-percentage">${percentage}%</span>
      </div>
    `;
    })
    .join("");

  container.innerHTML = `<div class="breakdown-list">${html}</div>`;
}

// Initialize with sample data if none exists
function initializeSampleData() {
  // Sample walk-in payments
  const existingWalkIn = getFromStorage("walkInPayments");
  if (!existingWalkIn || existingWalkIn.length === 0) {
    const sampleWalkInPayments = [
      {
        id: "WALK-001",
        customerName: "Juan Dela Cruz",
        amount: 150.0,
        paymentMethod: "cash",
        status: "completed",
        serviceType: "Printing",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        source: "walkIn"
      },
      {
        id: "WALK-002",
        customerName: "Maria Santos",
        amount: 200.0,
        paymentMethod: "cash",
        status: "completed",
        serviceType: "Lamination",
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        source: "walkIn"
      },
    ];
    saveToStorage("walkInPayments", sampleWalkInPayments);
  }

  // Sample payment verifications
  const existingVerifications = getFromStorage("paymentVerifications");
  if (!existingVerifications || existingVerifications.length === 0) {
    const sampleVerifications = [
      {
        id: "VER-001",
        name: "Pedro Reyes",
        amount: 300.0,
        paymentMethod: "gcash",
        status: "approved",
        serviceType: "ID Printing",
        submittedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        source: "verification"
      },
      {
        id: "VER-002",
        name: "Ana Garcia",
        amount: 175.0,
        paymentMethod: "maya",
        status: "pending",
        serviceType: "Binding",
        submittedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        source: "verification"
      },
    ];
    saveToStorage("paymentVerifications", sampleVerifications);
  }

  // Sample cash-on-pickup orders
  const existingCashOnPickup = getFromStorage("cashOnPickupOrders");
  if (!existingCashOnPickup || existingCashOnPickup.length === 0) {
    const sampleCashOnPickup = [
      {
        id: "COP-001",
        customerName: "Carlos Mendoza",
        amount: 250.0,
        paymentMethod: "cash",
        status: "completed",
        serviceType: "Mug Printing",
        orderDate: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
        source: "cashOnPickup"
      },
      {
        id: "COP-002",
        customerName: "Rosa Flores",
        amount: 125.0,
        paymentMethod: "cash",
        status: "pending",
        serviceType: "Lanyard",
        orderDate: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        source: "cashOnPickup"
      },
    ];
    saveToStorage("cashOnPickupOrders", sampleCashOnPickup);
  }
}
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

// Load sample data on first load
initializeSampleData();

// Helper functions
function getStatusLabel(status) {
  const statusMap = {
    'completed': 'Completed',
    'approved': 'Approved',
    'pending': 'Pending',
    'rejected': 'Rejected',
    'processing': 'Processing',
    'unknown': 'Unknown'
  };
  return statusMap[status] || status;
}

function getMethodLabel(method, source) {
  if (source === 'walkIn') return 'Walk-in Cash';
  if (source === 'cashOnPickup') return 'Cash on Pickup';
  if (source === 'verification') {
    const methodMap = {
      'gcash': 'GCash',
      'maya': 'Maya',
      'bank_transfer': 'Bank Transfer',
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'cash': 'Cash'
    };
    return methodMap[method] || method;
  }
  return method;
}
