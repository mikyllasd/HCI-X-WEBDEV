/**
 * Unified UPress sign-in — routes students (email) vs campus roles (username).
 * Demo only: no HttpOnly cookies; mirrors product intent from spec PDFs.
 */
(function () {
  const STAFF = {
    superadmin: { password: "super123", role: "Super Admin", path: "../superadmin/dashboard.html" },
    admin: { password: "admin123", role: "Admin", path: "../admin/admin-dashboard.html" },
    staff: { password: "staff123", role: "Staff & POS", path: "../staff/staff.html" },
  };

  const alertEl = document.getElementById("portal-alert");
  const form = document.getElementById("portal-form");
  const idInput = document.getElementById("portal-id");
  const pwInput = document.getElementById("portal-pw");
  const submitBtn = document.getElementById("portal-submit");
  const rememberCb = document.getElementById("portal-remember");
  const rememberPrompt = document.getElementById("remember-device-prompt");

  let pendingRemember = false;
  let failKey = "";

  function showAlert(msg, type) {
    alertEl.textContent = msg;
    alertEl.className = "portal-alert show " + (type || "error");
  }

  function hideAlert() {
    alertEl.className = "portal-alert";
    alertEl.textContent = "";
  }

  function readFails(key) {
    try {
      return parseInt(sessionStorage.getItem("upress_login_fails_" + key) || "0", 10) || 0;
    } catch {
      return 0;
    }
  }

  function writeFails(key, n) {
    try {
      sessionStorage.setItem("upress_login_fails_" + key, String(n));
    } catch (_) {}
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  document.getElementById("portal-toggle-pw").addEventListener("click", function () {
    const hidden = pwInput.type === "password";
    pwInput.type = hidden ? "text" : "password";
    this.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
  });

  rememberCb.addEventListener("change", function () {
    if (this.checked) {
      pendingRemember = true;
      rememberPrompt.classList.add("show");
    } else {
      pendingRemember = false;
      rememberPrompt.classList.remove("show");
      localStorage.removeItem("upressRememberChoice");
    }
  });

  document.getElementById("remember-yes").addEventListener("click", function () {
    localStorage.setItem("upressRememberChoice", "personal");
    rememberPrompt.classList.remove("show");
  });

  document.getElementById("remember-no").addEventListener("click", function () {
    localStorage.setItem("upressRememberChoice", "shared");
    rememberPrompt.classList.remove("show");
  });

  document.querySelectorAll(".portal-demo-card").forEach(function (card) {
    card.addEventListener("click", function () {
      idInput.value = card.getAttribute("data-user") || "";
      pwInput.value = card.getAttribute("data-pass") || "";
      hideAlert();
      idInput.focus();
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("user")) idInput.value = params.get("user");
  if (params.get("pass")) pwInput.value = params.get("pass");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert();

    const rawId = idInput.value.trim();
    const password = pwInput.value;

    if (!rawId || !password) {
      showAlert("Please enter your email or username and password.", "error");
      return;
    }

    failKey = rawId.toLowerCase();
    const fails = readFails(failKey);
    if (fails >= 5) {
      showAlert("Too many failed attempts. Please wait about 15 minutes or use Forgot password.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in…";

    window.setTimeout(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign in";

      /* ——— Campus roles (username) ——— */
      if (!isEmail(rawId)) {
        const user = rawId.toLowerCase();
        const rec = STAFF[user];
        if (rec && rec.password === password) {
          writeFails(failKey, 0);
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              name: rec.role,
              username: user,
              role: user,
            }),
          );
          showAlert("Welcome, " + rec.role + ". Redirecting…", "success");
          window.setTimeout(function () {
            window.location.href = rec.path;
          }, 500);
          return;
        }
        writeFails(failKey, fails + 1);
        showAlert("Incorrect email or password.", "error");
        return;
      }

      /* ——— Student (email) ——— */
      var stored = null;
      try {
        stored = JSON.parse(localStorage.getItem("upressUser") || "null");
      } catch (_) {
        stored = null;
      }

      if (stored && stored.email && stored.email.toLowerCase() === rawId.toLowerCase()) {
        if (stored.password && stored.password !== password) {
          writeFails(failKey, fails + 1);
          showAlert("Incorrect email or password.", "error");
          return;
        }
        if (stored.accountStatus === "suspended") {
          showAlert("Your account has been suspended. Please contact the UPress office for assistance.", "error");
          return;
        }
        if (stored.accountStatus === "deactivated") {
          showAlert("Your account has been deactivated. Please contact the UPress office to reactivate your account.", "error");
          return;
        }
        writeFails(failKey, 0);
        showAlert("Welcome back. Redirecting…", "success");
        window.setTimeout(function () {
          window.location.href = "../student/dashboard.html";
        }, 450);
        return;
      }

      /* Demo: allow first-time student login with any password to create a minimal session */
      var inferredName = rawId.split("@")[0].replace(/[._]/g, " ");
      localStorage.setItem(
        "upressUser",
        JSON.stringify({
          name: inferredName,
          email: rawId,
          password: password,
          phone: "",
          college: "",
          course: "",
          year: "",
          accountStatus: /@wmsu\.edu\.ph$/i.test(rawId) ? "verified" : "pending",
          signupPath: /@wmsu\.edu\.ph$/i.test(rawId) ? "A" : "B",
        }),
      );
      writeFails(failKey, 0);
      showAlert("Signed in. Redirecting to your dashboard…", "success");
      window.setTimeout(function () {
        window.location.href = "../student/dashboard.html";
      }, 450);
    }, 450);
  });
})();
