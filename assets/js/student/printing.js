
const fi = document.getElementById('print-file-input');
if (fi) {
    fi.addEventListener('change', async function() {
        const d = document.getElementById('print-file-name');
        if (d) {
            if (this.files[0]) {
                d.innerHTML = '<span class="upress-icon upress-icon--clip" aria-hidden="true"></span> ' + escHtml(this.files[0].name);
                d.style.display = 'block';
            } else {
                d.innerHTML = '';
                d.style.display = 'none';
            }
        }

        const file = this.files && this.files[0] ? this.files[0] : null;
        if (!file) return;

        const pagesInput = document.getElementById('print-pages');
        if (!pagesInput) return;

        const setStatus = (msg) => {
            const el = document.getElementById('print-file-name');
            if (!el) return;
            const baseHtml = file
                ? '<span class="upress-icon upress-icon--clip" aria-hidden="true"></span> ' + escHtml(file.name)
                : '';
            el.innerHTML = msg ? `${baseHtml} — ${escHtml(msg)}` : baseHtml;
        };

        setStatus('Detecting pages…');
        try {
            const count = await detectUploadedPageCount(file);
            if (count && Number.isFinite(count) && count > 0) {
                pagesInput.value = String(count);
                printPageCopiesOverride = null;
                calcPrintTotal();
                setStatus(`${count} page(s) detected`);
                refreshPrintPreviewIfOpen();
            } else {
                setStatus('Page count unavailable (enter manually)');
            }
        } catch {
            setStatus('Page count unavailable (enter manually)');
        }
    });
}

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getPrintFileName() {
    const input = document.getElementById('print-file-input');
    const f = input && input.files && input.files[0] ? input.files[0] : null;
    return f ? f.name : 'Uploaded document';
}

function getFileExt(name) {
    const s = String(name || '').toLowerCase().trim();
    const i = s.lastIndexOf('.');
    return i >= 0 ? s.slice(i + 1) : '';
}

async function detectPdfPageCount(file) {
    const pdfjs = window.pdfjsLib;
    const buf = await file.arrayBuffer();

    if (pdfjs) {
        if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';
        }
        try {
            const doc = await pdfjs.getDocument({ data: buf }).promise;
            const n = doc?.numPages || null;
            if (n && Number.isFinite(n) && n > 0) return n;
        } catch {
        }
    }

    try {
        const u8 = new Uint8Array(buf);
        let s = '';
        for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
        const matches = s.match(/\/Type\s*\/Page\b/g);
        const n = matches ? matches.length : 0;
        return n > 0 ? n : null;
    } catch {
        return null;
    }
}

async function detectDocxPageCount(file) {
    const JSZip = window.JSZip;
    if (!JSZip) return null;
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);

    const appXmlFile = zip.file('docProps/app.xml');
    if (!appXmlFile) return null;
    const xml = await appXmlFile.async('string');
    const m = xml.match(/<Pages>(\d+)<\/Pages>/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

async function detectUploadedPageCount(file) {
    const ext = getFileExt(file.name);
    if (ext === 'pdf') return await detectPdfPageCount(file);
    if (ext === 'docx') return await detectDocxPageCount(file);
    return null;
}

function getTotalPages() {
    return Math.max(1, parseInt(document.getElementById('print-pages')?.value) || 1);
}

let printPageCopiesOverride = null;
let ppPdfBlobUrl = null;

async function renderDocxPreview(file) {
    const el = document.getElementById('ppDocxPreview');
    if (!el) return;
    const mammoth = window.mammoth;
    if (!mammoth) {
        el.innerHTML = `<div style="font-weight:800;color:#0f172a;">DOCX preview unavailable (missing library).</div>`;
        return;
    }
    el.innerHTML = `<div style="font-weight:800;color:#0f172a;">Rendering DOCX preview…</div>`;
    try {
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf }, {
            includeDefaultStyleMap: true,
        });
        el.innerHTML = result?.value || `<div style="font-weight:800;color:#0f172a;">No preview content.</div>`;
    } catch {
        el.innerHTML = `<div style="font-weight:800;color:#0f172a;">Failed to render DOCX preview.</div>`;
    }
}

function setPdfPreviewFromUpload() {
    const obj = document.getElementById('ppPdfObject');
    const docxEl = document.getElementById('ppDocxPreview');
    const fallback = document.getElementById('ppPreviewFallback');
    const link = document.getElementById('ppPreviewLink');
    if (!obj || !fallback || !docxEl || !link) return;

    if (ppPdfBlobUrl) {
        try { URL.revokeObjectURL(ppPdfBlobUrl); } catch {}
        ppPdfBlobUrl = null;
    }
    obj.removeAttribute('data');
    link.style.display = 'none';
    link.setAttribute('href', '#');
    docxEl.innerHTML = '';

    const input = document.getElementById('print-file-input');
    const file = input && input.files && input.files[0] ? input.files[0] : null;
    if (!file) {
        obj.style.display = 'none';
        docxEl.style.display = 'none';
        fallback.style.display = '';
        fallback.textContent = 'Upload a PDF to see a document preview here.';
        return;
    }

    const ext = getFileExt(file.name);
    if (ext === 'docx') {
        obj.style.display = 'none';
        fallback.style.display = 'none';
        docxEl.style.display = '';
        renderDocxPreview(file);
        link.style.display = 'none';
        return;
    }

    if (ext !== 'pdf') {
        obj.style.display = 'none';
        docxEl.style.display = 'none';
        fallback.style.display = '';
        fallback.textContent = 'Preview is available for PDF and DOCX uploads. (Legacy .DOC is not supported in-browser in this prototype.)';
        link.style.display = 'none';
        return;
    }

    ppPdfBlobUrl = URL.createObjectURL(file);
    obj.style.display = '';
    docxEl.style.display = 'none';
    fallback.style.display = 'none';
    obj.setAttribute('data', `${ppPdfBlobUrl}#page=1&view=FitH`);
    link.style.display = '';
    link.href = ppPdfBlobUrl;
}
function getUniformQty() {
    return Math.max(1, parseInt(document.getElementById('print-qty')?.value) || 1);
}

function getEffectiveSheetCount(pages, qty) {
    if (Array.isArray(printPageCopiesOverride) && printPageCopiesOverride.length === pages) {
        return printPageCopiesOverride.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
    }
    return pages * qty;
}

function formatPerPageCopiesSummary(copies) {
    if (!Array.isArray(copies) || !copies.length) return '';
    const parts = copies.map((c, i) => `P${i + 1}×${c}`);
    return parts.join(', ');
}

function openPrintPreview() {
    const modal = document.getElementById('ppModal');
    const metaEl = document.getElementById('ppMeta');
    const hintEl = document.getElementById('ppHint');
    const copiesEl = document.getElementById('ppCopies');
    if (!modal || !metaEl || !hintEl || !copiesEl) return;

    const totalPages = getTotalPages();
    const defaultQty = getUniformQty();
    const fileName = getPrintFileName();
    const paper = document.getElementById('print-paper')?.value || '—';
    const colorSel = document.getElementById('print-color');
    const color = colorSel?.options[colorSel.selectedIndex]?.value || '—';

    setPdfPreviewFromUpload();

    metaEl.innerHTML = `<b>${escapeHtml(fileName)}</b> • ${escapeHtml(String(totalPages))} page(s) • ${escapeHtml(paper)} • ${escapeHtml(color)}`;
    hintEl.textContent = `Set how many copies to print for each page (1 to ${totalPages}).`;

    copiesEl.innerHTML = Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        const initial = Array.isArray(printPageCopiesOverride) && printPageCopiesOverride.length === totalPages
            ? (printPageCopiesOverride[i] ?? 0)
            : defaultQty;
        return `
          <div class="pp-copyRow">
            <div>
              <div class="pp-copyLabel">Page ${pageNum}</div>
              <div class="pp-copySub">${escapeHtml(fileName)}</div>
            </div>
            <input
              class="input pp-copyInput"
              type="number"
              min="0"
              value="${escapeHtml(String(initial))}"
              inputmode="numeric"
              data-pp-page="${pageNum}"
              aria-label="Copies for page ${pageNum}"
            />
          </div>
        `;
    }).join('');

    modal.setAttribute('aria-hidden', 'false');
}

function refreshPrintPreviewIfOpen() {
    const modal = document.getElementById('ppModal');
    if (!modal) return;
    const isOpen = modal.getAttribute('aria-hidden') === 'false';
    if (!isOpen) return;
    openPrintPreview();
}

function closePrintPreview() {
    const modal = document.getElementById('ppModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');

    const obj = document.getElementById('ppPdfObject');
    if (obj) obj.removeAttribute('data');
    const docxEl = document.getElementById('ppDocxPreview');
    if (docxEl) { docxEl.innerHTML = ''; docxEl.style.display = 'none'; }
    const link = document.getElementById('ppPreviewLink');
    if (link) { link.style.display = 'none'; link.setAttribute('href', '#'); }
    if (ppPdfBlobUrl) {
        try { URL.revokeObjectURL(ppPdfBlobUrl); } catch {}
        ppPdfBlobUrl = null;
    }
}

function applyCopiesToOrder() {
    const totalPages = getTotalPages();
    const copiesEl = document.getElementById('ppCopies');
    const inputs = copiesEl ? Array.from(copiesEl.querySelectorAll('input[data-pp-page]')) : [];

    const copies = Array.from({ length: totalPages }, () => 0);
    for (const input of inputs) {
        const p = Number(input.getAttribute('data-pp-page') || 0);
        if (!p || p > totalPages) continue;
        const c = Math.max(0, Math.floor(Number(input.value || 0)));
        copies[p - 1] = c;
    }

    printPageCopiesOverride = copies;
    closePrintPreview();
    calcPrintTotal();

    const sheets = copies.reduce((s, n) => s + n, 0);
    const summary = formatPerPageCopiesSummary(copies);
    showAlert('Saved to Order', `Per-page copies applied.\n\nTotal sheets: ${sheets}\n${summary}`);
}

function calcPrintTotal() {
    const colorSel = document.getElementById('print-color');
    if (!colorSel) return 0;
    const priceEach = parseFloat(colorSel.options[colorSel.selectedIndex]?.dataset.price || 0);
    const pages = Math.max(1, parseInt(document.getElementById('print-pages')?.value) || 1);
    const qty   = Math.max(1, parseInt(document.getElementById('print-qty')?.value)   || 1);
    const sheets = getEffectiveSheetCount(pages, qty);
    let total   = priceEach * sheets;
    const addons = [];
    if (document.getElementById('print-binding')?.checked)    { total += 50; addons.push('Binding'); }
    if (document.getElementById('print-lamination')?.checked) { total += 10 * sheets; addons.push('Lamination'); }
    if (document.getElementById('print-rush')?.checked)       { total += 100; addons.push('Rush Fee'); }
    const paper = document.getElementById('print-paper')?.value || '—';
    const color = colorSel.options[colorSel.selectedIndex]?.value || '—';
    setText('sum-print-paper', paper);
    setText('sum-print-color', color);
    setText('sum-print-pages', pages);
    setText('sum-print-qty', Array.isArray(printPageCopiesOverride) && printPageCopiesOverride.length === pages ? 'Per-page' : qty);
    setText('sum-print-total', '₱' + total.toFixed(2));
    const addonsRow = document.getElementById('print-addons-row');
    if (addonsRow) {
        const extra = (Array.isArray(printPageCopiesOverride) && printPageCopiesOverride.length === pages)
            ? [`Per-page copies: ${formatPerPageCopiesSummary(printPageCopiesOverride)}`]
            : [];
        const all = [...addons, ...extra];
        if (all.length) { setText('sum-print-addons', all.join(', ')); addonsRow.style.display = 'flex'; }
        else addonsRow.style.display = 'none';
    }
    return total;
}

function getPrintOrderData() {
    const colorSel = document.getElementById('print-color');
    const paper = document.getElementById('print-paper')?.value;
    const color = colorSel?.options[colorSel.selectedIndex]?.value;
    const pages = Math.max(1, parseInt(document.getElementById('print-pages')?.value) || 1);
    const qty   = Math.max(1, parseInt(document.getElementById('print-qty')?.value)   || 1);
    const total = calcPrintTotal();
    const addons = [];
    if (document.getElementById('print-binding')?.checked)    addons.push('Binding');
    if (document.getElementById('print-lamination')?.checked) addons.push('Lamination');
    if (document.getElementById('print-rush')?.checked)       addons.push('Rush Fee');

    const hasPerPage = Array.isArray(printPageCopiesOverride) && printPageCopiesOverride.length === pages;
    const sheets = getEffectiveSheetCount(pages, qty);
    const perPageDesc = hasPerPage ? ` (per-page: ${formatPerPageCopiesSummary(printPageCopiesOverride)})` : '';

    return {
        service: 'Printing',
        paperSize: paper,
        color,
        pages,
        qty,
        pageCopies: hasPerPage ? printPageCopiesOverride.slice() : null,
        sheets,
        addons,
        desc: `${paper || 'N/A'} (${color || 'N/A'}) — ${sheets} sheet(s) total${perPageDesc}${addons.length ? ' + ' + addons.join(', ') : ''}`,
        total: total.toFixed(2)
    };
}

function validatePrint() {
    if (!document.getElementById('print-paper')?.value) { showAlert('Missing Info', 'Please select a paper size.'); return false; }
    if (!document.getElementById('print-color')?.value) { showAlert('Missing Info', 'Please select a color option.'); return false; }
    if ((parseInt(document.getElementById('print-pages')?.value) || 0) < 1) { showAlert('Invalid Input', 'Number of pages must be at least 1.'); return false; }
    return true;
}

function printOrderNow() {
    if (!validatePrint()) return;
    showConfirm('Proceed to Checkout', 'Place this printing order and go to checkout?', () => {
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

calcPrintTotal();

(function initPrintPreview() {
    const openBtn = document.getElementById('printPreviewBtn');
    const modal = document.getElementById('ppModal');
    const applyBtn = document.getElementById('ppApplyBtn');

    if (modal) modal.setAttribute('aria-hidden', 'true');
    if (openBtn) openBtn.addEventListener('click', openPrintPreview);
    if (applyBtn) applyBtn.addEventListener('click', applyCopiesToOrder);

    document.addEventListener('click', (e) => {
        const close = e.target.closest('[data-pp-close]');
        if (close) closePrintPreview();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePrintPreview();
    });

    document.addEventListener('input', (e) => {
        const input = e.target.closest('#ppCopies input[data-pp-page]');
        if (!input) return;
        const v = Math.max(0, Math.min(999, Math.floor(Number(input.value || 0))));
        input.value = String(v);
    });

    const pagesInput = document.getElementById('print-pages');
    const qtyInput = document.getElementById('print-qty');
    const clearOverride = () => {
        if (printPageCopiesOverride) {
            printPageCopiesOverride = null;
            calcPrintTotal();
        }
    };
    if (pagesInput) pagesInput.addEventListener('input', clearOverride);
    if (qtyInput) qtyInput.addEventListener('input', clearOverride);
})();