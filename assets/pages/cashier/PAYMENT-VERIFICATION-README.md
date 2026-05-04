# Payment Verification Section

A comprehensive payment verification interface for the Cashier Module System, featuring proof upload validation, reference number checking, and bulk approval/rejection capabilities.

## Features

### Core Functionality

- **Payment Verification**: Detailed verification modal with payment details, proof preview, and reference validation
- **Proof Upload Support**: Image preview functionality for uploaded payment proofs
- **Reference Validation**: Automatic validation of reference number formats
- **Status Management**: Approve, reject, or mark payments as processing
- **Bulk Operations**: Select multiple payments for bulk approve/reject actions

### User Interface

- **Statistics Dashboard**: Real-time stats showing pending, approved, rejected, and processing payments
- **Search & Filter**: Search by customer name, reference number, or payment method; filter by status
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Interactive Table**: Sortable table with pagination and selection controls
- **Modal Dialogs**: Clean modal interfaces for verification, bulk actions, and image preview

### Data Management

- **localStorage Integration**: Persistent storage of payment verification data
- **Sample Data**: Pre-loaded sample payments for demonstration
- **Real-time Updates**: Automatic UI updates when payment status changes

## Files Structure

```
cashier/
├── payment-verification-standalone.html    # Main HTML structure
├── payment-verification.css               # Complete styling
├── payment-verification-standalone.js      # Full functionality
└── payment-verification-demo.html          # Standalone demo
```

## Usage

### Basic Setup

1. Include the HTML, CSS, and JavaScript files in your project
2. Ensure Lucide icons are loaded via CDN
3. Include the shared storage utilities

### Integration

```html
<!-- Include dependencies -->
<link rel="stylesheet" href="path/to/payment-verification.css" />
<script src="path/to/storage.js"></script>
<script src="path/to/payment-verification-standalone.js"></script>
```

### Data Structure

Payments are stored in localStorage with the following structure:

```javascript
{
  id: "PV-1703123456789-001",           // Unique payment ID
  referenceNumber: "TXN-20231201-001",   // Payment reference
  customerName: "Maria Santos",          // Customer name
  amount: 150.00,                        // Payment amount
  paymentMethod: "gcash",                // gcash, paymaya, card
  proofStatus: "uploaded",               // uploaded, pending, missing
  proofImage: "data:image/...",          // Base64 image data
  status: "pending",                     // pending, processing, approved, rejected
  submittedAt: "2023-12-01T10:00:00Z",   // Submission timestamp
  verifiedAt: "2023-12-01T11:00:00Z",   // Verification timestamp (optional)
  verifiedBy: "Cashier",                 // Verifier name (optional)
  notes: "Payment for printing services" // Additional notes (optional)
}
```

## API Reference

### Functions

#### Payment Management

- `verifyPayment(paymentId)` - Open detailed verification modal
- `approvePayment(paymentId)` - Approve a single payment
- `rejectPayment(paymentId)` - Reject a single payment
- `quickApprove(paymentId)` - Quick approve without modal
- `quickReject(paymentId)` - Quick reject without modal

#### Bulk Operations

- `showBulkActions()` - Show bulk actions modal
- `bulkApprove()` - Approve all selected payments
- `bulkReject()` - Reject all selected payments
- `toggleSelectAll()` - Select/deselect all visible payments

#### UI Controls

- `refreshPayments()` - Reload and refresh payment data
- `previewProof(paymentId)` - Show proof image in modal
- `handleSearch()` - Filter payments by search term
- `handleFilter()` - Filter payments by status

#### Utilities

- `updateStats()` - Refresh statistics dashboard
- `showToast(message, type)` - Show notification toast
- `formatCurrency(amount)` - Format amount as Philippine Peso
- `formatDateTime(dateString)` - Format date/time display

### Events

- Search input triggers real-time filtering
- Status filter updates table immediately
- Checkbox selection updates bulk action availability
- Modal interactions handle verification workflow

## Validation Rules

### Reference Number Formats

The system validates reference numbers against these patterns:

- `TXN-{date}-{number}` (e.g., TXN-20231201-001)
- `GCASH-{timestamp}` (e.g., GCASH-17031234567)
- `PAY-{date}-{number}` (e.g., PAY-20231201-0001)

### Payment Methods

Supported payment methods:

- `gcash` - GCash mobile payments
- `paymaya` - PayMaya payments
- `card` - Credit/debit card payments

### Status Flow

1. **Pending** → Processing (via Verify) → Approved/Rejected
2. **Pending** → Approved/Rejected (via Quick Actions)
3. **Processing** → Approved/Rejected (via modal actions)

## Styling

### CSS Variables

```css
:root {
  --primary-color: #2563eb;
  --success-color: #16a34a;
  --warning-color: #ca8a04;
  --danger-color: #dc2626;
  --gray-50: #f9fafb;
  /* ... additional variables */
}
```

### Responsive Breakpoints

- Desktop: > 768px
- Tablet: 480px - 768px
- Mobile: < 480px

### Color Coding

- **Pending**: Yellow/Orange theme
- **Processing**: Blue theme
- **Approved**: Green theme
- **Rejected**: Red theme

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- **Lucide Icons**: For all UI icons
- **Inter Font**: Via Google Fonts
- **Shared Storage**: `../../../js/shared/storage.js`
- **CSS Tokens**: `../../../css/upress-tokens.css`
- **Super Widgets**: `../../../css/upress-super-widgets.css`

## Demo

Open `payment-verification-demo.html` in a browser to see the complete interface with sample data.

## Integration Notes

1. **Authentication**: Add user authentication checks before allowing verification actions
2. **API Integration**: Replace localStorage calls with actual API endpoints
3. **File Upload**: Implement proper file upload handling for proof images
4. **Notifications**: Add email/SMS notifications for status changes
5. **Audit Trail**: Log all verification actions for compliance
6. **Permissions**: Implement role-based access control for different user types

## Troubleshooting

### Common Issues

1. **Icons not showing**: Ensure Lucide CDN is loaded
2. **Data not persisting**: Check localStorage availability
3. **Modal not closing**: Verify modal overlay click handlers
4. **Search not working**: Check input event listeners

### Debug Mode

Set `localStorage.debug = 'true'` to enable console logging of all operations.

## Future Enhancements

- Real-time notifications for new payments
- Advanced filtering options (date range, amount range)
- Export functionality for verified payments
- Integration with payment gateway APIs
- Automated reference number generation
- Payment dispute resolution workflow
