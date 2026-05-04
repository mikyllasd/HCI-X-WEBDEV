// ============================================================
// UPRESSease — binding.js
// ============================================================

let _bindingProcess = 'full'; // 'full' | 'bindonly'
let _bindingType = '';
let _bindingPrice = 0;
const BINDING_PRICES = {
    'Soft Bind': 80,
    'Hard Bind': 200,
    'Ring Bind': 100,
    'Spiral Bind': 80
};

function selectBindingProcess(process, el) {
    document.querySelectorAll('.binding-process-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _bindingProcess = process;

    const sectionFull = document.getElementById('section-full');
    const appointmentCard = document.getElementById('appointment-notice-card');
    const pagesInput = document.getElementById('binding-pages');

    if (process === 'full') {
        if (sectionFull) sectionFull.style.display = '';
        if (appointmentCard) appointmentCard.classList.add('hidden');
        if (pagesInput) pagesInput.placeholder = 'Auto-detected or enter manually';
        setText('binding-sum-process', 'Print & Bind');
    } else {
        if (sectionFull) sectionFull.style.display = 'none';
        if (appointmentCard) appointmentCard.classList.remove('hidden');
        if (pagesInput) pagesInput.placeholder = 'Enter number of pages';
        setText('binding-sum-process', 'Binding Only');
    }
    updateBindingSummary();
}

function onBindingFileChange(input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    const fnEl = document.getElementById('binding-file-name');
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        showAlert('File Too Large', 'Your file is too large. Try re-exporting your PDF with compression settings enabled before uploading.');
        input.value = '';
        return;
    }

    if (fnEl) { fnEl.innerHTML = '📎 ' + escHtml(file.name); fnEl.style.display = 'block'; }

    // Auto-detect pages from PDF
    detectPdfPages(file).then(count => {
        if (count) {
            const pagesEl = document.getElementById('binding-pages');
            if (pagesEl) pagesEl.value = count;
            updateBindingSummary();
        }
    });
}

async function detectPdfPages(file) {
    try {
        const pdfjs = window.pdfjsLib;
        if (!pdfjs) return null;
        if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';
        }
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        return doc.numPages || null;
    } catch {
        return null;
    }
}

function onBindingTypeChange() {
    const val = document.getElementById('binding-type-select')?.value;
    _bindingType = val || '';
    _bindingPrice = BINDING_PRICES[val] || 0;

    const coverField = document.getElementById('cover-color-field');
    if (coverField) {
        if (val === 'Hard Bind') coverField.classList.remove('hidden');
        else coverField.classList.add('hidden');
    }
    updateBindingSummary();
}

function updateBindingSummary() {
    const qty = Math.max(1, parseInt(document.getElementById('binding-qty')?.value) || 1);
    const pages = parseInt(document.getElementById('binding-pages')?.value) || 0;
    setText('binding-sum-type', _bindingType || '—');
    setText('binding-sum-pages', pages > 0 ? pages : '—');
    setText('binding-sum-unit', '₱' + _bindingPrice.toFixed(2));
    setText('binding-sum-qty', qty);
    setText('binding-sum-total', '₱' + (_bindingPrice * qty).toFixed(2));
}

function validateBinding() {
    if (!_bindingType) { showAlert('No Binding Type', 'Please select a binding type.'); return false; }
    const pages = parseInt(document.getElementById('binding-pages')?.value) || 0;
    if (pages < 1) { showAlert('Missing Info', 'Please enter the number of pages.'); return false; }
    if (_bindingProcess === 'full') {
        const fileInput = document.getElementById('binding-file-input');
        if (!fileInput || !fileInput.files[0]) {
            showAlert('No File', 'Please upload your PDF document.');
            return false;
        }
    }
    if (_bindingType === 'Hard Bind' && !document.getElementById('binding-cover-color')?.value) {
        showAlert('Missing Info', 'Please select a cover color for Hard Bind.');
        return false;
    }
    return true;
}

function getBindingOrderData() {
    const qty = Math.max(1, parseInt(document.getElementById('binding-qty')?.value) || 1);
    const pages = parseInt(document.getElementById('binding-pages')?.value) || 0;
    const coverColor = _bindingType === 'Hard Bind' ? (document.getElementById('binding-cover-color')?.value || '') : '';
    return {
        service: 'Binding',
        desc: `${qty} × ${_bindingType} (${pages} pages)${coverColor ? ' — Cover: ' + coverColor : ''} [${_bindingProcess === 'full' ? 'Print & Bind' : 'Binding Only'}]`,
        qty,
        total: (_bindingPrice * qty).toFixed(2),
        process: _bindingProcess,
        bindingType: _bindingType,
        pages,
        coverColor,
        specialInstructions: document.getElementById('binding-special')?.value || ''
    };
}

function bindingOrderNow() {
    if (!validateBinding()) return;
    showConfirm('Proceed to Checkout', 'Place this binding order and proceed to checkout?', () => {
        const data = getBindingOrderData();
        Cart.clear();
        Cart.add(data);
        window.location.href = 'payment.html';
    });
}

function bindingAddToCart() {
    if (!validateBinding()) return;
    Cart.add(getBindingOrderData());
    const qty = document.getElementById('binding-qty')?.value || 1;
    showAlert('Added to Cart', `${_bindingType} × ${qty} added to your cart.`);
}

updateBindingSummary();