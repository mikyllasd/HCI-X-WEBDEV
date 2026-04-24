// ============================================================
// UPRESSease — script.js  (FULL SYSTEM REWRITE)
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
        const fullOrder = {
            ...orderData,
            orderId,
            dateOrdered: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'Pending'
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
// CART BADGE — updates ALL badge elements everywhere
// ============================================================
function updateCartBadge() {
    const count = Cart.count();
    // appbar cart-badge spans
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.textContent = count > 0 ? count : '';
        b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
    // dashboard badge
    const dashBadge = document.getElementById('dash-cart-badge');
    if (dashBadge) {
        dashBadge.textContent = count;
        dashBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// ============================================================
// DASHBOARD CART PREVIEW
// ============================================================
function renderDashCartPreview() {
    const cart = Cart.get();
    const preview = document.getElementById('dash-cart-preview');
    if (!preview) return;
    if (cart.length === 0) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    const MAX = 3;
    const shown = cart.slice(0, MAX);
    const container = document.getElementById('dash-cart-preview-items');
    if (container) {
        container.innerHTML = shown.map(item => `
            <div class="dash-cart-preview-item">
                <span>🛒 ${item.service} — ${item.desc ? item.desc.substring(0, 40) + (item.desc.length > 40 ? '...' : '') : ''}</span>
                <span style="font-weight:700;color:#a32020;">₱${item.total}</span>
            </div>`).join('');
        if (cart.length > MAX) {
            container.innerHTML += `<div style="font-size:0.8rem;color:#aaa;padding:0.25rem 0;">...and ${cart.length - MAX} more item(s)</div>`;
        }
    }
    const totalEl = document.getElementById('dash-cart-preview-total');
    if (totalEl) totalEl.textContent = '₱' + Cart.total().toFixed(2);
}

// ============================================================
// COLLEGE → COURSE DROPDOWN
// ============================================================
const courseByCollege = {
    'College of Arts and Sciences':       ['BA English', 'BA Psychology', 'BS Biology', 'BS Mathematics'],
    'College of Education':               ['BEEd', 'BSEd Math', 'BSEd Science', 'BSEd English'],
    'College of Engineering':             ['BS Civil Engineering', 'BS Mechanical Engineering', 'BS Electrical Engineering', 'BS Computer Engineering'],
    'College of Business Administration': ['BSBA Marketing', 'BSBA Finance', 'BSBA Management', 'BS Accountancy']
};

function populateCourses(collegeId, courseId) {
    const college     = document.getElementById(collegeId)?.value;
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
// PAGE ROUTER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initModals();
    updateCartBadge();
    routePage(document.body.dataset.page || 'landing');
});

function routePage(page) {
    const map = {
        landing:          initLanding,
        login:            initLogin,
        signup:           initSignup,
        dashboard:        initDashboard,
        cart:             initCart,
        printing:         initPrinting,
        binding:          initBinding,
        'binding-details': initBindingDetails,
        mug:              initMug,
        lanyard:          initLanyard,
        payment:          initPayment,
        'pay-method':     initPayMethod,
        gcash:            initGcash,
        orders:           initOrders,
        confirm:          initConfirm
    };
    if (map[page]) map[page]();
}

// ============================================================
// SPA PAGE SWITCHER
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.spa-page').forEach(p => p.style.display = 'none');
    const target = document.getElementById('page-' + pageId);
    if (target) { target.style.display = 'block'; window.scrollTo(0, 0); }
    document.body.dataset.page = pageId;
    routePage(pageId);
    updateCartBadge();
}

// ============================================================
// LANDING PAGE
// ============================================================
function initLanding() {
    const observer = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }),
        { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ============================================================
// LOGIN PAGE
// ============================================================
function initLogin() {
    const form = document.getElementById('login-form');
    if (!form || form._bound) return;
    form._bound = true;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value.trim();
        const pass  = document.getElementById('login-password')?.value;
        if (!email || !pass) { showAlert('Missing Info', 'Please enter email and password.'); return; }
        // Check if user exists in storage
        const existing = User.get();
        if (existing && existing.email === email) {
            showPage('dashboard');
        } else {
            // Demo login: create session
            User.save({ name: email.split('@')[0], email, phone: '', college: '', course: '', year: '' });
            showPage('dashboard');
        }
    });
}

// ============================================================
// SIGN UP PAGE
// ============================================================
let _otp = null;
let _otpVerified = false;

function initSignup() {
    _otp = null;
    _otpVerified = false;
    const statusEl = document.getElementById('otp-status');
    if (statusEl) statusEl.textContent = '';
    const otpInput = document.getElementById('user-otp');
    if (otpInput) { otpInput.disabled = true; otpInput.value = ''; }
}

function sendOtp() {
    const email = document.getElementById('signup-email')?.value.trim();
    const phone = document.getElementById('signup-phone')?.value.trim();
    if (!email || !phone) { showAlert('Missing Info', 'Please enter your email and phone number first.'); return; }
    _otp = Math.floor(100000 + Math.random() * 900000).toString();
    _otpVerified = false;
    const otpInput = document.getElementById('user-otp');
    if (otpInput) { otpInput.disabled = false; otpInput.value = ''; }
    const statusEl = document.getElementById('otp-status');
    if (statusEl) { statusEl.textContent = `📱 OTP sent to ${phone}. (Demo code: ${_otp})`; statusEl.style.color = '#888'; }
}

function verifyOtp() {
    const entered  = document.getElementById('user-otp')?.value.trim();
    const statusEl = document.getElementById('otp-status');
    if (entered === _otp && _otp) {
        _otpVerified = true;
        if (statusEl) { statusEl.textContent = '✅ OTP verified!'; statusEl.style.color = 'green'; }
    } else {
        _otpVerified = false;
        if (statusEl) { statusEl.textContent = '❌ Invalid OTP. Please try again.'; statusEl.style.color = '#d43434'; }
    }
}

function validateSignup(e) {
    e.preventDefault();
    const name    = document.getElementById('signup-name')?.value.trim();
    const email   = document.getElementById('signup-email')?.value.trim();
    const phone   = document.getElementById('signup-phone')?.value.trim();
    const college = document.getElementById('signup-college')?.value;
    const course  = document.getElementById('signup-course')?.value;
    const year    = document.getElementById('signup-year')?.value;

    if (!name || !email || !phone || !college || !course || !year) {
        showAlert('Missing Info', 'Please fill in all required fields.'); return false;
    }
    if (!_otpVerified) {
        showAlert('OTP Required', 'Please verify your phone number with OTP before proceeding.'); return false;
    }
    const terms = document.getElementById('terms-check');
    if (!terms?.checked) {
        showAlert('Terms Required', 'Please agree to the terms and conditions.'); return false;
    }
    User.save({ name, email, phone, college, course, year });
    showAlert('Account Created! 🎉', `Welcome, ${name}! Your account has been created successfully.`, () => showPage('login'));
    return false;
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
function initDashboard() {
    const u = User.get();
    setText('welcome-name',  u?.name  || 'Student');
    setText('welcome-email', u?.email || 'student@wmsu.edu.ph');
    renderDashCartPreview();
}

function doLogout() {
    showConfirm('Logout', 'Are you sure you want to log out?', () => {
        User.clear();
        Checkout.clear();
        showPage('login');
    });
}

// ============================================================
// CART PAGE
// ============================================================
function initCart() {
    renderCartPage();
}

function renderCartPage() {
    const cart = Cart.get();
    const listEl   = document.getElementById('cart-items-list');
    const emptyEl  = document.getElementById('cart-empty-state');
    const countEl  = document.getElementById('cart-item-count');
    const sumCountEl  = document.getElementById('cart-sum-count');
    const sumSubEl    = document.getElementById('cart-sum-subtotal');
    const sumTotalEl  = document.getElementById('cart-sum-total');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    if (!listEl) return;

    if (cart.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl)  emptyEl.style.display = 'block';
        if (countEl)  countEl.textContent = '0 item(s)';
        if (sumCountEl) sumCountEl.textContent = '0';
        if (sumSubEl)   sumSubEl.textContent = '₱0.00';
        if (sumTotalEl) sumTotalEl.textContent = '₱0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (countEl)  countEl.textContent = cart.length + ' item(s)';

    const total = Cart.total();
    if (sumCountEl) sumCountEl.textContent = cart.length;
    if (sumSubEl)   sumSubEl.textContent   = '₱' + total.toFixed(2);
    if (sumTotalEl) sumTotalEl.textContent = '₱' + total.toFixed(2);

    listEl.innerHTML = cart.map((item, idx) => `
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
    const cart = Cart.get();
    if (cart.length === 0) { showAlert('Empty Cart', 'Your cart is empty. Add items before checking out.'); return; }
    showPage('payment');
}

function cartClearAll() {
    if (Cart.count() === 0) { showAlert('Cart Empty', 'Your cart is already empty.'); return; }
    showConfirm('Clear Cart', 'Are you sure you want to remove all items from your cart?', () => {
        Cart.clear();
        renderCartPage();
    });
}

// ============================================================
// PRINTING ORDER PAGE
// ============================================================
function initPrinting() {
    const fi = document.getElementById('print-file-input');
    if (fi && !fi._bound) {
        fi._bound = true;
        fi.addEventListener('change', function() {
            const d = document.getElementById('print-file-name');
            if (d) { d.textContent = this.files[0] ? '📎 ' + this.files[0].name : ''; d.style.display = this.files[0] ? 'block' : 'none'; }
        });
    }
    calcPrintTotal();
}

function calcPrintTotal() {
    const colorSel = document.getElementById('print-color');
    if (!colorSel) return 0;
    const priceEach = parseFloat(colorSel.options[colorSel.selectedIndex]?.dataset.price || 0);
    const pages = Math.max(1, parseInt(document.getElementById('print-pages')?.value) || 1);
    const qty   = Math.max(1, parseInt(document.getElementById('print-qty')?.value)   || 1);
    let total = priceEach * pages * qty;

    const addons = [];
    if (document.getElementById('print-binding')?.checked)    { total += 50; addons.push('Binding'); }
    if (document.getElementById('print-lamination')?.checked) { total += 10 * pages * qty; addons.push('Lamination'); }
    if (document.getElementById('print-rush')?.checked)       { total += 100; addons.push('Rush Fee'); }

    const paper = document.getElementById('print-paper')?.value || '—';
    const color = colorSel.options[colorSel.selectedIndex]?.value || '—';

    setText('sum-print-paper', paper);
    setText('sum-print-color', color);
    setText('sum-print-pages', pages);
    setText('sum-print-qty',   qty);
    setText('sum-print-total', '₱' + total.toFixed(2));

    const addonsRow = document.getElementById('print-addons-row');
    if (addonsRow) {
        if (addons.length) { setText('sum-print-addons', addons.join(', ')); addonsRow.style.display = 'flex'; }
        else addonsRow.style.display = 'none';
    }
    return total;
}

function getPrintOrderData() {
    const colorSel = document.getElementById('print-color');
    const paper = document.getElementById('print-paper')?.value;
    const color = colorSel?.options[colorSel.selectedIndex]?.value;
    const pages = Math.max(1, parseInt(document.getElementById('print-pages')?.value) || 1);
    const qty   = Math.max(1, parseInt(document.getElementById('print-qty')?.value)   || 1);
    const total = calcPrintTotal();
    const addons = [];
    if (document.getElementById('print-binding')?.checked)    addons.push('Binding');
    if (document.getElementById('print-lamination')?.checked) addons.push('Lamination');
    if (document.getElementById('print-rush')?.checked)       addons.push('Rush Fee');
    return {
        service: 'Printing', paperSize: paper, color, pages, qty, addons,
        desc: `${qty} copy(ies) — ${paper || 'N/A'} (${color || 'N/A'}) × ${pages} pages${addons.length ? ' + ' + addons.join(', ') : ''}`,
        total: total.toFixed(2)
    };
}

function validatePrint() {
    if (!document.getElementById('print-paper')?.value) { showAlert('Missing Info', 'Please select a paper size.'); return false; }
    if (!document.getElementById('print-color')?.value) { showAlert('Missing Info', 'Please select a color option.'); return false; }
    if ((parseInt(document.getElementById('print-pages')?.value) || 0) < 1) { showAlert('Invalid Input', 'Number of pages must be at least 1.'); return false; }
    return true;
}

function printOrderNow() {
    if (!validatePrint()) return;
    showConfirm('Proceed to Checkout', 'Place this printing order and go to checkout?', () => {
        const data = getPrintOrderData();
        Cart.clear();
        Cart.add(data);
        showPage('payment');
    });
}

function printAddToCart() {
    if (!validatePrint()) return;
    const data = getPrintOrderData();
    Cart.add(data);
    showAlert('Added to Cart! 🛒', `Printing order added to your cart successfully.`);
}

// ============================================================
// BINDING ORDER PAGE
// ============================================================
let _bindingSelected = null, _bindingPrice = 0, _bindingQty = 1;

function initBinding() {
    _bindingSelected = null; _bindingPrice = 0; _bindingQty = 1;
    document.querySelectorAll('#binding-page .service-option').forEach(o => o.classList.remove('selected'));
    setText('binding-qty-display', '1');
    updateBindingBottom();
}

function selectBinding(el, name, price) {
    document.querySelectorAll('#binding-page .service-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    _bindingSelected = name; _bindingPrice = price;
    updateBindingBottom();
}

function changeBindingQty(delta) {
    _bindingQty = Math.max(1, _bindingQty + delta);
    setText('binding-qty-display', _bindingQty);
    updateBindingBottom();
}

function updateBindingBottom() {
    setText('binding-bottom-type',  _bindingSelected ? `${_bindingSelected} × ${_bindingQty}` : 'No binding selected');
    setText('binding-bottom-total', '₱' + (_bindingPrice * _bindingQty).toFixed(2));
}

function bindingGoNext() {
    if (!_bindingSelected) { showAlert('No Selection', 'Please select a binding type first.'); return; }
    Checkout.set({ bindingType: _bindingSelected, bindingPrice: _bindingPrice, bindingQty: _bindingQty });
    showPage('binding-details');
}

// ============================================================
// BINDING DETAILS PAGE
// ============================================================
function initBindingDetails() {
    const co = Checkout.get();
    const u  = User.get();
    setText('binding-sum-type',  co.bindingType  || '—');
    setText('binding-sum-qty',   co.bindingQty   || 1);
    setText('binding-sum-unit',  '₱' + parseFloat(co.bindingPrice || 0).toFixed(2));
    setText('binding-sum-total', '₱' + ((parseFloat(co.bindingPrice) || 0) * (parseInt(co.bindingQty) || 1)).toFixed(2));

    // Auto-fill user info
    if (u) {
        const nEl  = document.getElementById('binding-d-name');
        const pEl  = document.getElementById('binding-d-phone');
        const cEl  = document.getElementById('binding-d-college');
        const crEl = document.getElementById('binding-d-course');
        if (nEl  && !nEl.value)  nEl.value  = u.name    || '';
        if (pEl  && !pEl.value)  pEl.value  = u.phone   || '';
        if (cEl  && !cEl.value)  cEl.value  = u.college || '';
        if (crEl && !crEl.value) crEl.value = u.course ? `${u.course} ${u.year || ''}`.trim() : '';
    }
}

function getBindingOrderData() {
    const co = Checkout.get();
    const bPrice = parseFloat(co.bindingPrice) || 0;
    const bQty   = parseInt(co.bindingQty)     || 1;
    return {
        service: 'Binding',
        desc:    `${bQty} × ${co.bindingType}`,
        qty:     bQty,
        total:   (bPrice * bQty).toFixed(2),
        customer: {
            name:    document.getElementById('binding-d-name')?.value.trim()    || '',
            phone:   document.getElementById('binding-d-phone')?.value.trim()   || '',
            course:  document.getElementById('binding-d-course')?.value.trim()  || '',
            college: document.getElementById('binding-d-college')?.value.trim() || '',
            date:    document.getElementById('binding-d-date')?.value           || ''
        }
    };
}

function validateBindingDetails() {
    const co = Checkout.get();
    if (!co.bindingType)                                          { showAlert('No Selection', 'Please go back and select a binding type.'); return false; }
    if (!document.getElementById('binding-d-name')?.value.trim()) { showAlert('Missing Info', 'Please enter your full name.'); return false; }
    if (!document.getElementById('binding-d-phone')?.value.trim()){ showAlert('Missing Info', 'Please enter your phone number.'); return false; }
    if (!document.getElementById('binding-d-date')?.value)        { showAlert('Missing Info', 'Please select a preferred pick-up date.'); return false; }
    return true;
}

function bindingOrderNow() {
    if (!validateBindingDetails()) return;
    showConfirm('Proceed to Checkout', 'Place this binding order and proceed to payment?', () => {
        const data = getBindingOrderData();
        Cart.clear();
        Cart.add(data);
        Checkout.set({ customerInfo: data.customer });
        showPage('pay-method');
    });
}

function bindingAddToCart() {
    if (!validateBindingDetails()) return;
    Cart.add(getBindingOrderData());
    showAlert('Added to Cart! 🛒', `${Checkout.get().bindingType} × ${Checkout.get().bindingQty} added to your cart.`);
}

// ============================================================
// MUG ORDER PAGE
// ============================================================
let _mugType = 'wmsu', _mugTypeName = 'WMSU Logo Mug', _mugBasePrice = 200;

function initMug() {
    _mugType = 'wmsu'; _mugTypeName = 'WMSU Logo Mug'; _mugBasePrice = 200;
    document.querySelectorAll('#mug-page .option').forEach((o, i) => o.classList.toggle('active', i === 0));
    const deptField = document.getElementById('mug-dept-field');
    if (deptField) deptField.classList.add('hidden');
    buildMugPhotoForms();
    updateMugSummary();
}

function selectMugType(type, el) {
    document.querySelectorAll('#mug-page .option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _mugType = type;
    const deptField = document.getElementById('mug-dept-field');
    if (deptField) deptField.classList.add('hidden');
    if (type === 'wmsu')       { _mugBasePrice = 200; _mugTypeName = 'WMSU Logo Mug'; }
    if (type === 'department') { _mugBasePrice = 220; _mugTypeName = 'Department Mug'; deptField?.classList.remove('hidden'); }
    if (type === 'photo')      { _mugBasePrice = 250; _mugTypeName = 'Photo Print Mug'; }
    buildMugPhotoForms(); updateMugSummary();
}

function onMugQtyChange() { buildMugPhotoForms(); updateMugSummary(); }

function buildMugPhotoForms() {
    const container = document.getElementById('mug-photo-forms');
    if (!container) return;
    container.innerHTML = '';
    if (_mugType !== 'photo') return;
    const qty = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    for (let i = 1; i <= qty; i++) {
        container.innerHTML += `
        <div style="border:1px solid #e0e0e0;border-radius:0.75rem;padding:1.25rem;margin-bottom:1rem;">
            <div style="font-weight:700;color:#8B0000;margin-bottom:0.75rem;">📸 Mug ${i} of ${qty} — Upload Photo</div>
            <label class="dropzone" style="padding:1.25rem;cursor:pointer;">
                <input type="file" style="display:none;" id="mug-photo-${i}" accept="image/*">
                <div style="font-size:1.5rem;">🖼️</div>
                <div style="color:#a32020;font-weight:700;font-size:0.875rem;">Click to upload photo for Mug ${i}</div>
                <div style="color:#999;font-size:0.75rem;">PNG, JPG (MAX. 20MB)</div>
            </label>
            <div id="mug-file-${i}" style="display:none;font-size:0.8125rem;color:#555;margin-top:0.5rem;"></div>
            <div class="field" style="margin-top:0.75rem;margin-bottom:0;">
                <label class="label">Caption/Text (optional)</label>
                <input class="input" type="text" id="mug-caption-${i}" placeholder="e.g. John's Mug, Class 2025...">
            </div>
        </div>`;
    }
    for (let i = 1; i <= qty; i++) {
        const fi = document.getElementById(`mug-photo-${i}`);
        if (fi) fi.addEventListener('change', (function(idx) { return function() {
            const d = document.getElementById(`mug-file-${idx}`);
            if (d && this.files[0]) { d.textContent = '📎 ' + this.files[0].name; d.style.display = 'block'; }
        }; })(i));
    }
}

function updateMugSummary() {
    const qty     = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    const sizeEl  = document.getElementById('mug-size');
    const sizeExtra = sizeEl?.value === 'large' ? 30 : 0;
    const sizeLabel = sizeEl?.options[sizeEl.selectedIndex]?.text.split(' +')[0] || 'Standard (11oz)';
    const unit = _mugBasePrice + sizeExtra;
    setText('mug-sum-type',  _mugTypeName);
    setText('mug-sum-size',  sizeLabel);
    setText('mug-sum-unit',  '₱' + unit.toFixed(2));
    setText('mug-sum-qty',   qty);
    setText('mug-sum-total', '₱' + (unit * qty).toFixed(2));
}

function validateMug() {
    const qty = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    if (_mugType === 'department' && !document.getElementById('mug-dept-select')?.value) { showAlert('Missing Info', 'Please select a department.'); return false; }
    if (_mugType === 'photo') {
        for (let i = 1; i <= qty; i++) {
            if (!document.getElementById(`mug-photo-${i}`)?.files[0]) { showAlert('Missing Photo', `Please upload a photo for Mug ${i}.`); return false; }
        }
    }
    return true;
}

function getMugOrderData() {
    const qty    = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    const sizeEl = document.getElementById('mug-size');
    const unit   = _mugBasePrice + (sizeEl?.value === 'large' ? 30 : 0);
    const dept   = _mugType === 'department' ? document.getElementById('mug-dept-select')?.value : null;
    const sizeLabel = sizeEl?.options[sizeEl.selectedIndex]?.text.split(' +')[0] || 'Standard';
    return {
        service: 'Mug Printing',
        desc: `${qty} × ${_mugTypeName}${dept ? ' (' + dept + ')' : ''} (${sizeLabel})`,
        qty, total: (unit * qty).toFixed(2), department: dept
    };
}

function mugOrderNow() {
    if (!validateMug()) return;
    showConfirm('Proceed to Checkout', 'Place this mug order and proceed to checkout?', () => {
        const data = getMugOrderData();
        Cart.clear(); Cart.add(data);
        showPage('payment');
    });
}

function mugAddToCart() {
    if (!validateMug()) return;
    Cart.add(getMugOrderData());
    showAlert('Added to Cart! 🛒', `${_mugTypeName} × ${document.getElementById('mug-qty')?.value || 1} added to your cart.`);
}

// ============================================================
// LANYARD ORDER PAGE
// ============================================================
let _lanyardType = 'wmsu', _lanyardTypeName = 'WMSU Official', _lanyardPrice = 120;

function initLanyard() {
    _lanyardType = 'wmsu'; _lanyardTypeName = 'WMSU Official'; _lanyardPrice = 120;
    document.querySelectorAll('#lanyard-page .option').forEach((o, i) => o.classList.toggle('active', i === 0));
    const deptField = document.getElementById('lanyard-dept-field');
    if (deptField) deptField.classList.add('hidden');
    buildLanyardCustomForms(); updateLanyardSummary();
}

function selectLanyardType(type, el) {
    document.querySelectorAll('#lanyard-page .option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _lanyardType = type;
    const deptField = document.getElementById('lanyard-dept-field');
    if (deptField) deptField.classList.add('hidden');
    if (type === 'wmsu')       { _lanyardPrice = 120; _lanyardTypeName = 'WMSU Official'; }
    if (type === 'department') { _lanyardPrice = 150; _lanyardTypeName = 'Department Lanyard'; deptField?.classList.remove('hidden'); }
    if (type === 'custom')     { _lanyardPrice = 200; _lanyardTypeName = 'Custom Design'; }
    buildLanyardCustomForms(); updateLanyardSummary();
}

function onLanyardQtyChange() { buildLanyardCustomForms(); updateLanyardSummary(); }

function buildLanyardCustomForms() {
    const container = document.getElementById('lanyard-custom-forms');
    if (!container) return;
    container.innerHTML = '';
    if (_lanyardType !== 'custom') return;
    const qty = Math.max(1, parseInt(document.getElementById('lanyard-qty')?.value) || 1);
    for (let i = 1; i <= qty; i++) {
        container.innerHTML += `
        <div style="border:1px solid #e0e0e0;border-radius:0.75rem;padding:1.25rem;margin-bottom:1rem;">
            <div style="font-weight:700;color:#8B0000;margin-bottom:0.75rem;">🎨 Design ${i} of ${qty}</div>
            <div class="grid-2">
                <div class="field"><label class="label">Length (cm)</label><input class="input" type="number" id="lanyard-len-${i}" placeholder="e.g. 90" min="1"></div>
                <div class="field"><label class="label">Width (cm)</label><input class="input" type="number" id="lanyard-wid-${i}" placeholder="e.g. 2" min="1"></div>
            </div>
            <div class="field">
                <label class="label">Upload Design File</label>
                <label class="dropzone" style="padding:1.25rem;cursor:pointer;">
                    <input type="file" style="display:none;" id="lanyard-file-${i}" accept="image/*,.pdf">
                    <div style="font-size:1.25rem;">🎨</div>
                    <div style="color:#a32020;font-weight:700;font-size:0.875rem;">Click to upload design ${i}</div>
                    <div style="color:#999;font-size:0.75rem;">PNG, JPG, PDF (MAX. 20MB)</div>
                </label>
                <div id="lanyard-fname-${i}" style="display:none;font-size:0.8125rem;color:#555;margin-top:0.5rem;"></div>
            </div>
            <div class="field"><label class="label">Special Notes (optional)</label><input class="input" type="text" id="lanyard-note-${i}" placeholder="Any special instructions..."></div>
        </div>`;
    }
    for (let i = 1; i <= qty; i++) {
        const fi = document.getElementById(`lanyard-file-${i}`);
        if (fi) fi.addEventListener('change', (function(idx) { return function() {
            const d = document.getElementById(`lanyard-fname-${idx}`);
            if (d && this.files[0]) { d.textContent = '📎 ' + this.files[0].name; d.style.display = 'block'; }
        }; })(i));
    }
}

function updateLanyardSummary() {
    const qty = Math.max(1, parseInt(document.getElementById('lanyard-qty')?.value) || 1);
    setText('lanyard-sum-type',  _lanyardTypeName);
    setText('lanyard-sum-unit',  '₱' + _lanyardPrice.toFixed(2));
    setText('lanyard-sum-qty',   qty);
    setText('lanyard-sum-total', '₱' + (_lanyardPrice * qty).toFixed(2));
}

function validateLanyard() {
    const qty = Math.max(1, parseInt(document.getElementById('lanyard-qty')?.value) || 1);
    if (_lanyardType === 'department' && !document.getElementById('lanyard-dept-select')?.value) { showAlert('Missing Info', 'Please select a department.'); return false; }
    if (_lanyardType === 'custom') {
        for (let i = 1; i <= qty; i++) {
            if (!document.getElementById(`lanyard-len-${i}`)?.value || !document.getElementById(`lanyard-wid-${i}`)?.value) {
                showAlert('Missing Info', `Please fill in dimensions for Design ${i}.`); return false;
            }
        }
    }
    return true;
}

function getLanyardOrderData() {
    const qty  = Math.max(1, parseInt(document.getElementById('lanyard-qty')?.value) || 1);
    const dept = _lanyardType === 'department' ? document.getElementById('lanyard-dept-select')?.value : null;
    return {
        service: 'Lanyards',
        desc:    `${qty} × ${_lanyardTypeName}${dept ? ' (' + dept + ')' : ''}`,
        qty, total: (_lanyardPrice * qty).toFixed(2), department: dept
    };
}

function lanyardOrderNow() {
    if (!validateLanyard()) return;
    showConfirm('Proceed to Checkout', 'Place this lanyard order and proceed to checkout?', () => {
        const data = getLanyardOrderData();
        Cart.clear(); Cart.add(data);
        showPage('payment');
    });
}

function lanyardAddToCart() {
    if (!validateLanyard()) return;
    Cart.add(getLanyardOrderData());
    showAlert('Added to Cart! 🛒', `${_lanyardTypeName} × ${document.getElementById('lanyard-qty')?.value || 1} added to your cart.`);
}

// ============================================================
// PAYMENT PAGE — Step 1 of 3
// ============================================================
function initPayment() {
    const cart = Cart.get();
    const u    = User.get() || {};
    const co   = Checkout.get();

    if (cart.length === 0) { showAlert('Empty Cart', 'Your cart is empty.', () => showPage('cart')); return; }

    // Render cart items list
    const listEl   = document.getElementById('pay-cart-items-list');
    const countEl  = document.getElementById('pay-cart-count');
    const totalEl  = document.getElementById('pay-sum-total');

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
    if (countEl)  countEl.textContent = `${cart.length} item(s) — review before checkout`;
    if (totalEl)  totalEl.textContent = '₱' + Cart.total().toFixed(2);

    // Auto-fill user info — only if fields are empty or not yet touched
    const nameEl  = document.getElementById('pay-full-name');
    const phoneEl = document.getElementById('pay-contact');
    if (nameEl  && !nameEl.value)  nameEl.value  = co.customerInfo?.name  || u.name  || '';
    if (phoneEl && !phoneEl.value) phoneEl.value = co.customerInfo?.phone || u.phone || '';
    if (co.customerInfo?.date) {
        const dateEl = document.getElementById('pay-date');
        if (dateEl && !dateEl.value) dateEl.value = co.customerInfo.date;
    }

    // Show toggle row only if user has a registered phone
    window._registeredPhone = u.phone || '';
    window._checkoutOtpVerified = true;
    const toggleRow = document.getElementById('pay-number-toggle-row');
    if (toggleRow) {
        toggleRow.style.display = u.phone ? 'flex' : 'none';
    }
    // Reset toggle state
    document.getElementById('pay-yes-btn')?.classList.add('toggle-btn--active');
    document.getElementById('pay-no-btn')?.classList.remove('toggle-btn--active');
}

function togglePayNumber(useIt) {
    document.getElementById('pay-yes-btn')?.classList.toggle('toggle-btn--active', useIt);
    document.getElementById('pay-no-btn')?.classList.toggle('toggle-btn--active', !useIt);
    const phoneEl = document.getElementById('pay-contact');
    if (!phoneEl) return;
    if (useIt) {
        phoneEl.value = window._registeredPhone || '';
        window._checkoutOtpVerified = true;
    } else {
        phoneEl.value = '';
        window._checkoutOtpVerified = false;
    }
}

function proceedToPayMethod() {
    const name  = document.getElementById('pay-full-name')?.value.trim();
    const date  = document.getElementById('pay-date')?.value;
    const phone = document.getElementById('pay-contact')?.value.trim();
    if (!name)  { showAlert('Missing Info', 'Please enter your full name.'); return; }
    if (!date)  { showAlert('Missing Info', 'Please select a preferred delivery date.'); return; }
    if (!phone) { showAlert('Missing Info', 'Please enter your contact number.'); return; }

    const regPhone    = window._registeredPhone;
    const phoneChanged = regPhone && phone !== regPhone;

    if (phoneChanged && !window._checkoutOtpVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        showConfirm(
            '📱 Phone Number Changed',
            `You entered a different number (${phone}) from your registered one.\n\nAn OTP is required for verification.\nDemo OTP: ${code}\n\nProceed?`,
            () => {
                showPrompt('Enter OTP', `Enter the 6-digit OTP sent to ${phone}`, 'Enter OTP here', entered => {
                    if (entered === code) {
                        window._checkoutOtpVerified = true;
                        Checkout.set({ customerInfo: { name, date, phone } });
                        showAlert('✅ Verified!', 'Phone verified.', () => showPage('pay-method'));
                    } else {
                        showAlert('❌ Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
                    }
                });
            }
        );
        return;
    }

    Checkout.set({ customerInfo: { name, date, phone } });
    showPage('pay-method');
}

// ============================================================
// PAYMENT METHOD PAGE — Step 2 of 3
// ============================================================
function initPayMethod() {
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

    // Highlight selected payment option
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.style.borderColor = '#e0e0e0';
        opt.style.background  = '';
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => { o.style.borderColor = '#e0e0e0'; o.style.background = ''; });
            opt.style.borderColor = '#a32020';
            opt.style.background  = '#fff9f9';
        });
    });
    // Reset radio
    document.querySelectorAll('input[name="payment"]').forEach(r => r.checked = false);
}

function proceedPayment() {
    const selected = document.querySelector('input[name="payment"]:checked');
    if (!selected) { showAlert('No Selection', 'Please select a payment method to continue.'); return; }
    Checkout.set({ paymentMethod: selected.value });
    if (selected.value === 'gcash') {
        showPage('gcash');
    } else {
        // Cash on pickup — finalize immediately
        const orderId = finalizeOrder({ paymentMethod: 'Cash on Pick-up' });
        showPage('confirm');
    }
}

// ============================================================
// GCASH PAYMENT PAGE — Step 3 of 3
// ============================================================
function initGcash() {
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

    const totalStr = '₱' + total.toFixed(2);
    if (totalEl) totalEl.textContent = totalStr;
    if (amtEl)   amtEl.textContent   = totalStr;

    setText('gcash-info-name',  customer.name  || '—');
    setText('gcash-info-phone', customer.phone || '—');
    setText('gcash-info-date',  customer.date  || '—');

    // Clear previous inputs
    const refEl   = document.getElementById('gcash-ref');
    const proofEl = document.getElementById('gcash-proof');
    if (refEl)   refEl.value   = '';
    if (proofEl) proofEl.value = '';
}

function submitGcashPayment() {
    const ref   = document.getElementById('gcash-ref')?.value.trim();
    const proof = document.getElementById('gcash-proof')?.files[0];
    if (!ref)   { showAlert('Missing Info', 'Please enter your GCash reference number.'); return; }
    if (!proof) { showAlert('Missing Info', 'Please upload your proof of payment screenshot.'); return; }
    finalizeOrder({ paymentMethod: 'GCash', refNumber: ref });
    showPage('confirm');
}

// ============================================================
// FINALIZE ORDER — builds order records from full cart
// ============================================================
function finalizeOrder(extra = {}) {
    const cart     = Cart.get();
    const co       = Checkout.get();
    const customer = co.customerInfo || {};

    // Create one order per cart item (Shopee-style)
    let lastOrderId = null;
    cart.forEach(item => {
        lastOrderId = Orders.add({ ...item, customer, ...extra });
    });

    Cart.clear();
    Checkout.clear();
    updateCartBadge();
    return lastOrderId;
}

// ============================================================
// ORDER CONFIRMATION PAGE
// ============================================================
function initConfirm() {
    const all    = Orders.getAll();
    const latest = all[0]; // most recent
    if (!latest) return;

    const detailsEl = document.getElementById('confirm-details-list');
    if (!detailsEl) return;

    const c = latest.customer || {};
    const rows = [
        ['Order ID',     latest.orderId       || '—'],
        ['Service',      latest.service       || '—'],
        ['Description',  latest.desc          || '—'],
        ['Total',        '₱' + (latest.total  || '0.00')],
        ['Payment',      latest.paymentMethod || '—'],
        ['Name',         c.name               || '—'],
        ['Contact',      c.phone              || '—'],
        ['Pickup Date',  c.date               || '—'],
        ['Date Ordered', latest.dateOrdered   || '—'],
        ['Status',       latest.status        || 'Pending']
    ];

    detailsEl.innerHTML = rows.map(([label, val]) => `
        <div class="confirm-row">
            <span>${escHtml(label)}</span>
            <span>${escHtml(String(val))}</span>
        </div>`).join('');
}

// ============================================================
// MY ORDERS PAGE
// ============================================================
let _ordersFilter = 'all';

function initOrders() {
    _ordersFilter = 'all';
    document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.manage-tab[data-filter="all"]')?.classList.add('active');
    updateOrderCounts();
    renderOrders();

    const tabsBar = document.getElementById('tabs-bar');
    if (tabsBar && !tabsBar._bound) {
        tabsBar._bound = true;
        tabsBar.addEventListener('click', e => {
            const tab = e.target.closest('.manage-tab');
            if (!tab) return;
            document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            _ordersFilter = tab.dataset.filter;
            renderOrders();
        });
    }
}

function updateOrderCounts() {
    const all = Orders.getAll();
    const el  = s => document.querySelector(`[data-status="${s}"]`);
    if (el('all')) el('all').textContent = all.length;
    ['Pending','Processing','Ready','Completed'].forEach(s => {
        if (el(s)) el(s).textContent = all.filter(o => o.status === s).length;
    });
}

function renderOrders() {
    const list = document.getElementById('orders-list');
    if (!list) return;
    const all      = Orders.getAll();
    const filtered = _ordersFilter === 'all' ? all : all.filter(o => o.status === _ordersFilter);

    const statusStyle = {
        'Pending':    { bg:'#fffde7', color:'#c8a800', border:'#f9e79f' },
        'Processing': { bg:'#f3e5f5', color:'#8e44ad', border:'#d7bde2' },
        'Ready':      { bg:'#e8f8f5', color:'#27ae60', border:'#a9dfbf' },
        'Completed':  { bg:'#f0f0f0', color:'#555',    border:'#ccc'   }
    };

    if (filtered.length === 0) {
        list.innerHTML = `
        <div class="orders-card empty-state">
            <div class="empty-icon">📦</div>
            <h3>No orders here</h3>
            <p>${_ordersFilter === 'all' ? "You haven't placed any orders yet." : `No ${_ordersFilter} orders found.`}</p>
            <button onclick="showPage('dashboard')" class="browse-btn">Browse Services</button>
        </div>`; return;
    }

    list.innerHTML = filtered.map(order => {
        const sc  = statusStyle[order.status] || statusStyle['Pending'];
        const badge = `<span style="display:inline-block;padding:0.25rem 0.875rem;border-radius:1.25rem;font-size:0.8125rem;font-weight:600;background:${sc.bg};color:${sc.color};border:1px solid ${sc.border};">${escHtml(order.status)}</span>`;
        const c   = order.customer || {};
        const customerRow = c.name ? `<div style="font-size:0.8rem;color:#888;margin-top:0.25rem;">👤 ${escHtml(c.name)}${c.phone ? ' &nbsp;📞 ' + escHtml(c.phone) : ''}${c.date ? ' &nbsp;🗓 Pickup: ' + escHtml(c.date) : ''}</div>` : '';
        const addonsRow   = order.addons?.length ? `<div style="font-size:0.8rem;color:#888;">Add-ons: ${escHtml(order.addons.join(', '))}</div>` : '';
        const refRow      = order.refNumber ? `<div style="font-size:0.8rem;color:#888;">GCash Ref: ${escHtml(order.refNumber)}</div>` : '';
        return `
        <div class="orders-card" style="display:block;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.375rem;">
                        <span style="font-weight:700;font-size:1rem;color:#333;">${escHtml(order.service)}</span>
                        ${badge}
                        <span style="font-size:0.8rem;color:#aaa;">${escHtml(order.orderId || '')}</span>
                    </div>
                    <div style="font-size:0.875rem;color:#555;margin-bottom:0.25rem;">${escHtml(order.desc || '')}</div>
                    ${addonsRow}${customerRow}${refRow}
                    <div style="font-size:0.8rem;color:#aaa;margin-top:0.375rem;">📅 ${escHtml(order.dateOrdered || '—')} &nbsp;|&nbsp; 💳 ${escHtml(order.paymentMethod || '—')}</div>
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:0.625rem;">
                    <span style="font-weight:700;font-size:1.25rem;color:#a32020;">₱${escHtml(String(order.total))}</span>
                    <button onclick="deleteOrder('${escHtml(order.orderId)}')"
                        style="background:none;border:1px solid #e0e0e0;border-radius:0.5rem;padding:0.375rem 0.75rem;cursor:pointer;font-size:0.8125rem;color:#888;font-family:'Segoe UI',sans-serif;"
                        onmouseover="this.style.borderColor='#a32020';this.style.color='#a32020';"
                        onmouseout="this.style.borderColor='#e0e0e0';this.style.color='#888';">🗑 Remove</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function deleteOrder(orderId) {
    showConfirm('Remove Order', 'Are you sure you want to remove this order from your history?', () => {
        Orders.save(Orders.getAll().filter(o => o.orderId !== orderId));
        updateOrderCounts();
        renderOrders();
    });
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