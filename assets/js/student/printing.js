// printing.js
const fi = document.getElementById('print-file-input');
if (fi) {
    fi.addEventListener('change', function() {
        const d = document.getElementById('print-file-name');
        if (d) { d.textContent = this.files[0] ? '📎 ' + this.files[0].name : ''; d.style.display = this.files[0] ? 'block' : 'none'; }
    });
}

function calcPrintTotal() {
    const colorSel = document.getElementById('print-color');
    if (!colorSel) return 0;
    const priceEach = parseFloat(colorSel.options[colorSel.selectedIndex]?.dataset.price || 0);
    const pages = Math.max(1, parseInt(document.getElementById('print-pages')?.value) || 1);
    const qty   = Math.max(1, parseInt(document.getElementById('print-qty')?.value)   || 1);
    let total   = priceEach * pages * qty;
    const addons = [];
    if (document.getElementById('print-binding')?.checked)    { total += 50; addons.push('Binding'); }
    if (document.getElementById('print-lamination')?.checked) { total += 10 * pages * qty; addons.push('Lamination'); }
    if (document.getElementById('print-rush')?.checked)       { total += 100; addons.push('Rush Fee'); }
    const paper = document.getElementById('print-paper')?.value || '—';
    const color = colorSel.options[colorSel.selectedIndex]?.value || '—';
    setText('sum-print-paper', paper);
    setText('sum-print-color', color);
    setText('sum-print-pages', pages);
    setText('sum-print-qty',   qty);
    setText('sum-print-total', '₱' + total.toFixed(2));
    const addonsRow = document.getElementById('print-addons-row');
    if (addonsRow) {
        if (addons.length) { setText('sum-print-addons', addons.join(', ')); addonsRow.style.display = 'flex'; }
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
    return {
        service: 'Printing', paperSize: paper, color, pages, qty, addons,
        desc: `${qty} copy(ies) — ${paper || 'N/A'} (${color || 'N/A'}) × ${pages} pages${addons.length ? ' + ' + addons.join(', ') : ''}`,
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
    showAlert('Added to Cart! 🛒', 'Printing order added to your cart successfully.');
}

calcPrintTotal();