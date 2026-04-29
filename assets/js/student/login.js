// login.js
const form = document.getElementById('login-form');
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    if (!email || !pass) { showAlert('Missing Info', 'Please enter email and password.'); return; }
    const existing = User.get();
    if (existing && existing.email === email) {
        window.location.href = 'dashboard.html';
    } else {
        User.save({ name: email.split('@')[0], email, phone: '', college: '', course: '', year: '' });
        window.location.href = 'dashboard.html';
    }
});