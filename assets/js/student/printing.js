// ============================================================
// UPRESSease — printing.js (Per-copy slot + impressions pricing)
// ============================================================

const PRINT_MAX_MB = 50;
const PRINT_ACCEPTED = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
/** Max rows with individual copy inputs; remaining pages use one “tail” count */
const PP_PAGE_TABLE_MAX = 60;
/** pdf.js worker (must match script in printing.html) */
const PDFJS_WORKER_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

function getPdfJsLib() {
    return typeof window !== 'undefined' ? window.pdfjsLib || window.pdfjs : null;
}

// State per slot: file, paper, color, notes, pageCount, pageCopies[], docKind
let printSlots = [
    {
        file: null,
        paperSize: '',
        colorMode: '',
        notes: '',
        pageCount: 0,
        pageCopies: [],
        docKind: ''
    }
];
/** @type {Record<number, string>} */
const slotPreviewBlobUrls = {};

/** Which print set is visible when there is more than one print set */
let activePrintSet = 0;

/** Modal: which slot index is being edited */
let _ppSlotIdx = -1;
let _ppPdfDoc = null;
let _ppPdfPageNum = 1;
let _ppImgBlobUrl = null;
/** Blob URL for modal PDF iframe (revoked on close / reopen) */
let _ppPdfIframeUrl = null;

function getPrintingPrices() {
    const def = {
        shortBw: 3,
        shortColor: 5,
        a4Bw: 3,
        a4Color: 5,
        a3Bw: 3,
        a3Color: 5,
        longBw: 3,
        longColor: 5,
        customBw: 3,
        customColor: 5,
        surcharge: 15
    };
    if (typeof window.UPressPricing === 'undefined' || !UPressPricing.readPricingFromSession) return def;
    const p = UPressPricing.readPricingFromSession();
    return Object.assign({}, def, p && p.printing ? p.printing : {});
}

function getPrintPaperKey(paperSize) {
    const map = {
        Short: 'short',
        A4: 'a4',
        A3: 'a3',
        Long: 'long',
        Custom: 'custom'
    };
    return map[paperSize] || 'a4';
}

function revokeAllSlotPreviewUrls() {
    Object.keys(slotPreviewBlobUrls).forEach((k) => {
        try {
            URL.revokeObjectURL(slotPreviewBlobUrls[k]);
        } catch (_) {}
        delete slotPreviewBlobUrls[k];
    });
}

function clearSlotPreview(i) {
    const wrap = document.getElementById(`slot-preview-wrap-${i}`);
    const inner = document.getElementById(`slot-preview-inner-${i}`);
    if (slotPreviewBlobUrls[i]) {
        try {
            URL.revokeObjectURL(slotPreviewBlobUrls[i]);
        } catch (_) {}
        delete slotPreviewBlobUrls[i];
    }
    if (inner) inner.innerHTML = '';
    if (wrap) wrap.style.display = 'none';
}

function newEmptySlot() {
    return {
        file: null,
        paperSize: '',
        colorMode: '',
        notes: '',
        pageCount: 0,
        pageCopies: [],
        docKind: ''
    };
}

function slotFileExt(slot) {
    const n = slot?.file?.name;
    if (!n) return '';
    return '.' + String(n).split('.').pop().toLowerCase();
}

async function countPdfPages(file) {
    try {
        const pdfjs = getPdfJsLib();
        if (!pdfjs) return 1;
        if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        }
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const n = Math.max(1, doc.numPages | 0);
        try {
            doc.destroy();
        } catch (_) {}
        return n;
    } catch (_) {
        return 1;
    }
}

/**
 * Heuristic page count from DOCX (breaks / Word layout hints). Not exact without Word.
 */
async function countDocxPages(file) {
    try {
        const JSZip = window.JSZip;
        if (!JSZip) return 1;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const xf = zip.file('word/document.xml');
        if (!xf) return 1;
        const xml = await xf.async('string');
        const rendered = (xml.match(/w:lastRenderedPageBreak/g) || []).length;
        const explicitBr = (xml.match(/<w:br[^>]*w:type=["']page["']/gi) || []).length;
        const n = 1 + Math.max(rendered, explicitBr);
        return Math.max(1, Math.min(n, 500));
    } catch (_) {
        return 1;
    }
}

async function refreshSlotPageMeta(i) {
    const slot = printSlots[i];
    if (!slot || !slot.file) return;

    const ext = slotFileExt(slot);
    if (ext === '.pdf') {
        slot.docKind = 'pdf';
        slot.pageCount = await countPdfPages(slot.file);
    } else if (ext === '.docx') {
        slot.docKind = 'docx';
        slot.pageCount = await countDocxPages(slot.file);
    } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        slot.docKind = 'image';
        slot.pageCount = 1;
    } else {
        slot.docKind = 'other';
        slot.pageCount = 1;
    }

    slot.pageCopies = Array(Math.max(1, slot.pageCount)).fill(1);
    setPreviewButtonEnabled(i, true);
    calcPrintTotal();
}

/** Detect page count without wiping existing per-page copy choices when count unchanged. */
async function ensurePageCountForSlot(i) {
    const slot = printSlots[i];
    if (!slot || !slot.file) return;

    const ext = slotFileExt(slot);
    let n = 1;
    let kind = 'other';
    if (ext === '.pdf') {
        kind = 'pdf';
        n = await countPdfPages(slot.file);
    } else if (ext === '.docx') {
        kind = 'docx';
        n = await countDocxPages(slot.file);
    } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        kind = 'image';
        n = 1;
    }

    slot.docKind = kind;
    const prev = Array.isArray(slot.pageCopies) ? [...slot.pageCopies] : [];
    const prevN = slot.pageCount | 0;

    if (n !== prevN) {
        slot.pageCount = n;
        slot.pageCopies = Array(n).fill(1);
        for (let j = 0; j < Math.min(prev.length, n); j++) {
            slot.pageCopies[j] = Math.max(1, parseInt(prev[j], 10) || 1);
        }
    } else {
        slot.pageCount = n;
        ensureSlotPricingArrays(slot);
    }

    setPreviewButtonEnabled(i, true);
}

function setPreviewButtonEnabled(i, on) {
    const btn = document.getElementById(`slot-preview-open-${i}`);
    if (btn) btn.disabled = !on;
}

function ensureSlotPricingArrays(slot) {
    const n = Math.max(1, slot.pageCount | 0);
    if (!Array.isArray(slot.pageCopies) || slot.pageCopies.length !== n) {
        slot.pageCopies = Array(n).fill(1);
    }
}

function getSlotPageUnitPrice(slot) {
    if (!slot.paperSize || !slot.colorMode) return 0;
    const prices = getPrintingPrices();
    const key = getPrintPaperKey(slot.paperSize);
    const colorKey = slot.colorMode === 'Full Color' ? `${key}Color` : `${key}Bw`;
    return Number(prices[colorKey] ?? prices.a4Bw ?? 0);
}

function getPrintSlotImpressions(slot) {
    if (!slot.file) return 0;
    ensureSlotPricingArrays(slot);
    return slot.pageCopies.reduce((sum, c) => sum + Math.max(1, parseInt(c, 10) || 1), 0);
}

function getPrintSlotPrice(slot) {
    if (!slot.file) return 0;
    const unit = getSlotPageUnitPrice(slot);
    const impressions = getPrintSlotImpressions(slot);
    const fileName = String(slot.file?.name || '').toLowerCase();
    const hasImage = /\.(jpg|jpeg|png)$/.test(fileName);
    const surcharge = hasImage ? Number(getPrintingPrices().surcharge || 0) : 0;
    return unit * impressions + surcharge;
}

async function renderSlotPreview(i, file) {
    const wrap = document.getElementById(`slot-preview-wrap-${i}`);
    const inner = document.getElementById(`slot-preview-inner-${i}`);
    if (!wrap || !inner || !file) {
        clearSlotPreview(i);
        return;
    }

    if (slotPreviewBlobUrls[i]) {
        try {
            URL.revokeObjectURL(slotPreviewBlobUrls[i]);
        } catch (_) {}
        delete slotPreviewBlobUrls[i];
    }
    inner.innerHTML = '';
    wrap.style.display = 'block';

    const ext = '.' + String(file.name).split('.').pop().toLowerCase();

    if (ext === '.docx') {
        inner.innerHTML =
            '<div class="slot-preview-fallback">DOCX — use <strong>Preview &amp; copies</strong> to view and set copies per page.</div>';
        return;
    }

    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        const url = URL.createObjectURL(file);
        slotPreviewBlobUrls[i] = url;
        const img = document.createElement('img');
        img.className = 'slot-preview-img';
        img.src = url;
        img.alt = 'File preview';
        inner.appendChild(img);
        return;
    }

    if (ext === '.pdf') {
        try {
            const url = URL.createObjectURL(file);
            slotPreviewBlobUrls[i] = url;
            const iframe = document.createElement('iframe');
            iframe.className = 'slot-preview-pdf-iframe';
            iframe.title = 'PDF preview';
            iframe.setAttribute('loading', 'lazy');
            iframe.src = url;
            inner.appendChild(iframe);
        } catch (_) {
            inner.innerHTML =
                '<div class="slot-preview-fallback">Could not open PDF preview.</div>';
        }
        return;
    }

    wrap.style.display = 'none';
}

// ── Preview modal ───────────────────────────────────────────

function _ppCleanupPdf() {
    if (_ppPdfDoc) {
        try {
            _ppPdfDoc.destroy();
        } catch (_) {}
        _ppPdfDoc = null;
    }
    _ppPdfPageNum = 1;
}

function _ppCleanupImg() {
    if (_ppImgBlobUrl) {
        try {
            URL.revokeObjectURL(_ppImgBlobUrl);
        } catch (_) {}
        _ppImgBlobUrl = null;
    }
}

function _ppClearPdfIframe() {
    const iframe = document.getElementById('pp-pdf-iframe');
    if (iframe) {
        iframe.src = 'about:blank';
        iframe.style.display = 'none';
    }
    if (_ppPdfIframeUrl) {
        try {
            URL.revokeObjectURL(_ppPdfIframeUrl);
        } catch (_) {}
        _ppPdfIframeUrl = null;
    }
}

function closePrintPreviewModal() {
    const modal = document.getElementById('print-preview-modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
    }
    _ppCleanupPdf();
    _ppCleanupImg();
    _ppClearPdfIframe();
    const cv = document.getElementById('pp-pdf-canvas');
    if (cv) {
        const ctx = cv.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
        cv.style.display = 'none';
    }
    _ppSlotIdx = -1;
}

async function openPrintPreviewModal(i) {
    const slot = printSlots[i];
    if (!slot || !slot.file) {
        showAlert('No file', 'Upload a file first.');
        return;
    }

    await ensurePageCountForSlot(i);
    ensureSlotPricingArrays(slot);

    _ppSlotIdx = i;
    const modal = document.getElementById('print-preview-modal');
    const sub = document.getElementById('pp-modal-sub');
    const title = document.getElementById('pp-modal-title');
    if (title) title.textContent = 'Preview & copies per page';
    if (sub) sub.textContent = slot.file.name;

    const nav = document.getElementById('pp-pdf-nav');
    const canvas = document.getElementById('pp-pdf-canvas');
    const iframePdf = document.getElementById('pp-pdf-iframe');
    const imgEl = document.getElementById('pp-img-preview');
    const docxEl = document.getElementById('pp-docx-preview');
    const fb = document.getElementById('pp-preview-fallback');
    const docxHint = document.getElementById('pp-docx-hint');

    if (nav) nav.style.display = 'none';
    if (canvas) canvas.style.display = 'none';
    if (iframePdf) {
        iframePdf.style.display = 'none';
        iframePdf.src = 'about:blank';
    }
    if (imgEl) imgEl.style.display = 'none';
    if (docxEl) {
        docxEl.style.display = 'none';
        docxEl.innerHTML = '';
    }
    if (fb) fb.style.display = 'none';
    if (docxHint) docxHint.style.display = 'none';

    _ppCleanupPdf();
    _ppCleanupImg();
    _ppClearPdfIframe();

    const ext = slotFileExt(slot);

    if (ext === '.pdf') {
        if (nav) nav.style.display = 'none';
        if (canvas) canvas.style.display = 'none';
        try {
            _ppPdfIframeUrl = URL.createObjectURL(slot.file);
            if (iframePdf) {
                iframePdf.src = _ppPdfIframeUrl;
                iframePdf.style.display = 'block';
            } else {
                try {
                    URL.revokeObjectURL(_ppPdfIframeUrl);
                } catch (_) {}
                _ppPdfIframeUrl = null;
                if (fb) {
                    fb.style.display = 'grid';
                    fb.textContent = 'PDF preview frame is missing.';
                }
            }
        } catch (_) {
            if (fb) {
                fb.style.display = 'grid';
                fb.textContent = 'Could not load PDF preview.';
            }
        }
    } else if (ext === '.docx') {
        if (docxEl) docxEl.style.display = 'block';
        if (docxHint) docxHint.style.display = 'block';
        try {
            const mammoth = window.mammoth;
            if (!mammoth) throw new Error('no mammoth');
            const arr = await slot.file.arrayBuffer();
            const { value } = await mammoth.convertToHtml({ arrayBuffer: arr });
            docxEl.innerHTML = value || '<p>(Empty document)</p>';
        } catch (_) {
            docxEl.innerHTML = '<p class="pp-docx-err">Could not render DOCX preview.</p>';
        }
    } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        if (imgEl) {
            _ppImgBlobUrl = URL.createObjectURL(slot.file);
            imgEl.src = _ppImgBlobUrl;
            imgEl.style.display = 'block';
        }
    } else {
        if (fb) {
            fb.style.display = 'grid';
            fb.textContent = 'Preview not available for this file type.';
        }
    }

    ppBuildPagesTable(slot);
    const badge = document.getElementById('pp-page-count-badge');
    if (badge) badge.textContent = `${slot.pageCount} page${slot.pageCount === 1 ? '' : 's'}`;

    const notesSync = document.getElementById('pp-print-notes-sync');
    const orderNotes = document.getElementById('print-special');
    if (notesSync && orderNotes) {
        notesSync.value = orderNotes.value || '';
    }

    if (modal) modal.setAttribute('aria-hidden', 'false');
}

async function ppRenderPdfPage() {
    if (!_ppPdfDoc) return;
    const canvas = document.getElementById('pp-pdf-canvas');
    const label = document.getElementById('pp-pdf-page-label');
    const n = _ppPdfDoc.numPages;
    const num = Math.min(Math.max(1, _ppPdfPageNum), n);
    _ppPdfPageNum = num;
    if (label) label.textContent = `Page ${num} / ${n}`;

    const prev = document.getElementById('pp-pdf-prev');
    const next = document.getElementById('pp-pdf-next');
    if (prev) prev.disabled = num <= 1;
    if (next) next.disabled = num >= n;

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const page = await _ppPdfDoc.getPage(num);
    const base = page.getViewport({ scale: 1 });
    const box = document.getElementById('pp-preview-box');
    const maxW = Math.min(520, (box && box.clientWidth) ? box.clientWidth - 24 : 480);
    const scale = Math.min(maxW / base.width, 2);
    const viewport = page.getViewport({ scale });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise.catch(() => {});
}

function ppPdfPrevPage() {
    if (_ppPdfPageNum > 1) {
        _ppPdfPageNum--;
        void ppRenderPdfPage();
    }
}

function ppPdfNextPage() {
    if (_ppPdfDoc && _ppPdfPageNum < _ppPdfDoc.numPages) {
        _ppPdfPageNum++;
        void ppRenderPdfPage();
    }
}

function ppBuildPagesTable(slot) {
    ensureSlotPricingArrays(slot);
    const wrap = document.getElementById('pp-pages-table');
    const tailRow = document.getElementById('pp-tail-row');
    const tailFrom = document.getElementById('pp-tail-from');
    const tailTo = document.getElementById('pp-tail-to');
    const tailInput = document.getElementById('pp-tail-copies');
    if (!wrap) return;

    const n = slot.pageCount;
    const showTail = n > PP_PAGE_TABLE_MAX;
    const head = Math.min(n, PP_PAGE_TABLE_MAX);

    if (tailRow) tailRow.style.display = showTail ? 'flex' : 'none';
    if (tailFrom) tailFrom.textContent = String(PP_PAGE_TABLE_MAX + 1);
    if (tailTo) tailTo.textContent = String(n);
    if (tailInput && showTail) {
        const tailVal = slot.pageCopies[PP_PAGE_TABLE_MAX] || 1;
        tailInput.value = String(Math.max(1, parseInt(tailVal, 10) || 1));
    }

    let html = '<table class="pp-pages-table"><thead><tr><th>Page</th><th>Copies</th></tr></thead><tbody>';
    for (let p = 0; p < head; p++) {
        const v = Math.max(1, parseInt(slot.pageCopies[p], 10) || 1);
        html += `<tr><td>${p + 1}</td><td><input type="number" class="input pp-page-copies-input" min="1" max="999" data-pp-page="${p}" value="${v}" /></td></tr>`;
    }
    html += '</tbody></table>';
    if (showTail) {
        html += `<p class="pp-tail-note">Pages ${PP_PAGE_TABLE_MAX + 1}–${n} share one copy count (below).</p>`;
    }
    wrap.innerHTML = html;
}

function ppApplyAllCopies() {
    const slot = printSlots[_ppSlotIdx];
    if (!slot) return;
    const inp = document.getElementById('pp-apply-all');
    const v = Math.max(1, parseInt(inp && inp.value, 10) || 1);
    ensureSlotPricingArrays(slot);
    for (let p = 0; p < slot.pageCopies.length; p++) slot.pageCopies[p] = v;
    ppBuildPagesTable(slot);
}

function savePrintPreviewModal() {
    const slot = printSlots[_ppSlotIdx];
    if (!slot) {
        closePrintPreviewModal();
        return;
    }
    ensureSlotPricingArrays(slot);
    const n = slot.pageCount;

    document.querySelectorAll('.pp-page-copies-input').forEach((el) => {
        const p = parseInt(el.getAttribute('data-pp-page'), 10);
        if (p >= 0 && p < n) {
            slot.pageCopies[p] = Math.max(1, parseInt(el.value, 10) || 1);
        }
    });

    if (n > PP_PAGE_TABLE_MAX) {
        const tail = document.getElementById('pp-tail-copies');
        const tv = Math.max(1, parseInt(tail && tail.value, 10) || 1);
        for (let p = PP_PAGE_TABLE_MAX; p < n; p++) slot.pageCopies[p] = tv;
    }

    const notesSync = document.getElementById('pp-print-notes-sync');
    const orderNotes = document.getElementById('print-special');
    if (notesSync && orderNotes) {
        orderNotes.value = notesSync.value || '';
    }

    closePrintPreviewModal();
    calcPrintTotal();
}

function setActivePrintSet(i) {
    const qty = getPrintQty();
    activePrintSet = Math.max(0, Math.min(i | 0, qty - 1));
    const multi = qty > 1;
    for (let j = 0; j < qty; j++) {
        const card = document.getElementById(`slot-card-${j}`);
        if (!card) continue;
        const hide = multi && j !== activePrintSet;
        card.classList.toggle('copy-slot--hidden', hide);
        card.setAttribute('aria-hidden', hide ? 'true' : 'false');
    }
    document.querySelectorAll('.printing-tab').forEach((btn, j) => {
        const on = j === activePrintSet;
        btn.classList.toggle('printing-tab--active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
}

// ── Build slots UI ──
function buildPrintSlots() {
    const qty = getPrintQty();
    while (printSlots.length < qty) printSlots.push(newEmptySlot());
    printSlots = printSlots.slice(0, qty);
    activePrintSet = Math.min(activePrintSet, Math.max(0, qty - 1));

    const container = document.getElementById('print-copy-slots');
    if (!container) return;
    revokeAllSlotPreviewUrls();
    container.innerHTML = '';

    const multi = qty > 1;
    for (let i = 0; i < qty; i++) {
        const hiddenClass = multi && i !== activePrintSet ? ' copy-slot--hidden' : '';
        const ariaHidden = multi && i !== activePrintSet ? 'true' : 'false';
        container.innerHTML += `
        <div class="card copy-slot copy-slot--compact${hiddenClass}" id="slot-card-${i}" role="tabpanel" aria-hidden="${ariaHidden}">
            <div class="copy-slot-layout">
                <div class="copy-slot-filecol">
                    <div class="printing-label-sm">File *</div>
                    <label class="dropzone printing-dropzone">
                        <input type="file" style="display:none;" id="slot-file-${i}" accept=".pdf,.docx,.jpg,.jpeg,.png" onchange="onSlotFileChange(${i}, this)" />
                        <div class="dropzone-icon"><span class="upress-icon upress-icon--doc" aria-hidden="true"></span></div>
                        <div class="printing-drop-copy">
                            <span class="printing-drop-primary">Choose file</span>
                            <span class="printing-drop-secondary">PDF · DOCX · JPG · PNG · max 50MB</span>
                        </div>
                    </label>
                    <div id="slot-fname-${i}" class="slot-fname-print" style="display:none;"></div>
                    <div class="slot-preview-actions" id="slot-preview-actions-${i}" style="display:none;">
                        <button type="button" class="btn-order slot-preview-open-btn" id="slot-preview-open-${i}" disabled onclick="openPrintPreviewModal(${i})">Preview &amp; pages</button>
                        <span class="slot-page-meta" id="slot-page-meta-${i}"></span>
                    </div>
                    <div class="slot-file-preview" id="slot-preview-wrap-${i}" style="display:none;">
                        <div class="slot-preview-label">Quick look</div>
                        <div class="slot-preview-inner" id="slot-preview-inner-${i}"></div>
                    </div>
                    <div class="slot-file-error" id="slot-err-${i}">Upload a file for this set.</div>
                    <div class="slot-warn" id="slot-warn-${i}">
                        <span class="slot-warn-msg">Image may print soft — consider a higher-res file.</span>
                        <span class="slot-warn-actions">
                            <button type="button" class="btn-cart slot-warn-btn" onclick="dismissSlotWarn(${i})">OK</button>
                            <label class="btn-order slot-warn-btn">Replace<input type="file" style="display:none;" accept=".pdf,.docx,.jpg,.jpeg,.png" onchange="onSlotFileChange(${i}, this)"></label>
                        </span>
                    </div>
                </div>
                <div class="copy-slot-sidecol">
                    <div class="field printing-field-tight">
                        <label class="label printing-label-sm" for="slot-paper-${i}">Paper *</label>
                        <select class="select printing-select" id="slot-paper-${i}" onchange="onSlotChange(${i})">
                            <option value="">Paper…</option>
                            <option value="A4">A4</option>
                            <option value="A3">A3</option>
                            <option value="Short">Short</option>
                            <option value="Long">Long</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>
                    <div class="field printing-field-tight">
                        <label class="label printing-label-sm" for="slot-color-${i}">Color *</label>
                        <select class="select printing-select" id="slot-color-${i}" onchange="onSlotChange(${i})">
                            <option value="">Color…</option>
                            <option value="Full Color">Full Color</option>
                            <option value="Black & White">Black &amp; White</option>
                        </select>
                    </div>
                    <div class="field printing-field-tight">
                        <label class="label printing-label-sm" for="slot-notes-${i}">Notes (this set)</label>
                        <textarea class="input textarea printing-slot-notes" id="slot-notes-${i}" rows="3" placeholder="Notes for this set…" oninput="onSlotChange(${i})"></textarea>
                    </div>
                </div>
            </div>
        </div>`;
    }

    const tabsEl = document.getElementById('print-set-tabs');
    if (tabsEl) {
        if (qty <= 1) {
            tabsEl.style.display = 'none';
            tabsEl.innerHTML = '';
        } else {
            tabsEl.style.display = 'flex';
            let tb = '';
            for (let t = 0; t < qty; t++) {
                const active = t === activePrintSet;
                tb += `<button type="button" role="tab" class="printing-tab${active ? ' printing-tab--active' : ''}" aria-selected="${active}" id="printing-tab-${t}" onclick="setActivePrintSet(${t})">Set ${t + 1}</button>`;
            }
            tabsEl.innerHTML = tb;
        }
    }

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
            if (fnEl) {
                fnEl.innerHTML = '📎 ' + escHtml(slot.file.name);
                fnEl.style.display = 'block';
            }
            const act = document.getElementById(`slot-preview-actions-${i}`);
            if (act) act.style.display = 'flex';
            setPreviewButtonEnabled(i, true);
            void renderSlotPreview(i, slot.file);
            if (!slot.pageCount) {
                void refreshSlotPageMeta(i).then(() => updateSlotPageMetaLabel(i));
            } else {
                ensureSlotPricingArrays(slot);
                updateSlotPageMetaLabel(i);
            }
        } else {
            clearSlotPreview(i);
            const act = document.getElementById(`slot-preview-actions-${i}`);
            if (act) act.style.display = 'none';
            setPreviewButtonEnabled(i, false);
        }
    }

    updateSameFileRow();
    calcPrintTotal();
}

function updateSlotPageMetaLabel(i) {
    const el = document.getElementById(`slot-page-meta-${i}`);
    const slot = printSlots[i];
    if (!el || !slot || !slot.file) {
        if (el) el.textContent = '';
        return;
    }
    if (!slot.pageCount) {
        el.textContent = 'Counting pages…';
        return;
    }
    ensureSlotPricingArrays(slot);
    const imp = getPrintSlotImpressions(slot);
    el.textContent = `${slot.pageCount} file page${slot.pageCount === 1 ? '' : 's'} · ${imp} impression${imp === 1 ? '' : 's'}`;
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

    if (file.size > PRINT_MAX_MB * 1024 * 1024) {
        showAlert(
            'File Too Large',
            'Your file is too large. Try re-exporting your PDF with compression settings enabled before uploading.'
        );
        input.value = '';
        return;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!PRINT_ACCEPTED.includes(ext)) {
        showAlert('Invalid File', 'Only PDF, DOCX, JPG, and PNG files are accepted.');
        input.value = '';
        return;
    }

    printSlots[i].file = file;
    printSlots[i].pageCount = 0;
    printSlots[i].pageCopies = [];
    printSlots[i].docKind = '';

    if (fnEl) {
        fnEl.innerHTML = '📎 ' + escHtml(file.name);
        fnEl.style.display = 'block';
    }
    if (errEl) errEl.classList.remove('visible');

    const act = document.getElementById(`slot-preview-actions-${i}`);
    if (act) act.style.display = 'flex';
    setPreviewButtonEnabled(i, true);

    if ((ext === '.jpg' || ext === '.jpeg' || ext === '.png') && file.size < 200 * 1024) {
        if (warnEl) warnEl.classList.add('visible');
    } else {
        if (warnEl) warnEl.classList.remove('visible');
    }

    void renderSlotPreview(i, file);
    void refreshSlotPageMeta(i).then(() => {
        updateSlotPageMetaLabel(i);
        if (document.getElementById('same-file-all')?.checked && i === 0) {
            applySlot0ToAll(true);
        }
        calcPrintTotal();
    });
    if (getPrintQty() > 1) {
        setActivePrintSet(i);
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
    updateSlotPageMetaLabel(i);
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
        if (includeFile && slot0.file) {
            printSlots[i].file = slot0.file;
            printSlots[i].pageCount = slot0.pageCount;
            printSlots[i].docKind = slot0.docKind;
            printSlots[i].pageCopies = Array.isArray(slot0.pageCopies) ? [...slot0.pageCopies] : [];
        }
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
            if (fnEl) {
                fnEl.innerHTML = '📎 ' + escHtml(slot0.file.name);
                fnEl.style.display = 'block';
            }
            if (errEl) errEl.classList.remove('visible');
            const act = document.getElementById(`slot-preview-actions-${i}`);
            if (act) act.style.display = 'flex';
            setPreviewButtonEnabled(i, true);
            updateSlotPageMetaLabel(i);
            void renderSlotPreview(i, slot0.file);
        }
    }
    calcPrintTotal();
}

function updateSameFileRow() {
    const row = document.getElementById('same-file-row');
    if (row) row.style.display = getPrintQty() > 1 ? 'flex' : 'none';
}

function getPrintQty() {
    return Math.max(1, parseInt(document.getElementById('print-qty')?.value, 10) || 1);
}

function onPrintQtyChange() {
    buildPrintSlots();
}

function calcPrintTotal() {
    const qty = getPrintQty();
    const slot0 = printSlots[0];
    const visibleSlots = printSlots.slice(0, qty);
    const total = visibleSlots.reduce((sum, slot) => sum + getPrintSlotPrice(slot), 0);
    const imageCount = visibleSlots.filter((slot) => /\.(jpg|jpeg|png)$/i.test(slot.file?.name || '')).length;
    const surcharge = Number(getPrintingPrices().surcharge || 0);

    const docPages = visibleSlots.reduce((s, slot) => s + (slot.file ? Math.max(1, slot.pageCount | 0) : 0), 0);
    const impressions = visibleSlots.reduce((s, slot) => s + getPrintSlotImpressions(slot), 0);

    setText('sum-print-qty', String(qty));
    setText('sum-print-docpages', docPages > 0 ? String(docPages) : '—');
    setText('sum-print-impressions', impressions > 0 ? String(impressions) : '—');
    setText('sum-print-paper', slot0.paperSize || '—');
    setText('sum-print-color', slot0.colorMode || '—');
    setText('sum-print-total', '₱' + total.toFixed(2));

    const addonsRow = document.getElementById('print-addons-row');
    const addonsText = document.getElementById('sum-print-addons');
    if (addonsRow) addonsRow.style.display = imageCount > 0 ? 'flex' : 'none';
    if (addonsText) {
        addonsText.textContent =
            imageCount > 0
                ? `${imageCount} image surcharge${imageCount > 1 ? 's' : ''} (+₱${(imageCount * surcharge).toFixed(2)})`
                : '';
    }
    for (let i = 0; i < qty; i++) updateSlotPageMetaLabel(i);
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
    const copies = printSlots.slice(0, qty).map((s, i) => {
        ensureSlotPricingArrays(s);
        return {
            copy: i + 1,
            file: s.file?.name || 'N/A',
            paperSize: s.paperSize,
            colorMode: s.colorMode,
            notes: s.notes,
            pageCount: s.pageCount,
            printedPageImpressions: getPrintSlotImpressions(s),
            pageCopies: [...s.pageCopies]
        };
    });
    const totalImpressions = copies.reduce((a, c) => a + (c.printedPageImpressions || 0), 0);
    return {
        service: 'Printing',
        desc: `${qty} set${qty > 1 ? 's' : ''}, ${totalImpressions} printed page${totalImpressions === 1 ? '' : 's'} — ${slot0.paperSize || 'N/A'} (${slot0.colorMode || 'N/A'})`,
        qty,
        copies,
        specialInstructions: document.getElementById('print-special')?.value || '',
        total: total.toFixed(2),
        totalPrintedPages: totalImpressions
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

// Globals for inline handlers
window.openPrintPreviewModal = openPrintPreviewModal;
window.closePrintPreviewModal = closePrintPreviewModal;
window.savePrintPreviewModal = savePrintPreviewModal;
window.ppPdfPrevPage = ppPdfPrevPage;
window.ppPdfNextPage = ppPdfNextPage;
window.ppApplyAllCopies = ppApplyAllCopies;
window.setActivePrintSet = setActivePrintSet;

buildPrintSlots();
