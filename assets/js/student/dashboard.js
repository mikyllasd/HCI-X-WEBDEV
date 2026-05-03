// dashboard.js
const u = User.get();
if (!u) { window.location.href = '../auth/portal.html'; }

const accountStatus = u?.accountStatus || 'verified';
const canPlaceOrders = accountStatus === 'verified' && !u?.accountSuspended;

setText('welcome-name',  u?.name  || 'Student');
setText('welcome-email', u?.email || 'student@wmsu.edu.ph');

(function initAccountBanner() {
    const bar = document.getElementById('account-status-banner');
    if (!bar) return;
    if (accountStatus === 'pending') {
        bar.style.display = 'block';
        bar.className = 'account-status-banner account-status-banner--pending';
        bar.innerHTML =
            '<strong>Pending verification</strong> — Your enrollment is being reviewed. You can browse services, ' +
            'but placing orders is disabled until an administrator approves your account.';
    } else if (accountStatus === 'verified') {
        bar.style.display = 'none';
    }
})();

function serviceHref(page) {
    if (!canPlaceOrders) {
        showAlert('Verification required', 'You must have a verified account before placing orders.');
        return;
    }
    window.location.href = page;
}

/* ===================== SIDEBAR ===================== */
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderSidebarOrders(); // always refresh orders on open
    renderSidebarCart();
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function openSidebarCart() {
    openSidebar();
    const tabs = document.querySelectorAll('.sidebar-tab');
    tabs.forEach(t => t.classList.remove('active'));
    tabs[1].classList.add('active');
    switchSidebarTab('cart', tabs[1]);
}

function switchSidebarTab(tab, el) {
    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
    if (tab === 'cart')    renderSidebarCart();
    if (tab === 'orders')  renderSidebarOrders();
    if (tab === 'history') renderSidebarHistory();
}

// Navigate to full orders page
function goToFullOrders() {
    closeSidebar();
    window.location.href = 'orders.html';
}

/* ===================== SIDEBAR ORDERS ===================== */
function renderSidebarOrders() {
    const listEl = document.getElementById('sidebar-orders-list');
    if (!listEl) return;

    // Active = not Completed, not Cancelled
    const allOrders = Orders.getAll();
    const active = allOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');

    if (active.length === 0) {
        listEl.innerHTML = `
            <div class="sidebar-empty-state">
                <div class="sidebar-empty-icon"><span class="upress-icon upress-icon--pkg" aria-hidden="true"></span></div>
                <p>No active orders yet.</p>
                <button class="sidebar-browse-btn" onclick="closeSidebar()">Browse Services</button>
            </div>`;
        return;
    }

    // Show up to 5 in sidebar; link to full page for more
    const shown = active.slice(0, 5);
    listEl.innerHTML = shown.map(o => {
        const items = Array.isArray(o.items) ? o.items : [o];
        const total = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
        const name  = items[0]?.service || 'Order';
        return `
        <div class="sidebar-order-item">
            <div class="sidebar-order-name">${escHtml(name)}${items.length > 1 ? ` +${items.length - 1}` : ''}</div>
            <div class="sidebar-order-meta">
                ${escHtml(o.orderId || '')}
                <span class="sidebar-order-status status-${escHtml(o.status || 'Pending')}">
                    ${escHtml(o.status || 'Pending')}
                </span>
            </div>
            <div class="sidebar-order-price">₱${total.toFixed(2)}</div>
        </div>`;
    }).join('');

    if (active.length > 5) {
        listEl.innerHTML += `
        <div style="text-align:center;padding:0.5rem 0;">
            <button onclick="goToFullOrders()" style="background:none;border:none;color:#8B0000;font-weight:700;cursor:pointer;font-size:0.8125rem;font-family:'Segoe UI',sans-serif;">
                View all ${active.length} orders →
            </button>
        </div>`;
    }
}

/* ===================== SIDEBAR HISTORY ===================== */
function renderSidebarHistory() {
    const listEl = document.getElementById('sidebar-history-list');
    if (!listEl) return;

    const allOrders = Orders.getAll();
    const history = allOrders.filter(o => o.status === 'Completed' || o.status === 'Cancelled');

    if (history.length === 0) {
        listEl.innerHTML = `
            <div class="sidebar-empty-state">
                <div class="sidebar-empty-icon"><span class="upress-icon upress-icon--clock" aria-hidden="true"></span></div>
                <p>No completed orders yet.</p>
            </div>`;
        return;
    }

    const shown = history.slice(0, 5);
    listEl.innerHTML = shown.map(o => {
        const items = Array.isArray(o.items) ? o.items : [o];
        const total = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
        const name  = items[0]?.service || 'Order';
        const iconHtml = o.status === 'Completed'
            ? '<span class="upress-icon upress-icon--check" style="width:0.85rem;height:0.85rem;color:#27ae60" aria-hidden="true"></span>'
            : '<span class="upress-icon upress-icon--x" style="width:0.85rem;height:0.85rem;color:#c0392b" aria-hidden="true"></span>';
        const color = o.status === 'Completed' ? '#27ae60' : '#c0392b';
        return `
        <div class="sidebar-order-item">
            <div class="sidebar-order-name">${escHtml(name)}</div>
            <div class="sidebar-order-meta" style="color:${color};display:flex;align-items:center;gap:0.25rem;">${iconHtml}<span>${escHtml(o.status)} · ${escHtml(o.dateOrdered || '')}</span></div>
            <div class="sidebar-order-price">₱${total.toFixed(2)}</div>
        </div>`;
    }).join('');

    if (history.length > 5) {
        listEl.innerHTML += `
        <div style="text-align:center;padding:0.5rem 0;">
            <button onclick="goToFullOrders()" style="background:none;border:none;color:#8B0000;font-weight:700;cursor:pointer;font-size:0.8125rem;font-family:'Segoe UI',sans-serif;">
                View all history →
            </button>
        </div>`;
    }
}

/* ===================== SIDEBAR CART ===================== */
let sidebarSelected = new Set();

function renderSidebarCart() {
    const cart = Cart.get();
    const listEl = document.getElementById('sidebar-cart-list');
    if (!listEl) return;

    sidebarSelected = new Set([...sidebarSelected].filter(id => cart.find(i => i.cartId === id)));

    if (cart.length === 0) {
        listEl.innerHTML = `
            <div class="sidebar-empty-state">
                <div class="sidebar-empty-icon"><span class="upress-icon upress-icon--cart" aria-hidden="true"></span></div>
                <p>Your cart is empty.</p>
                <button class="sidebar-browse-btn" onclick="closeSidebar()">Browse Services</button>
            </div>`;
        updateSidebarCartFooter();
        updateSidebarSelectAll();
        return;
    }

    listEl.innerHTML = cart.map(item => {
        const checked = sidebarSelected.has(item.cartId);
        const unitPrice = item.unitPrice
            ? parseFloat(item.unitPrice)
            : (parseFloat(item.total) / (item.qty || 1));
        return `
        <div class="sidebar-cart-item" id="sc-row-${item.cartId}">
            <label class="sc-check-wrap">
                <input type="checkbox" class="sc-check" data-id="${item.cartId}"
                    ${checked ? 'checked' : ''}
                    onchange="sidebarToggleItem('${item.cartId}', this.checked)" />
            </label>
            <div class="sc-info">
                <div class="sc-service">${escHtml(item.service)}</div>
                <div class="sc-desc">${escHtml((item.desc || '').substring(0, 55))}${(item.desc || '').length > 55 ? '…' : ''}</div>
                <div class="sc-qty-row">
                    <button class="sc-qty-btn" onclick="sidebarChangeQty('${item.cartId}', -1)">−</button>
                    <span class="sc-qty-val">${item.qty || 1}</span>
                    <button class="sc-qty-btn" onclick="sidebarChangeQty('${item.cartId}', 1)">+</button>
                    <span class="sc-unit-price">@ ₱${unitPrice.toFixed(2)}</span>
                </div>
            </div>
            <div class="sc-right">
                <div class="sc-price">₱${parseFloat(item.total).toFixed(2)}</div>
                <button type="button" class="sc-remove-btn" onclick="sidebarRemoveItem('${item.cartId}')" aria-label="Remove from cart"><span class="upress-icon upress-icon--trash" aria-hidden="true"></span></button>
            </div>
        </div>`;
    }).join('');

    updateSidebarCartFooter();
    updateSidebarSelectAll();
    updateNavBadges();
}

function sidebarToggleItem(cartId, checked) {
    if (checked) sidebarSelected.add(cartId);
    else sidebarSelected.delete(cartId);
    updateSidebarCartFooter();
    updateSidebarSelectAll();
}

function sidebarSelectAll(checked) {
    const cart = Cart.get();
    if (checked) cart.forEach(i => sidebarSelected.add(i.cartId));
    else sidebarSelected.clear();
    renderSidebarCart();
}

function updateSidebarSelectAll() {
    const cart = Cart.get();
    const allCheckEl = document.getElementById('sidebar-select-all');
    const countEl    = document.getElementById('sidebar-selected-count');
    if (!allCheckEl) return;
    if (cart.length === 0) {
        allCheckEl.checked = false; allCheckEl.indeterminate = false;
    } else if (sidebarSelected.size === cart.length) {
        allCheckEl.checked = true;  allCheckEl.indeterminate = false;
    } else if (sidebarSelected.size === 0) {
        allCheckEl.checked = false; allCheckEl.indeterminate = false;
    } else {
        allCheckEl.checked = false; allCheckEl.indeterminate = true;
    }
    if (countEl) countEl.textContent = sidebarSelected.size + ' selected';
}

function updateSidebarCartFooter() {
    const cart     = Cart.get();
    const selected = cart.filter(i => sidebarSelected.has(i.cartId));
    const total    = selected.reduce((s, i) => s + parseFloat(i.total), 0);
    const totalEl  = document.getElementById('sidebar-cart-total');
    const checkBtn = document.getElementById('sidebar-checkout-btn');
    if (totalEl)  totalEl.textContent = '₱' + total.toFixed(2);
    if (checkBtn) checkBtn.disabled = sidebarSelected.size === 0;
}

function sidebarChangeQty(cartId, delta) {
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
    renderSidebarCart();
    renderDashCartPreview();
}

function sidebarRemoveItem(cartId) {
    showConfirm('Remove Item', 'Remove this item from your cart?', () => {
        sidebarSelected.delete(cartId);
        Cart.save(Cart.get().filter(i => i.cartId !== cartId));
        updateCartBadge();
        renderSidebarCart();
        renderDashCartPreview();
    });
}

function sidebarClearCart() {
    if (Cart.count() === 0) { showAlert('Cart Empty', 'Your cart is already empty.'); return; }
    showConfirm('Clear Cart', 'Remove all items from your cart?', () => {
        Cart.clear();
        sidebarSelected.clear();
        renderSidebarCart();
        renderDashCartPreview();
    });
}

function sidebarCheckout() {
    if (!canPlaceOrders) {
        showAlert('Verification required', 'You must have a verified account before checking out.');
        return;
    }
    if (sidebarSelected.size === 0) {
        showAlert('No Items Selected', 'Please select at least one item to checkout.');
        return;
    }
    localStorage.setItem('upress_checkout_selected', JSON.stringify([...sidebarSelected]));
    closeSidebar();
    window.location.href = 'payment.html';
}

/* ===================== NOTIFICATIONS ===================== */
function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function clearNotifications() {
    document.getElementById('notif-list').innerHTML = `
        <div class="notif-empty">
            <div class="sidebar-empty-icon"><span class="upress-icon upress-icon--bell" aria-hidden="true"></span></div>
            <p>No notifications yet.</p>
        </div>`;
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
}

document.addEventListener('click', function (e) {
    const panel = document.getElementById('notif-panel');
    const btn   = document.getElementById('notif-btn');
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.style.display = 'none';
    }
});

/* ===================== NAV BADGES ===================== */
function updateNavBadges() {
    const count = Cart.count();
    const badge = document.getElementById('sidebar-cart-nav-badge');
    if (badge) {
        badge.style.display = count > 0 ? 'flex' : 'none';
        badge.textContent = count;
    }
}

/* ===================== DASH CART PREVIEW ===================== */
function renderDashCartPreview() {
    const cart    = Cart.get();
    const preview = document.getElementById('dash-cart-preview');
    if (!preview) return;
    if (cart.length === 0) { preview.style.display = 'none'; updateNavBadges(); return; }
    preview.style.display = 'block';
    const MAX = 3;
    const shown = cart.slice(0, MAX);
    const container = document.getElementById('dash-cart-preview-items');
    if (container) {
        container.innerHTML = shown.map(item => `
            <div class="dash-cart-preview-item">
                <span><span class="upress-icon upress-icon--cart" aria-hidden="true"></span> ${escHtml(item.service)} — ${item.desc ? escHtml(item.desc.substring(0, 40)) + (item.desc.length > 40 ? '…' : '') : ''}</span>
                <span style="font-weight:700;color:#a32020;">₱${item.total}</span>
            </div>`).join('');
        if (cart.length > MAX) {
            container.innerHTML += `<div style="font-size:0.8rem;color:#aaa;padding:0.25rem 0;">...and ${cart.length - MAX} more item(s)</div>`;
        }
    }
    const totalEl = document.getElementById('dash-cart-preview-total');
    if (totalEl) totalEl.textContent = '₱' + Cart.total().toFixed(2);
    updateNavBadges();
}

renderDashCartPreview();

function doLogout() {
    showConfirm('Logout', 'Are you sure you want to log out?', () => {
        User.clear();
        Checkout.clear();
        window.location.href = '../auth/portal.html';
    });
}