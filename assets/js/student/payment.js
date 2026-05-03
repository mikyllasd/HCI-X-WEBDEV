// payment.js
const cart = Cart.get();
const u    = User.get() || {};
const co   = Checkout.get();

if (cart.length === 0) {
    showAlert('Empty Cart', 'Your cart is empty.', () => window.location.href = 'cart.html');
}

const listEl  = document.getElementById('pay-cart-items-list');
const countEl = document.getElementById('pay-cart-count');
const totalEl = document.getElementById('pay-sum-total');
if (listEl) {
    listEl.innerHTML = cart.map(item => `
        <div class="pay-cart-item-mini">
            <div>
                <div class="pay-cart-item-mini-name">${escHtml(item.service)}</div>
                <div class="pay-cart-item-mini-desc">${escHtml(item.desc || '')}</div>
            </div>
            <div class="pay-cart-item-mini-price">₱${parseFloat(item.total).toFixed(2)}</div>
        </div>`).join('');
}
if (countEl) countEl.textContent = `${cart.length} item(s) — review before checkout`;
if (totalEl) totalEl.textContent = '₱' + Cart.total().toFixed(2);

const nameEl  = document.getElementById('pay-full-name');
const phoneEl = document.getElementById('pay-contact');
if (nameEl  && !nameEl.value)  nameEl.value  = co.customerInfo?.name  || u.name  || '';
if (phoneEl && !phoneEl.value) phoneEl.value = co.customerInfo?.phone || u.phone || '';
if (co.customerInfo?.date) {
    const dateEl = document.getElementById('pay-date');
    if (dateEl && !dateEl.value) dateEl.value = co.customerInfo.date;
}

window._registeredPhone     = u.phone || '';
window._checkoutOtpVerified = true;

const toggleRow = document.getElementById('pay-number-toggle-row');
if (toggleRow) toggleRow.style.display = u.phone ? 'flex' : 'none';

function togglePayNumber(useIt) {
    document.getElementById('pay-yes-btn')?.classList.toggle('toggle-btn--active', useIt);
    document.getElementById('pay-no-btn')?.classList.toggle('toggle-btn--active', !useIt);
    const phoneEl = document.getElementById('pay-contact');
    if (!phoneEl) return;
    if (useIt) {
        phoneEl.value = window._registeredPhone || '';
        window._checkoutOtpVerified = true;
    } else {
        phoneEl.value = '';
        window._checkoutOtpVerified = false;
    }
}

function proceedToPayMethod() {
    const name  = document.getElementById('pay-full-name')?.value.trim();
    const date  = document.getElementById('pay-date')?.value;
    const phone = document.getElementById('pay-contact')?.value.trim();
    if (!name)  { showAlert('Missing Info', 'Please enter your full name.'); return; }
    if (!date)  { showAlert('Missing Info', 'Please select a preferred delivery date.'); return; }
    if (!phone) { showAlert('Missing Info', 'Please enter your contact number.'); return; }

    const regPhone     = window._registeredPhone;
    const phoneChanged = regPhone && phone !== regPhone;

    if (phoneChanged && !window._checkoutOtpVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        showConfirm(
            'Phone Number Changed',
            `You entered a different number (${phone}) from your registered one.\n\nAn OTP is required for verification.\nDemo OTP: ${code}\n\nProceed?`,
            () => {
                showPrompt('Enter OTP', `Enter the 6-digit OTP sent to ${phone}`, 'Enter OTP here', entered => {
                    if (entered === code) {
                        window._checkoutOtpVerified = true;
                        Checkout.set({ customerInfo: { name, date, phone } });
                        showAlert('Verified', 'Phone verified.', () => window.location.href = 'pay-method.html');
                    } else {
                        showAlert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
                    }
                });
            }
        );
        return;
    }

    Checkout.set({ customerInfo: { name, date, phone } });
    window.location.href = 'pay-method.html';
}