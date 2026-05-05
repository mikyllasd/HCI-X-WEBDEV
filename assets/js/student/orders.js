// orders.js
(function () {

    /* Get current logged-in user; redirect if none */
    const u = User.get();
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    let currentFilter = 'all';

    /* Pull all orders from shared Orders storage */
    function getOrders() {
        return Orders.getAll();
    }

    /* Count orders based on status */
    function countByStatus(orders, status) {
        if (status === 'all') return orders.length;
        return orders.filter(o => o.status === status).length;
    }

    /* Update numbers shown on filter tabs */
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

        /* Filter orders based on selected tab */
        const filtered = currentFilter === 'all'
            ? orders
            : orders.filter(o => o.status === currentFilter);

        /* Show empty state if no orders */
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

        /* Get user info once (optimization fix) */
        const user = User.get() || {};
        const fullName = user.name || '—';
        const studentId = user.campusId || '—';
        const course = user.course || '—';
        const department = user.college || '—';
        const mobile = user.phone || '—';
        const email = user.email || '—';

        /* Render each order card */
        listEl.innerHTML = filtered.map(o => {
            const items = Array.isArray(o.items) ? o.items : [o];

            /* Build description preview */
            const descParts = items.map(i =>
                `${escHtml(i.service || '')}${i.desc ? ' — ' + escHtml((i.desc || '').substring(0, 60)) + ((i.desc || '').length > 60 ? '…' : '') : ''}`
            );

            /* Compute total amount */
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

                <!-- Customer information display -->
                <div class="order-customer-info">
                    <div class="customer-info-row">
                        <span class="info-label">Full Name:</span>
                        <span class="info-value">${escHtml(fullName)}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Student ID:</span>
                        <span class="info-value">${escHtml(studentId)}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Course:</span>
                        <span class="info-value">${escHtml(course)}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Department:</span>
                        <span class="info-value">${escHtml(department)}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Mobile:</span>
                        <span class="info-value">${escHtml(mobile)}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${escHtml(email)}</span>
                    </div>
                </div>

                <!-- Bottom section with date and total -->
                <div class="order-card-bottom">
                    <span class="order-date">
                        <span class="upress-icon upress-icon--cal" aria-hidden="true"></span>
                        ${escHtml(o.dateOrdered || '')}
                    </span>
                    <span class="order-total">₱${totalAmt.toFixed(2)}</span>
                </div>
            </div>`;
        }).join('');
    }

    /* Handle tab switching for filtering orders */
    document.querySelectorAll('.manage-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderOrders();
        });
    });

    /* Initial render */
    renderOrders();

})();