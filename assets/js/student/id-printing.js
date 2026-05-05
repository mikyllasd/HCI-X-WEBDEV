(function () {
    /* ── Auth guard ─────────────────────────────────────────── */
    const u = typeof User !== 'undefined' ? User.get() : null;
    if (!u) { window.location.href = '../auth/portal.html'; return; }

    /* ── State ──────────────────────────────────────────────── */
    let _reason = null;
    let _affidavitFile = null;

    /* ── Config ─────────────────────────────────────────────── */
    const REASON_SHORT = {
        new:     'New ID',
        lost:    'Lost',
        damaged: 'Damaged',
        renewal: 'Renewal'
    };

    const REASON_DOCS = {
        new:     'None required',
        lost:    'Affidavit of Loss',
        damaged: 'Damaged ID (bring to appt)',
        renewal: 'None required'
    };

    const REASON_NEXT = {
        new:     'Appointment scheduling',
        lost:    'Checkout → Appointment',
        damaged: 'Checkout → Appointment',
        renewal: 'Checkout → Appointment'
    };

    const REASON_NOTICE = {
        new: {
            icon: '🆕',
            title: 'New ID — Free of Charge',
            body: 'New IDs are issued at no cost. ID printing requires an <strong>in-person visit</strong> to the UPress office for photo capture and information verification. You will proceed directly to appointment scheduling — no checkout needed.',
            what: '📋 What to bring: Any valid school document for identity verification. Your photo will be taken at the UPress office.'
        },
        lost: {
            icon: '🔴',
            title: 'Lost ID — Affidavit Required',
            body: 'A replacement ID due to loss requires a <strong>notarized Affidavit of Loss</strong>. Please upload a scanned copy or clear photo below. Admin will review the document before processing. If rejected, you have <strong>48 hours</strong> to resubmit before the order is automatically cancelled.',
            what: '📋 What to bring to appointment: A printed copy of your Affidavit of Loss as backup.'
        },
        damaged: {
            icon: '🟡',
            title: 'Damaged ID — Surrender Required',
            body: 'No affidavit is required. Please <strong>bring your damaged ID</strong> to your scheduled appointment at the UPress office. It will be surrendered upon release of your replacement ID.',
            what: '📋 What to bring: Your damaged ID. It will be collected when your new ID is released.'
        },
        renewal: {
            icon: '🟢',
            title: 'ID Renewal',
            body: 'No affidavit or ID surrender is required. Simply complete checkout and schedule your appointment.',
            what: '📋 What to bring: No additional documents needed. Simply arrive at your scheduled time.'
        }
    };

    const FOOTNOTES = {
        new:     'No payment required → proceed directly to appointment scheduling.',
        lost:    'After checkout is confirmed, you will be directed to appointment scheduling.',
        damaged: 'After checkout is confirmed, you will be directed to appointment scheduling.',
        renewal: 'After checkout is confirmed, you will be directed to appointment scheduling.'
    };

    /* ── Pricing helper ─────────────────────────────────────── */
    function getIdPrices() {
        const def = { lost: 150, damaged: 150, renewal: 100 };
        if (typeof window.UPressPricing === 'undefined' || !UPressPricing.readPricingFromSession) return def;
        const p = UPressPricing.readPricingFromSession();
        const ia = p && p.idAccessories ? p.idAccessories : {};
        return {
            lost:    typeof ia.lostId    === 'number' ? ia.lostId    : def.lost,
            damaged: typeof ia.damagedId === 'number' ? ia.damagedId : def.damaged,
            renewal: typeof ia.renewalId === 'number' ? ia.renewalId : def.renewal
        };
    }

    function getFeePeso(reason) {
        if (reason === 'new') return null;
        const pr = getIdPrices();
        return pr[reason] != null ? pr[reason] : null;
    }

    /* ── Sync price badges on the option cards ──────────────── */
    function syncPriceBadges() {
        const pr = getIdPrices();
        const badges = { lost: 'id-badge-lost', damaged: 'id-badge-damaged', renewal: 'id-badge-renewal' };
        Object.entries(badges).forEach(([key, id]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = '₱' + pr[key].toFixed(2);
        });
    }

    /* ── Summary rail update ────────────────────────────────── */
    function updateSummary() {
        setText('id-sum-reason', _reason ? REASON_SHORT[_reason] : '—');
        setText('id-sum-docs',   _reason ? REASON_DOCS[_reason]  : '—');
        setText('id-sum-next',   _reason ? REASON_NEXT[_reason]  : '—');

        const totalEl = document.getElementById('id-sum-total');
        if (!totalEl) return;
        if (!_reason) { totalEl.textContent = '—'; return; }
        if (_reason === 'new') { totalEl.textContent = 'Free'; return; }
        const fee = getFeePeso(_reason);
        totalEl.textContent = fee != null ? '₱' + fee.toFixed(2) : '—';

        const btnLabel = document.getElementById('id-btn-label');
        if (btnLabel) {
            btnLabel.textContent = _reason === 'new' ? 'Schedule Appointment' : 'Proceed to Checkout';
        }
    }

    /* ── Show / hide secondary cards ───────────────────────── */
    function showSecondaryCards(reason) {
        const noticeCard    = document.getElementById('id-notice-card');
        const affidavitCard = document.getElementById('id-affidavit-card');
        const notesCard     = document.getElementById('id-notes-card');

        // Notice
        if (noticeCard && REASON_NOTICE[reason]) {
            const cfg = REASON_NOTICE[reason];
            const noticeBox = document.getElementById('id-notice-box');
            const noticeTitle = document.getElementById('id-notice-title');
            if (noticeTitle) noticeTitle.textContent = 'Step 2 — ' + cfg.title;
            if (noticeBox) {
                noticeBox.innerHTML =
                    '<p>' + cfg.body + '</p>' +
                    '<div class="id-notice-what">' + cfg.what + '</div>';
            }
            noticeCard.classList.remove('hidden');
        } else if (noticeCard) {
            noticeCard.classList.add('hidden');
        }

        // Affidavit (Lost only)
        if (affidavitCard) {
            if (reason === 'lost') {
                affidavitCard.classList.remove('hidden');
            } else {
                affidavitCard.classList.add('hidden');
                _affidavitFile = null;
                const inp = document.getElementById('id-affidavit');
                if (inp) inp.value = '';
                const fn = document.getElementById('id-affidavit-fname');
                if (fn) fn.style.display = 'none';
            }
        }

        // Notes / step 3
        if (notesCard) {
            notesCard.classList.remove('hidden');
            const notesTitle = document.getElementById('id-notes-title');
            if (notesTitle) {
                notesTitle.textContent = reason === 'lost' ? 'Step 4 — Additional Notes' : 'Step 3 — Additional Notes';
            }
            const footnoteEl = document.getElementById('id-flow-footnote');
            if (footnoteEl) footnoteEl.textContent = FOOTNOTES[reason] || '';
        }
    }

    /* ── Public: option card click ──────────────────────────── */
    window.selectIdReason = function (reason, el) {
        document.querySelectorAll('.id-reason-option').forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        _reason = reason;
        showSecondaryCards(reason);
        updateSummary();
    };

    /* ── Public: affidavit file handler ─────────────────────── */
    window.onAffidavitFile = function (input) {
        const file = input.files && input.files[0] ? input.files[0] : null;
        const errEl = document.getElementById('id-affidavit-err');
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showAlert('File Too Large', 'Maximum file size for the affidavit is 10 MB.');
            input.value = '';
            _affidavitFile = null;
            return;
        }
        _affidavitFile = file;
        const fn = document.getElementById('id-affidavit-fname');
        if (fn) { fn.innerHTML = '📎 ' + escHtml(file.name); fn.style.display = 'block'; }
        if (errEl) errEl.classList.remove('visible');
    };

    /* ── Public: continue / checkout ───────────────────────── */
    window.idContinue = function () {
        if (!_reason) {
            showAlert('Select Request Type', 'Please choose what type of ID request this is.');
            return;
        }
        if (_reason === 'lost' && !_affidavitFile) {
            const errEl = document.getElementById('id-affidavit-err');
            if (errEl) errEl.classList.add('visible');
            document.getElementById('id-affidavit-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showAlert('Document Required', 'Please upload your notarized Affidavit of Loss to continue.');
            return;
        }

        const fee = getFeePeso(_reason);
        const specialInstructions = document.getElementById('id-special')?.value || '';

        const orderData = {
            service: 'ID Printing',
            desc: REASON_SHORT[_reason] + (_reason !== 'new' && fee != null ? ' — ₱' + fee.toFixed(2) : ' — Free'),
            qty: 1,
            total: fee != null ? fee.toFixed(2) : '0.00',
            reason: _reason,
            reasonLabel: REASON_SHORT[_reason],
            affidavit: _affidavitFile ? _affidavitFile.name : null,
            specialInstructions
        };

        if (_reason === 'new') {
            // Free → go straight to appointment scheduling (no checkout)
            showConfirm(
                'Proceed to Appointment',
                'New ID requests are free. You will now be directed to appointment scheduling.',
                () => {
                    Cart.clear();
                    Cart.add(orderData);
                    window.location.href = 'appointment.html';
                }
            );
        } else {
            // Paid → checkout first
            showConfirm(
                'Proceed to Checkout',
                'You will be directed to checkout. After payment is confirmed, you can schedule your appointment.',
                () => {
                    Cart.clear();
                    Cart.add(orderData);
                    window.location.href = 'payment.html';
                }
            );
        }
    };

    /* ── Init ───────────────────────────────────────────────── */
    syncPriceBadges();
    updateSummary();

})();