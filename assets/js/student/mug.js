// ============================================================
// UPRESSease — mug.js
// ============================================================

let _mugType = 'wmsu';
let _mugTypeName = 'WMSU Standard';
let _mugBasePrice = 200;
let mugSlots = [];

function getMugPrices() {
    const def = { wmsu: 200, department: 220, custom: 250, largeExtra: 30 };
    if (typeof window.UPressPricing === 'undefined' || !UPressPricing.readPricingFromSession) return def;
    const p = UPressPricing.readPricingFromSession();
    const m = p && p.mugs ? p.mugs : {};
    return {
        wmsu:       typeof m.wmsuLogo       === 'number' ? m.wmsuLogo       : def.wmsu,
        department: typeof m.department     === 'number' ? m.department     : def.department,
        custom:     typeof m.photo          === 'number' ? m.photo          : def.custom,
        largeExtra: typeof m.largeSizeAddon === 'number' ? m.largeSizeAddon : def.largeExtra,
    };
}

function syncMugOptionLabels() {
    const pr = getMugPrices();
    const w  = document.getElementById('mug-opt-price-wmsu');
    const d  = document.getElementById('mug-opt-price-dept');
    const c  = document.getElementById('mug-opt-price-custom');
    if (w) w.textContent = '₱' + pr.wmsu;
    if (d) d.textContent = '₱' + pr.department;
    if (c) c.textContent = '₱' + pr.custom;
}

function selectMugType(type, el) {
    document.querySelectorAll('#mug-page .option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _mugType = type;

    const pr = getMugPrices();
    if (type === 'wmsu')       { _mugBasePrice = pr.wmsu;       _mugTypeName = 'WMSU Standard'; }
    if (type === 'department') { _mugBasePrice = pr.department; _mugTypeName = 'Department Design'; }
    if (type === 'custom')     { _mugBasePrice = pr.custom;     _mugTypeName = 'Custom Upload'; }

    toggleMugSections(type);
    buildMugSlots();
    updateMugSummary();
}

function toggleMugSections(type) {
    const wmsuCard   = document.getElementById('mug-wmsu-preview-card');
    const deptCard   = document.getElementById('mug-dept-card');
    const customCard = document.getElementById('mug-custom-card');
    if (wmsuCard)   wmsuCard.classList.toggle('hidden',   type !== 'wmsu');
    if (deptCard)   deptCard.classList.toggle('hidden',   type !== 'department');
    if (customCard) customCard.classList.toggle('hidden', type !== 'custom');
}

function onMugQtyChange() {
    buildMugSlots();
    updateMugSummary();
}

function getMugQty() {
    return Math.max(1, parseInt(document.getElementById('mug-qty')?.value) || 1);
}

function buildMugSlots() {
    const qty = getMugQty();
    while (mugSlots.length < qty) mugSlots.push({ file: null, mugColor: 'White', personText: '', notes: '' });
    mugSlots = mugSlots.slice(0, qty);

    const container = document.getElementById('mug-piece-slots');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < qty; i++) {
        const customFileSection = _mugType === 'custom' ? `
            <div class="field">
                <label class="label">Upload Design File *</label>
                <label class="dropzone" style="padding:1rem;cursor:pointer;">
                    <input type="file" style="display:none;" id="mslot-file-${i}" accept=".png,.pdf" onchange="onMugSlotFile(${i}, this)" />
                    <div class="dropzone-primary" style="font-size:0.875rem;">Click to upload design</div>
                    <div class="dropzone-secondary">PNG, PDF — min 300 DPI recommended</div>
                </label>
                <div id="mslot-fname-${i}" style="display:none;font-size:0.8rem;color:#555;margin-top:0.4rem;"></div>
                <div class="piece-slot-error" id="mslot-err-${i}">Please complete the details for Mug ${i + 1}.</div>
            </div>` : `<div class="mug-preview-box" style="margin-bottom:0.75rem;padding:0.75rem;font-size:0.8125rem;">
                ${_mugType === 'wmsu' ? '🏫 WMSU Standard design will be used.' : '🎓 Department design will be used.'}
            </div>`;

        container.innerHTML += `
        <div class="card piece-slot" id="mslot-card-${i}">
            <div class="piece-slot-header">
                <span class="piece-slot-title">Mug ${i + 1} of ${qty}</span>
                <span class="piece-slot-badge">Piece ${i + 1}</span>
            </div>
            ${customFileSection}
            <div class="grid-2">
                <div class="field">
                    <label class="label">Mug Color *</label>
                    <select class="select" id="mslot-color-${i}" onchange="onMugSlotChange(${i})">
                        <option value="White">White</option>
                        <option value="Black">Black</option>
                        <option value="Pastel Pink">Pastel Pink</option>
                        <option value="Pastel Blue">Pastel Blue</option>
                        <option value="Pastel Yellow">Pastel Yellow</option>
                        <option value="Pastel Green">Pastel Green</option>
                    </select>
                </div>
                <div class="field">
                    <label class="label">Personalization Text (optional)</label>
                    <input class="input" type="text" id="mslot-text-${i}" placeholder="Name or message to print..." oninput="onMugSlotChange(${i})" />
                </div>
            </div>
            <div class="field">
                <label class="label">Additional Design Notes (optional)</label>
                <input class="input" type="text" id="mslot-notes-${i}" placeholder="Any notes for this mug..." oninput="onMugSlotChange(${i})" />
            </div>
        </div>`;
    }

    // Restore values
    for (let i = 0; i < qty; i++) {
        const colorEl = document.getElementById(`mslot-color-${i}`);
        const textEl  = document.getElementById(`mslot-text-${i}`);
        const notesEl = document.getElementById(`mslot-notes-${i}`);
        if (colorEl && mugSlots[i].mugColor) colorEl.value = mugSlots[i].mugColor;
        if (textEl  && mugSlots[i].personText) textEl.value = mugSlots[i].personText;
        if (notesEl && mugSlots[i].notes)     notesEl.value = mugSlots[i].notes;
    }

    const sameRow = document.getElementById('mug-same-row');
    if (sameRow) sameRow.style.display = qty > 1 ? 'flex' : 'none';
}

function onMugSlotFile(i, input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { showAlert('File Too Large', 'Maximum file size is 50MB.'); input.value = ''; return; }
    mugSlots[i].file = file;
    const fnEl = document.getElementById(`mslot-fname-${i}`);
    if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(file.name); fnEl.style.display = 'block'; }
    const errEl = document.getElementById(`mslot-err-${i}`);
    if (errEl) errEl.classList.remove('visible');

    // Low-res warning (heuristic: PNG/PDF under 500KB)
    if (file.size < 500 * 1024) {
        showAlert('Low Resolution Warning', 'Your design may print with low quality. Consider uploading a higher resolution version (minimum 300 DPI recommended).');
    }

    if (document.getElementById('mug-same-all')?.checked) applyMugSlot0ToAll(true);
}

function onMugSlotChange(i) {
    const slot = mugSlots[i];
    slot.mugColor   = document.getElementById(`mslot-color-${i}`)?.value || 'White';
    slot.personText = document.getElementById(`mslot-text-${i}`)?.value  || '';
    slot.notes      = document.getElementById(`mslot-notes-${i}`)?.value || '';
    if (i === 0 && document.getElementById('mug-same-all')?.checked) applyMugSlot0ToAll(false);
}

function onMugSameToggle() {
    if (document.getElementById('mug-same-all')?.checked) applyMugSlot0ToAll(true);
}

function applyMugSlot0ToAll(includeFile) {
    const qty = getMugQty();
    const s0 = mugSlots[0];
    for (let i = 1; i < qty; i++) {
        if (includeFile && s0.file) mugSlots[i].file = s0.file;
        mugSlots[i].mugColor   = s0.mugColor;
        mugSlots[i].personText = s0.personText;
        mugSlots[i].notes      = s0.notes;

        const colorEl = document.getElementById(`mslot-color-${i}`);
        const textEl  = document.getElementById(`mslot-text-${i}`);
        const notesEl = document.getElementById(`mslot-notes-${i}`);
        if (colorEl) colorEl.value = s0.mugColor;
        if (textEl)  textEl.value  = s0.personText;
        if (notesEl) notesEl.value = s0.notes;

        if (includeFile && s0.file) {
            const fnEl = document.getElementById(`mslot-fname-${i}`);
            if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(s0.file.name); fnEl.style.display = 'block'; }
        }
    }
}

function updateMugSummary() {
    const qty = getMugQty();
    const sizeEl = document.getElementById('mug-size');
    const pr = getMugPrices();
    const sizeExtra = sizeEl?.value === 'large' ? pr.largeExtra : 0;
    const sizeLabel = sizeEl?.value === 'large' ? 'Large (15oz)' : 'Standard (11oz)';
    const unit = _mugBasePrice + sizeExtra;
    setText('mug-sum-type',  _mugTypeName);
    setText('mug-sum-size',  sizeLabel);
    setText('mug-sum-unit',  '₱' + unit.toFixed(2));
    setText('mug-sum-qty',   qty);
    setText('mug-sum-total', '₱' + (unit * qty).toFixed(2));
}

function validateMug() {
    const qty = getMugQty();
    if (_mugType === 'department') {
        if (!document.getElementById('mug-college-select')?.value) { showAlert('Missing Info', 'Please select a college/department.'); return false; }
        if (!document.getElementById('mug-course-select')?.value)  { showAlert('Missing Info', 'Please select a course.'); return false; }
    }
    for (let i = 0; i < qty; i++) {
        if (_mugType === 'custom' && !mugSlots[i].file) {
            showAlert('Missing File', `Please upload a design file for Mug ${i + 1}.`);
            return false;
        }
    }
    return true;
}

function getMugOrderData() {
    const qty = getMugQty();
    const sizeEl = document.getElementById('mug-size');
    const pr = getMugPrices();
    const unit = _mugBasePrice + (sizeEl?.value === 'large' ? pr.largeExtra : 0);
    const sizeLabel = sizeEl?.value === 'large' ? 'Large (15oz)' : 'Standard (11oz)';
    const dept = _mugType === 'department'
        ? (document.getElementById('mug-college-select')?.value || '') + ' — ' + (document.getElementById('mug-course-select')?.value || '')
        : null;
    return {
        service: 'Mug Printing',
        desc: `${qty} × ${_mugTypeName}${dept ? ' (' + dept + ')' : ''} (${sizeLabel})`,
        qty,
        total: (unit * qty).toFixed(2),
        department: dept,
        pieces: mugSlots.slice(0, qty).map((s, i) => ({
            piece: i + 1,
            mugColor: s.mugColor,
            personText: s.personText,
            notes: s.notes,
            file: s.file?.name || null
        })),
        specialInstructions: document.getElementById('mug-special')?.value || ''
    };
}

function mugOrderNow() {
    if (!validateMug()) return;
    showConfirm('Proceed to Checkout', 'Place this mug order and proceed to checkout?', () => {
        const data = getMugOrderData();
        Cart.clear();
        Cart.add(data);
        window.location.href = 'payment.html';
    });
}

function mugAddToCart() {
    if (!validateMug()) return;
    Cart.add(getMugOrderData());
    showAlert('Added to Cart', `${_mugTypeName} × ${getMugQty()} added to your cart.`);
}

// Init
const _mugInit = getMugPrices();
_mugBasePrice = _mugInit.wmsu;
syncMugOptionLabels();
toggleMugSections('wmsu');
buildMugSlots();
updateMugSummary();