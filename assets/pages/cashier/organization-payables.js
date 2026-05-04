// Organization Payables JavaScript

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
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
}

// Show toast notification
function showToast(message, type = "success") {
  // Simple implementation - can be enhanced with a toast library
  console.log(`Toast (${type}):`, message);
  // You can implement a proper toast notification here
}

// Generate reference number
function generateReferenceNumber() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `REF-${timestamp}-${random}`.toUpperCase();
}

document.addEventListener("DOMContentLoaded", function () {
  initializeOrganizationPayables();
});

function initializeOrganizationPayables() {
  loadOrganizations();
  loadOrganizationTransactions();
}

function loadOrganizations() {
  const organizations =
    getFromStorage("organizations") || initializeSampleOrganizations();

  const container = document.getElementById("payablesBody");

  if (organizations.length === 0) {
    container.innerHTML =
      '<div class="payables-row"><div colspan="5">No organizations found</div></div>';
    return;
  }

  const html = organizations
    .map((org) => {
      const totalTransactions =
        org.transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const paymentsMade =
        org.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const remainingBalance = totalTransactions - paymentsMade;
      const status = remainingBalance > 0 ? "pending" : "paid";

      return `
      <div class="payables-row">
        <div class="payables-org">
          <div>${org.name}</div>
          <small>${org.contactPerson}</small>
        </div>
        <div class="payables-amount">${formatCurrency(totalTransactions)}</div>
        <div class="payables-amount">${formatCurrency(paymentsMade)}</div>
        <div class="payables-amount">${formatCurrency(remainingBalance)}</div>
        <div class="payables-status ${status}">
          ${status === "paid" ? "Paid" : "Pending"}
          <button class="btn btn-secondary" onclick="recordPayment('${org.id}')" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;">
            Pay
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  container.innerHTML = html;
}

function loadOrganizationTransactions() {
  const organizations = getFromStorage("organizations") || [];
  const allTransactions = [];

  organizations.forEach((org) => {
    if (org.transactions) {
      org.transactions.forEach((transaction) => {
        allTransactions.push({
          ...transaction,
          organization: org.name,
        });
      });
    }
    if (org.payments) {
      org.payments.forEach((payment) => {
        allTransactions.push({
          ...payment,
          organization: org.name,
          type: "payment",
        });
      });
    }
  });

  // Sort by date, most recent first
  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  const container = document.getElementById("organizationTransactions");

  if (allTransactions.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="receipt"></i>
        </div>
        <h3 class="sd-empty__title">No organization transactions</h3>
        <p class="sd-empty__sub">Organization payment transactions will appear here</p>
      </div>
    `;
    return;
  }

  const html = allTransactions
    .slice(0, 10)
    .map(
      (transaction) => `
    <div class="transaction-item ${transaction.type === "payment" ? "payment-transaction" : ""}">
      <div class="transaction-info">
        <div class="transaction-org">${transaction.organization}</div>
        <div class="transaction-desc">${transaction.description || "Payment"}</div>
      </div>
      <div class="transaction-amount ${transaction.type === "payment" ? "credit" : "debit"}">
        ${transaction.type === "payment" ? "+" : "-"}${formatCurrency(transaction.amount)}
      </div>
      <div class="transaction-date">${formatDate(transaction.date)}</div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = `<div class="transactions-list">${html}</div>`;
}

function addNewOrganization() {
  document.getElementById("orgModal").classList.add("open");
}

function closeOrgModal() {
  document.getElementById("orgModal").classList.remove("open");
  // Clear form
  document.getElementById("orgName").value = "";
  document.getElementById("orgContact").value = "";
  document.getElementById("orgEmail").value = "";
  document.getElementById("orgPhone").value = "";
}

function saveOrganization() {
  const name = document.getElementById("orgName").value.trim();
  const contactPerson = document.getElementById("orgContact").value.trim();
  const email = document.getElementById("orgEmail").value.trim();
  const phone = document.getElementById("orgPhone").value.trim();

  if (!name || !contactPerson) {
    showToast("Please fill required fields", "error");
    return;
  }

  const organizations = getFromStorage("organizations") || [];
  const newOrg = {
    id: generateReferenceNumber(),
    name: name,
    contactPerson: contactPerson,
    email: email,
    phone: phone,
    transactions: [],
    payments: [],
    createdDate: new Date().toISOString(),
  };

  organizations.push(newOrg);
  saveToStorage("organizations", organizations);

  closeOrgModal();
  loadOrganizations();
  showToast("Organization added successfully");
}

function recordPayment(orgId) {
  const organizations = getFromStorage("organizations") || [];
  const org = organizations.find((o) => o.id === orgId);

  if (!org) {
    showToast("Organization not found", "error");
    return;
  }

  // Populate modal
  document.getElementById("paymentOrgInfo").innerHTML = `
    <div class="org-summary">
      <h4>${org.name}</h4>
      <p><strong>Contact:</strong> ${org.contactPerson}</p>
      <p><strong>Email:</strong> ${org.email}</p>
    </div>
  `;

  window.currentPaymentOrg = org;

  document.getElementById("paymentModal").classList.add("open");
}

function closePaymentModal() {
  document.getElementById("paymentModal").classList.remove("open");
  // Clear form
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentMethod").value = "cash";
  document.getElementById("paymentRef").value = "";
  document.getElementById("paymentNotes").value = "";
  window.currentPaymentOrg = null;
}

function savePayment() {
  const org = window.currentPaymentOrg;
  if (!org) return;

  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const method = document.getElementById("paymentMethod").value;
  const ref = document.getElementById("paymentRef").value.trim();
  const notes = document.getElementById("paymentNotes").value.trim();

  if (!amount || amount <= 0) {
    showToast("Please enter a valid payment amount", "error");
    return;
  }

  const organizations = getFromStorage("organizations") || [];
  const orgIndex = organizations.findIndex((o) => o.id === org.id);

  if (orgIndex !== -1) {
    const payment = {
      id: generateReferenceNumber(),
      amount: amount,
      method: method,
      reference: ref,
      notes: notes,
      date: new Date().toISOString(),
    };

    if (!organizations[orgIndex].payments) {
      organizations[orgIndex].payments = [];
    }
    organizations[orgIndex].payments.push(payment);

    saveToStorage("organizations", organizations);
  }

  closePaymentModal();
  loadOrganizations();
  loadOrganizationTransactions();
  showToast("Payment recorded successfully");
}

function initializeSampleOrganizations() {
  const sampleOrgs = [
    {
      id: "ORG-001",
      name: "Computer Science Society",
      contactPerson: "Alice Johnson",
      email: "alice@css.edu.ph",
      phone: "+63 912 345 6789",
      transactions: [
        {
          id: "TXN-001",
          amount: 1500.0,
          description: "ID Card Printing - 50 cards",
          date: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id: "TXN-002",
          amount: 800.0,
          description: "Banner Printing",
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
      payments: [
        {
          id: "PAY-001",
          amount: 1000.0,
          method: "GCash",
          reference: "GC123456",
          notes: "Partial payment",
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ],
      createdDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: "ORG-002",
      name: "Engineering Council",
      contactPerson: "Bob Smith",
      email: "bob@engcouncil.edu.ph",
      phone: "+63 923 456 7890",
      transactions: [
        {
          id: "TXN-003",
          amount: 2200.0,
          description: "Certificate Printing - 100 certificates",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
      payments: [],
      createdDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  saveToStorage("organizations", sampleOrgs);
  return sampleOrgs;
}
