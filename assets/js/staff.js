document.getElementById('staffLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Basic check (you can later connect to backend/login API)
  if (email === '' || password === '') {
    alert('Please enter both email and password.');
    return;
  }

  // Example validation (placeholder logic)
  if (email.endsWith('@wmsu.edu.ph')) {
    alert('Login successful! Redirecting...');
    window.location.href = 'staff_dashboard.html';
  } else {
    alert('Invalid email domain. Use your WMSU staff email.');
  }
});
