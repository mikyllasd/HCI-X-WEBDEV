// ============================================================
// UPRESSease — printing.js (Per-copy slot system)
// ============================================================

const PRINT_MAX_MB = 50;
const PRINT_ACCEPTED = ['.pdf', '.jpg', '.jpeg', '.png'];

// State per slot: { file, paperSize, colorMode, notes }
let printSlots = [{ file: null, paperSize: '', colorMode: '', notes: '' }];
let ppPdfBlobUrl = null;

// ── Pricing (from data-price attributes on color options, or defaults) ──
const COLOR_PRICES = { 'Black & White': 3, 'Colored': 6 };

// ── Build slots UI ──
function buildPrintSlots() {
    const qty = getPrintQty();
    // Resize slots array
    while (printSlots.length < qty) printSlots.push({ file: null, paperSize: '', colorMode: '', notes: '' });
    printSlots = printSlots.slice(0, qty);

    const container = document.getElementById('print-copy-slots');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < qty; i++) {
        const slot = printSlots[i];
        container.innerHTML += `
        <div class="card copy-slot" id="slot-card-${i}">
            <div class="copy-slot-header">
                <span class="copy-slot-title">Print ${i + 1} of ${qty}</span>
                <span class="copy-slot-badge">Copy ${i + 1}</span>
            </div>
            <div class="field">
                <label class="label">Upload File *</label>
                <label class="dropzone" style="padding:1.25rem;cursor:pointer;">
                    <input type="file" style="display:none;" id="slot-file-${i}" accept=".pdf,.jpg,.jpeg,.png" onchange="onSlotFileChange(${i}, this)" />
                    <div class="dropzone-icon"><span class="upress-icon upress-icon--doc" aria-hidden="true"></span></div>
                    <div class="dropzone-primary">Click to upload</div>
                    <div class="dropzone-secondary">PDF, JPG, PNG (MAX. 50MB)</div>
                </label>
                <div id="slot-fname-${i}" style="display:none;font-size:0.8125rem;color:#555;margin-top:0.5rem;"></div>
                <div class="slot-file-error" id="slot-err-${i}">Please upload a file for Print ${i + 1}.</div>
                <div class="slot-warn" id="slot-warn-${i}">
                    ⚠️ Your file may print with low quality. Consider uploading a higher resolution version.
                    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
                        <button type="button" class="btn-cart" style="padding:0.3rem 0.75rem;font-size:0.8rem;" onclick="dismissSlotWarn(${i})">Proceed Anyway</button>
                        <label class="btn-order" style="padding:0.3rem 0.75rem;font-size:0.8rem;cursor:pointer;">Replace File<input type="file" style="display:none;" accept=".pdf,.jpg,.jpeg,.png" onchange="onSlotFileChange(${i}, this)"></label>
                    </div>
                </div>
            </div>
            <div class="grid-2">
                <div class="field">
                    <label class="label">Paper Size *</label>
                    <select class="select" id="slot-paper-${i}" onchange="onSlotChange(${i})">
                        <option value="">Select paper size</option>
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="Short">Short</option>
                        <option value="Long">Long</option>
                        <option value="Custom">Custom</option>
                    </select>
                </div>
                <div class="field">
                    <label class="label">Color Mode *</label>
                    <select class="select" id="slot-color-${i}" onchange="onSlotChange(${i})">
                        <option value="">Select color mode</option>
                        <option value="Full Color">Full Color</option>
                        <option value="Black & White">Black &amp; White</option>
                    </select>
                </div>
            </div>
            <div class="field">
                <label class="label">Additional Notes (optional)</label>
                <input class="input" type="text" id="slot-notes-${i}" placeholder="Notes for this copy..." oninput="onSlotChange(${i})" />
            </div>
        </div>`;
    }

    // Restore values
    for (let i = 0; i < qty; i++) {
        const slot = printSlots[i];
        const paperEl = document.getElementById(`slot-paper-${i}`);
        const colorEl = document.getElementById(`slot-color-${i}`);
        const notesEl = document.getElementById(`slot-notes-${i}`);
        if (paperEl && slot.paperSize) paperEl.value = slot.paperSize;
        if (colorEl && slot.colorMode) colorEl.value = slot.colorMode;
        if (notesEl && slot.notes) notesEl.value = slot.notes;
        if (slot.file) {
            const fnEl = document.getElementById(`slot-fname-${i}`);
            if (fnEl) { fnEl.textContent = slot.file.name; fnEl.style.display = 'block'; }
        }
    }

    updateSameFileRow();
    calcPrintTotal();
}

function dismissSlotWarn(i) {
    const el = document.getElementById(`slot-warn-${i}`);
    if (el) el.classList.remove('visible');
}

function onSlotFileChange(i, input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    const errEl = document.getElementById(`slot-err-${i}`);
    const fnEl = document.getElementById(`slot-fname-${i}`);
    const warnEl = document.getElementById(`slot-warn-${i}`);

    if (!file) return;

    // Check size
    if (file.size > PRINT_MAX_MB * 1024 * 1024) {
        showAlert('File Too Large', 'Your file is too large. Try re-exporting your PDF with compression settings enabled before uploading.');
        input.value = '';
        return;
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!PRINT_ACCEPTED.includes(ext)) {
        showAlert('Invalid File', 'Only PDF, JPG, and PNG files are accepted.');
        input.value = '';
        return;
    }

    printSlots[i].file = file;
    if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(file.name); fnEl.style.display = 'block'; }
    if (errEl) errEl.classList.remove('visible');

    // Low-res warning for images (simulate DPI check — flag files < 200KB as potentially low-res)
    if ((ext === '.jpg' || ext === '.jpeg' || ext === '.png') && file.size < 200 * 1024) {
        if (warnEl) warnEl.classList.add('visible');
    } else {
        if (warnEl) warnEl.classList.remove('visible');
    }

    // If "same for all" is checked, propagate
    if (document.getElementById('same-file-all')?.checked) {
        applySlot0ToAll(false);
    }

    calcPrintTotal();
}

function onSlotChange(i) {
    const paperEl = document.getElementById(`slot-paper-${i}`);
    const colorEl = document.getElementById(`slot-color-${i}`);
    const notesEl = document.getElementById(`slot-notes-${i}`);
    printSlots[i].paperSize = paperEl?.value || '';
    printSlots[i].colorMode = colorEl?.value || '';
    printSlots[i].notes = notesEl?.value || '';

    if (i === 0 && document.getElementById('same-file-all')?.checked) {
        applySlot0ToAll(true);
    }
    calcPrintTotal();
}

function onSameFileToggle() {
    const checked = document.getElementById('same-file-all')?.checked;
    if (checked) applySlot0ToAll(true);
}

function applySlot0ToAll(includeFile) {
    const qty = getPrintQty();
    const slot0 = printSlots[0];
    for (let i = 1; i < qty; i++) {
        if (includeFile && slot0.file) printSlots[i].file = slot0.file;
        printSlots[i].paperSize = slot0.paperSize;
        printSlots[i].colorMode = slot0.colorMode;
        printSlots[i].notes = slot0.notes;

        const paperEl = document.getElementById(`slot-paper-${i}`);
        const colorEl = document.getElementById(`slot-color-${i}`);
        const notesEl = document.getElementById(`slot-notes-${i}`);
        if (paperEl) paperEl.value = slot0.paperSize;
        if (colorEl) colorEl.value = slot0.colorMode;
        if (notesEl) notesEl.value = slot0.notes;

        if (includeFile && slot0.file) {
            const fnEl = document.getElementById(`slot-fname-${i}`);
            const errEl = document.getElementById(`slot-err-${i}`);
            if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(slot0.file.name); fnEl.style.display = 'block'; }
            if (errEl) errEl.classList.remove('visible');
        }
    }
    calcPrintTotal();
}

function updateSameFileRow() {
    const row = document.getElementById('same-file-row');
    if (row) row.style.display = getPrintQty() > 1 ? 'flex' : 'none';
}

function getPrintQty() {
    return Math.max(1, parseInt(document.getElementById('print-qty')?.value) || 1);
}

function onPrintQtyChange() {
    buildPrintSlots();
}

function calcPrintTotal() {
    const qty = getPrintQty();
    // Use first slot's color/paper for summary display
    const slot0 = printSlots[0];
    const pricePerPage = COLOR_PRICES[slot0.colorMode] || 0;
    // Simple total: price per page × 1 page × qty (more accurate would need page count per file)
    const total = pricePerPage * qty;

    setText('sum-print-qty', qty);
    setText('sum-print-paper', slot0.paperSize || '—');
    setText('sum-print-color', slot0.colorMode || '—');
    setText('sum-print-total', '₱' + total.toFixed(2));

    const addonsRow = document.getElementById('print-addons-row');
    if (addonsRow) addonsRow.style.display = 'none';
    return total;
}

function validatePrint() {
    const qty = getPrintQty();
    for (let i = 0; i < qty; i++) {
        if (!printSlots[i].file) {
            const errEl = document.getElementById(`slot-err-${i}`);
            if (errEl) errEl.classList.add('visible');
            showAlert('Missing File', `Please upload a file for Print ${i + 1}.`);
            return false;
        }
        if (!printSlots[i].paperSize) {
            showAlert('Missing Info', `Please select a paper size for Print ${i + 1}.`);
            return false;
        }
        if (!printSlots[i].colorMode) {
            showAlert('Missing Info', `Please select a color mode for Print ${i + 1}.`);
            return false;
        }
    }
    return true;
}

function getPrintOrderData() {
    const qty = getPrintQty();
    const slot0 = printSlots[0];
    const total = calcPrintTotal();
    const copies = printSlots.slice(0, qty).map((s, i) => ({
        copy: i + 1,
        file: s.file?.name || 'N/A',
        paperSize: s.paperSize,
        colorMode: s.colorMode,
        notes: s.notes
    }));
    return {
        service: 'Printing',
        desc: `${qty} cop${qty > 1 ? 'ies' : 'y'} — ${slot0.paperSize || 'N/A'} (${slot0.colorMode || 'N/A'})`,
        qty,
        copies,
        specialInstructions: document.getElementById('print-special')?.value || '',
        total: total.toFixed(2)
    };
}

function printOrderNow() {
    if (!validatePrint()) return;
    showConfirm('Proceed to Checkout', 'Place this printing order and proceed to checkout?', () => {
        const data = getPrintOrderData();
        Cart.clear();
        Cart.add(data);
        window.location.href = 'payment.html';
    });
}

function printAddToCart() {
    if (!validatePrint()) return;
    Cart.add(getPrintOrderData());
    showAlert('Added to Cart', 'Printing order added to your cart successfully.');
}

// Init
buildPrintSlots();