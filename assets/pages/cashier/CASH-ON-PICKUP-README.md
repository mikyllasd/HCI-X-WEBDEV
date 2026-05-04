# Cash on Pickup Section

A comprehensive standalone implementation of the Cash on Pickup order management system for the UPRESSease Cashier Module.

## Files

- `cash-on-pickup-standalone.html` - Complete HTML page with order management interface
- `cash-on-pickup.css` - Dedicated styles for the order management UI
- `cash-on-pickup-standalone.js` - Full JavaScript functionality for order processing

## Features

### Order Status Flow

- **Ready for Pickup**: Order is prepared and waiting for customer collection
- **Payment Verified**: Customer has arrived and payment has been confirmed
- **Completed**: Order has been successfully collected by the customer

### Order Management

- **Create Orders**: Add new orders with customer details, service type, amount, and pickup date
- **Status Progression**: Move orders through the status flow with appropriate actions
- **Order Details**: View comprehensive order information and status history
- **Search & Filter**: Find orders by customer name, ID, service type, or status

### Statistics Dashboard

- **Ready for Pickup**: Count and total amount of orders awaiting collection
- **Payment Verified**: Count and total amount of orders with confirmed payment
- **Completed Today**: Count and total amount of orders completed on current day

### Order Operations

- **View Details**: Display complete order information in modal dialog
- **Verify Payment**: Mark order as payment verified (Ready → Verified)
- **Mark Complete**: Mark order as completed (Verified → Completed)
- **Cancel Order**: Remove order from system with confirmation

### User Interface

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modal Interfaces**: Clean order creation and detail viewing
- **Status Indicators**: Visual status badges with appropriate colors and icons
- **Action Buttons**: Context-sensitive buttons based on order status
- **Toast Notifications**: Success, error, and warning messages

## Data Storage

The application uses localStorage with the following keys:

- `cashier_cashOnPickupOrders`: Array of order records
- Records include: ID, customer info, amount, service type, pickup date, status, status history

## Order ID Format

Order records use the format: `COP-{timestamp}-{random}`

- COP: Cash on Pickup prefix
- timestamp: Unix timestamp in milliseconds
- random: 3-digit random number

## Status Flow Logic

### Ready for Pickup

- **Actions Available**: View Details, Verify Payment, Cancel Order
- **Next Status**: Payment Verified
- **Description**: Order is ready for customer pickup

### Payment Verified

- **Actions Available**: View Details, Mark Complete
- **Next Status**: Completed
- **Description**: Customer has arrived and payment has been verified

### Completed

- **Actions Available**: View Details (read-only)
- **Next Status**: None (final state)
- **Description**: Order has been successfully collected

## Usage

1. Open `cash-on-pickup-standalone.html` in a web browser
2. Click "New Order" to create an order with customer and service details
3. View orders in the table with current status
4. Use action buttons to progress orders through the status flow:
   - Click "Verify" (✓) to mark payment as verified
   - Click "Complete" (✓✓) to mark order as completed
5. Use search and status filters to find specific orders
6. Click "View" to see detailed order information

## Sample Data Included

The application comes pre-loaded with sample orders demonstrating all status states:

- Ana Santos - Printing (Ready for Pickup)
- Carlos Reyes - Binding (Payment Verified)
- Maria Cruz - Lanyard (Completed)

## Integration

This standalone version can be easily integrated into larger applications. The JavaScript functions are self-contained and use standard DOM manipulation and localStorage APIs.

## Dependencies

- Lucide icons (loaded from CDN)
- Inter font (Google Fonts)
- Shared CSS files from the main project (upress-tokens.css, cashier.css)

## Security Notes

This implementation uses localStorage for data persistence, which is suitable for client-side storage only. In a production environment, order data should be stored on a secure server with proper authentication and audit trails.

## Status History

Each order maintains a complete status history with timestamps:

- Order creation timestamp
- Status change timestamps
- Notes for each status transition

This provides a complete audit trail for order processing and can help resolve disputes or track order handling times.
