// ============================================================
// UPRESSease — student.js
// Shared across all separated HTML pages via anchor navigation
// ============================================================

// ============================================================
// USER SYSTEM
// ============================================================
const User = {
    save(data) { localStorage.setItem('upressUser', JSON.stringify(data)); },
    get() { try { return JSON.parse(localStorage.getItem('upressUser') || 'null'); } catch { return null; } },
    update(patch) { const u = this.get() || {}; this.save({ ...u, ...patch }); },
    clear() { localStorage.removeItem('upressUser'); },
    isLoggedIn() { return !!this.get(); }
};

// ============================================================
// CART SYSTEM
// ============================================================
const Cart = {
    get() { try { return JSON.parse(localStorage.getItem('upressCart') || '[]'); } catch { return []; } },
    save(cart) { localStorage.setItem('upressCart', JSON.stringify(cart)); },
    add(item) {
        const cart = this.get();
        item.cartId = 'CART-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        item.addedAt = new Date().toISOString();
        cart.push(item);
        this.save(cart);
        updateCartBadge();
        return item.cartId;
    },
    remove(cartId, onDone) {
        showConfirm('Remove Item', 'Are you sure you want to remove this item from your cart?', () => {
            this.save(this.get().filter(i => i.cartId !== cartId));
            updateCartBadge();
            if (onDone) onDone();
        });
    },
    clear() { localStorage.removeItem('upressCart'); updateCartBadge(); },
    count() { return this.get().length; },
    total() { return this.get().reduce((s, i) => s + parseFloat(i.total || 0), 0); }
};

// ============================================================
// ORDERS SYSTEM
// ============================================================
const Orders = {
    getAll() { try { return JSON.parse(localStorage.getItem('upressOrders') || '[]'); } catch { return []; } },
    save(orders) { localStorage.setItem('upressOrders', JSON.stringify(orders)); },
    add(orderData) {
        const orders = this.getAll();
        const orderId = 'ORD-' + Date.now();
        const pm = orderData.paymentMethod || '';
        const paymentStatus =
            pm.indexOf('GCash') !== -1 ? 'awaiting_proof' : 'due_at_pickup';
        const fullOrder = {
            ...orderData,
            orderId,
            dateOrdered: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'Pending',
            paymentVerified: false,
            paymentStatus
        };
        orders.unshift(fullOrder);
        this.save(orders);
        return orderId;
    },
    updateStatus(orderId, status) {
        const orders = this.getAll();
        const i = orders.findIndex(o => o.orderId === orderId);
        if (i !== -1) { orders[i].status = status; this.save(orders); }
    }
};

// ============================================================
// CHECKOUT STATE
// ============================================================
const Checkout = {
    get() { try { return JSON.parse(localStorage.getItem('upressCheckout') || '{}'); } catch { return {}; } },
    set(data) { localStorage.setItem('upressCheckout', JSON.stringify({ ...this.get(), ...data })); },
    clear() { localStorage.removeItem('upressCheckout'); }
};

// ============================================================
// MODAL SYSTEM
// ============================================================
function initModals() {
    if (document.getElementById('upress-modal-overlay')) return;
    const el = document.createElement('div');
    el.innerHTML = `
    <div id="upress-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;align-items:center;justify-content:center;">
        <div id="upress-modal-box" style="background:white;border-radius:0.9375rem;padding:2rem;max-width:26rem;width:90%;box-shadow:0 0.5rem 2rem rgba(0,0,0,0.2);font-family:'Segoe UI',sans-serif;animation:modalIn 0.2s ease;">
            <h3 id="upress-modal-title" style="margin:0 0 0.75rem;font-size:1.125rem;color:#333;"></h3>
            <p id="upress-modal-msg" style="margin:0 0 1.5rem;font-size:0.9375rem;color:#555;line-height:1.5;white-space:pre-line;"></p>
            <div id="upress-modal-input-wrap" style="display:none;margin-bottom:1rem;">
                <input id="upress-modal-input" type="text" style="width:100%;padding:0.75rem;border:1px solid #e0e0e0;border-radius:0.5rem;font-size:0.875rem;font-family:'Segoe UI',sans-serif;outline:none;">
            </div>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                <button id="upress-modal-cancel" style="padding:0.625rem 1.25rem;border-radius:0.5rem;border:1.5px solid #e0e0e0;background:white;color:#555;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:'Segoe UI',sans-serif;">Cancel</button>
                <button id="upress-modal-confirm" style="padding:0.625rem 1.25rem;border-radius:0.5rem;border:none;background:#a32020;color:white;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:'Segoe UI',sans-serif;">Confirm</button>
            </div>
        </div>
    </div>
    <style>@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}</style>`;
    document.body.appendChild(el);
}

function showConfirm(title, message, onConfirm, onCancel) {
    initModals();
    const overlay = document.getElementById('upress-modal-overlay');
    document.getElementById('upress-modal-title').textContent = title;
    document.getElementById('upress-modal-msg').textContent = message;
    document.getElementById('upress-modal-cancel').style.display = '';
    document.getElementById('upress-modal-confirm').textContent = 'Confirm';
    document.getElementById('upress-modal-input-wrap').style.display = 'none';
    overlay.style.display = 'flex';
    const close = () => { overlay.style.display = 'none'; };
    document.getElementById('upress-modal-confirm').onclick = () => { close(); if (onConfirm) onConfirm(); };
    document.getElementById('upress-modal-cancel').onclick  = () => { close(); if (onCancel)  onCancel(); };
    overlay.onclick = e => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };
}

function showAlert(title, message, onOk) {
    initModals();
    const overlay = document.getElementById('upress-modal-overlay');
    document.getElementById('upress-modal-title').textContent = title;
    document.getElementById('upress-modal-msg').textContent = message;
    document.getElementById('upress-modal-cancel').style.display = 'none';
    document.getElementById('upress-modal-confirm').textContent = 'OK';
    document.getElementById('upress-modal-input-wrap').style.display = 'none';
    overlay.style.display = 'flex';
    document.getElementById('upress-modal-confirm').onclick = () => {
        overlay.style.display = 'none';
        document.getElementById('upress-modal-cancel').style.display = '';
        document.getElementById('upress-modal-confirm').textContent = 'Confirm';
        if (onOk) onOk();
    };
}

function showPrompt(title, message, placeholder, onConfirm, onCancel) {
    initModals();
    const overlay = document.getElementById('upress-modal-overlay');
    document.getElementById('upress-modal-title').textContent = title;
    document.getElementById('upress-modal-msg').textContent = message;
    document.getElementById('upress-modal-cancel').style.display = '';
    document.getElementById('upress-modal-confirm').textContent = 'Confirm';
    const wrap = document.getElementById('upress-modal-input-wrap');
    const inp  = document.getElementById('upress-modal-input');
    wrap.style.display = 'block';
    inp.placeholder = placeholder || '';
    inp.value = '';
    overlay.style.display = 'flex';
    setTimeout(() => inp.focus(), 100);
    const close = () => { overlay.style.display = 'none'; wrap.style.display = 'none'; };
    document.getElementById('upress-modal-confirm').onclick = () => { const v = inp.value.trim(); close(); if (onConfirm) onConfirm(v); };
    document.getElementById('upress-modal-cancel').onclick  = () => { close(); if (onCancel) onCancel(); };
    overlay.onclick = e => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };
}

// ============================================================
// NAVIGATION — uses anchor tags (window.location.href)
// ============================================================
// Base path detection: works from any subfolder depth
function getBase() {
    // All pages are in assets/pages/student/ so base is ../../../
    return '../../../';
}

function goTo(page) {
    // Map page names to filenames
    const map = {
        'login':           'index.html',
        'signup':          'signup.html',
        'terms':           'terms.html',
        'dashboard':       'dashboard.html',
        'cart':            'cart.html',
        'printing':        'printing.html',
        'binding':         'binding.html',
        'binding-details': 'binding-details.html',
        'mug':             'mug.html',
        'lanyard':         'lanyard.html',
        'payment':         'payment.html',
        'pay-method':      'pay-method.html',
        'gcash':           'gcash.html',
        'confirm':         'confirm.html',
        'orders':          'orders.html'
    };
    if (map[page]) {
        window.location.href = map[page];
    }
}

// ============================================================
// CART BADGE — updates ALL badge elements on current page
// ============================================================
function updateCartBadge() {
    const count = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.textContent = count > 0 ? count : '';
        b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
    const dashBadge = document.getElementById('dash-cart-badge');
    if (dashBadge) {
        dashBadge.textContent = count;
        dashBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// ============================================================
// COLLEGE → COURSE DROPDOWN
// ============================================================
const courseByCollege = {
    'College of Arts and Sciences': ['BA English', 'BA Psychology', 'BS Biology', 'BS Mathematics'],
    'College of Education': ['BEEd', 'BSEd Math', 'BSEd Science', 'BSEd English'],
    'College of Engineering': ['BS Civil Engineering', 'BS Mechanical Engineering', 'BS Electrical Engineering', 'BS Computer Engineering'],
    'College of Business Administration': ['BSBA Marketing', 'BSBA Finance', 'BSBA Management', 'BS Accountancy'],
    'College of Computing Studies': ['BS Computer Science', 'BS Information Technology', 'BS Information Systems'],
    'College of Home Science and Industry': ['BS Hospitality Management', 'BS Nutrition', 'BS Fashion Design'],
    'College of Law': ['JD'],
    'College of Medicine': ['MD'],
    'College of Nursing': ['BS Nursing'],
    'College of Sports, Physical Education and Athletics': ['BPEd', 'BSPE'],
    'College of Forestry and Environmental Studies': ['BS Forestry', 'BS Environmental Science'],
    'College of Agriculture': ['BS Agriculture', 'BS Agricultural Engineering'],
    'College of Social Science and Humanities': ['BA Political Science', 'BA Sociology', 'BS Public Administration'],
    Other: ['Program to be confirmed at office'],
};

function populateCourses(collegeId, courseId) {
    const college      = document.getElementById(collegeId)?.value;
    const courseSelect = document.getElementById(courseId);
    if (!courseSelect) return;
    courseSelect.innerHTML = '<option value="">-- Select Course --</option>';
    if (college && courseByCollege[college]) {
        courseByCollege[college].forEach(c => {
            const o = document.createElement('option');
            o.value = c; o.textContent = c;
            courseSelect.appendChild(o);
        });
    }
}

// ============================================================
// UTILITY HELPERS
// ============================================================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
}

function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================
// RUN ON EVERY PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initModals();
    updateCartBadge();
});