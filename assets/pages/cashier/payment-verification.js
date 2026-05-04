// Payment Verification JavaScript

document.addEventListener("DOMContentLoaded", function () {
  initializePaymentVerification();
});

function initializePaymentVerification() {
  setupFileUpload();
  loadPendingVerifications();
}

function setupFileUpload() {
  const fileUpload = document.getElementById("fileUpload");
  const proofFile = document.getElementById("proofFile");
  const uploadArea = fileUpload.querySelector(".upload-area");

  uploadArea.addEventListener("click", () => {
    proofFile.click();
  });

  proofFile.addEventListener("change", handleFileSelect);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("proofPreview").src = e.target.result;
      document.getElementById("uploadedFile").style.display = "block";
      document.getElementById("fileUpload").style.display = "none";
      updateStep(1, true);
    };
    reader.readAsDataURL(file);
  }
}

function removeFile() {
  document.getElementById("proofFile").value = "";
  document.getElementById("uploadedFile").style.display = "none";
  document.getElementById("fileUpload").style.display = "block";
  updateStep(1, false);
}

function updateStep(stepNumber, completed) {
  const step = document.getElementById(`step${stepNumber}`);
  const nextStep = document.getElementById(`step${stepNumber + 1}`);

  if (completed) {
    step.classList.add("completed");
    if (nextStep) {
      nextStep.classList.add("active");
    }
  } else {
    step.classList.remove("completed");
    if (nextStep) {
      nextStep.classList.remove("active");
    }
  }
}

function verifyPayment() {
  const refNumber = document.getElementById("refNumber").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const customerName = document.getElementById("customerName").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const proofFile = document.getElementById("proofFile").files[0];

  if (!refNumber || !amount || !customerName || !proofFile) {
    showToast("Please fill all required fields", "error");
    return;
  }

  // Check downpayment rule
  if (amount > 600) {
    const downpaymentRequired = amount * 0.5;
    if (
      !confirm(
        `Amount > ₱600. Requires 50% downpayment (₱${downpaymentRequired.toFixed(2)}). Proceed?`,
      )
    ) {
      return;
    }
  }

  // Create transaction
  const transaction = {
    id: refNumber,
    amount: amount,
    paymentMethod: "GCash",
    customerName: customerName,
    notes: notes,
    status: "pending",
    timestamp: new Date().toISOString(),
    proofOfPayment: true, // In real app, this would be the uploaded file
  };

  // Save transaction
  const transactions = getFromStorage("transactions") || [];
  transactions.push(transaction);
  saveToStorage("transactions", transactions);

  // Update steps
  updateStep(2, true);
  updateStep(3, true);

  showToast("Payment verification submitted successfully");

  // Clear form
  clearForm();

  // Reload pending verifications
  loadPendingVerifications();
}

function clearForm() {
  document.getElementById("refNumber").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("customerName").value = "";
  document.getElementById("notes").value = "";

  removeFile();

  // Reset steps
  document.querySelectorAll(".verification-step").forEach((step) => {
    step.classList.remove("active", "completed");
  });
  document.getElementById("step1").classList.add("active");
}

function loadPendingVerifications() {
  const transactions = getFromStorage("transactions") || [];
  const pending = transactions.filter((t) => t.status === "pending");

  const container = document.getElementById("pendingVerifications");

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="sd-empty">
        <div class="sd-empty__icon">
          <i data-lucide="clock"></i>
        </div>
        <h3 class="sd-empty__title">No pending verifications</h3>
        <p class="sd-empty__sub">Pending payment verifications will appear here</p>
      </div>
    `;
    return;
  }

  const html = pending
    .map(
      (transaction) => `
    <div class="verification-item">
      <div class="verification-info">
        <div class="verification-id">${transaction.id}</div>
        <div class="verification-amount">${formatCurrency(transaction.amount)}</div>
        <div class="verification-customer">${transaction.customerName}</div>
      </div>
      <div class="verification-actions">
        <button class="btn btn-secondary" onclick="viewProof('${transaction.id}')">
          <i data-lucide="eye"></i>
          View Proof
        </button>
        <button class="btn btn-primary" onclick="approveVerification('${transaction.id}')">
          <i data-lucide="check"></i>
          Approve
        </button>
        <button class="btn btn-secondary" onclick="rejectVerification('${transaction.id}')">
          <i data-lucide="x"></i>
          Reject
        </button>
      </div>
    </div>
  `,
    )
    .join("");

  container.innerHTML = `<div class="verifications-list">${html}</div>`;
}

function viewProof(transactionId) {
  // In a real app, this would open the proof image
  showToast("Proof viewing not implemented in demo");
}

function approveVerification(transactionId) {
  const transactions = getFromStorage("transactions") || [];
  const transaction = transactions.find((t) => t.id === transactionId);

  if (transaction) {
    transaction.status = "completed";
    saveToStorage("transactions", transactions);
    loadPendingVerifications();
    showToast("Payment approved successfully");
  }
}

function rejectVerification(transactionId) {
  const transactions = getFromStorage("transactions") || [];
  const transaction = transactions.find((t) => t.id === transactionId);

  if (transaction) {
    transaction.status = "rejected";
    saveToStorage("transactions", transactions);
    loadPendingVerifications();
    showToast("Payment rejected");
  }
}
