// ============================================================
// UPRESS ease — Shared Cart & Order System
// Include this in every page: <script src="cart.js"></script>
// ============================================================

const Cart = {

    // --- GET CART ---
    get() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },

    // --- SAVE CART ---
    save(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    },

    // --- ADD ITEM ---
    add(item) {
        const cart = this.get();
        item.cartId = Date.now() + Math.random().toString(36).slice(2);
        cart.push(item);
        this.save(cart);
    },

    // --- REMOVE ITEM (with confirmation) ---
    remove(cartId) {
        return new Promise((resolve) => {
            showConfirm(
                'Remove Item',
                'Are you sure you want to remove this item from your cart?',
                () => {
                    let cart = this.get();
                    cart = cart.filter(i => i.cartId !== cartId);
                    this.save(cart);
                    resolve(true);
                },
                () => resolve(false)
            );
        });
    },

    // --- CLEAR CART ---
    clear() {
        localStorage.removeItem('cart');
    },

    // --- COUNT ---
    count() {
        return this.get().length;
    },

    // --- TOTAL ---
    total() {
        return this.get().reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
    }
};

const Orders = {

    getAll() {
        return JSON.parse(localStorage.getItem('allOrders') || '[]');
    },

    save(orders) {
        localStorage.setItem('allOrders', JSON.stringify(orders));
    },

    add(orderData) {
        const orders = this.getAll();
        orderData.orderId = 'ORD-' + Date.now();
        orderData.dateOrdered = new Date().toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        orderData.status = 'Pending';
        orders.unshift(orderData);
        this.save(orders);
        return orderData.orderId;
    },

    updateStatus(orderId, status) {
        const orders = this.getAll();
        const idx = orders.findIndex(o => o.orderId === orderId);
        if (idx !== -1) orders[idx].status = status;
        this.save(orders);
    }
};

// ============================================================
// MODAL SYSTEM
// ============================================================

function initModals() {
    if (document.getElementById('upress-modal-overlay')) return;
    const el = document.createElement('div');
    el.innerHTML = `
    <div id="upress-modal-overlay" style="
        display:none; position:fixed; inset:0; background:rgba(0,0,0,0.45);
        z-index:9999; align-items:center; justify-content:center;">
        <div id="upress-modal-box" style="
            background:white; border-radius:0.9375rem; padding:2rem;
            max-width:26rem; width:90%; box-shadow:0 0.5rem 2rem rgba(0,0,0,0.2);
            font-family:'Segoe UI',sans-serif; animation:modalIn 0.2s ease;">
            <h3 id="upress-modal-title" style="margin:0 0 0.75rem;font-size:1.125rem;color:#333;"></h3>
            <p id="upress-modal-msg" style="margin:0 0 1.5rem;font-size:0.9375rem;color:#555;line-height:1.5;"></p>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                <button id="upress-modal-cancel" style="
                    padding:0.625rem 1.25rem; border-radius:0.5rem; border:1.5px solid #e0e0e0;
                    background:white; color:#555; font-size:0.875rem; font-weight:600;
                    cursor:pointer; font-family:'Segoe UI',sans-serif;">Cancel</button>
                <button id="upress-modal-confirm" style="
                    padding:0.625rem 1.25rem; border-radius:0.5rem; border:none;
                    background:#a32020; color:white; font-size:0.875rem; font-weight:600;
                    cursor:pointer; font-family:'Segoe UI',sans-serif;">Confirm</button>
            </div>
        </div>
    </div>
    <style>
        @keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    </style>`;
    document.body.appendChild(el);
}

function showConfirm(title, message, onConfirm, onCancel) {
    initModals();
    const overlay = document.getElementById('upress-modal-overlay');
    document.getElementById('upress-modal-title').textContent = title;
    document.getElementById('upress-modal-msg').textContent = message;
    overlay.style.display = 'flex';

    const confirmBtn = document.getElementById('upress-modal-confirm');
    const cancelBtn = document.getElementById('upress-modal-cancel');

    const close = () => { overlay.style.display = 'none'; };

    confirmBtn.onclick = () => { close(); if (onConfirm) onConfirm(); };
    cancelBtn.onclick = () => { close(); if (onCancel) onCancel(); };
    overlay.onclick = (e) => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };
}

function showAlert(title, message, onOk) {
    initModals();
    const overlay = document.getElementById('upress-modal-overlay');
    document.getElementById('upress-modal-title').textContent = title;
    document.getElementById('upress-modal-msg').textContent = message;
    document.getElementById('upress-modal-cancel').style.display = 'none';
    document.getElementById('upress-modal-confirm').textContent = 'OK';
    overlay.style.display = 'flex';

    document.getElementById('upress-modal-confirm').onclick = () => {
        overlay.style.display = 'none';
        document.getElementById('upress-modal-cancel').style.display = '';
        document.getElementById('upress-modal-confirm').textContent = 'Confirm';
        if (onOk) onOk();
    };
}

// ============================================================
// CART BADGE (shows count on navbar)
// ============================================================
function updateCartBadge() {
    const count = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initModals();
    updateCartBadge();
});