// binding-details.js
const co = Checkout.get();
const u  = User.get();

setText('binding-sum-type',  co.bindingType  || '—');
setText('binding-sum-qty',   co.bindingQty   || 1);
setText('binding-sum-unit',  '₱' + parseFloat(co.bindingPrice || 0).toFixed(2));
setText('binding-sum-total', '₱' + ((parseFloat(co.bindingPrice) || 0) * (parseInt(co.bindingQty) || 1)).toFixed(2));

if (u) {
    const nEl  = document.getElementById('binding-d-name');
    const pEl  = document.getElementById('binding-d-phone');
    const cEl  = document.getElementById('binding-d-college');
    const crEl = document.getElementById('binding-d-course');
    if (nEl  && !nEl.value)  nEl.value  = u.name    || '';
    if (pEl  && !pEl.value)  pEl.value  = u.phone   || '';
    if (cEl  && !cEl.value)  cEl.value  = u.college || '';
    if (crEl && !crEl.value) crEl.value = u.course ? `${u.course} ${u.year || ''}`.trim() : '';
}

function getBindingOrderData() {
    const bPrice = parseFloat(co.bindingPrice) || 0;
    const bQty   = parseInt(co.bindingQty)     || 1;
    return {
        service: 'Binding',
        desc:    `${bQty} × ${co.bindingType}`,
        qty:     bQty,
        total:   (bPrice * bQty).toFixed(2),
        customer: {
            name:    document.getElementById('binding-d-name')?.value.trim()    || '',
            phone:   document.getElementById('binding-d-phone')?.value.trim()   || '',
            course:  document.getElementById('binding-d-course')?.value.trim()  || '',
            college: document.getElementById('binding-d-college')?.value.trim() || '',
            date:    document.getElementById('binding-d-date')?.value           || ''
        }
    };
}

function validateBindingDetails() {
    if (!co.bindingType)                                           { showAlert('No Selection', 'Please go back and select a binding type.'); return false; }
    if (!document.getElementById('binding-d-name')?.value.trim()) { showAlert('Missing Info', 'Please enter your full name.'); return false; }
    if (!document.getElementById('binding-d-phone')?.value.trim()){ showAlert('Missing Info', 'Please enter your phone number.'); return false; }
    if (!document.getElementById('binding-d-date')?.value)        { showAlert('Missing Info', 'Please select a preferred pick-up date.'); return false; }
    return true;
}

function bindingOrderNow() {
    if (!validateBindingDetails()) return;
    showConfirm('Proceed to Checkout', 'Place this binding order and proceed to payment?', () => {
        const data = getBindingOrderData();
        Cart.clear();
        Cart.add(data);
        Checkout.set({ customerInfo: data.customer });
        window.location.href = 'pay-method.html';
    });
}

function bindingAddToCart() {
    if (!validateBindingDetails()) return;
    Cart.add(getBindingOrderData());
    showAlert('Added to Cart! 🛒', `${co.bindingType} × ${co.bindingQty} added to your cart.`);
}