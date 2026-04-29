// pay-method.js
const cart  = Cart.get();
const total = Cart.total();

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
if (totalEl) totalEl.textContent = '₱' + total.toFixed(2);

document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => { o.style.borderColor = '#e0e0e0'; o.style.background = ''; });
        opt.style.borderColor = '#a32020';
        opt.style.background  = '#fff9f9';
    });
});

function finalizeOrder(extra = {}) {
    const cartItems = Cart.get();
    const co        = Checkout.get();
    const customer  = co.customerInfo || {};
    cartItems.forEach(item => {
        Orders.add({ ...item, customer, ...extra });
    });
    Cart.clear();
    Checkout.clear();
    updateCartBadge();
}

function proceedPayment() {
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