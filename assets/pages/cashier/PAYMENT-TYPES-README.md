# Payment Types Section

A standalone implementation of the Payment Types selection interface for the UPRESSease Cashier Module.

## Files

- `payment-types-standalone.html` - Complete HTML page with sidebar navigation
- `payment-types.css` - Dedicated styles for the payment types interface
- `payment-types-standalone.js` - JavaScript functionality for payment type selection

## Features

### Payment Type Selection

- **GCash**: Mobile wallet payments via GCash app
- **Cash (Walk-in)**: Direct cash payments at the counter
- **Cash on Pickup**: Pay when collecting your order

### Interactive Features

- Visual selection feedback with animations
- Hover effects and smooth transitions
- Responsive design for mobile and desktop
- Toast notifications for user feedback

### Settings Management

- GCash merchant account configuration
- Reference number format customization
- Auto-verification settings for small amounts

### Activity Tracking

- Recent payment activities display
- Status indicators (completed, pending, failed)
- Transaction history with timestamps

## Usage

1. Open `payment-types-standalone.html` in a web browser
2. Click on any payment type card to select it
3. Configure payment settings in the settings panel
4. View recent activities in the activities section

## Data Storage

The application uses localStorage to persist:

- Selected payment type
- Payment settings
- Transaction history
- User preferences

## Dependencies

- Lucide icons (loaded from CDN)
- Inter font (Google Fonts)
- Shared CSS files from the main project

## Integration

This standalone version can be easily integrated into larger applications or used independently. The JavaScript functions are self-contained and don't require external dependencies beyond the included shared utilities.
