# Cashier Dashboard Section

A comprehensive dashboard for monitoring cashier operations, payments, and transactions in the UPress system.

## Features

### Dashboard Metrics

- **POS Sales Summary**: Total sales from completed walk-in payments and cash-on-pickup orders
- **Cash on Hand**: Total cash payments received (walk-in and cash-on-pickup)
- **Online Payments**: Approved online payment verifications (GCash, Maya, etc.)
- **Unpaid Transactions**: Pending payments and incomplete orders

### Time-based Filtering

- Daily, Weekly, Monthly, and Semester views
- Real-time data aggregation from multiple sources

### Transaction Monitoring

- Recent transactions list with customer details
- Payment method tracking
- Status indicators (Completed, Approved, Pending, etc.)
- Service type identification

### Payment Method Breakdown

- Visual breakdown of payment methods used
- Percentage distribution
- Amount totals per method

## Data Sources

The dashboard aggregates data from multiple localStorage sources:

- `walkInPayments`: Walk-in payment transactions
- `paymentVerifications`: Online payment verification records
- `cashOnPickupOrders`: Cash-on-pickup order records
- `transactions`: Legacy transaction data

## File Structure

```
assets/pages/cashier/
├── dashboard.html          # Dashboard HTML template
├── dashboard.js            # Dashboard logic and data aggregation
├── dashboard-demo.html     # Standalone demo page
└── dashboard.css           # Dashboard-specific styles

assets/css/cashier/
└── dashboard.css           # Dashboard styles
```

## Usage

### Standalone Demo

Open `dashboard-demo.html` in a browser to see the dashboard in action.

### Integration

Include the dashboard HTML in your cashier interface and initialize with:

```javascript
// Load dashboard data
loadDashboardData();

// Set up filters
document
  .getElementById("periodFilter")
  .addEventListener("change", loadDashboardData);
document
  .getElementById("refreshBtn")
  .addEventListener("click", loadDashboardData);
```

## Dependencies

- `storage.js`: Shared utility for localStorage operations
- Lucide icons: For UI icons
- Inter font: For typography

## Data Aggregation Logic

### POS Sales Summary

```javascript
const posSales = transactions
  .filter(
    (t) =>
      (t.source === "walkIn" && t.status === "completed") ||
      (t.source === "cashOnPickup" && t.status === "completed"),
  )
  .reduce((sum, t) => sum + (t.amount || 0), 0);
```

### Cash on Hand

```javascript
const cashOnHand = transactions
  .filter(
    (t) =>
      t.paymentMethod === "cash" &&
      ((t.source === "walkIn" && t.status === "completed") ||
        (t.source === "cashOnPickup" && t.status === "completed")),
  )
  .reduce((sum, t) => sum + (t.amount || 0), 0);
```

### Online Payments

```javascript
const onlinePayments = transactions
  .filter(
    (t) =>
      t.source === "verification" &&
      t.status === "approved" &&
      t.paymentMethod !== "cash",
  )
  .reduce((sum, t) => sum + (t.amount || 0), 0);
```

### Unpaid Transactions

```javascript
const unpaidTransactions = transactions
  .filter(
    (t) =>
      (t.source === "verification" && t.status === "pending") ||
      (t.source === "cashOnPickup" && t.status !== "completed"),
  )
  .reduce((sum, t) => sum + (t.amount || 0), 0);
```

## Responsive Design

The dashboard is fully responsive with:

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Optimized typography scaling

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support
- CSS Grid and Flexbox support

## Testing

The dashboard includes sample data initialization for testing purposes. To reset data:

```javascript
localStorage.clear();
location.reload();
```

## Future Enhancements

- Real-time data updates via WebSocket
- Export functionality (PDF/Excel)
- Advanced filtering options
- Chart visualizations
- Performance metrics
- Alert notifications
