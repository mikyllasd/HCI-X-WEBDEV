// binding.js
let _bindingType = null, _bindingTypeName = '—', _bindingPrice = 0;

function selectBindingType(type, price, el) {
    document.querySelectorAll('#binding-page .option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    _bindingType = type;
    _bindingPrice = price;
    if (type === 'thesis')    _bindingTypeName = 'Thesis Binding';
    if (type === 'hardcover') _bindingTypeName = 'Hardcover Binding';
    if (type === 'spiral')    _bindingTypeName = 'Spiral Binding';
    updateBindingSummary();
}

function updateBindingSummary() {
    const qty = Math.max(1, parseInt(document.getElementById('binding-qty')?.value) || 1);
    setText('binding-sum-type',  _bindingTypeName);
    setText('binding-sum-unit',  '₱' + _bindingPrice.toFixed(2));
    setText('binding-sum-qty',   qty);
    setText('binding-sum-total', '₱' + (_bindingPrice * qty).toFixed(2));
}

function validateBinding() {
    if (!_bindingType) { showAlert('No Selection', 'Please select a binding type first.'); return false; }
    return true;
}

function getBindingOrderData() {
    const qty = Math.max(1, parseInt(document.getElementById('binding-qty')?.value) || 1);
    return {
        service: 'Binding',
        desc:    `${qty} × ${_bindingTypeName}`,
        qty,
        total: (_bindingPrice * qty).toFixed(2)
    };
}

function bindingOrderNow() {
    if (!validateBinding()) return;
    showConfirm('Proceed to Checkout', 'Place this binding order and proceed to checkout?', () => {
        const data = getBindingOrderData();
        Cart.clear(); Cart.add(data);
        window.location.href = 'payment.html';
    });
}

function bindingAddToCart() {
    if (!validateBinding()) return;
    Cart.add(getBindingOrderData());
    const qty = document.getElementById('binding-qty')?.value || 1;
    showAlert('Added to Cart', `${_bindingTypeName} × ${qty} added to your cart.`);
}

updateBindingSummary();