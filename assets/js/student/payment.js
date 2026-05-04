// payment.js - PART 6: CHECKOUT
const cart = Cart.get();
const u    = User.get() || {};
const co   = Checkout.get();

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
    
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    
    if (subtotalEl) subtotalEl.textContent = '₱' + subtotal.toFixed(2);
    if (totalEl) totalEl.textContent = '₱' + total.toFixed(2);
}

function goBackToCart() {
    window.location.href = 'cart.html';
}

function proceedToConfirmation() {
    Checkout.set({ 
        customerInfo: {
            name: u.name,
            phone: u.phone,
            email: u.email
        }
    });
    window.location.href = 'pay-method.html';
}

// Initialize checkout display
renderCheckoutItems();
updateTotals();