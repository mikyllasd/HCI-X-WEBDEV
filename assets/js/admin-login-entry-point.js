// ── Demo Credentials Store ──
const CREDENTIALS = {
  admin:      { password: 'admin123', role: 'Admin' },
  superadmin: { password: 'super123', role: 'Super Admin' },
  staff:      { password: 'staff123', role: 'Staff' },
};
 
// ── Element References ──
const alertBox  = document.getElementById('alert');
const alertMsg  = document.getElementById('alert-msg');
const loginBtn  = document.getElementById('loginBtn');
const togglePw  = document.getElementById('togglePw');
const pwInput   = document.getElementById('password');
const eyeIcon   = document.getElementById('eyeIcon');
const studentLink = document.getElementById('studentLink');
 
// ── Alert Helpers ──
function showAlert(msg, type = 'error') {
  alertBox.className = `alert ${type}`;
  alertMsg.textContent = msg;
}
function hideAlert() {
  alertBox.className = 'alert';
}
 
// ── Auto-fill Demo Credentials ──
function fillCreds(user, pass) {
  document.getElementById('username').value = user;
  pwInput.value = pass;
  hideAlert();
  document.getElementById('username').focus();
}
 
// ── Login Handler ──
function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = pwInput.value;
 
  hideAlert();
 
  if (!username || !password) {
    showAlert('Please enter both username and password.', 'error');
    return;
  }
 
  // Simulate loading state
  loginBtn.classList.add('loading');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Authenticating…';
 
  setTimeout(() => {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login as Admin';
 
    const record = CREDENTIALS[username.toLowerCase()];
    if (record && record.password === password) {
      showAlert(`✓ Welcome, ${record.role}! Redirecting to dashboard…`, 'success');
      setTimeout(() => {
        if (username.toLowerCase() === 'staff') {
          window.location.href = '../assets/pages/staff-dashboard.html';
        } else {
          window.location.href = '../admin-login/admin-dashboard.html';
        }
      }, 900);
    } else {
      showAlert('Invalid username or password. Please try again.', 'error');
      pwInput.value = '';
      pwInput.focus();
    }
  }, 900);
}
 
// ── Password Visibility Toggle ──
togglePw.addEventListener('click', () => {
  const isHidden = pwInput.type === 'password';
  pwInput.type = isHidden ? 'text' : 'password';
  eyeIcon.innerHTML = isHidden
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});
 
// ── Demo Card Click Events ──
document.querySelectorAll('.demo-card').forEach(card => {
  card.addEventListener('click', () => {
    fillCreds(card.dataset.user, card.dataset.pass);
  });
});
 
// ── Login Button Click ──
loginBtn.addEventListener('click', handleLogin);
 
// ── Student Login Link ──
studentLink.addEventListener('click', () => {
  window.location.href = '../assets/pages/student.html';
});
 
// ── Enter Key Submits Form ──
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});