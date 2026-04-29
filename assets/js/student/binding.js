// binding.js
let _bindingSelected = null, _bindingPrice = 0, _bindingQty = 1;

function selectBinding(el, name, price) {
    document.querySelectorAll('#binding-page .service-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    _bindingSelected = name;
    _bindingPrice    = price;
    updateBindingBottom();
}

function changeBindingQty(delta) {
    _bindingQty = Math.max(1, _bindingQty + delta);
    setText('binding-qty-display', _bindingQty);
    updateBindingBottom();
}

function updateBindingBottom() {
    setText('binding-bottom-type',  _bindingSelected ? `${_bindingSelected} × ${_bindingQty}` : 'No binding selected');
    setText('binding-bottom-total', '₱' + (_bindingPrice * _bindingQty).toFixed(2));
}

function bindingGoNext() {
    if (!_bindingSelected) { showAlert('No Selection', 'Please select a binding type first.'); return; }
    Checkout.set({ bindingType: _bindingSelected, bindingPrice: _bindingPrice, bindingQty: _bindingQty });
    window.location.href = 'binding-details.html';
}