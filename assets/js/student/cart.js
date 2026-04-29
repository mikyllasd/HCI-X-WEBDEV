// cart.js
function renderCartPage() {
    const cart = Cart.get();
    const listEl      = document.getElementById('cart-items-list');
    const emptyEl     = document.getElementById('cart-empty-state');
    const countEl     = document.getElementById('cart-item-count');
    const sumCountEl  = document.getElementById('cart-sum-count');
    const sumSubEl    = document.getElementById('cart-sum-subtotal');
    const sumTotalEl  = document.getElementById('cart-sum-total');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (!listEl) return;
    if (cart.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl)     emptyEl.style.display = 'block';
        if (countEl)     countEl.textContent = '0 item(s)';
        if (sumCountEl)  sumCountEl.textContent = '0';
        if (sumSubEl)    sumSubEl.textContent = '₱0.00';
        if (sumTotalEl)  sumTotalEl.textContent = '₱0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    if (emptyEl)     emptyEl.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (countEl)     countEl.textContent = cart.length + ' item(s)';
    const total = Cart.total();
    if (sumCountEl)  sumCountEl.textContent = cart.length;
    if (sumSubEl)    sumSubEl.textContent   = '₱' + total.toFixed(2);
    if (sumTotalEl)  sumTotalEl.textContent = '₱' + total.toFixed(2);
    listEl.innerHTML = cart.map(item => `
        <div class="cart-item-row" id="cart-row-${item.cartId}">
            <div class="cart-item-info">
                <div class="cart-item-service">${escHtml(item.service)}</div>
                <div class="cart-item-desc-text">${escHtml(item.desc || '')}</div>
                ${item.addons && item.addons.length ? `<div style="font-size:0.75rem;color:#888;margin-top:0.2rem;">Add-ons: ${escHtml(item.addons.join(', '))}</div>` : ''}
                <div style="font-size:0.75rem;color:#bbb;margin-top:0.2rem;">Added ${new Date(item.addedAt).toLocaleString()}</div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-item-price-tag">₱${parseFloat(item.total).toFixed(2)}</div>
                <button class="cart-remove-btn" onclick="removeCartItem('${escHtml(item.cartId)}')">🗑 Remove</button>
            </div>
        </div>`).join('');
}

function removeCartItem(cartId) {
    Cart.remove(cartId, () => renderCartPage());
}

function cartProceedCheckout() {
    if (Cart.count() === 0) { showAlert('Empty Cart', 'Your cart is empty. Add items before checking out.'); return; }
    window.location.href = 'payment.html';
}

function cartClearAll() {
    if (Cart.count() === 0) { showAlert('Cart Empty', 'Your cart is already empty.'); return; }
    showConfirm('Clear Cart', 'Are you sure you want to remove all items from your cart?', () => {
        Cart.clear();
        renderCartPage();
    });
}

renderCartPage();