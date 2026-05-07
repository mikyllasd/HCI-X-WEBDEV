// pay-method.js
const cart  = Cart.get();
const co = Checkout.get ? Checkout.get() : {};
const grossTotal = Cart.total();
const netTotal =
    co && co.netAmount != null && Number.isFinite(Number(co.netAmount))
        ? Number(co.netAmount)
        : grossTotal;

const listEl  = document.getElementById('pm-cart-items-list');
const countEl = document.getElementById('pm-cart-count');
const totalEl = document.getElementById('pm-sum-total');

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
if (countEl) countEl.textContent = `${cart.length} item(s) in cart`;
if (totalEl) totalEl.textContent = '₱' + netTotal.toFixed(2);

// ===================== DOWNPAYMENT RULE =====================
const DOWNPAYMENT_THRESHOLD = 600;
const downpaymentSection = document.getElementById('downpayment-section');
if (netTotal >= DOWNPAYMENT_THRESHOLD) {
    const downpayment = netTotal * 0.5;
    const balance = netTotal - downpayment;
    downpaymentSection.style.display = 'block';
    document.getElementById('pm-downpayment').textContent = '₱' + downpayment.toFixed(2);
    document.getElementById('pm-balance').textContent = '₱' + balance.toFixed(2);
} else {
    downpaymentSection.style.display = 'none';
}

document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => { o.style.borderColor = '#e0e0e0'; o.style.background = ''; });
        opt.style.borderColor = '#a32020';
        opt.style.background  = '#fff9f9';
    });
});

function finalizeOrder(extra = {}) {
    if (!User.assertAccountApprovedForCheckout()) return;
    if (!User.assertVerifiedForOrganizationCheckout()) return;
    const cartItems = Cart.get();
    const co        = Checkout.get();
    const customer  = co.customerInfo || {};
    const totalAmount =
        co && co.netAmount != null && Number.isFinite(Number(co.netAmount))
            ? Number(co.netAmount)
            : Cart.total();
    const grossAmount =
        co && co.grossAmount != null && Number.isFinite(Number(co.grossAmount))
            ? Number(co.grossAmount)
            : Cart.total();
    const discountAmount =
        co && co.discountAmount != null && Number.isFinite(Number(co.discountAmount))
            ? Number(co.discountAmount)
            : Math.max(0, grossAmount - totalAmount);
    
    // Calculate downpayment info
    let downpaymentInfo = {};
    if (totalAmount >= DOWNPAYMENT_THRESHOLD) {
        downpaymentInfo = {
            requiresDownpayment: true,
            downpaymentAmount: (totalAmount * 0.5).toFixed(2),
            balanceDueAtPickup: (totalAmount * 0.5).toFixed(2)
        };
    }
    
    cartItems.forEach(item => {
        Orders.add({
            ...item,
            customer,
            ...downpaymentInfo,
            discountCode: String(co.discountCode || ''),
            discountId: String(co.discountId || ''),
            grossAmount: grossAmount.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            netAmount: totalAmount.toFixed(2),
            ...extra
        });
    });
    Cart.clear();
    Checkout.clear();
    updateCartBadge();
}

function proceedPayment() {
    if (!User.assertAccountApprovedForCheckout()) return;
    if (!User.assertVerifiedForOrganizationCheckout()) return;
    const selected = document.querySelector('input[name="payment"]:checked');
    if (!selected) { showAlert('No Selection', 'Please select a payment method to continue.'); return; }
    Checkout.set({ paymentMethod: selected.value });
    if (selected.value === 'gcash') {
        window.location.href = 'gcash.html';
    } else {
        finalizeOrder({ paymentMethod: 'Cash on Pick-up' });
        window.location.href = 'confirm.html';
    }
}