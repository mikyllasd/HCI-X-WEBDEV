// payment.js - PART 6: CHECKOUT
const cart = Cart.get();
const u    = User.get() || {};
const co   = Checkout.get();

const paymentPhoneInputWrap = document.getElementById('payment-phone-input-wrap');
const paymentSavedPhoneEl = document.getElementById('payment-saved-phone');
const paymentSavedPhoneActionsEl = document.getElementById('payment-saved-phone-actions');
const paymentOtpWrap = document.getElementById('payment-otp-wrap');
const paymentOtpMessageEl = document.getElementById('payment-otp-message');
const paymentOtpInfoEl = document.getElementById('payment-otp-info');
const paymentOtpInput = document.getElementById('payment-otp');
const paymentSendOtpButton = document.getElementById('payment-send-otp');
const paymentVerifyOtpButton = document.getElementById('payment-verify-otp');
const paymentPhoneInput = document.getElementById('payment-phone');

let paymentOtpCode = null;
let isPhoneVerified = false;

if (cart.length === 0) {
    showAlert('Empty Cart', 'Your cart is empty.', () => window.location.href = 'cart.html');
}

// Services that require appointment scheduling (to be scheduled after payment)
const appointmentRequiredServices = ['Binding Option 2', 'ID Printing — Lost', 'ID Printing — Damaged', 'ID Printing — Renewal'];

// Estimated completion days by service type
const estimatedCompletionDays = {
    'Printing': 2,
    'Binding': 5,
    'Lanyards': 7,
    'Mug Printing': 10,
    'ID Printing': 3
};

function getEstimatedCompletionDate(serviceType) {
    // Get base days from service type
    let days = 2; // default
    for (const [key, value] of Object.entries(estimatedCompletionDays)) {
        if (serviceType.includes(key)) {
            days = value;
            break;
        }
    }
    
    // Add 1 day per 5 orders in queue (simplified queue calculation)
    const allOrders = Orders.getAll();
    const pendingOrders = allOrders.filter(o => o.status === 'Pending' || o.status === 'Processing');
    const queueDays = Math.floor(pendingOrders.length / 5);
    
    const date = new Date();
    date.setDate(date.getDate() + days + queueDays);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderCheckoutItems() {
    const listEl = document.getElementById('checkout-items-list');
    const countEl = document.getElementById('checkout-item-count');
    
    if (!listEl) return;
    
    listEl.innerHTML = cart.map((item, idx) => {
        const isAppointmentRequired = appointmentRequiredServices.some(s => item.service.includes(s));
        const completionDate = isAppointmentRequired 
            ? 'To be scheduled after payment confirmation'
            : getEstimatedCompletionDate(item.service);
        
        let html = `
            <div class="checkout-item-card">
                <div class="checkout-item-header">
                    <h3 class="checkout-item-title">${escHtml(item.service)}</h3>
                </div>
                
                <div class="checkout-item-specs">
        `;
        
        // Specifications
        if (item.desc) {
            html += `<div class="spec-row"><span class="spec-label">Specifications:</span><span class="spec-value">${escHtml(item.desc)}</span></div>`;
        }
        
        // Quantity
        html += `<div class="spec-row"><span class="spec-label">Quantity:</span><span class="spec-value">${item.quantity || 1}</span></div>`;
        
        // Uploaded file thumbnail (if applicable)
        if (item.fileData || item.fileName) {
            html += `
                <div class="spec-row">
                    <span class="spec-label">Uploaded File:</span>
                    <span class="spec-value">
                        <span class="file-thumbnail">📄 ${escHtml(item.fileName || 'file.pdf')}</span>
                    </span>
                </div>
            `;
        }
        
        // Special instructions
        if (item.specialInstructions) {
            html += `<div class="spec-row"><span class="spec-label">Instructions:</span><span class="spec-value">${escHtml(item.specialInstructions)}</span></div>`;
        }
        
        // Pricing
        html += `
                </div>
                
                <div class="checkout-item-pricing">
                    <div class="pricing-row">
                        <span class="pricing-label">Unit Price:</span>
                        <span class="pricing-value">₱${parseFloat(item.price || 0).toFixed(2)}</span>
                    </div>
                    <div class="pricing-row">
                        <span class="pricing-label">Total:</span>
                        <span class="pricing-value pricing-value--bold">₱${parseFloat(item.total || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="checkout-item-timeline">
                    <span class="timeline-label">
                        ${isAppointmentRequired ? '📅 Appointment:' : '⏱️ Estimated:'}
                    </span>
                    <span class="timeline-value">${completionDate}</span>
                </div>
            </div>
        `;
        
        return html;
    }).join('');
    
    if (countEl) countEl.textContent = `${cart.length} item(s) in order`;
}

function updateTotals() {
    const subtotal = Cart.total();
    const total = subtotal; // No taxes/fees in this implementation
    const downpaymentThreshold = 500;
    const downpaymentEl = document.getElementById('checkout-downpayment');
    const downpaymentRow = document.getElementById('checkout-downpayment-row');
    const fullTotalRow = document.getElementById('checkout-full-total-row');
    const downpaymentNote = document.getElementById('checkout-downpayment-note');
    const totalLabel = document.getElementById('checkout-total-label');
    const totalEl = document.getElementById('checkout-total');
    const fullTotalEl = document.getElementById('checkout-full-total');
    const subtotalEl = document.getElementById('checkout-subtotal');

    if (subtotalEl) subtotalEl.textContent = '₱' + subtotal.toFixed(2);

    if (subtotal > downpaymentThreshold) {
        const downpayment = Math.ceil(subtotal * 0.20 * 100) / 100;
        if (downpaymentRow) downpaymentRow.style.display = 'flex';
        if (downpaymentEl) downpaymentEl.textContent = '₱' + downpayment.toFixed(2);
        if (downpaymentNote) downpaymentNote.style.display = 'block';
        if (fullTotalRow) fullTotalRow.style.display = 'flex';
        if (fullTotalEl) fullTotalEl.textContent = '₱' + total.toFixed(2);
        if (totalLabel) totalLabel.textContent = 'Downpayment Due';
        if (totalEl) totalEl.textContent = '₱' + downpayment.toFixed(2);
    } else {
        if (downpaymentRow) downpaymentRow.style.display = 'none';
        if (downpaymentNote) downpaymentNote.style.display = 'none';
        if (fullTotalRow) fullTotalRow.style.display = 'none';
        if (totalLabel) totalLabel.textContent = 'Total Amount Due';
        if (totalEl) totalEl.textContent = '₱' + total.toFixed(2);
    }
}

function showPhoneConfirmation() {
    const hasSavedPhone = u.phone && u.phone.trim().length > 0;
    if (!paymentSavedPhoneEl || !paymentSavedPhoneActionsEl || !paymentPhoneInputWrap) return;

    paymentPhoneInputWrap.style.display = 'none';
    paymentOtpWrap.style.display = 'none';
    paymentSavedPhoneEl.innerHTML = '';
    paymentSavedPhoneActionsEl.innerHTML = '';

    if (hasSavedPhone) {
        paymentSavedPhoneEl.innerHTML = `
            <p>We will use your registered phone number for payment updates:</p>
            <strong>+63 ${escHtml(u.phone.replace(/^0/, ''))}</strong>
        `;

        paymentSavedPhoneActionsEl.innerHTML = `
            <button type="button" class="btn btn-secondary" id="payment-use-saved">Use this number</button>
            <button type="button" class="btn btn-secondary" id="payment-use-another">Use another number</button>
        `;

        document.getElementById('payment-use-saved').addEventListener('click', () => {
            paymentPhoneInput.value = u.phone;
            isPhoneVerified = false;
            paymentOtpWrap.style.display = 'none';
            paymentPhoneInputWrap.style.display = 'block';
            paymentPhoneInput.focus();
        });

        document.getElementById('payment-use-another').addEventListener('click', () => {
            paymentPhoneInput.value = '';
            isPhoneVerified = false;
            paymentOtpWrap.style.display = 'none';
            paymentPhoneInputWrap.style.display = 'block';
            paymentPhoneInput.focus();
        });
    } else {
        paymentSavedPhoneEl.innerHTML = '<p>Please enter your mobile number to receive payment status updates.</p>';
        paymentSavedPhoneActionsEl.innerHTML = '';
        paymentPhoneInputWrap.style.display = 'block';
    }
}

function isValidPhilippinesPhone(phone) {
    return /^09\d{9}$/.test(phone);
}

function sendPaymentOtp(phone) {
    if (!paymentOtpWrap || !paymentOtpMessageEl || !paymentOtpInfoEl) return;
    if (!isValidPhilippinesPhone(phone)) {
        showAlert('Invalid phone number', 'Enter a valid 09XXXXXXXXX mobile number.');
        return;
    }

    paymentOtpCode = String(Math.floor(100000 + Math.random() * 900000));
    paymentOtpMessageEl.textContent = `Demo OTP sent to ${phone}: ${paymentOtpCode}`;
    paymentOtpInfoEl.textContent = 'Use this one-time code to verify your number in demo mode.';
    paymentOtpWrap.style.display = 'block';
    paymentOtpInput.value = '';
    isPhoneVerified = false;
}

function verifyPaymentOtp() {
    if (!paymentOtpInput || !paymentOtpMessageEl) return;
    const enteredOtp = paymentOtpInput.value.trim();
    if (!enteredOtp) {
        showAlert('OTP required', 'Please enter the OTP sent to your mobile number.');
        return;
    }

    if (enteredOtp === paymentOtpCode) {
        isPhoneVerified = true;
        paymentOtpMessageEl.textContent = 'Phone number verified successfully.';
        paymentOtpInfoEl.textContent = 'You may now proceed to payment.';
    } else {
        showAlert('Invalid OTP', 'The code you entered is not correct. Please try again.');
        isPhoneVerified = false;
    }
}

function goBackToCart() {
    window.location.href = 'cart.html';
}

function proceedToConfirmation() {
    if (!User.assertAccountApprovedForCheckout()) return;
    const phone = paymentPhoneInput ? paymentPhoneInput.value.trim() : u.phone;
    if (!isValidPhilippinesPhone(phone)) {
        showAlert('Invalid phone number', 'Please verify a valid 09XXXXXXXXX mobile number before continuing.');
        return;
    }

    if (!isPhoneVerified) {
        showAlert('Verify phone number', 'Please verify your mobile number with the OTP before confirming payment.');
        return;
    }

    const preferredPickupDate = document.getElementById('preferred-pickup-date')?.value;
    
    // Validate preferred pickup date if provided
    if (preferredPickupDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(preferredPickupDate);
        
        // For now, just check it's not in the past. Expected date validation will be done later
        if (selectedDate < today) {
            showAlert('Invalid Date', 'Preferred pickup date cannot be in the past.');
            return;
        }
    }

    Checkout.set({
        customerInfo: {
            name: u.name,
            phone,
            email: u.email
        },
        preferredPickupDate: preferredPickupDate || null
    });

    if (u.phone !== phone) {
        u.phone = phone;
        User.set(u);
    }

    window.location.href = 'pay-method.html';
}

function attachPaymentEvents() {
    if (paymentSendOtpButton) {
        paymentSendOtpButton.addEventListener('click', () => {
            const phone = paymentPhoneInput ? paymentPhoneInput.value.trim() : '';
            sendPaymentOtp(phone);
        });
    }

    if (paymentVerifyOtpButton) {
        paymentVerifyOtpButton.addEventListener('click', verifyPaymentOtp);
    }
}

// Initialize checkout display
renderCheckoutItems();
updateTotals();
showPhoneConfirmation();
attachPaymentEvents();