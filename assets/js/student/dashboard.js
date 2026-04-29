// dashboard.js
const u = User.get();
if (!u) { window.location.href = 'index.html'; }

setText('welcome-name',  u?.name  || 'Student');
setText('welcome-email', u?.email || 'student@wmsu.edu.ph');

function renderDashCartPreview() {
    const cart    = Cart.get();
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
                <span>🛒 ${escHtml(item.service)} — ${item.desc ? escHtml(item.desc.substring(0, 40)) + (item.desc.length > 40 ? '...' : '') : ''}</span>
                <span style="font-weight:700;color:#a32020;">₱${item.total}</span>
            </div>`).join('');
        if (cart.length > MAX) {
            container.innerHTML += `<div style="font-size:0.8rem;color:#aaa;padding:0.25rem 0;">...and ${cart.length - MAX} more item(s)</div>`;
        }
    }
    const totalEl = document.getElementById('dash-cart-preview-total');
    if (totalEl) totalEl.textContent = '₱' + Cart.total().toFixed(2);
}

renderDashCartPreview();

function doLogout() {
    showConfirm('Logout', 'Are you sure you want to log out?', () => {
        User.clear();
        Checkout.clear();
        window.location.href = 'index.html';
    });
}