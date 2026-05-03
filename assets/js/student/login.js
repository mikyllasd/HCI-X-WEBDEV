// ── LOGIN ──────────────────────────────────────────────
const form = document.getElementById('login-form');
form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;

    if (!email || !pass) {
        showAlert('Missing Info', 'Please enter your email and password.');
        return;
    }

    const existing = User.get();

    // Check if account exists and password matches (if a password was saved)
    if (existing && existing.email === email) {
        if (existing.accountStatus === 'suspended') {
            showAlert('Account suspended', 'Your account has been suspended. Please contact the UPress office for assistance.');
            return;
        }
        if (existing.accountStatus === 'deactivated') {
            showAlert('Account deactivated', 'Your account has been deactivated. Please contact the UPress office to reactivate your account.');
            return;
        }
        if (existing.password && existing.password !== pass) {
            showAlert('Sign-in failed', 'Incorrect email or password.');
            return;
        }
        window.location.href = 'dashboard.html';
    } else {
        // New user — save and proceed
        User.save({
            name: email.split('@')[0],
            email,
            password: pass,
            phone: '',
            college: '',
            course: '',
            year: '',
            accountStatus: /@wmsu\.edu\.ph$/i.test(email) ? 'verified' : 'pending',
            signupPath: /@wmsu\.edu\.ph$/i.test(email) ? 'A' : 'B'
        });
        window.location.href = 'dashboard.html';
    }
});

if (window.location.hash === '#recover') {
    function tryOpenRecover() {
        if (typeof openFP === 'function') openFP();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryOpenRecover);
    } else {
        tryOpenRecover();
    }
}

// ── FORGOT PASSWORD ────────────────────────────────────
let fpOTP         = '';
let fpTargetEmail = '';
let fpTimerID     = null;

document.getElementById('forgot-link').addEventListener('click', function (e) {
    e.preventDefault();
    openFP();
});

function openFP() {
    fpReset();
    document.getElementById('fp-overlay').classList.add('open');
}

function closeFP() {
    document.getElementById('fp-overlay').classList.remove('open');
    clearInterval(fpTimerID);
    fpReset();
}

function fpReset() {
    showStep('fp-step1');
    document.getElementById('fp-email').value       = '';
    document.getElementById('fp-otp-input').value   = '';
    document.getElementById('fp-new-pass').value    = '';
    document.getElementById('fp-confirm-pass').value = '';
    fpHideErr('fp-email-err');
    fpHideErr('fp-otp-err');
    fpHideErr('fp-pass-err');
    fpOTP         = '';
    fpTargetEmail = '';
}

function showStep(stepId) {
    ['fp-step1', 'fp-step2', 'fp-step3', 'fp-step4'].forEach(function (id) {
        document.getElementById(id).style.display = id === stepId ? '' : 'none';
    });
}

function fpShowErr(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
}

function fpHideErr(id) {
    const el = document.getElementById(id);
    el.textContent = '';
    el.style.display = 'none';
}

// Step 1 — Send OTP
function fpSendOTP() {
    const email = document.getElementById('fp-email').value.trim();
    fpHideErr('fp-email-err');

    if (!email) {
        fpShowErr('fp-email-err', 'Please enter your email address.');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fpShowErr('fp-email-err', 'Please enter a valid email address.');
        return;
    }

    // Generate a 6-digit OTP
    fpOTP         = String(Math.floor(100000 + Math.random() * 900000));
    fpTargetEmail = email;

    // In a real app you'd send this via backend.
    // Here we show it in an alert so the user can "receive" it.
    showAlert(
        '📩 OTP Sent',
        'A reset code has been sent to ' + email + '.\n\n' +
        '(Demo mode — your code is: ' + fpOTP + ')',
        function () {
            document.getElementById('fp-otp-hint').textContent =
                'We sent a 6-digit code to ' + email + '. Enter it below.';
            showStep('fp-step2');
            fpStartResendTimer();
        }
    );
}

function fpBackToStep1() {
    clearInterval(fpTimerID);
    fpHideErr('fp-otp-err');
    showStep('fp-step1');
}

// Step 2 — Verify OTP
function fpVerifyOTP() {
    const entered = document.getElementById('fp-otp-input').value.trim();
    fpHideErr('fp-otp-err');

    if (!entered) {
        fpShowErr('fp-otp-err', 'Please enter the 6-digit code.');
        return;
    }
    if (entered !== fpOTP) {
        fpShowErr('fp-otp-err', 'Incorrect code. Please check and try again.');
        return;
    }

    clearInterval(fpTimerID);
    showStep('fp-step3');
}

// Resend timer
function fpStartResendTimer() {
    let secs = 60;
    document.getElementById('fp-countdown').textContent  = secs;
    document.getElementById('fp-resend-link').style.display  = 'none';
    document.getElementById('fp-resend-timer').style.display = 'inline';

    fpTimerID = setInterval(function () {
        secs--;
        document.getElementById('fp-countdown').textContent = secs;
        if (secs <= 0) {
            clearInterval(fpTimerID);
            document.getElementById('fp-resend-timer').style.display = 'none';
            document.getElementById('fp-resend-link').style.display  = 'inline';
        }
    }, 1000);
}

function fpResend(e) {
    e.preventDefault();
    fpOTP = String(Math.floor(100000 + Math.random() * 900000));
    showAlert(
        '📩 New Code Sent',
        'A new reset code has been sent to ' + fpTargetEmail + '.\n\n' +
        '(Demo mode — your new code is: ' + fpOTP + ')'
    );
    document.getElementById('fp-otp-input').value = '';
    fpHideErr('fp-otp-err');
    fpStartResendTimer();
}

// Step 3 — Reset Password
function fpResetPassword() {
    const newPass     = document.getElementById('fp-new-pass').value;
    const confirmPass = document.getElementById('fp-confirm-pass').value;
    fpHideErr('fp-pass-err');

    if (!newPass) {
        fpShowErr('fp-pass-err', 'Please enter a new password.');
        return;
    }
    if (newPass.length < 8) {
        fpShowErr('fp-pass-err', 'Password must be at least 8 characters.');
        return;
    }
    if (newPass !== confirmPass) {
        fpShowErr('fp-pass-err', 'Passwords do not match.');
        return;
    }

    // Update password in localStorage
    const existing = User.get();
    if (existing && existing.email === fpTargetEmail) {
        User.update({ password: newPass });
    } else {
        // Account not found — still save so user can log in after resetting
        User.save({
            name: fpTargetEmail.split('@')[0],
            email: fpTargetEmail,
            password: newPass,
            phone: '',
            college: '',
            course: '',
            year: ''
        });
    }

    showStep('fp-step4');
}

// Close modal when clicking the backdrop
document.getElementById('fp-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeFP();
});