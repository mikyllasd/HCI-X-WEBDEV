// ============================================================
// UPRESSease — lanyard.js
// ============================================================

let _lanyardType = 'wmsu';
let _lanyardSubType = null; // 'department' or 'custom' when type is 'customization'
let _lanyardTypeName = 'WMSU Standard';
let _lanyardPrice = 120;
let lanyardSlots = [];

function getLanyardPrices() {
    const def = { official: 120, department: 150, custom: 200 };
    if (typeof window.UPressPricing === 'undefined' || !UPressPricing.readPricingFromSession) return def;
    const p = UPressPricing.readPricingFromSession();
    const l = p && p.lanyards ? p.lanyards : {};
    return {
        official:   typeof l.official   === 'number' ? l.official   : def.official,
        department: typeof l.department === 'number' ? l.department : def.department,
        custom:     typeof l.custom     === 'number' ? l.custom     : def.custom,
    };
}

function syncLanyardOptionLabels() {
    const pr = getLanyardPrices();
    const w = document.getElementById('lanyard-opt-price-wmsu');
    const c = document.getElementById('lanyard-opt-price-custom');
    if (w) w.textContent = '₱' + pr.official;
    if (c) c.textContent = '₱' + pr.custom;
}

function selectLanyardType(type, el) {
    document.querySelectorAll('#lanyard-page .option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _lanyardType = type;

    if (type === 'wmsu') {
        const pr = getLanyardPrices();
        _lanyardPrice = pr.official;
        _lanyardTypeName = 'WMSU Standard';
        _lanyardSubType = null;
        toggleLanyardSections('wmsu');
        buildLanyardSlots();
        updateLanyardSummary();
    } else if (type === 'customization') {
        showLanyardDesignSourceModal();
    }
}

function showLanyardDesignSourceModal() {
    initModals();
    const overlay = document.getElementById('upress-modal-overlay');
    const modalBox = document.getElementById('upress-modal-box');
    
    const customOptions = `
        <h3 id="upress-modal-title" style="margin:0 0 1rem;font-size:1.125rem;color:#333;">What is your design source?</h3>
        <p id="upress-modal-msg" style="margin:0 0 1.5rem;font-size:0.9375rem;color:#555;">Choose how you want to customize your lanyard.</p>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem;">
            <button type="button" id="source-dept" style="padding:1rem;border:2px solid #e0e0e0;border-radius:0.5rem;background:white;text-align:left;cursor:pointer;transition:all 0.2s;font-family:var(--font-sans);">
                <div style="font-weight:600;color:#333;margin-bottom:0.25rem;">🎓 Department Design</div>
                <div style="font-size:0.8125rem;color:#888;">Select college/department and course</div>
            </button>
            <button type="button" id="source-custom" style="padding:1rem;border:2px solid #e0e0e0;border-radius:0.5rem;background:white;text-align:left;cursor:pointer;transition:all 0.2s;font-family:var(--font-sans);">
                <div style="font-weight:600;color:#333;margin-bottom:0.25rem;">🎨 Upload Custom Design</div>
                <div style="font-size:0.8125rem;color:#888;">Upload your own design file</div>
            </button>
        </div>
        <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
            <button id="upress-modal-cancel" style="padding:0.625rem 1.25rem;border-radius:0.5rem;border:1.5px solid #e0e0e0;background:white;color:#555;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:var(--font-sans);">Cancel</button>
            <button id="upress-modal-confirm" style="padding:0.625rem 1.25rem;border-radius:0.5rem;border:none;background:var(--color-cta);color:white;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:var(--font-sans);">Select</button>
        </div>`;
    
    modalBox.innerHTML = customOptions;
    overlay.style.display = 'flex';
    
    let selectedSource = null;
    
    function updateStyle(btn, selected) {
        if (selected) {
            btn.style.borderColor = '#a32020';
            btn.style.background = '#fff9f9';
        } else {
            btn.style.borderColor = '#e0e0e0';
            btn.style.background = 'white';
        }
    }
    
    document.getElementById('source-dept').addEventListener('click', () => {
        selectedSource = 'department';
        updateStyle(document.getElementById('source-dept'), true);
        updateStyle(document.getElementById('source-custom'), false);
    });
    
    document.getElementById('source-custom').addEventListener('click', () => {
        selectedSource = 'custom';
        updateStyle(document.getElementById('source-dept'), false);
        updateStyle(document.getElementById('source-custom'), true);
    });
    
    document.getElementById('upress-modal-confirm').onclick = () => {
        if (!selectedSource) {
            showAlert('Selection Required', 'Please select a design source.');
            return;
        }
        
        overlay.style.display = 'none';
        
        const pr = getLanyardPrices();
        _lanyardType = 'customization';
        _lanyardSubType = selectedSource;
        
        if (selectedSource === 'department') {
            _lanyardPrice = pr.department;
            _lanyardTypeName = 'Department Design';
        } else {
            _lanyardPrice = pr.custom;
            _lanyardTypeName = 'Custom Design';
        }
        
        toggleLanyardSections('customization');
        buildLanyardSlots();
        updateLanyardSummary();
    };
    
    document.getElementById('upress-modal-cancel').onclick = () => {
        overlay.style.display = 'none';
        // Reset the selection
        document.querySelectorAll('#lanyard-page .option').forEach(o => o.classList.remove('active'));
        document.querySelectorAll('#lanyard-page .option')[0].classList.add('active');
        _lanyardType = 'wmsu';
        _lanyardSubType = null;
    };
}

function toggleLanyardSections(type) {
    const wmsuCard   = document.getElementById('lanyard-wmsu-preview-card');
    const deptCard   = document.getElementById('lanyard-dept-card');
    const customCard = document.getElementById('lanyard-custom-card');

    if (type === 'wmsu') {
        if (wmsuCard)   wmsuCard.classList.remove('hidden');
        if (deptCard)   deptCard.classList.add('hidden');
        if (customCard) customCard.classList.add('hidden');
    } else if (type === 'customization') {
        if (wmsuCard)   wmsuCard.classList.add('hidden');
        if (_lanyardSubType === 'department') {
            if (deptCard)   deptCard.classList.remove('hidden');
            if (customCard) customCard.classList.add('hidden');
        } else {
            if (deptCard)   deptCard.classList.add('hidden');
            if (customCard) customCard.classList.remove('hidden');
        }
    }
}

function onLanyardQtyChange() {
    buildLanyardSlots();
    updateLanyardSummary();
}

function buildLanyardSlots() {
    const qty = getLanyardQty();
    while (lanyardSlots.length < qty) lanyardSlots.push({ file: null, size: 'Standard', customLen: '', customWid: '', clasp: '', nameText: '', notes: '' });
    lanyardSlots = lanyardSlots.slice(0, qty);

    const container = document.getElementById('lanyard-piece-slots');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < qty; i++) {
        const slot = lanyardSlots[i];
        const customFileSection = _lanyardSubType === 'custom' ? `
            <div class="field">
                <label class="label">Upload Design File *</label>
                <label class="dropzone" style="padding:1rem;cursor:pointer;">
                    <input type="file" style="display:none;" id="lslot-file-${i}" accept=".ai,.pdf,.png" onchange="onLanyardSlotFile(${i}, this)" />
                    <div class="dropzone-primary" style="font-size:0.875rem;">Click to upload design</div>
                    <div class="dropzone-secondary">AI, PDF, PNG (MAX. 20MB)</div>
                </label>
                <div id="lslot-fname-${i}" style="display:none;font-size:0.8rem;color:#555;margin-top:0.4rem;"></div>
                <div class="piece-slot-error" id="lslot-err-${i}">Please complete the details for Lanyard ${i + 1}.</div>
            </div>` : `<div class="lanyard-preview-box" style="margin-bottom:0.75rem;padding:0.75rem;font-size:0.8125rem;">
                🎓 Department design will be used.
            </div>`;

        container.innerHTML += `
        <div class="card piece-slot" id="lslot-card-${i}">
            <div class="piece-slot-header">
                <span class="piece-slot-title">Lanyard ${i + 1} of ${qty}</span>
                <span class="piece-slot-badge">Piece ${i + 1}</span>
            </div>
            ${customFileSection}
            <div class="grid-2">
                <div class="field">
                    <label class="label">Size *</label>
                    <select class="select" id="lslot-size-${i}" onchange="onLanyardSlotChange(${i})">
                        <option value="Standard">Standard</option>
                        <option value="Custom">Custom</option>
                    </select>
                </div>
                <div class="field">
                    <label class="label">Clasp Type *</label>
                    <select class="select" id="lslot-clasp-${i}" onchange="onLanyardSlotChange(${i})">
                        <option value="">Select clasp</option>
                        <option value="Hook">Hook</option>
                        <option value="Swivel">Swivel</option>
                        <option value="Badge Clip">Badge Clip</option>
                    </select>
                </div>
            </div>
            <div class="grid-2 hidden" id="lslot-custom-dims-${i}">
                <div class="field">
                    <label class="label">Length (cm)</label>
                    <input class="input" type="number" id="lslot-len-${i}" placeholder="e.g. 90" min="1" oninput="onLanyardSlotChange(${i})" />
                </div>
                <div class="field">
                    <label class="label">Width (cm)</label>
                    <input class="input" type="number" id="lslot-wid-${i}" placeholder="e.g. 2" min="1" oninput="onLanyardSlotChange(${i})" />
                </div>
            </div>
            <div class="field">
                <label class="label">Name / Text to Print (optional)</label>
                <input class="input" type="text" id="lslot-name-${i}" placeholder="e.g. Juan dela Cruz" oninput="onLanyardSlotChange(${i})" />
            </div>
            <div class="field">
                <label class="label">Additional Design Notes (optional)</label>
                <input class="input" type="text" id="lslot-notes-${i}" placeholder="Any notes for this piece..." oninput="onLanyardSlotChange(${i})" />
            </div>
        </div>`;
    }

    // Restore values & wire size toggles
    for (let i = 0; i < qty; i++) {
        const sizeEl = document.getElementById(`lslot-size-${i}`);
        if (sizeEl) {
            sizeEl.value = lanyardSlots[i].size || 'Standard';
            toggleLanyardCustomDims(i, sizeEl.value);
            sizeEl.addEventListener('change', () => toggleLanyardCustomDims(i, sizeEl.value));
        }
    }

    const sameRow = document.getElementById('lanyard-same-row');
    if (sameRow) sameRow.style.display = qty > 1 ? 'flex' : 'none';
}

function toggleLanyardCustomDims(i, val) {
    const el = document.getElementById(`lslot-custom-dims-${i}`);
    if (el) el.classList.toggle('hidden', val !== 'Custom');
}

function onLanyardSlotFile(i, input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { showAlert('File Too Large', 'Maximum file size for design upload is 20MB.'); input.value = ''; return; }
    lanyardSlots[i].file = file;
    const fnEl = document.getElementById(`lslot-fname-${i}`);
    if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(file.name); fnEl.style.display = 'block'; }
    const errEl = document.getElementById(`lslot-err-${i}`);
    if (errEl) errEl.classList.remove('visible');

    if (document.getElementById('lanyard-same-all')?.checked) applyLanyardSlot0ToAll(true);
}

function onLanyardSlotChange(i) {
    const slot = lanyardSlots[i];
    slot.size  = document.getElementById(`lslot-size-${i}`)?.value || 'Standard';
    slot.clasp = document.getElementById(`lslot-clasp-${i}`)?.value || '';
    slot.customLen = document.getElementById(`lslot-len-${i}`)?.value || '';
    slot.customWid = document.getElementById(`lslot-wid-${i}`)?.value || '';
    slot.nameText  = document.getElementById(`lslot-name-${i}`)?.value || '';
    slot.notes     = document.getElementById(`lslot-notes-${i}`)?.value || '';
    toggleLanyardCustomDims(i, slot.size);
    if (i === 0 && document.getElementById('lanyard-same-all')?.checked) applyLanyardSlot0ToAll(false);
}

function onLanyardSameToggle() {
    if (document.getElementById('lanyard-same-all')?.checked) applyLanyardSlot0ToAll(true);
}

function applyLanyardSlot0ToAll(includeFile) {
    const qty = getLanyardQty();
    const s0 = lanyardSlots[0];
    for (let i = 1; i < qty; i++) {
        if (includeFile && s0.file) lanyardSlots[i].file = s0.file;
        lanyardSlots[i].size = s0.size;
        lanyardSlots[i].clasp = s0.clasp;
        lanyardSlots[i].customLen = s0.customLen;
        lanyardSlots[i].customWid = s0.customWid;
        lanyardSlots[i].nameText = s0.nameText;
        lanyardSlots[i].notes = s0.notes;

        const sizeEl  = document.getElementById(`lslot-size-${i}`);
        const claspEl = document.getElementById(`lslot-clasp-${i}`);
        const lenEl   = document.getElementById(`lslot-len-${i}`);
        const widEl   = document.getElementById(`lslot-wid-${i}`);
        const nameEl  = document.getElementById(`lslot-name-${i}`);
        const notesEl = document.getElementById(`lslot-notes-${i}`);
        if (sizeEl)  { sizeEl.value = s0.size; toggleLanyardCustomDims(i, s0.size); }
        if (claspEl) claspEl.value = s0.clasp;
        if (lenEl)   lenEl.value = s0.customLen;
        if (widEl)   widEl.value = s0.customWid;
        if (nameEl)  nameEl.value = s0.nameText;
        if (notesEl) notesEl.value = s0.notes;

        if (includeFile && s0.file) {
            const fnEl = document.getElementById(`lslot-fname-${i}`);
            if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(s0.file.name); fnEl.style.display = 'block'; }
        }
    }
}

function getLanyardQty() {
    return Math.max(1, parseInt(document.getElementById('lanyard-qty')?.value) || 1);
}

function updateLanyardSummary() {
    const qty = getLanyardQty();
    setText('lanyard-sum-type',  _lanyardTypeName);
    setText('lanyard-sum-unit',  '₱' + _lanyardPrice.toFixed(2));
    setText('lanyard-sum-qty',   qty);
    setText('lanyard-sum-total', '₱' + (_lanyardPrice * qty).toFixed(2));
}

function validateLanyard() {
    const qty = getLanyardQty();
    if (_lanyardType === 'department') {
        if (!document.getElementById('lanyard-college-select')?.value) { showAlert('Missing Info', 'Please select a college/department.'); return false; }
        if (!document.getElementById('lanyard-course-select')?.value)  { showAlert('Missing Info', 'Please select a course.'); return false; }
    }
    for (let i = 0; i < qty; i++) {
        if (_lanyardType === 'custom' && !lanyardSlots[i].file) {
            showAlert('Missing File', `Please upload a design file for Lanyard ${i + 1}.`);
            return false;
        }
        if (!lanyardSlots[i].clasp) {
            showAlert('Missing Info', `Please select a clasp type for Lanyard ${i + 1}.`);
            return false;
        }
        if (lanyardSlots[i].size === 'Custom' && (!lanyardSlots[i].customLen || !lanyardSlots[i].customWid)) {
            showAlert('Missing Info', `Please enter dimensions for Lanyard ${i + 1}.`);
            return false;
        }
    }
    return true;
}

function getLanyardOrderData() {
    const qty = getLanyardQty();
    const dept = _lanyardType === 'department'
        ? (document.getElementById('lanyard-college-select')?.value || '') + ' — ' + (document.getElementById('lanyard-course-select')?.value || '')
        : null;
    return {
        service: 'Lanyards',
        desc: `${qty} × ${_lanyardTypeName}${dept ? ' (' + dept + ')' : ''}`,
        qty,
        total: (_lanyardPrice * qty).toFixed(2),
        department: dept,
        pieces: lanyardSlots.slice(0, qty).map((s, i) => ({
            piece: i + 1,
            size: s.size,
            clasp: s.clasp,
            nameText: s.nameText,
            notes: s.notes,
            file: s.file?.name || null
        })),
        specialInstructions: document.getElementById('lanyard-special')?.value || ''
    };
}

function lanyardOrderNow() {
    if (!validateLanyard()) return;
    showConfirm('Proceed to Checkout', 'Place this lanyard order and proceed to checkout?', () => {
        const data = getLanyardOrderData();
        Cart.clear();
        Cart.add(data);
        window.location.href = 'payment.html';
    });
}

function lanyardAddToCart() {
    if (!validateLanyard()) return;
    if (!Cart.add(getLanyardOrderData())) return;
    showAlert('Added to Cart', `${_lanyardTypeName} × ${getLanyardQty()} added to your cart.`);
}

// Init
const _lanInit = getLanyardPrices();
_lanyardPrice = _lanInit.official;
syncLanyardOptionLabels();
toggleLanyardSections('wmsu');
buildLanyardSlots();
updateLanyardSummary();