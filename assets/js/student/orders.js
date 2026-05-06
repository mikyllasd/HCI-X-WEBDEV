(function () {

    const u = User.get();
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    const LS_PROMPT_DISMISSED = 'upress_rating_prompt_dismissed';

    let currentTypeFilter   = 'individual';
    let currentStatusFilter = 'all';
    let ratingTargetOrderId = null;
    let ratingModalReadOnly = false;
    const ratings = { product: 0, service: 0 };

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

    function normalizeRatingEntry(raw) {
        if (!raw || typeof raw !== 'object') return null;
        if (raw.productRating > 0 && raw.serviceRating > 0) return raw;
        if (raw.system > 0 && raw.staff > 0 && raw.admin > 0) {
            return {
                productRating: raw.system,
                serviceRating: raw.staff,
                productMessage: raw.message || '',
                serviceMessage: '',
                createdAt: raw.date || new Date().toISOString(),
                userId: raw.userId
            };
        }
        return null;
    }

    function getRatingForOrder(orderId) {
        return normalizeRatingEntry(getRatingsStore()[orderId]);
    }

    function saveRatingLocal(orderId, data) {
        const store = getRatingsStore();
        store[orderId] = data;
        localStorage.setItem('upress_ratings', JSON.stringify(store));
    }

    function hasRated(orderId) {
        return !!getRatingForOrder(orderId);
    }

    function getPromptDismissedMap() {
        try { return JSON.parse(localStorage.getItem(LS_PROMPT_DISMISSED) || '{}'); }
        catch { return {}; }
    }

    function isPromptDismissed(orderId) {
        return !!getPromptDismissedMap()[orderId];
    }

    function dismissRatingPrompt(orderId) {
        const m = getPromptDismissedMap();
        m[orderId] = true;
        localStorage.setItem(LS_PROMPT_DISMISSED, JSON.stringify(m));
    }

    function formatStarDisplay(n) {
        const v = Math.min(5, Math.max(0, Number(n) || 0));
        return '★'.repeat(v) + '☆'.repeat(5 - v);
    }

    function orderServiceLabel(o) {
        const items = Array.isArray(o.items) ? o.items : [o];
        return (items[0] && (items[0].service || items[0].serviceName)) || 'Order';
    }

    function pushRatingToSharedDb(orderId, payload, order) {
        if (typeof window.getDB !== 'function' || typeof window.saveDB !== 'function') return;
        try {
            const db = window.getDB();
            if (!Array.isArray(db.ratings)) db.ratings = [];
            const user = User.get() || {};
            const combinedComment = [payload.productMessage, payload.serviceMessage].filter(Boolean).join('\n\n');
            db.ratings.push({
                id: 'rating_' + Date.now() + '_' + Math.random().toString(36).slice(2),
                transactionId: orderId,
                orderId,
                userId: user.id,
                userEmail: user.email || '',
                productRating: payload.productRating,
                serviceRating: payload.serviceRating,
                productComment: payload.productMessage || '',
                serviceComment: payload.serviceMessage || '',
                comment: combinedComment,
                serviceName: orderServiceLabel(order),
                createdAt: payload.createdAt || new Date().toISOString(),
                academicYear: db.academicYear || ''
            });
            window.saveDB(db);
        } catch (e) { console.warn('pushRatingToSharedDb:', e); }
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

        const indTab = document.querySelector('.manage-tab[data-type="individual"] .tab-count');
        const orgTab = document.querySelector('.manage-tab[data-type="organization"] .tab-count');
        if (indTab) indTab.textContent = orders.filter(o => !o.order_type || o.order_type === 'individual').length;
        if (orgTab) orgTab.textContent = orders.filter(o => o.order_type === 'organization').length;

        document.querySelectorAll('.status-tab').forEach(btn => {
            const s = btn.dataset.status;
            const countEl = btn.querySelector('.tab-count');
            if (!countEl) return;
            countEl.textContent = s === 'all'
                ? typeFiltered.length
                : typeFiltered.filter(o => o.status === s).length;
        });

        const hasAffiliations = typeof User.hasVerifiedAffiliations === 'function'
            ? User.hasVerifiedAffiliations()
            : false;
        const orgCount = orders.filter(o => o.order_type === 'organization').length;
        const orgTabEl = document.getElementById('org-orders-tab');
        if (orgTabEl) {
            orgTabEl.style.display = (hasAffiliations && orgCount > 0) ? 'flex' : 'none';
        }
    }

    function buildRatedSummaryHtml(r) {
        if (!r) return '';
        const pm = escHtml(r.productMessage || '');
        const sm = escHtml(r.serviceMessage || '');
        return `
            <div class="order-rate-summary">
                <div class="rate-summary-line"><strong>Product</strong> <span class="rate-stars">${formatStarDisplay(r.productRating)}</span></div>
                ${pm ? `<div class="rate-summary-line">${pm}</div>` : ''}
                <div class="rate-summary-line"><strong>Service</strong> <span class="rate-stars">${formatStarDisplay(r.serviceRating)}</span></div>
                ${sm ? `<div class="rate-summary-line">${sm}</div>` : ''}
            </div>`;
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
            maybeAutoPromptRating(orders);
            return;
        }

        const user       = User.get() || {};
        const fullName   = user.name || user.fullName || '—';
        const studentId  = user.campusId || user.studentId || user.facultyId || '—';
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
            const ratedEntry   = getRatingForOrder(o.orderId);
            const alreadyRated = !!ratedEntry;

            const rateRow = isCompleted ? `
                <div class="order-rate-row">
                    ${alreadyRated
                        ? `<span class="rated-badge">✔ Rated</span>
                           <button type="button" class="rate-btn rate-btn--view" data-orderid="${escHtml(o.orderId)}">View rating</button>`
                        : `<button type="button" class="rate-btn" data-orderid="${escHtml(o.orderId)}">⭐ Rate Order</button>`
                    }
                </div>
                ${alreadyRated ? buildRatedSummaryHtml(ratedEntry) : ''}` : '';

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

        listEl.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const oid = this.dataset.orderid;
                const viewOnly = this.classList.contains('rate-btn--view');
                openRatingModal(oid, viewOnly);
            });
        });

        maybeAutoPromptRating(orders);
    }

    function findOrderById(orderId) {
        return getOrders().find(o => o.orderId === orderId) || null;
    }

    function maybeAutoPromptRating(allOrders) {
        const completed = allOrders.filter(o =>
            o.status === 'Completed' &&
            !hasRated(o.orderId) &&
            !isPromptDismissed(o.orderId)
        );
        if (completed.length === 0) return;
        let latest = completed[0];
        let best = 0;
        completed.forEach(o => {
            const t = Date.parse(o.dateOrdered) || 0;
            if (t >= best) { best = t; latest = o; }
        });
        if (ratingTargetOrderId) return;
        const modal = document.getElementById('rating-modal');
        if (modal && modal.style.display === 'flex') return;
        openRatingModal(latest.orderId, false, true);
    }

    /* ── Rating Modal ── */
    function updateRatingActionButtons(readOnly) {
        const submitBtn = document.getElementById('rating-submit-btn');
        const skipBtn = document.getElementById('rating-skip-btn');
        if (submitBtn) submitBtn.style.display = readOnly ? 'none' : '';
        if (skipBtn) skipBtn.style.display = readOnly ? 'none' : '';
    }

    function resetStarUi() {
        document.querySelectorAll('.star-group').forEach(group => {
            group.querySelectorAll('.star').forEach(s => s.classList.remove('selected', 'hovered'));
        });
    }

    function applyStarSelection(category, val) {
        const group = document.querySelector(`.star-group[data-category="${category}"]`);
        if (!group) return;
        const stars = group.querySelectorAll('.star');
        stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value, 10) <= val));
    }

    function openRatingModal(orderId, readOnly, isAuto) {
        ratingTargetOrderId = orderId;
        ratingModalReadOnly = !!readOnly;
        const order = findOrderById(orderId);
        if (order && order.status !== 'Completed') {
            closeRatingModal();
            return;
        }

        const existing = getRatingForOrder(orderId);
        ratings.product = existing ? existing.productRating : 0;
        ratings.service = existing ? existing.serviceRating : 0;

        const prodTa = document.getElementById('rating-product-message');
        const servTa = document.getElementById('rating-service-message');
        if (prodTa) {
            prodTa.value = existing ? (existing.productMessage || '') : '';
            prodTa.readOnly = !!readOnly;
        }
        if (servTa) {
            servTa.value = existing ? (existing.serviceMessage || '') : '';
            servTa.readOnly = !!readOnly;
        }

        resetStarUi();
        if (existing) {
            applyStarSelection('product', existing.productRating);
            applyStarSelection('service', existing.serviceRating);
        }
        updateSubmitBtn();

        document.getElementById('rating-order-label').textContent = 'Order ID: ' + orderId;
        updateRatingActionButtons(!!readOnly);
        document.getElementById('rating-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (isAuto && !readOnly) {
            const skipBtn = document.getElementById('rating-skip-btn');
            if (skipBtn) skipBtn.style.display = '';
        }
    }

    function closeRatingModal() {
        const modal = document.getElementById('rating-modal');
        if (modal && ratingTargetOrderId && !ratingModalReadOnly) {
            const rated = hasRated(ratingTargetOrderId);
            if (!rated) dismissRatingPrompt(ratingTargetOrderId);
        }
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
        ratingTargetOrderId = null;
        ratingModalReadOnly = false;
        updateRatingActionButtons(false);
    }

    function updateSubmitBtn() {
        const allSet = ratings.product > 0 && ratings.service > 0;
        const btn = document.getElementById('rating-submit-btn');
        if (btn) btn.disabled = !allSet;
    }

    document.querySelectorAll('.star-group').forEach(group => {
        const category = group.dataset.category;
        const stars    = group.querySelectorAll('.star');

        stars.forEach(star => {
            const val = parseInt(star.dataset.value, 10);

            star.addEventListener('mouseenter', () => {
                if (ratingModalReadOnly) return;
                stars.forEach(s => s.classList.toggle('hovered', parseInt(s.dataset.value, 10) <= val));
            });
            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hovered'));
            });
            star.addEventListener('click', () => {
                if (ratingModalReadOnly) return;
                ratings[category] = val;
                stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value, 10) <= val));
                updateSubmitBtn();
            });
        });
    });

    document.getElementById('rating-close-btn').addEventListener('click', closeRatingModal);
    document.getElementById('rating-modal').addEventListener('click', function (e) {
        if (e.target === this) closeRatingModal();
    });

    document.getElementById('rating-skip-btn').addEventListener('click', function () {
        if (ratingTargetOrderId) dismissRatingPrompt(ratingTargetOrderId);
        closeRatingModal();
        renderOrders();
    });

    document.getElementById('rating-submit-btn').addEventListener('click', function () {
        if (!ratingTargetOrderId || ratingModalReadOnly) return;
        if (!ratings.product || !ratings.service) return;

        const user = User.get() || {};
        const productMessage = (document.getElementById('rating-product-message') || {}).value || '';
        const serviceMessage = (document.getElementById('rating-service-message') || {}).value || '';
        const createdAt = new Date().toISOString();

        const payload = {
            productRating: ratings.product,
            serviceRating: ratings.service,
            productMessage: productMessage.trim(),
            serviceMessage: serviceMessage.trim(),
            createdAt,
            userId: user.id
        };

        saveRatingLocal(ratingTargetOrderId, payload);
        const order = findOrderById(ratingTargetOrderId);
        pushRatingToSharedDb(ratingTargetOrderId, payload, order || {});

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

    renderOrders();

})();
