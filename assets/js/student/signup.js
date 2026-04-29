// signup.js
let _otp = null;
let _otpVerified = false;

function sendOtp() {
    const email = document.getElementById('signup-email')?.value.trim();
    const phone = document.getElementById('signup-phone')?.value.trim();
    if (!email || !phone) { showAlert('Missing Info', 'Please enter your email and phone number first.'); return; }
    _otp = Math.floor(100000 + Math.random() * 900000).toString();
    _otpVerified = false;
    const otpInput = document.getElementById('user-otp');
    if (otpInput) { otpInput.disabled = false; otpInput.value = ''; }
    const statusEl = document.getElementById('otp-status');
    if (statusEl) { statusEl.textContent = `📱 OTP sent to ${phone}. (Demo code: ${_otp})`; statusEl.style.color = '#888'; }
}

function verifyOtp() {
    const entered  = document.getElementById('user-otp')?.value.trim();
    const statusEl = document.getElementById('otp-status');
    if (entered === _otp && _otp) {
        _otpVerified = true;
        if (statusEl) { statusEl.textContent = '✅ OTP verified!'; statusEl.style.color = 'green'; }
    } else {
        _otpVerified = false;
        if (statusEl) { statusEl.textContent = '❌ Invalid OTP. Please try again.'; statusEl.style.color = '#d43434'; }
    }
}

function validateSignup(e) {
    e.preventDefault();
    const name    = document.getElementById('signup-name')?.value.trim();
    const email   = document.getElementById('signup-email')?.value.trim();
    const phone   = document.getElementById('signup-phone')?.value.trim();
    const college = document.getElementById('signup-college')?.value;
    const course  = document.getElementById('signup-course')?.value;
    const year    = document.getElementById('signup-year')?.value;
    if (!name || !email || !phone || !college || !course || !year) {
        showAlert('Missing Info', 'Please fill in all required fields.'); return false;
    }
    if (!_otpVerified) {
        showAlert('OTP Required', 'Please verify your phone number with OTP before proceeding.'); return false;
    }
    const terms = document.getElementById('terms-check');
    if (!terms?.checked) {
        showAlert('Terms Required', 'Please agree to the terms and conditions.'); return false;
    }
    User.save({ name, email, phone, college, course, year });
    showAlert('Account Created! 🎉', `Welcome, ${name}! Your account has been created successfully.`, () => {
        window.location.href = 'index.html';
    });
    return false;
}