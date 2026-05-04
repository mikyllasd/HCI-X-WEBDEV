# Organization Payables Section

A comprehensive system for managing organization accounts, tracking transactions, recording payments, and monitoring remaining balances in the UPress cashier system.

## Features

### Organization Management

- **Add New Organizations**: Create organization accounts with contact details
- **Organization Overview**: View all organizations with their financial status
- **Contact Information**: Store and display organization contact details

### Transaction Tracking

- **Transaction History**: View all transactions for each organization
- **Transaction Details**: Amount, description, and date for each transaction
- **Payment Records**: Track all payments made by organizations

### Payment Management

- **Record Payments**: Add new payments with multiple payment methods
- **Payment Methods**: Support for Cash, GCash, and Bank Transfer
- **Reference Tracking**: Store payment references and notes

### Financial Overview

- **Total Transactions**: Sum of all transaction amounts per organization
- **Payments Made**: Total payments received from each organization
- **Remaining Balance**: Outstanding balance calculation
- **Status Indicators**: Paid/Pending status for each organization

## Data Structure

### Organization Object

```javascript
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
      date: "2024-01-15T10:30:00.000Z"
    }
  ],
  payments: [
    {
      id: "PAY-001",
      amount: 1000.0,
      method: "GCash",
      reference: "GC123456",
      notes: "Partial payment",
      date: "2024-01-20T14:15:00.000Z"
    }
  ],
  createdDate: "2024-01-10T09:00:00.000Z"
}
```

## File Structure

```
assets/pages/cashier/
├── organization-payables.html          # Main HTML template
├── organization-payables.js            # Complete functionality
├── organization-payables-demo.html     # Standalone demo
└── organization-payables.css           # Section-specific styles

assets/css/cashier/
└── organization-payables.css           # Organization payables styles
```

## Usage

### Standalone Demo

Open `organization-payables-demo.html` in a browser to see the system in action.

### Integration

Include the organization payables HTML in your cashier interface and initialize with:

```javascript
// Initialize the organization payables system
initializeOrganizationPayables();
```

## Key Functions

### Organization Management

- `addNewOrganization()`: Opens modal to add new organization
- `saveOrganization()`: Saves new organization to storage
- `loadOrganizations()`: Loads and displays all organizations

### Payment Management

- `recordPayment(orgId)`: Opens payment modal for specific organization
- `savePayment()`: Records new payment and updates balances

### Data Display

- `loadOrganizationTransactions()`: Loads and displays recent transactions
- `updateOrganizationDisplay()`: Updates organization table with latest data

## Sample Data

The system includes sample organizations for testing:

- **Computer Science Society**: ₱2,300 total transactions, ₱1,000 paid, ₱1,300 remaining
- **Engineering Council**: ₱2,200 total transactions, ₱0 paid, ₱2,200 remaining

## Dependencies

- `localStorage`: For client-side data persistence
- Lucide icons: For UI icons
- Inter font: For typography

## Responsive Design

The organization payables section is fully responsive with:

- Mobile-first approach
- Flexible grid layouts for organization table
- Touch-friendly modal interactions
- Optimized typography scaling

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support
- CSS Grid and Flexbox support

## Testing

The system includes sample data initialization for testing. To reset data:

```javascript
localStorage.removeItem("organizations");
location.reload();
```

## Future Enhancements

- Export functionality (PDF/Excel reports)
- Payment reminders and notifications
- Advanced filtering and search
- Bulk payment processing
- Integration with accounting systems
- Payment history analytics
- Organization credit limits
- Automated payment due date tracking
