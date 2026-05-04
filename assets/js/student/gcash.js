// gcash.js
const cart     = Cart.get();
const total    = Cart.total();
const co       = Checkout.get();
const customer = co.customerInfo || {};

const listEl  = document.getElementById('gcash-cart-items-list');
const totalEl = document.getElementById('gcash-sum-total');
const amtEl   = document.getElementById('gcash-amount');

if (listEl) {
    listEl.innerHTML = cart.map(item => `
        <div class="pay-cart-item-mini">
            <div>
                <div class="pay-cart-item-mini-name">${escHtml(item.service)}</div>
                <div class="pay-cart-item-mini-desc">${escHtml(item.desc || '')}</div>
            </div>
            <div class="pay-cart-item-mini-price">₱${parseFloat(item.total).toFixed(2)}</div>
        </div>`).join('');
}

// ===================== DOWNPAYMENT RULE =====================
const DOWNPAYMENT_THRESHOLD = 600;
let gcashAmountToPay = total;
let downpaymentInfo = {};

if (total >= DOWNPAYMENT_THRESHOLD) {
    const downpayment = total * 0.5;
    const balance = total - downpayment;
    gcashAmountToPay = downpayment;
    downpaymentInfo = {
        requiresDownpayment: true,
        downpaymentAmount: downpayment.toFixed(2),
        balanceDueAtPickup: balance.toFixed(2)
    };
    
    const downpaymentSection = document.getElementById('gcash-downpayment-section');
    if (downpaymentSection) {
        downpaymentSection.style.display = 'block';
        document.getElementById('gcash-downpayment').textContent = '₱' + downpayment.toFixed(2);
        document.getElementById('gcash-balance').textContent = '₱' + balance.toFixed(2);
    }
    
    const amountInfo = document.getElementById('gcash-amount-info');
    if (amountInfo) {
        amountInfo.style.display = 'block';
        amountInfo.textContent = '(50% downpayment - remaining ₱' + balance.toFixed(2) + ' due at pickup)';
    }
}

const totalStr = '₱' + total.toFixed(2);
if (totalEl) totalEl.textContent = totalStr;
if (amtEl)   amtEl.textContent   = '₱' + gcashAmountToPay.toFixed(2);

setText('gcash-info-name',  customer.name  || '—');
setText('gcash-info-phone', customer.phone || '—');
setText('gcash-info-date',  customer.date  || '—');

function submitGcashPayment() {
    const ref   = document.getElementById('gcash-ref')?.value.trim();
    const proof = document.getElementById('gcash-proof')?.files[0];
    if (!ref)   { showAlert('Missing Info', 'Please enter your GCash reference number.'); return; }
    if (!proof) { showAlert('Missing Info', 'Please upload your proof of payment screenshot.'); return; }
    cart.forEach(item => {
        Orders.add({ ...item, customer, paymentMethod: 'GCash', refNumber: ref, ...downpaymentInfo });
    });
    Cart.clear();
    Checkout.clear();
    updateCartBadge();
    window.location.href = 'confirm.html';
}