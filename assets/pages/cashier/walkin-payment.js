// Walk-in Payment JavaScript

document.addEventListener("DOMContentLoaded", function () {
  initializeWalkinPayment();
});

function initializeWalkinPayment() {
  loadWalkinRecords();
  setupAmountInputs();
}

function setupAmountInputs() {
  const amountInput = document.getElementById("walkinAmount");
  const cashReceivedInput = document.getElementById("cashReceived");

  amountInput.addEventListener("input", updateSummary);
  cashReceivedInput.addEventListener("input", updateSummary);
}

function updateSummary() {
  const amount = parseFloat(document.getElementById("walkinAmount").value) || 0;
  const received =
    parseFloat(document.getElementById("cashReceived").value) || 0;
  const change = received - amount;

  document.getElementById("summaryTotal").textContent = formatCurrency(amount);
  document.getElementById("summaryReceived").textContent =
    formatCurrency(received);
  document.getElementById("summaryChange").textContent = formatCurrency(change);

  const summary = document.getElementById("paymentSummary");
  const processBtn = document.getElementById("processWalkinBtn");

  if (amount > 0 && received > 0) {
    summary.style.display = "block";
    processBtn.disabled = change < 0;
  } else {
    summary.style.display = "none";
    processBtn.disabled = true;
  }

  // Update change row styling
  const changeRow = summary.querySelector(".change-row");
  if (change < 0) {
    changeRow.style.color = "#ef4444";
  } else {
    changeRow.style.color = "";
  }
}

function calculateChange() {
  const amount = parseFloat(document.getElementById("walkinAmount").value) || 0;
  const received =
    parseFloat(document.getElementById("cashReceived").value) || 0;

  if (amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }

  if (received < amount) {
    showToast("Insufficient cash received", "error");
    return;
  }

  updateSummary();
  showToast("Change calculated successfully");
}

function processWalkinPayment() {
  const customerName = document
    .getElementById("walkinCustomerName")
    .value.trim();
  const contact = document.getElementById("walkinContact").value.trim();
  const service = document.getElementById("walkinService").value;
  const amount = parseFloat(document.getElementById("walkinAmount").value);
  const description = document.getElementById("walkinDescription").value.trim();
  const cashReceived = parseFloat(
    document.getElementById("cashReceived").value,
  );
  const change = cashReceived - amount;

  if (!customerName || !service || !amount || !cashReceived) {
    showToast("Please fill all required fields", "error");
    return;
  }

  if (change < 0) {
    showToast("Insufficient payment amount", "error");
    return;
  }

  // Generate reference number
  const refNumber = generateReferenceNumber();

  // Create transaction
  const transaction = {
    id: refNumber,
    customerName: customerName,
    contact: contact,
    service: service,
    amount: amount,
    cashReceived: cashReceived,
    change: change,
    description: description,
    paymentMethod: "cash",
    status: "completed",
    timestamp: new Date().toISOString(),
    type: "walk-in",
  };

  // Save transaction
  const transactions = getFromStorage("transactions") || [];
  transactions.push(transaction);
  saveToStorage("transactions", transactions);

  showToast("Walk-in payment processed successfully");

  // Clear form
  clearWalkinForm();

  // Reload records
  loadWalkinRecords();
}

function clearWalkinForm() {
  document.getElementById("walkinCustomerName").value = "";
  document.getElementById("walkinContact").value = "";
  document.getElementById("walkinService").value = "";
  document.getElementById("walkinAmount").value = "";
  document.getElementById("walkinDescription").value = "";
  document.getElementById("cashReceived").value = "";

  document.getElementById("paymentSummary").style.display = "none";
  document.getElementById("processWalkinBtn").disabled = true;
}

function loadWalkinRecords() {
  const transactions = getFromStorage("transactions") || [];
  const today = new Date().toDateString();
  const walkinToday = transactions.filter(
    (t) =>
      t.type === "walk-in" && new Date(t.timestamp).toDateString() === today,
  );

  const container = document.getElementById("walkinRecords");

  if (walkinToday.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="receipt"></i>
        </div>
        <h3 class="sd-empty__title">No walk-in transactions today</h3>
        <p class="sd-empty__sub">Walk-in payment records will appear here</p>
      </div>
    `;
    return;
  }

  const html = walkinToday
    .map(
      (transaction) => `
    <div class="walkin-record">
      <div class="record-header">
        <div class="record-id">${transaction.id}</div>
        <div class="record-time">${formatDate(transaction.timestamp)}</div>
      </div>
      <div class="record-customer">
        <div class="customer-name">${transaction.customerName}</div>
        <div class="customer-contact">${transaction.contact}</div>
      </div>
      <div class="record-service">
        <span class="service-badge">${transaction.service}</span>
        <div class="service-desc">${transaction.description}</div>
      </div>
      <div class="record-amount">
        <div class="amount-total">${formatCurrency(transaction.amount)}</div>
        <div class="amount-details">
          Received: ${formatCurrency(transaction.cashReceived)} |
          Change: ${formatCurrency(transaction.change)}
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = `<div class="walkin-records-list">${html}</div>`;
}
