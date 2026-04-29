// mug.js
let _mugType = 'wmsu', _mugTypeName = 'WMSU Logo Mug', _mugBasePrice = 200;

function selectMugType(type, el) {
    document.querySelectorAll('#mug-page .option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _mugType = type;
    const deptField = document.getElementById('mug-dept-field');
    if (deptField) deptField.classList.add('hidden');
    if (type === 'wmsu')       { _mugBasePrice = 200; _mugTypeName = 'WMSU Logo Mug'; }
    if (type === 'department') { _mugBasePrice = 220; _mugTypeName = 'Department Mug'; deptField?.classList.remove('hidden'); }
    if (type === 'photo')      { _mugBasePrice = 250; _mugTypeName = 'Photo Print Mug'; }
    buildMugPhotoForms();
    updateMugSummary();
}

function onMugQtyChange() { buildMugPhotoForms(); updateMugSummary(); }

function buildMugPhotoForms() {
    const container = document.getElementById('mug-photo-forms');
    if (!container) return;
    container.innerHTML = '';
    if (_mugType !== 'photo') return;
    const qty = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    for (let i = 1; i <= qty; i++) {
        container.innerHTML += `
        <div style="border:1px solid #e0e0e0;border-radius:0.75rem;padding:1.25rem;margin-bottom:1rem;">
            <div style="font-weight:700;color:#8B0000;margin-bottom:0.75rem;">📸 Mug ${i} of ${qty} — Upload Photo</div>
            <label class="dropzone" style="padding:1.25rem;cursor:pointer;">
                <input type="file" style="display:none;" id="mug-photo-${i}" accept="image/*">
                <div style="font-size:1.5rem;">🖼️</div>
                <div style="color:#a32020;font-weight:700;font-size:0.875rem;">Click to upload photo for Mug ${i}</div>
                <div style="color:#999;font-size:0.75rem;">PNG, JPG (MAX. 20MB)</div>
            </label>
            <div id="mug-file-${i}" style="display:none;font-size:0.8125rem;color:#555;margin-top:0.5rem;"></div>
            <div class="field" style="margin-top:0.75rem;margin-bottom:0;">
                <label class="label">Caption/Text (optional)</label>
                <input class="input" type="text" id="mug-caption-${i}" placeholder="e.g. John's Mug, Class 2025...">
            </div>
        </div>`;
    }
    for (let i = 1; i <= qty; i++) {
        const f = document.getElementById(`mug-photo-${i}`);
        if (f) f.addEventListener('change', (function(idx) { return function() {
            const d = document.getElementById(`mug-file-${idx}`);
            if (d && this.files[0]) { d.textContent = '📎 ' + this.files[0].name; d.style.display = 'block'; }
        }; })(i));
    }
}

function updateMugSummary() {
    const qty      = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    const sizeEl   = document.getElementById('mug-size');
    const sizeExtra = sizeEl?.value === 'large' ? 30 : 0;
    const sizeLabel = sizeEl?.options[sizeEl.selectedIndex]?.text.split(' +')[0] || 'Standard (11oz)';
    const unit = _mugBasePrice + sizeExtra;
    setText('mug-sum-type',  _mugTypeName);
    setText('mug-sum-size',  sizeLabel);
    setText('mug-sum-unit',  '₱' + unit.toFixed(2));
    setText('mug-sum-qty',   qty);
    setText('mug-sum-total', '₱' + (unit * qty).toFixed(2));
}

function validateMug() {
    const qty = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    if (_mugType === 'department' && !document.getElementById('mug-dept-select')?.value) { showAlert('Missing Info', 'Please select a department.'); return false; }
    if (_mugType === 'photo') {
        for (let i = 1; i <= qty; i++) {
            if (!document.getElementById(`mug-photo-${i}`)?.files[0]) { showAlert('Missing Photo', `Please upload a photo for Mug ${i}.`); return false; }
        }
    }
    return true;
}

function getMugOrderData() {
    const qty    = Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
    const sizeEl = document.getElementById('mug-size');
    const unit   = _mugBasePrice + (sizeEl?.value === 'large' ? 30 : 0);
    const dept   = _mugType === 'department' ? document.getElementById('mug-dept-select')?.value : null;
    const sizeLabel = sizeEl?.options[sizeEl.selectedIndex]?.text.split(' +')[0] || 'Standard';
    return {
        service: 'Mug Printing',
        desc: `${qty} × ${_mugTypeName}${dept ? ' (' + dept + ')' : ''} (${sizeLabel})`,
        qty, total: (unit * qty).toFixed(2), department: dept
    };
}

function mugOrderNow() {
    if (!validateMug()) return;
    showConfirm('Proceed to Checkout', 'Place this mug order and proceed to checkout?', () => {
        const data = getMugOrderData();
        Cart.clear(); Cart.add(data);
        window.location.href = 'payment.html';
    });
}

function mugAddToCart() {
    if (!validateMug()) return;
    Cart.add(getMugOrderData());
    showAlert('Added to Cart! 🛒', `${_mugTypeName} × ${document.getElementById('mug-qty')?.value || 1} added to your cart.`);
}

updateMugSummary();