# Walk-in Payment Section

A comprehensive standalone implementation of the Walk-in Payment processing interface for the UPRESSease Cashier Module.

## Files

- `walk-in-payment-standalone.html` - Complete HTML page with form and records display
- `walk-in-payment.css` - Dedicated styles for the payment interface
- `walk-in-payment-standalone.js` - Full JavaScript functionality for payment processing

## Features

### Payment Form

- **Customer Information**: Name and contact number fields
- **Payment Details**: Amount, payment method (Cash/Card/Check), service type
- **Service Types**: Printing, Binding, Lanyard, Mug Printing, ID Printing, Other
- **Notes**: Additional service details and descriptions
- **Validation**: Required field validation with user feedback

### Records Management

- **Data Persistence**: All payments stored in localStorage
- **Search Functionality**: Search by customer name, transaction ID, service type, or notes
- **Date Filtering**: Filter by Today, This Week, This Month, or All Time
- **Pagination**: Navigate through large record sets
- **Export**: Download payment records as CSV file

### Statistics Dashboard

- **Today's Total**: Sum of all payments for current day
- **Transaction Count**: Number of payments processed today
- **Unique Customers**: Count of distinct customers served today
- **Average Transaction**: Mean payment amount for today

### Record Actions

- **View Details**: Display complete payment information
- **Edit Records**: Modify existing payment entries (UI placeholder)
- **Delete Records**: Remove payments with confirmation
- **Status Tracking**: Completed, Pending, Cancelled status indicators

### User Interface

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modal Forms**: Clean payment entry interface
- **Toast Notifications**: Success, error, and warning messages
- **Visual Feedback**: Hover effects, loading states, and animations
- **Service Icons**: Visual indicators for different service types

## Data Storage

The application uses localStorage with the following keys:

- `cashier_walkInPayments`: Array of payment records
- Records include: ID, customer info, amount, service type, payment method, timestamp, status, notes

## Usage

1. Open `walk-in-payment-standalone.html` in a web browser
2. Click "New Payment" to open the payment form
3. Fill in customer and payment details
4. Click "Record Payment" to save the transaction
5. View records in the table below with search and filter options
6. Use "Export" to download records as CSV

## Sample Data

The application includes sample payment records for demonstration:

- Juan Dela Cruz - Printing service (₱150.00)
- Maria Santos - Binding service (₱75.50)
- Pedro Reyes - Lanyard service (₱200.00)

## Integration

This standalone version can be easily integrated into larger applications. The JavaScript functions are self-contained and use standard DOM manipulation and localStorage APIs.

## Dependencies

- Lucide icons (loaded from CDN)
- Inter font (Google Fonts)
- Shared CSS files from the main project (upress-tokens.css, cashier.css)

## Transaction ID Format

Payment records use the format: `WIP-{timestamp}-{random}`

- WIP: Walk-in Payment prefix
- timestamp: Unix timestamp in milliseconds
- random: 3-digit random number

## Security Notes

This implementation uses localStorage for data persistence, which is suitable for client-side storage only. In a production environment, payment data should be stored on a secure server with proper authentication and encryption.
