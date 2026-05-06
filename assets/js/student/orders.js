(function () {

    /* Get current logged-in user; redirect if none */
    const u = User.get();
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    let currentFilter = 'individual';

    /* ── Rating state ── */
    let ratingTargetOrderId = null;
    const ratings = {}; // { system: 0, staff: 0, admin: 0 }

    /* ── Helpers ── */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getRatingsStore() {
        try {
            return JSON.parse(localStorage.getItem('upress_ratings') || '{}');
        } catch { return {}; }
    }

    function saveRating(orderId, data) {
        const store = getRatingsStore();
        store[orderId] = data;
        localStorage.setItem('upress_ratings', JSON.stringify(store));
    }

    function hasRated(orderId) {
        return !!getRatingsStore()[orderId];
    }

    /* ── Orders ── */
    function getOrders() {
        return Orders.getAll();
    }

    function countByStatus(orders, status) {
        if (status === 'individual') return orders.filter(o => o.order_type !== 'organization').length;
        if (status === 'organization') return orders.filter(o => o.order_type === 'organization').length;
        if (status === 'all') return orders.length;
        return orders.filter(o => o.status === status).length;
    }

    function updateTabCounts() {
        const orders = getOrders();
        document.querySelectorAll('.tab-count').forEach(el => {
            const s = el.dataset.status;
            el.textContent = countByStatus(orders, s);
        });
        
        // Show/hide organization tab based on affiliations and orders
        const hasAffiliations = User.hasVerifiedAffiliations();
        const orgOrdersCount = countByStatus(orders, 'organization');
        const orgTab = document.getElementById('org-orders-tab');
        if (orgTab) {
            orgTab.style.display = (hasAffiliations && orgOrdersCount > 0) ? 'block' : 'none';
        }
    }

    function renderOrders() {
        const orders = getOrders();
        const listEl = document.getElementById('orders-list');
        if (!listEl) return;

        updateTabCounts();

        const filtered = currentFilter === 'individual'
            ? orders.filter(o => o.order_type !== 'organization')
            : orders.filter(o => o.order_type === 'organization');

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div class="orders-empty">
                    <div class="orders-empty-icon"><span class="upress-icon upress-icon--pkg" aria-hidden="true"></span></div>
                    <p>No ${currentFilter === 'individual' ? 'individual' : 'organization'} orders yet.</p>
                    <button class="orders-browse-btn" onclick="window.location.href='dashboard.html'">
                        Browse Services
                    </button>
                </div>`;
            return;
        }

        const user = User.get() || {};
        const fullName   = user.name     || '—';
        const studentId  = user.campusId || '—';
        const course     = user.course   || '—';
        const department = user.college  || '—';
        const mobile     = user.phone    || '—';
        const email      = user.email    || '—';

        listEl.innerHTML = filtered.map(o => {
            const items = Array.isArray(o.items) ? o.items : [o];

            const descParts = items.map(i =>
                `${escHtml(i.service || '')}${i.desc ? ' — ' + escHtml((i.desc || '').substring(0, 60)) + ((i.desc || '').length > 60 ? '…' : '') : ''}`
            );

            const totalAmt = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);

            const isCompleted = o.status === 'Completed';
            const alreadyRated = hasRated(o.orderId);

            /* Rate / Rated row — only for completed orders */
            const rateRow = isCompleted ? `
                <div class="order-rate-row">
                    ${alreadyRated
                        ? `<span class="rated-badge">✔ Rated</span>`
                        : `<button class="rate-btn" data-orderid="${escHtml(o.orderId)}">⭐ Rate Order</button>`
                    }
                </div>` : '';

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

                <div class="order-card-bottom">
                    <span class="order-date">
                        <span class="upress-icon upress-icon--cal" aria-hidden="true"></span>
                        ${escHtml(o.dateOrdered || '')}
                    </span>
                    <div class="order-pickup-info">
                        <div class="pickup-expected">
                            <span class="upress-icon upress-icon--clock" aria-hidden="true"></span>
                            Expected: ${escHtml(o.expectedPickupDate || 'TBD')}
                        </div>
                        ${o.preferredPickupDate ? `<div class="pickup-preferred">Preferred: ${escHtml(o.preferredPickupDate)}</div>` : ''}
                    </div>
                    <span class="order-total">₱${totalAmt.toFixed(2)}</span>
                </div>

                ${rateRow}
            </div>`;
        }).join('');

        /* Attach rate button listeners after render */
        listEl.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                openRatingModal(this.dataset.orderid);
            });
        });
    }

    /* ── Modal logic ── */
    function openRatingModal(orderId) {
        ratingTargetOrderId = orderId;

        /* Reset stars */
        ratings.system = 0;
        ratings.staff  = 0;
        ratings.admin  = 0;
        document.getElementById('rating-message').value = '';
        document.querySelectorAll('.star').forEach(s => s.classList.remove('selected', 'hovered'));
        updateSubmitBtn();

        document.getElementById('rating-order-label').textContent = 'Order ID: ' + orderId;
        document.getElementById('rating-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeRatingModal() {
        document.getElementById('rating-modal').style.display = 'none';
        document.body.style.overflow = '';
        ratingTargetOrderId = null;
    }

    function updateSubmitBtn() {
        const allSet = ratings.system > 0 && ratings.staff > 0 && ratings.admin > 0;
        document.getElementById('rating-submit-btn').disabled = !allSet;
    }

    /* Star interaction per group */
    document.querySelectorAll('.star-group').forEach(group => {
        const category = group.dataset.category;
        const stars = group.querySelectorAll('.star');

        stars.forEach(star => {
            const val = parseInt(star.dataset.value);

            star.addEventListener('mouseenter', () => {
                stars.forEach(s => {
                    s.classList.toggle('hovered', parseInt(s.dataset.value) <= val);
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hovered'));
            });

            star.addEventListener('click', () => {
                ratings[category] = val;
                stars.forEach(s => {
                    s.classList.toggle('selected', parseInt(s.dataset.value) <= val);
                });
                updateSubmitBtn();
            });
        });
    });

    /* Close button */
    document.getElementById('rating-close-btn').addEventListener('click', closeRatingModal);

    /* Click outside modal to close */
    document.getElementById('rating-modal').addEventListener('click', function (e) {
        if (e.target === this) closeRatingModal();
    });

    /* Submit */
    document.getElementById('rating-submit-btn').addEventListener('click', function () {
        if (!ratingTargetOrderId) return;
        if (!ratings.system || !ratings.staff || !ratings.admin) return;

        saveRating(ratingTargetOrderId, {
            system:  ratings.system,
            staff:   ratings.staff,
            admin:   ratings.admin,
            message: document.getElementById('rating-message').value.trim(),
            date:    new Date().toISOString()
        });

        closeRatingModal();
        renderOrders(); /* Re-render so Rate btn becomes Rated badge */
    });

    /* Tab switching */
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