# Payment Rules Module

A JavaScript module that enforces business rules for payment processing, specifically handling downpayment requirements for high-value transactions.

## Overview

The Payment Rules module implements the business rule that payments exceeding ₱500 require a 20% downpayment before verification can be completed. This ensures financial security and proper cash flow management.

## Features

### Core Functionality

- **Downpayment Validation**: Checks if payments require downpayment based on amount thresholds
- **Amount Calculation**: Automatically calculates required downpayment amounts (20% of total)
- **Status Tracking**: Provides detailed status information for downpayment progress
- **Verification Control**: Prevents payment approval until downpayment requirements are met

### Business Rules

- **Threshold**: ₱500 minimum amount requiring downpayment
- **Percentage**: 20% of total payment amount
- **Enforcement**: Verification blocked until downpayment collected
- **Validation**: Real-time checking of downpayment adequacy

## Installation

Include the module in your HTML file:

```html
<script src="path/to/payment-rules.js"></script>
```

Or import as an ES module:

```javascript
import PaymentRules from "./payment-rules.js";
```

## Usage

### Basic Setup

```javascript
// Initialize the payment rules
const paymentRules = new PaymentRules();

// Check if downpayment is required
const requiresDownpayment = paymentRules.requiresDownpayment(750.0); // true

// Calculate required downpayment
const requiredAmount = paymentRules.calculateRequiredDownpayment(750.0); // 150.00

// Validate downpayment
const validation = paymentRules.validateDownpayment(750.0, 100.0);
// Returns: { isValid: false, message: "Insufficient downpayment..." }
```

### Integration with Payment Verification

```javascript
// Check if payment can be verified
const payment = {
  amount: 1200.0,
  downpaymentAmount: 200.0,
};

const canVerify = paymentRules.canVerifyPayment(payment);
// Returns: { canVerify: false, message: "...", requiredActions: [...] }

// Get downpayment status for UI display
const status = paymentRules.getDownpaymentStatus(1200.0, 200.0);
// Returns: { required: true, status: "partial", message: "...", progress: 83, ... }
```

## API Reference

### Constructor

```javascript
const paymentRules = new PaymentRules();
```

### Methods

#### `requiresDownpayment(totalAmount)`

Checks if a payment amount requires downpayment.

**Parameters:**

- `totalAmount` (number): The total payment amount

**Returns:** boolean

**Example:**

```javascript
paymentRules.requiresDownpayment(300.0); // false
paymentRules.requiresDownpayment(600.0); // true
```

#### `calculateRequiredDownpayment(totalAmount)`

Calculates the required downpayment amount.

**Parameters:**

- `totalAmount` (number): The total payment amount

**Returns:** number

**Example:**

```javascript
paymentRules.calculateRequiredDownpayment(1000.0); // 200.00
```

#### `validateDownpayment(totalAmount, downpaymentAmount)`

Validates if the provided downpayment meets requirements.

**Parameters:**

- `totalAmount` (number): The total payment amount
- `downpaymentAmount` (number): The amount paid as downpayment

**Returns:** object

```javascript
{
  isValid: boolean,
  message: string
}
```

**Example:**

```javascript
paymentRules.validateDownpayment(1000.0, 150.0);
// { isValid: false, message: "Insufficient downpayment..." }

paymentRules.validateDownpayment(1000.0, 200.0);
// { isValid: true, message: "Downpayment of ₱200.00 meets..." }
```

#### `canVerifyPayment(payment)`

Checks if a payment can be marked as verified.

**Parameters:**

- `payment` (object): Payment object with amount and downpaymentAmount properties

**Returns:** object

```javascript
{
  canVerify: boolean,
  message: string,
  requiredActions: string[]
}
```

**Example:**

```javascript
const payment = { amount: 800.0, downpaymentAmount: 160.0 };
paymentRules.canVerifyPayment(payment);
// { canVerify: true, message: "Payment can be verified...", requiredActions: [] }
```

#### `getDownpaymentStatus(totalAmount, downpaymentAmount)`

Gets detailed status information for UI display.

**Parameters:**

- `totalAmount` (number): The total payment amount
- `downpaymentAmount` (number): The amount paid as downpayment (default: 0)

**Returns:** object

```javascript
{
  required: boolean,
  status: string, // "not-required" | "pending" | "partial" | "completed"
  message: string,
  progress: number, // 0-100
  requiredAmount: number,
  paidAmount: number,
  remainingAmount: number,
  color: string // "success" | "warning" | "danger"
}
```

#### `getRulesSummary()`

Gets a summary of all business rules.

**Returns:** object

```javascript
{
  downpaymentThreshold: number,
  downpaymentPercentage: number,
  rules: string[]
}
```

## Configuration

The module uses these default values (can be modified by extending the class):

```javascript
DOWNPAYMENT_THRESHOLD = 500; // Minimum amount requiring downpayment
DOWNPAYMENT_PERCENTAGE = 0.2; // 20% of total amount
```

## Integration Examples

### Payment Verification System

```javascript
// Before approving payment
function approvePayment(paymentId) {
  const payment = getPaymentById(paymentId);

  if (paymentRules) {
    const verificationResult = paymentRules.canVerifyPayment(payment);
    if (!verificationResult.canVerify) {
      showError(verificationResult.message);
      return;
    }
  }

  // Proceed with approval
  updatePaymentStatus(paymentId, "approved");
}
```

### UI Status Display

```javascript
function updatePaymentUI(payment) {
  const status = paymentRules.getDownpaymentStatus(
    payment.amount,
    payment.downpaymentAmount,
  );

  if (status.required) {
    displayDownpaymentProgress(status);
  }
}
```

### Form Validation

```javascript
function validatePaymentForm(formData) {
  const totalAmount = parseFloat(formData.amount);
  const downpaymentAmount = parseFloat(formData.downpaymentAmount || 0);

  if (paymentRules.requiresDownpayment(totalAmount)) {
    const validation = paymentRules.validateDownpayment(
      totalAmount,
      downpaymentAmount,
    );
    if (!validation.isValid) {
      showValidationError(validation.message);
      return false;
    }
  }

  return true;
}
```

## Error Handling

The module includes built-in error handling:

- Invalid input types are handled gracefully
- Missing properties return appropriate defaults
- All methods are safe to call with undefined/null values

## Browser Support

- Modern browsers with ES6 support
- Node.js environments (with module.exports)
- Compatible with both browser globals and ES modules

## Testing

The module includes comprehensive sample data for testing different scenarios:

- Payments below threshold (no downpayment required)
- Payments above threshold with full downpayment
- Payments above threshold with partial downpayment
- Payments above threshold with no downpayment

## Future Enhancements

- Configurable thresholds and percentages
- Multiple downpayment tiers
- Time-based downpayment deadlines
- Integration with payment gateways
- Audit trail logging
- Multi-currency support
