(function () {

    // ── DB / User helpers ──────────────────────────────────────────────────

    function getCurrentUser() {
        try { return JSON.parse(localStorage.getItem('upressUser') || 'null'); } catch { return null; }
    }

    // ── Guard ──────────────────────────────────────────────────────────────

    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = '../auth/portal.html';
        return;
    }

    if (typeof User !== 'undefined') {
        User.clearOrganizationOrderContextIfUnauthorized();
        User.syncAccountStatusFromDB();
        if (!User.canPlaceOrders()) {
            const msg =
                'Your account must be approved by an administrator before you can place orders. After signup verification is approved, you can return here to create order requests.';
            if (typeof showAlert === 'function') {
                showAlert('Account verification required', msg, () => {
                    window.location.href = 'dashboard.html';
                });
            } else {
                alert(msg);
                window.location.href = 'dashboard.html';
            }
            return;
        }
    }

    // ── State ──────────────────────────────────────────────────────────────

    let selectedType = null; // 'individual' | 'organization'
    let selectedOrg  = null;

    // ── Check affiliation and show/hide org option ─────────────────────────

    const hasAffil = typeof User !== 'undefined' && User.hasVerifiedAffiliations();
    const orgCard = document.getElementById('btn-organization');
    const noAffilNotice = document.getElementById('co-no-affil-notice');

    if (hasAffil) {
        if (orgCard) orgCard.style.display = 'flex';
        if (noAffilNotice) noAffilNotice.style.display = 'none';
    } else {
        if (orgCard) orgCard.style.display = 'none';
        if (noAffilNotice) noAffilNotice.style.display = 'flex';
    }

    // ── Step navigation ────────────────────────────────────────────────────

    function showStep(n) {
        document.querySelectorAll('.co-step-panel').forEach((p, i) => {
            p.classList.toggle('active', i + 1 === n);
        });
        document.querySelectorAll('.co-step').forEach((s, i) => {
            s.classList.remove('active', 'done');
            if (i + 1 === n)     s.classList.add('active');
            else if (i + 1 < n)  s.classList.add('done');
        });
        document.querySelectorAll('.co-step-line').forEach((l, i) => {
            l.classList.toggle('done', i + 1 < n);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Order type selection ───────────────────────────────────────────────

    window.selectOrderType = function (type) {
        if (type === 'organization' && typeof User !== 'undefined' && !User.hasVerifiedAffiliations()) {
            alert('Organization orders require an approved affiliation. Finish verification on your dashboard first.');
            return;
        }
        selectedType = type;
        selectedOrg  = null;

        document.querySelectorAll('.co-type-card').forEach(c => c.classList.remove('selected'));
        const selectedCard = document.getElementById('btn-' + type);
        if (selectedCard) selectedCard.classList.add('selected');

        const orgSection = document.getElementById('co-org-section');
        if (orgSection) orgSection.style.display = type === 'organization' ? 'block' : 'none';

        if (type === 'individual') {
            const orgSelect = document.getElementById('co-org-select');
            if (orgSelect) orgSelect.value = '';
            const othersWrap = document.getElementById('co-others-wrap');
            if (othersWrap) othersWrap.style.display = 'none';
            const othersInput = document.getElementById('co-others-input');
            if (othersInput) othersInput.value = '';
        }

        updateNextBtn();
    };

    // ── Org dropdown change ────────────────────────────────────────────────

    window.onOrgChange = function (val) {
        selectedOrg = val;
        const othersWrap = document.getElementById('co-others-wrap');
        if (othersWrap) othersWrap.style.display = val === 'Others' ? 'block' : 'none';
        if (val !== 'Others') {
            const othersInput = document.getElementById('co-others-input');
            if (othersInput) othersInput.value = '';
        }
        updateNextBtn();
    };

    // ── Enable/disable Next button ─────────────────────────────────────────

    function updateNextBtn() {
        const btn = document.getElementById('btn-next-step');
        if (!btn) return;
        let ok = !!selectedType;
        if (selectedType === 'organization') {
            const orgVal = document.getElementById('co-org-select')?.value || '';
            ok = !!orgVal;
            if (orgVal === 'Others') {
                const otherVal = document.getElementById('co-others-input')?.value.trim() || '';
                ok = !!otherVal;
            }
        }
        btn.disabled = !ok;
    }

    document.getElementById('co-others-input')?.addEventListener('input', updateNextBtn);

    // ── Proceed to step 2 ──────────────────────────────────────────────────

    window.goToStep2 = function () {
        if (!selectedType) return;

        if (selectedType === 'organization') {
            if (typeof User !== 'undefined' && !User.hasVerifiedAffiliations()) {
                alert('Organization orders require an approved affiliation. Finish verification on your dashboard first.');
                return;
            }
            const orgVal = document.getElementById('co-org-select')?.value || '';
            if (!orgVal) return;
            selectedOrg = orgVal === 'Others'
                ? (document.getElementById('co-others-input')?.value.trim() || '')
                : orgVal;
            if (!selectedOrg) return;
        }

        // Save to localStorage so service pages can read it
        localStorage.setItem('upress_order_type', selectedType);
        if (selectedOrg) {
            localStorage.setItem('upress_order_org', selectedOrg);
        } else {
            localStorage.removeItem('upress_order_org');
        }

        // Update summary bar
        const bar = document.getElementById('co-order-summary-bar');
        if (bar) {
            const emoji   = selectedType === 'individual' ? '👤' : '🏫';
            const typeStr = selectedType === 'individual'
                ? 'Individual Order'
                : `Organization: ${selectedOrg}`;
            bar.innerHTML = `<span class="co-sum-emoji">${emoji}</span> <span>${typeStr}</span>`;
        }

        showStep(2);
        syncOrgCustomCardVisibility();
    };

    function syncOrgCustomCardVisibility() {
        const wrap = document.getElementById("co-org-custom-request-wrap");
        if (!wrap) return;
        const isOrg = localStorage.getItem("upress_order_type") === "organization";
        wrap.style.display = isOrg ? "block" : "none";
    }

    // ── Back to step 1 ─────────────────────────────────────────────────────

    window.goToStep1 = function () {
        showStep(1);
    };

    // ── Navigate to service page ───────────────────────────────────────────

    window.serviceHref = function (page) {
        window.location.href = page;
    };

    function getDbServicesSafe() {
        try {
            if (typeof window.getDB === 'function') {
                const db = window.getDB();
                return Array.isArray(db?.services) ? db.services : [];
            }
        } catch (_) {}
        return [];
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function renderServiceCardsFromDb() {
        const grid = document.querySelector('.co-services-grid');
        if (!grid) return;

        const hrefByName = {
            'printing': 'printing.html',
            'binding': 'binding.html',
            'lanyards': 'lanyard.html',
            'mug printing': 'mug.html',
            'id printing': 'id-printing.html',
            'id processing': 'id-printing.html',
        };

        const iconByKey = {
            printing: 'upress-icon--print',
            binding: 'upress-icon--book',
            lanyards: 'upress-icon--ticket',
            mugs: 'upress-icon--mug',
            id: 'upress-icon--id',
            default: 'upress-icon--print',
        };

        const services = getDbServicesSafe()
            .map((s) => ({
                id: String(s?.id || ''),
                name: String(s?.name || s?.serviceName || '').trim(),
                description: String(s?.description || '').trim(),
                category: String(s?.category || '').trim(),
            }))
            .filter((s) => s.name);

        if (!services.length) return; // keep existing hardcoded markup fallback

        // Unique by lowercased name (avoid duplicates when seed merges)
        const seen = new Set();
        const uniq = [];
        for (const s of services) {
            const k = s.name.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            uniq.push(s);
        }

        function iconClassFor(name) {
            const n = name.toLowerCase();
            if (n.includes('print')) return iconByKey.printing;
            if (n.includes('bind')) return iconByKey.binding;
            if (n.includes('lany')) return iconByKey.lanyards;
            if (n.includes('mug')) return iconByKey.mugs;
            if (n.includes('id')) return iconByKey.id;
            return iconByKey.default;
        }

        const cardsHtml = uniq.map((s) => {
            const nameKey = s.name.toLowerCase();
            const href = hrefByName[nameKey];
            const desc = s.description || 'Service available at UPress.';
            if (href) {
                return `
            <button type="button" class="co-service-card" onclick="serviceHref('${href}')">
                <div class="co-service-icon"><span class="upress-icon ${iconClassFor(s.name)}" aria-hidden="true"></span></div>
                <div class="co-service-info">
                    <div class="co-service-name">${escapeHtml(s.name)}</div>
                    <div class="co-service-desc">${escapeHtml(desc)}</div>
                </div>
                <span class="co-service-arrow">→</span>
            </button>`;
            }
            return `
            <button type="button" class="co-service-card" onclick="alert('This service is newly added but does not have an online order form yet. Please contact UPress staff for assistance.')">
                <div class="co-service-icon"><span class="upress-icon ${iconClassFor(s.name)}" aria-hidden="true"></span></div>
                <div class="co-service-info">
                    <div class="co-service-name">${escapeHtml(s.name)}</div>
                    <div class="co-service-desc">${escapeHtml(desc || 'Available soon in online ordering.')}</div>
                </div>
                <span class="co-service-arrow">→</span>
            </button>`;
        }).join('');

        const orgCustomWrap = document.getElementById('co-org-custom-request-wrap');
        const orgCustomHtml = orgCustomWrap ? orgCustomWrap.outerHTML : '';
        grid.innerHTML = cardsHtml + orgCustomHtml;
    }

    // ── Init ───────────────────────────────────────────────────────────────

    showStep(1);
    syncOrgCustomCardVisibility();
    renderServiceCardsFromDb();

})();