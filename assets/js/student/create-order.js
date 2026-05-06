(function () {

    // ── DB / User helpers ──────────────────────────────────────────────────

    function getDB() {
        if (typeof window.getDB === 'function') return window.getDB();
        try { return JSON.parse(localStorage.getItem('upressDB') || '{}'); } catch { return {}; }
    }

    function getCurrentUser() {
        try { return JSON.parse(localStorage.getItem('upressUser') || 'null'); } catch { return null; }
    }

    function hasVerifiedAffiliation(user) {
        if (!user) return false;
        // Check affiliations array on user object
        if (Array.isArray(user.affiliations)) {
            const found = user.affiliations.find(a =>
                a.status === 'verified' || a.status === 'approved'
            );
            if (found) return true;
        }
        // Also check affiliationRequests in DB
        const db = getDB();
        const requests = Array.isArray(db.affiliationRequests) ? db.affiliationRequests : [];
        return requests.some(r =>
            r.userId === user.id &&
            (r.status === 'verified' || r.status === 'approved')
        );
    }

    // ── Guard ──────────────────────────────────────────────────────────────

    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = '../auth/portal.html';
        return;
    }

    // ── State ──────────────────────────────────────────────────────────────

    let selectedType = null; // 'individual' | 'organization'
    let selectedOrg  = null;

    // ── Check affiliation and show/hide org option ─────────────────────────

    const hasAffil = hasVerifiedAffiliation(currentUser);
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

    // ── Init ───────────────────────────────────────────────────────────────

    showStep(1);
    syncOrgCustomCardVisibility();

})();