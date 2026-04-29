// cart.js
let cartSelected = new Set();
let editingCartId = null;

function renderCartPage() {
    const cart = Cart.get();
    const listEl      = document.getElementById('cart-items-list');
    const emptyEl     = document.getElementById('cart-empty-state');
    const countEl     = document.getElementById('cart-item-count');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    const selectAllWrap = document.getElementById('cart-select-all-wrap');

    if (!listEl) return;

    // Sync selection — prune removed items
    cartSelected = new Set([...cartSelected].filter(id => cart.find(i => i.cartId === id)));

    if (cart.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl)        emptyEl.style.display = 'block';
        if (countEl)        countEl.textContent = '0 item(s)';
        if (checkoutBtn)    checkoutBtn.disabled = true;
        if (selectAllWrap)  selectAllWrap.style.display = 'none';
        updateCartSummary();
        return;
    }

    if (emptyEl)       emptyEl.style.display = 'none';
    if (checkoutBtn)   checkoutBtn.disabled = cartSelected.size === 0;
    if (countEl)       countEl.textContent = cart.length + ' item(s)';
    if (selectAllWrap) selectAllWrap.style.display = 'flex';

    listEl.innerHTML = cart.map(item => {
        const checked = cartSelected.has(item.cartId);
        const unitPrice = item.unitPrice
            ? parseFloat(item.unitPrice)
            : (parseFloat(item.total) / (item.qty || 1));
        return `
        <div class="cart-item-row" id="cart-row-${item.cartId}">
            <label class="cart-check-wrap">
                <input type="checkbox" class="cart-item-check" data-id="${item.cartId}"
                    ${checked ? 'checked' : ''}
                    onchange="cartToggleItem('${item.cartId}', this.checked)" />
            </label>
            <div class="cart-item-info">
                <div class="cart-item-service">${escHtml(item.service)}</div>
                <div class="cart-item-desc-text">${escHtml(item.desc || '')}</div>
                ${item.addons && item.addons.length ? `<div style="font-size:0.75rem;color:#888;margin-top:0.2rem;">Add-ons: ${escHtml(item.addons.join(', '))}</div>` : ''}
                <div style="font-size:0.75rem;color:#bbb;margin-top:0.2rem;">Added ${new Date(item.addedAt).toLocaleString()}</div>
                <!-- Qty Controls -->
                <div class="cart-qty-row">
                    <button class="cart-qty-btn" onclick="cartChangeQty('${item.cartId}', -1)">−</button>
                    <span class="cart-qty-val">${item.qty || 1}</span>
                    <button class="cart-qty-btn" onclick="cartChangeQty('${item.cartId}', 1)">+</button>
                    <span class="cart-unit-price">@ ₱${unitPrice.toFixed(2)}</span>
                    <button class="cart-edit-btn" onclick="openEditModal('${item.cartId}')">✏️ Edit</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-item-price-tag">₱${parseFloat(item.total).toFixed(2)}</div>
                <button class="cart-remove-btn" onclick="removeCartItem('${item.cartId}')">🗑 Remove</button>
            </div>
        </div>`;
    }).join('');

    updateCartSummary();
    updateCartSelectAll();
}

function cartToggleItem(cartId, checked) {
    if (checked) cartSelected.add(cartId);
    else cartSelected.delete(cartId);
    updateCartSummary();
    updateCartSelectAll();
    const btn = document.getElementById('cart-checkout-btn');
    if (btn) btn.disabled = cartSelected.size === 0;
}

function cartSelectAll(checked) {
    const cart = Cart.get();
    if (checked) cart.forEach(i => cartSelected.add(i.cartId));
    else cartSelected.clear();
    renderCartPage();
}

function updateCartSelectAll() {
    const cart = Cart.get();
    const allCheckEl = document.getElementById('cart-select-all');
    if (!allCheckEl) return;
    if (cart.length === 0) {
        allCheckEl.checked = false;
        allCheckEl.indeterminate = false;
    } else if (cartSelected.size === cart.length) {
        allCheckEl.checked = true;
        allCheckEl.indeterminate = false;
    } else if (cartSelected.size === 0) {
        allCheckEl.checked = false;
        allCheckEl.indeterminate = false;
    } else {
        allCheckEl.checked = false;
        allCheckEl.indeterminate = true;
    }
}

function updateCartSummary() {
    const cart = Cart.get();
    const selected = cart.filter(i => cartSelected.has(i.cartId));
    const total = selected.reduce((s, i) => s + parseFloat(i.total), 0);

    const sumCountEl  = document.getElementById('cart-sum-count');
    const sumSubEl    = document.getElementById('cart-sum-subtotal');
    const sumTotalEl  = document.getElementById('cart-sum-total');

    if (sumCountEl)  sumCountEl.textContent  = cartSelected.size;
    if (sumSubEl)    sumSubEl.textContent    = '₱' + total.toFixed(2);
    if (sumTotalEl)  sumTotalEl.textContent  = '₱' + total.toFixed(2);
}

/* ===================== QTY INLINE ===================== */
function cartChangeQty(cartId, delta) {
    const cart = Cart.get();
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    const unitPrice = item.unitPrice
        ? parseFloat(item.unitPrice)
        : (parseFloat(item.total) / (item.qty || 1));
    const newQty = Math.max(1, (item.qty || 1) + delta);
    item.qty = newQty;
    item.unitPrice = unitPrice.toFixed(2);
    item.total = (unitPrice * newQty).toFixed(2);
    Cart.save(cart);
    renderCartPage();
}

/* ===================== EDIT MODAL ===================== */
function openEditModal(cartId) {
    const cart = Cart.get();
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    editingCartId = cartId;

    const unitPrice = item.unitPrice
        ? parseFloat(item.unitPrice)
        : (parseFloat(item.total) / (item.qty || 1));

    document.getElementById('edit-modal-item-name').textContent = item.service;
    document.getElementById('edit-modal-qty').value = item.qty || 1;
    document.getElementById('edit-modal-unit-price').textContent = '₱' + unitPrice.toFixed(2);
    document.getElementById('edit-modal-new-total').textContent = '₱' + parseFloat(item.total).toFixed(2);

    // Store unit price on input for live calculation
    const qtyInput = document.getElementById('edit-modal-qty');
    qtyInput.dataset.unit = unitPrice.toFixed(2);
    qtyInput.oninput = () => {
        const q = Math.max(1, parseInt(qtyInput.value) || 1);
        document.getElementById('edit-modal-new-total').textContent = '₱' + (parseFloat(qtyInput.dataset.unit) * q).toFixed(2);
    };

    document.getElementById('edit-qty-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-qty-modal').style.display = 'none';
    editingCartId = null;
}

function changeModalQty(delta) {
    const input = document.getElementById('edit-modal-qty');
    const newVal = Math.max(1, (parseInt(input.value) || 1) + delta);
    input.value = newVal;
    const unitPrice = parseFloat(input.dataset.unit || 0);
    document.getElementById('edit-modal-new-total').textContent = '₱' + (unitPrice * newVal).toFixed(2);
}

function saveEditQty() {
    if (!editingCartId) return;
    const cart = Cart.get();
    const item = cart.find(i => i.cartId === editingCartId);
    if (!item) { closeEditModal(); return; }

    const qtyInput = document.getElementById('edit-modal-qty');
    const newQty = Math.max(1, parseInt(qtyInput.value) || 1);
    const unitPrice = parseFloat(qtyInput.dataset.unit || 0);

    item.qty = newQty;
    item.unitPrice = unitPrice.toFixed(2);
    item.total = (unitPrice * newQty).toFixed(2);
    Cart.save(cart);
    closeEditModal();
    renderCartPage();
}

/* ===================== REMOVE / CLEAR ===================== */
function removeCartItem(cartId) {
    showConfirm('Remove Item', 'Remove this item from your cart?', () => {
        cartSelected.delete(cartId);
        Cart.remove(cartId, () => renderCartPage());
    });
}

function cartProceedCheckout() {
    if (cartSelected.size === 0) {
        showAlert('No Items Selected', 'Please select at least one item to checkout.');
        return;
    }
    localStorage.setItem('upress_checkout_selected', JSON.stringify([...cartSelected]));
    window.location.href = 'payment.html';
}

function cartClearAll() {
    if (Cart.count() === 0) { showAlert('Cart Empty', 'Your cart is already empty.'); return; }
    showConfirm('Clear Cart', 'Are you sure you want to remove all items from your cart?', () => {
        Cart.clear();
        cartSelected.clear();
        renderCartPage();
    });
}

renderCartPage();