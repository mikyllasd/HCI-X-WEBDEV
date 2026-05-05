(function () {

    /* Guard: must be logged in */
    const u = User.get();
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    /* ── State ── */
    let selectedType = null; // 'individual' | 'organization'
    let selectedOrg  = null; // org name string or null

    /* ── Step navigation ── */
    function showStep(n) {
        document.querySelectorAll('.co-step-panel').forEach((p, i) => {
            p.classList.toggle('active', i + 1 === n);
        });
        document.querySelectorAll('.co-step').forEach((s, i) => {
            s.classList.remove('active', 'done');
            if (i + 1 === n)      s.classList.add('active');
            else if (i + 1 < n)   s.classList.add('done');
        });
        document.querySelectorAll('.co-step-line').forEach((l, i) => {
            l.classList.toggle('done', i + 1 < n);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ── Order type selection ── */
    window.selectOrderType = function (type) {
        selectedType = type;
        selectedOrg  = null;

        /* Update card UI */
        document.querySelectorAll('.co-type-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('btn-' + type).classList.add('selected');

        /* Show / hide org section */
        const orgSection = document.getElementById('co-org-section');
        orgSection.style.display = type === 'organization' ? 'block' : 'none';
        if (type === 'individual') {
            document.getElementById('co-org-select').value = '';
            document.getElementById('co-others-wrap').style.display = 'none';
        }

        updateNextBtn();
    };

    /* ── Org dropdown change ── */
    window.onOrgChange = function (val) {
        selectedOrg = val;
        const othersWrap = document.getElementById('co-others-wrap');
        othersWrap.style.display = val === 'Others' ? 'block' : 'none';
        if (val !== 'Others') document.getElementById('co-others-input').value = '';
        updateNextBtn();
    };

    /* ── Enable/disable Next button ── */
    function updateNextBtn() {
        const btn = document.getElementById('btn-next-step');
        if (!btn) return;
        let ok = !!selectedType;
        if (selectedType === 'organization') {
            const orgVal = document.getElementById('co-org-select').value;
            ok = !!orgVal;
            if (orgVal === 'Others') {
                const otherVal = document.getElementById('co-others-input').value.trim();
                ok = !!otherVal;
            }
        }
        btn.disabled = !ok;
    }

    /* Live typing in "others" field */
    document.getElementById('co-others-input').addEventListener('input', updateNextBtn);

    /* ── Proceed to step 2 ── */
    window.goToStep2 = function () {
        if (!selectedType) return;
        if (selectedType === 'organization') {
            const orgVal = document.getElementById('co-org-select').value;
            if (!orgVal) return;
            selectedOrg = orgVal === 'Others'
                ? document.getElementById('co-others-input').value.trim()
                : orgVal;
            if (!selectedOrg) return;
        }

        /* Save to localStorage so service pages can read it */
        localStorage.setItem('upress_order_type', selectedType);
        if (selectedOrg) {
            localStorage.setItem('upress_order_org', selectedOrg);
        } else {
            localStorage.removeItem('upress_order_org');
        }

        /* Update summary bar */
        const bar = document.getElementById('co-order-summary-bar');
        if (bar) {
            const emoji   = selectedType === 'individual' ? '👤' : '🏫';
            const typeStr = selectedType === 'individual' ? 'Individual Order' : `Organization: ${selectedOrg}`;
            bar.innerHTML = `<span class="co-sum-emoji">${emoji}</span> <span>${typeStr}</span>`;
        }

        showStep(2);
    };

    /* ── Back to step 1 ── */
    window.goToStep1 = function () {
        showStep(1);
    };

    /* ── Navigate to service page ── */
    window.serviceHref = function (page) {
        window.location.href = page;
    };

    /* ── Init ── */
    showStep(1);

})();