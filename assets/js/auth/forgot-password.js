(function () {
  var fpOTP = "";
  var fpTargetEmail = "";
  var fpTimerID = null;

  function openFP() {
    fpReset();
    var overlay = document.getElementById("fp-overlay");
    if (overlay) overlay.classList.add("open");
  }

  function closeFP() {
    var overlay = document.getElementById("fp-overlay");
    if (overlay) overlay.classList.remove("open");
    clearInterval(fpTimerID);
    fpReset();
  }

  function fpReset() {
    showStep("fp-step1");
    var ids = ["fp-email", "fp-otp-input", "fp-new-pass", "fp-confirm-pass"];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    fpHideErr("fp-email-err");
    fpHideErr("fp-otp-err");
    fpHideErr("fp-pass-err");
    fpOTP = "";
    fpTargetEmail = "";
  }

  function showStep(stepId) {
    ["fp-step1", "fp-step2", "fp-step3", "fp-step4"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = id === stepId ? "block" : "none";
    });
  }

  function fpShowErr(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  function fpHideErr(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  }

  window.openFP = openFP;
  window.closeFP = closeFP;
  window.fpSendOTP = function () {
    var emailEl = document.getElementById("fp-email");
    var email = emailEl ? emailEl.value.trim() : "";
    fpHideErr("fp-email-err");

    if (!email) {
      fpShowErr("fp-email-err", "Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fpShowErr("fp-email-err", "Please enter a valid email address.");
      return;
    }

    fpOTP = String(Math.floor(100000 + Math.random() * 900000));
    fpTargetEmail = email;

    showAlert(
      "OTP sent",
      "A reset code has been sent to " +
        email +
        ".\n\n" +
        "(Demo mode — your code is: " +
        fpOTP +
        ")",
      function () {
        var hint = document.getElementById("fp-otp-hint");
        if (hint) {
          hint.textContent = "We sent a 6-digit code to " + email + ". Enter it below.";
        }
        showStep("fp-step2");
        fpStartResendTimer();
      },
    );
  };

  window.fpBackToStep1 = function () {
    clearInterval(fpTimerID);
    fpHideErr("fp-otp-err");
    showStep("fp-step1");
  };

  window.fpVerifyOTP = function () {
    var enteredEl = document.getElementById("fp-otp-input");
    var entered = enteredEl ? enteredEl.value.trim() : "";
    fpHideErr("fp-otp-err");

    if (!entered) {
      fpShowErr("fp-otp-err", "Please enter the 6-digit code.");
      return;
    }
    if (entered !== fpOTP) {
      fpShowErr("fp-otp-err", "Incorrect code. Please check and try again.");
      return;
    }

    clearInterval(fpTimerID);
    showStep("fp-step3");
  };

  function fpStartResendTimer() {
    var secs = 60;
    var cd = document.getElementById("fp-countdown");
    var link = document.getElementById("fp-resend-link");
    var timer = document.getElementById("fp-resend-timer");
    if (cd) cd.textContent = String(secs);
    if (link) link.style.display = "none";
    if (timer) timer.style.display = "inline";

    fpTimerID = setInterval(function () {
      secs--;
      if (cd) cd.textContent = String(secs);
      if (secs <= 0) {
        clearInterval(fpTimerID);
        if (timer) timer.style.display = "none";
        if (link) link.style.display = "inline";
      }
    }, 1000);
  }

  window.fpResend = function (e) {
    e.preventDefault();
    fpOTP = String(Math.floor(100000 + Math.random() * 900000));
    showAlert(
      "New code sent",
      "A new reset code has been sent to " +
        fpTargetEmail +
        ".\n\n" +
        "(Demo mode — your new code is: " +
        fpOTP +
        ")",
    );
    var otpIn = document.getElementById("fp-otp-input");
    if (otpIn) otpIn.value = "";
    fpHideErr("fp-otp-err");
    fpStartResendTimer();
  };

  window.fpResetPassword = function () {
    var newPassEl = document.getElementById("fp-new-pass");
    var confirmEl = document.getElementById("fp-confirm-pass");
    var newPass = newPassEl ? newPassEl.value : "";
    var confirmPass = confirmEl ? confirmEl.value : "";
    fpHideErr("fp-pass-err");

    if (!newPass) {
      fpShowErr("fp-pass-err", "Please enter a new password.");
      return;
    }
    if (newPass.length < 8) {
      fpShowErr("fp-pass-err", "Password must be at least 8 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      fpShowErr("fp-pass-err", "Passwords do not match.");
      return;
    }

    var existing = User.get();
    if (existing && existing.email === fpTargetEmail) {
      User.update({ password: newPass });
    } else {
      User.save({
        name: fpTargetEmail.split("@")[0],
        email: fpTargetEmail,
        password: newPass,
        phone: "",
        college: "",
        course: "",
        year: "",
      });
    }

    showStep("fp-step4");
  };

  document.addEventListener("DOMContentLoaded", function () {
    showStep("fp-step1");

    var forgot = document.getElementById("portal-forgot");
    if (forgot) {
      forgot.addEventListener("click", function (e) {
        e.preventDefault();
        openFP();
      });
    }

    var overlay = document.getElementById("fp-overlay");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeFP();
      });
    }

    if (window.location.hash === "#recover") {
      openFP();
    }
  });
})();
