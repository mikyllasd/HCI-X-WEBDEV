(function () {
    const u = User.get();
    if (!u) {
        window.location.href = '../auth/portal.html';
        return;
    }
    if ((u.accountStatus || 'verified') !== 'verified') {
        showAlert('Verification required', 'ID requests require a verified account.', () => {
            window.location.href = 'dashboard.html';
        });
        return;
    }

    const sel = document.getElementById('id-reason');
    const hint = document.getElementById('id-reason-hint');
    const affWrap = document.getElementById('id-affidavit-wrap');

    const hints = {
        new: 'New IDs are free. You will schedule an in-person visit for photo capture and verification at UPress.',
        lost: 'A notarized affidavit of loss is required. Payment applies before scheduling.',
        damaged: 'Bring your damaged ID to the appointment; it will be surrendered when you receive the replacement.',
        renewal: 'No surrender required. Payment applies before scheduling.'
    };

    function idFeePeso(key) {
        if (typeof window.UPressPricing === 'undefined' || !UPressPricing.readPricingFromSession) return null;
        const p = UPressPricing.readPricingFromSession();
        const map = { lost: 'lostId', damaged: 'damagedId', renewal: 'renewalId' };
        const idKey = map[key];
        if (!idKey || !p.idAccessories) return null;
        const n = p.idAccessories[idKey];
        return typeof n === 'number' ? n : null;
    }

    function hintWithFee(key) {
        const base = hints[key] || '';
        const fee = idFeePeso(key);
        if (fee == null) return base;
        return base + ' Estimated fee: ₱' + fee.toFixed(2) + '.';
    }

    sel.addEventListener('change', function () {
        const v = sel.value;
        hint.textContent = v && hints[v] ? hintWithFee(v) : '';
        affWrap.style.display = v === 'lost' ? 'block' : 'none';
    });

    document.getElementById('id-continue').addEventListener('click', function () {
        if (!sel.value) {
            showAlert('Select a reason', 'Please choose what type of ID request this is.');
            return;
        }
        if (sel.value === 'lost' && !document.getElementById('id-affidavit').files[0]) {
            showAlert('Document required', 'Please upload your affidavit of loss to continue.');
            return;
        }
        showAlert(
            'Next step',
            'In the full system you would open appointment scheduling here. For now, return to the dashboard or printing services.',
            () => { window.location.href = 'dashboard.html'; }
        );
    });
})();
