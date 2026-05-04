// orders.js
(function () {
    const u = User.get();
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    if ((u.accountStatus || 'verified') === 'pending') {
        showAlert(
            'Order history unavailable',
            'While your account is pending verification, order history is hidden. You will have full access after admin approval.',
            () => { window.location.href = 'dashboard.html'; }
        );
        return;
    }

    let currentFilter = 'all';

    // Pull orders from the shared Orders store
    function getOrders() {
        return Orders.getAll();
    }

    function countByStatus(orders, status) {
        if (status === 'all') return orders.length;
        return orders.filter(o => o.status === status).length;
    }

    function updateTabCounts() {
        const orders = getOrders();
        document.querySelectorAll('.tab-count').forEach(el => {
            const s = el.dataset.status;
            el.textContent = countByStatus(orders, s);
        });
    }

    function renderOrders() {
        const orders = getOrders();
        const listEl = document.getElementById('orders-list');
        if (!listEl) return;

        updateTabCounts();

        const filtered = currentFilter === 'all'
            ? orders
            : orders.filter(o => o.status === currentFilter);

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div class="orders-empty">
                    <div class="orders-empty-icon"><span class="upress-icon upress-icon--pkg" aria-hidden="true"></span></div>
                    <p>No ${currentFilter === 'all' ? '' : currentFilter.toLowerCase() + ' '}orders yet.</p>
                    <button class="orders-browse-btn" onclick="window.location.href='dashboard.html'">
                        Browse Services
                    </button>
                </div>`;
            return;
        }

        listEl.innerHTML = filtered.map(o => {
            const items = Array.isArray(o.items) ? o.items : [o];
            const descParts = items.map(i =>
                `${escHtml(i.service || '')}${i.desc ? ' — ' + escHtml((i.desc || '').substring(0, 60)) + ((i.desc || '').length > 60 ? '…' : '') : ''}`
            );
            const totalAmt = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);

            return `
            <div class="order-card">
                <div class="order-card-top">
                    <div>
                        <div class="order-service-name">
                            ${items.length > 1
                                ? escHtml(items[0].service) + ` <span style="font-size:0.8rem;color:#aaa;">+${items.length - 1} more</span>`
                                : escHtml(items[0].service || 'Order')}
                        </div>
                        <div class="order-id">${escHtml(o.orderId || '')}</div>
                    </div>
                    <span class="order-status-badge status-${escHtml(o.status || 'Pending')}">
                        ${escHtml(o.status || 'Pending')}
                    </span>
                </div>
                <div class="order-desc">${descParts.join('<br>')}</div>
                <div class="order-card-bottom">
                    <span class="order-date"><span class="upress-icon upress-icon--cal" aria-hidden="true"></span> ${escHtml(o.dateOrdered || '')}</span>
                    <span class="order-total">₱${totalAmt.toFixed(2)}</span>
                </div>
            </div>`;
        }).join('');
    }

    // Tab switching
    document.querySelectorAll('.manage-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderOrders();
        });
    });

    renderOrders();
})();