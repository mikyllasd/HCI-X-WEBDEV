// Downpayment Rule Logic

/**
 * Checks if a transaction requires a downpayment based on the amount
 * @param {number} amount - The transaction amount
 * @returns {boolean} - True if downpayment is required
 */
function requiresDownpayment(amount) {
  return amount > 600;
}

/**
 * Calculates the required downpayment amount
 * @param {number} totalAmount - The total transaction amount
 * @returns {number} - The required downpayment amount
 */
function calculateDownpayment(totalAmount) {
  if (!requiresDownpayment(totalAmount)) {
    return 0;
  }
  return totalAmount * 0.5; // 50% downpayment
}

/**
 * Validates if the provided downpayment meets the requirements
 * @param {number} totalAmount - The total transaction amount
 * @param {number} downpaymentAmount - The provided downpayment amount
 * @returns {object} - Validation result with isValid and requiredAmount
 */
function validateDownpayment(totalAmount, downpaymentAmount) {
  const required = calculateDownpayment(totalAmount);

  return {
    isValid: downpaymentAmount >= required,
    requiredAmount: required,
    shortfall: Math.max(0, required - downpaymentAmount),
  };
}

/**
 * Applies downpayment logic to a transaction
 * @param {object} transaction - The transaction object
 * @returns {object} - Updated transaction with downpayment info
 */
function applyDownpaymentLogic(transaction) {
  const amount = transaction.amount || 0;

  if (requiresDownpayment(amount)) {
    const requiredDownpayment = calculateDownpayment(amount);
    transaction.requiresDownpayment = true;
    transaction.downpaymentRequired = requiredDownpayment;
    transaction.remainingBalance = amount - (transaction.downpaymentPaid || 0);

    // Check if downpayment is satisfied
    if (transaction.downpaymentPaid >= requiredDownpayment) {
      transaction.downpaymentSatisfied = true;
    } else {
      transaction.downpaymentSatisfied = false;
    }
  } else {
    transaction.requiresDownpayment = false;
    transaction.downpaymentRequired = 0;
    transaction.downpaymentSatisfied = true;
    transaction.remainingBalance = amount;
  }

  return transaction;
}

/**
 * Processes a downpayment for a transaction
 * @param {string} transactionId - The transaction ID
 * @param {number} downpaymentAmount - The downpayment amount
 * @param {string} paymentMethod - The payment method used
 * @returns {boolean} - Success status
 */
function processDownpayment(transactionId, downpaymentAmount, paymentMethod) {
  const transactions = getFromStorage("transactions") || [];
  const transaction = transactions.find((t) => t.id === transactionId);

  if (!transaction) {
    console.error("Transaction not found:", transactionId);
    return false;
  }

  // Apply downpayment logic
  transaction.downpaymentPaid =
    (transaction.downpaymentPaid || 0) + downpaymentAmount;
  transaction = applyDownpaymentLogic(transaction);

  // Create downpayment record
  if (!transaction.downpayments) {
    transaction.downpayments = [];
  }

  transaction.downpayments.push({
    amount: downpaymentAmount,
    paymentMethod: paymentMethod,
    timestamp: new Date().toISOString(),
    reference: generateReferenceNumber(),
  });

  // Save updated transaction
  saveToStorage("transactions", transactions);

  return true;
}

/**
 * Checks if a transaction can proceed to verification
 * @param {object} transaction - The transaction object
 * @returns {boolean} - True if verification can proceed
 */
function canProceedToVerification(transaction) {
  if (!transaction.requiresDownpayment) {
    return true;
  }

  return transaction.downpaymentSatisfied === true;
}

/**
 * Gets downpayment status for display
 * @param {object} transaction - The transaction object
 * @returns {string} - Status message
 */
function getDownpaymentStatus(transaction) {
  if (!transaction.requiresDownpayment) {
    return "No downpayment required";
  }

  const paid = transaction.downpaymentPaid || 0;
  const required = transaction.downpaymentRequired || 0;

  if (paid >= required) {
    return `Downpayment satisfied (${formatCurrency(paid)} paid)`;
  } else {
    const shortfall = required - paid;
    return `Downpayment required: ${formatCurrency(shortfall)} more needed (${formatCurrency(paid)} paid)`;
  }
}

// Export functions for use in other modules
window.requiresDownpayment = requiresDownpayment;
window.calculateDownpayment = calculateDownpayment;
window.validateDownpayment = validateDownpayment;
window.applyDownpaymentLogic = applyDownpaymentLogic;
window.processDownpayment = processDownpayment;
window.canProceedToVerification = canProceedToVerification;
window.getDownpaymentStatus = getDownpaymentStatus;
