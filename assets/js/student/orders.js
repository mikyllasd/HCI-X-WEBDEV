(function () {

    const u = User.get();
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    let currentTypeFilter   = 'individual';
    let currentStatusFilter = 'all';
    let ratingTargetOrderId = null;
    const ratings = { system: 0, staff: 0, admin: 0 };

    /* ── Helpers ── */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getRatingsStore() {
        try { return JSON.parse(localStorage.getItem('upress_ratings') || '{}'); }
        catch { return {}; }
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
        try { return Orders.getAll() || []; }
        catch (e) { console.error('Orders.getAll() failed:', e); return []; }
    }

    function getTypeFiltered(orders) {
        return currentTypeFilter === 'individual'
            ? orders.filter(o => !o.order_type || o.order_type === 'individual')
            : orders.filter(o => o.order_type === 'organization');
    }

    function updateTabCounts() {
        const orders = getOrders();
        const typeFiltered = getTypeFiltered(orders);

        /* Type tab counts */
        const indTab = document.querySelector('.manage-tab[data-type="individual"] .tab-count');
        const orgTab = document.querySelector('.manage-tab[data-type="organization"] .tab-count');
        if (indTab) indTab.textContent = orders.filter(o => !o.order_type || o.order_type === 'individual').length;
        if (orgTab) orgTab.textContent = orders.filter(o => o.order_type === 'organization').length;

        /* Status tab counts scoped to current type */
        document.querySelectorAll('.status-tab').forEach(btn => {
            const s = btn.dataset.status;
            const countEl = btn.querySelector('.tab-count');
            if (!countEl) return;
            countEl.textContent = s === 'all'
                ? typeFiltered.length
                : typeFiltered.filter(o => o.status === s).length;
        });

        /* Show/hide org tab */
        const hasAffiliations = typeof User.hasVerifiedAffiliations === 'function'
            ? User.hasVerifiedAffiliations()
            : false;
        const orgCount = orders.filter(o => o.order_type === 'organization').length;
        const orgTabEl = document.getElementById('org-orders-tab');
        if (orgTabEl) {
            orgTabEl.style.display = (hasAffiliations && orgCount > 0) ? 'flex' : 'none';
        }
    }

    /* ── Render ── */
    function renderOrders() {
        const orders = getOrders();
        const listEl = document.getElementById('orders-list');
        if (!listEl) return;

        updateTabCounts();

        let filtered = getTypeFiltered(orders);
        if (currentStatusFilter !== 'all') {
            filtered = filtered.filter(o => o.status === currentStatusFilter);
        }

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div class="orders-empty">
                    <div class="orders-empty-icon">
                        <span class="upress-icon upress-icon--pkg" aria-hidden="true"></span>
                    </div>
                    <p>No ${currentStatusFilter !== 'all' ? currentStatusFilter.toLowerCase() + ' ' : ''}${currentTypeFilter} orders found.</p>
                    <button class="orders-browse-btn" onclick="window.location.href='dashboard.html'">
                        Browse Services
                    </button>
                </div>`;
            return;
        }

        const user       = User.get() || {};
        const fullName   = user.name     || '—';
        const studentId  = user.campusId || '—';
        const course     = user.course   || '—';
        const department = user.college  || '—';
        const mobile     = user.phone    || '—';
        const email      = user.email    || '—';

        listEl.innerHTML = filtered.map(o => {
            const items    = Array.isArray(o.items) ? o.items : [o];
            const totalAmt = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
            const status   = o.status || 'Pending';

            const descParts = items.map(i =>
                `${escHtml(i.service || '')}${i.desc
                    ? ' — ' + escHtml((i.desc || '').substring(0, 60)) + ((i.desc || '').length > 60 ? '…' : '')
                    : ''}`
            );

            const isCompleted  = status === 'Completed';
            const alreadyRated = hasRated(o.orderId);

            const rateRow = isCompleted ? `
                <div class="order-rate-row">
                    ${alreadyRated
                        ? `<span class="rated-badge">✔ Rated</span>`
                        : `<button class="rate-btn" data-orderid="${escHtml(o.orderId)}">⭐ Rate Order</button>`
                    }
                </div>` : '';

            return `
            <div class="order-card" data-status="${escHtml(status)}">
                <div class="order-card-top">
                    <div>
                        <div class="order-service-name">
                            ${items.length > 1
                                ? escHtml(items[0].service || 'Order') + ` <span style="font-size:0.78rem;color:#aaa;">+${items.length - 1} more</span>`
                                : escHtml(items[0].service || 'Order')}
                        </div>
                        <div class="order-id">${escHtml(o.orderId || '')}</div>
                    </div>
                    <span class="order-status-badge status-${escHtml(status)}">${escHtml(status)}</span>
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
                        ${escHtml(o.dateOrdered || '—')}
                    </span>
                    <div class="order-pickup-info">
                        <div class="pickup-expected">
                            <span class="upress-icon upress-icon--clock" aria-hidden="true"></span>
                            Expected: ${escHtml(o.expectedPickupDate || 'TBD')}
                        </div>
                        ${o.preferredPickupDate
                            ? `<div class="pickup-preferred">Preferred: ${escHtml(o.preferredPickupDate)}</div>`
                            : ''}
                    </div>
                    <span class="order-total">₱${totalAmt.toFixed(2)}</span>
                </div>

                ${rateRow}
            </div>`;
        }).join('');

        /* Attach rate button listeners */
        listEl.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                openRatingModal(this.dataset.orderid);
            });
        });
    }

    /* ── Rating Modal ── */
    function openRatingModal(orderId) {
        ratingTargetOrderId = orderId;
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

    /* Star interactions */
    document.querySelectorAll('.star-group').forEach(group => {
        const category = group.dataset.category;
        const stars    = group.querySelectorAll('.star');

        stars.forEach(star => {
            const val = parseInt(star.dataset.value);

            star.addEventListener('mouseenter', () => {
                stars.forEach(s => s.classList.toggle('hovered', parseInt(s.dataset.value) <= val));
            });
            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hovered'));
            });
            star.addEventListener('click', () => {
                ratings[category] = val;
                stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= val));
                updateSubmitBtn();
            });
        });
    });

    document.getElementById('rating-close-btn').addEventListener('click', closeRatingModal);
    document.getElementById('rating-modal').addEventListener('click', function (e) {
        if (e.target === this) closeRatingModal();
    });

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
        renderOrders();
    });

    /* ── Type tab switching ── */
    document.querySelectorAll('.manage-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTypeFilter   = this.dataset.type;
            currentStatusFilter = 'all';
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.status-tab[data-status="all"]').classList.add('active');
            renderOrders();
        });
    });

    /* ── Status tab switching ── */
    document.querySelectorAll('.status-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentStatusFilter = this.dataset.status;
            renderOrders();
        });
    });

    /* Initial render */
    renderOrders();

})();