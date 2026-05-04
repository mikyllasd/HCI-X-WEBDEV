// Payment Rules Module
// Enforces business rules for payment processing and verification

class PaymentRules {
  constructor() {
    this.DOWNPAYMENT_THRESHOLD = 500;
    this.DOWNPAYMENT_PERCENTAGE = 0.2; // 20%
  }

  /**
   * Check if a payment requires downpayment based on total amount
   * @param {number} totalAmount - The total payment amount
   * @returns {boolean} - True if downpayment is required
   */
  requiresDownpayment(totalAmount) {
    return totalAmount > this.DOWNPAYMENT_THRESHOLD;
  }

  /**
   * Calculate the required downpayment amount
   * @param {number} totalAmount - The total payment amount
   * @returns {number} - Required downpayment amount
   */
  calculateRequiredDownpayment(totalAmount) {
    if (!this.requiresDownpayment(totalAmount)) {
      return 0;
    }
    return totalAmount * this.DOWNPAYMENT_PERCENTAGE;
  }

  /**
   * Validate if the provided downpayment meets the requirement
   * @param {number} totalAmount - The total payment amount
   * @param {number} downpaymentAmount - The amount paid as downpayment
   * @returns {object} - Validation result with isValid and message
   */
  validateDownpayment(totalAmount, downpaymentAmount) {
    if (!this.requiresDownpayment(totalAmount)) {
      return {
        isValid: true,
        message: "No downpayment required for this amount",
      };
    }

    const requiredAmount = this.calculateRequiredDownpayment(totalAmount);

    if (downpaymentAmount >= requiredAmount) {
      return {
        isValid: true,
        message: `Downpayment of ₱${this.formatCurrency(downpaymentAmount)} meets the required ₱${this.formatCurrency(requiredAmount)}`,
      };
    } else {
      return {
        isValid: false,
        message: `Insufficient downpayment. Required: ₱${this.formatCurrency(requiredAmount)}, Provided: ₱${this.formatCurrency(downpaymentAmount)}`,
      };
    }
  }

  /**
   * Check if a payment can be marked as verified
   * @param {object} payment - Payment object with total amount and downpayment info
   * @returns {object} - Verification result with canVerify, message, and required actions
   */
  canVerifyPayment(payment) {
    const totalAmount = payment.amount || payment.totalAmount || 0;
    const downpaymentAmount = payment.downpaymentAmount || 0;

    if (!this.requiresDownpayment(totalAmount)) {
      return {
        canVerify: true,
        message: "Payment can be verified - no downpayment required",
        requiredActions: [],
      };
    }

    const validation = this.validateDownpayment(totalAmount, downpaymentAmount);

    if (validation.isValid) {
      return {
        canVerify: true,
        message: "Payment can be verified - downpayment requirement met",
        requiredActions: [],
      };
    } else {
      return {
        canVerify: false,
        message: validation.message,
        requiredActions: [
          "Collect additional downpayment",
          "Update payment record with downpayment amount",
          "Re-verify payment after downpayment collection",
        ],
      };
    }
  }

  /**
   * Get downpayment status for display
   * @param {number} totalAmount - The total payment amount
   * @param {number} downpaymentAmount - The amount paid as downpayment
   * @returns {object} - Status information for UI display
   */
  getDownpaymentStatus(totalAmount, downpaymentAmount = 0) {
    if (!this.requiresDownpayment(totalAmount)) {
      return {
        required: false,
        status: "not-required",
        message: "No downpayment required",
        progress: 100,
        color: "success",
      };
    }

    const requiredAmount = this.calculateRequiredDownpayment(totalAmount);
    const progress = Math.min((downpaymentAmount / requiredAmount) * 100, 100);

    let status, message, color;

    if (downpaymentAmount >= requiredAmount) {
      status = "completed";
      message = `Downpayment complete: ₱${this.formatCurrency(downpaymentAmount)} / ₱${this.formatCurrency(requiredAmount)}`;
      color = "success";
    } else if (downpaymentAmount > 0) {
      status = "partial";
      message = `Partial downpayment: ₱${this.formatCurrency(downpaymentAmount)} / ₱${this.formatCurrency(requiredAmount)}`;
      color = "warning";
    } else {
      status = "pending";
      message = `Downpayment required: ₱${this.formatCurrency(requiredAmount)}`;
      color = "danger";
    }

    return {
      required: true,
      status,
      message,
      progress: Math.round(progress),
      requiredAmount,
      paidAmount: downpaymentAmount,
      remainingAmount: Math.max(requiredAmount - downpaymentAmount, 0),
      color,
    };
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get business rules summary
   * @returns {object} - Summary of all business rules
   */
  getRulesSummary() {
    return {
      downpaymentThreshold: this.DOWNPAYMENT_THRESHOLD,
      downpaymentPercentage: this.DOWNPAYMENT_PERCENTAGE * 100,
      rules: [
        `Payments over ₱${this.formatCurrency(this.DOWNPAYMENT_THRESHOLD)} require ${this.DOWNPAYMENT_PERCENTAGE * 100}% downpayment`,
        "Downpayment must be collected before payment verification",
        "Partial downpayments are tracked and validated",
        "Verification is blocked until downpayment requirements are met",
      ],
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaymentRules;
}

// Global instance for browser usage
if (typeof window !== "undefined") {
  window.PaymentRules = PaymentRules;
}
