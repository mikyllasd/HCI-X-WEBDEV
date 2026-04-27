document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.querySelector("input[type='email']").value;
  const password = document.querySelector("input[type='password']").value;

  if (!email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  // SAMPLE LOGIN LOGIC (replace with backend)
  if (email === "staff@wmsu.edu.ph" && password === "1234") {
    alert("Login successful!");
    // window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials.");
  }
});