(function () {
  let currentStep = 1;
  let otpCode = null;
  let otpVerified = false;
  let capturedIdDataUrl = null;
  let capturedCorDataUrl = null;
  let faceMatchComplete = false;

  const CameraCapture = {
    idVideoStream: null,
    corVideoStream: null,
    faceVideoStream: null,

    async initIdCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        const video = document.getElementById("id-camera-video");
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
          this.idVideoStream = stream;
        }
        return true;
      } catch (err) {
        console.error("Camera error:", err);
        showInlineAlert(
          "Camera access denied.",
          "Please allow camera access to capture your ID.",
        );
        return false;
      }
    },

    async initCorCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        const video = document.getElementById("cor-camera-video");
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
          this.corVideoStream = stream;
        }
        return true;
      } catch (err) {
        console.error("COR camera error:", err);
        showInlineAlert(
          "Camera access denied.",
          "Please allow camera access to capture your COR.",
        );
        return false;
      }
    },

    async initFaceCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        const video = document.getElementById("face-camera-video");
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
          this.faceVideoStream = stream;
        }
        return true;
      } catch (err) {
        console.error("Face camera error:", err);
        showInlineAlert(
          "Camera access denied.",
          "Please allow camera access for face verification.",
        );
        return false;
      }
    },

    captureIdSnapshot() {
      const video = document.getElementById("id-camera-video");
      if (!video || !video.videoWidth || !video.videoHeight) return null;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      capturedIdDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      return capturedIdDataUrl;
    },

    captureCorSnapshot() {
      const video = document.getElementById("cor-camera-video");
      if (!video || !video.videoWidth || !video.videoHeight) return null;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      capturedCorDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      return capturedCorDataUrl;
    },

    stopIdCamera() {
      if (this.idVideoStream) {
        this.idVideoStream.getTracks().forEach((track) => track.stop());
        this.idVideoStream = null;
      }
    },

    stopCorCamera() {
      if (this.corVideoStream) {
        this.corVideoStream.getTracks().forEach((track) => track.stop());
        this.corVideoStream = null;
      }
    },

    stopFaceCamera() {
      if (this.faceVideoStream) {
        this.faceVideoStream.getTracks().forEach((track) => track.stop());
        this.faceVideoStream = null;
      }
    },
  };

  function showInlineAlert(message, detail) {
    const el = document.getElementById("signup-inline-alert");
    if (!el) return;
    el.textContent = detail ? `${message} ${detail}` : message;
    el.classList.remove("signup-hidden");
  }

  function hideInlineAlert() {
    const el = document.getElementById("signup-inline-alert");
    if (!el) return;
    el.textContent = "";
    el.classList.add("signup-hidden");
  }

  function showAlert(title, text) {
    window.alert(`${title}\n\n${text}`);
  }

  function getAccountType() {
    const selected = document.querySelector(
      'input[name="signup-account-type"]:checked',
    );
    return selected && selected.value === "faculty" ? "faculty" : "student";
  }

  function applyRoleUI() {
    const type = getAccountType();
    const avatar = document.getElementById("signup-role-avatar");
    const studentBlock = document.getElementById("signup-student-only");
    const yearEl = document.getElementById("signup-year");
    const courseEl = document.getElementById("signup-course");
    const idLabel = document.getElementById("signup-campus-id-label");
    const collegeLabel = document.getElementById("signup-college-label");
    const lead2 = document.getElementById("signup-step2-lead");
    const title3 = document.getElementById("signup-step3-title");
    const lead3 = document.getElementById("signup-step3-lead");
    const docCor = document.getElementById("signup-doc-cor-label");

    if (avatar) {
      avatar.innerHTML =
        type === "faculty"
          ? '<span class="upress-icon upress-icon--users upress-icon--md" aria-hidden="true"></span>'
          : '<span class="upress-icon upress-icon--grad upress-icon--md" aria-hidden="true"></span>';
    }

    if (type === "faculty") {
      if (studentBlock) studentBlock.classList.add("signup-hidden");
      if (yearEl) {
        yearEl.removeAttribute("required");
        yearEl.value = "";
      }
      if (courseEl) {
        courseEl.removeAttribute("required");
        courseEl.innerHTML = '<option value="">—</option>';
      }
      if (idLabel) idLabel.textContent = "Employee ID *";
      if (collegeLabel) collegeLabel.textContent = "College / department *";
      if (lead2) lead2.textContent = "Faculty contact and sign-in credentials.";
      if (title3) title3.textContent = "Verify your affiliation";
      if (lead3)
        lead3.textContent =
          "Upload a valid ID and proof of employment (e.g. appointment or faculty load). Demo only — files are not uploaded to a server.";
      if (docCor) docCor.textContent = "Proof of employment *";
    } else {
      if (studentBlock) studentBlock.classList.remove("signup-hidden");
      if (yearEl) yearEl.setAttribute("required", "required");
      if (courseEl) courseEl.setAttribute("required", "required");
      if (idLabel) idLabel.textContent = "Student ID *";
      if (collegeLabel) collegeLabel.textContent = "College *";
      if (lead2)
        lead2.textContent = "Tell us who you are and how to reach you.";
      if (title3) title3.textContent = "Upload verification";
      if (lead3)
        lead3.textContent =
          "Upload clear photos or scans. PDF, JPG, or PNG up to 5MB each (demo — files stay in your browser only).";
      if (docCor) docCor.textContent = "First semester COR *";
      if (typeof populateCourses === "function") {
        populateCourses("signup-college", "signup-course");
      }
    }
  }

  function selectRole(role) {
    document.querySelectorAll(".role-card").forEach((card) => {
      const input = card.querySelector('input[type="radio"]');
      const isActive = input && input.value === role;
      card.classList.toggle("selected", !!isActive);
      if (input) input.checked = !!isActive;
    });
    applyRoleUI();
  }

  function goToStep(step) {
    hideInlineAlert();
    currentStep = step;

    document.querySelectorAll(".signup-step").forEach((stepEl, index) => {
      const number = index + 1;
      stepEl.classList.remove("active", "completed");
      if (number < step) stepEl.classList.add("completed");
      else if (number === step) stepEl.classList.add("active");
    });

    document.querySelectorAll(".signup-form-step").forEach((section) => {
      section.classList.add("signup-hidden");
    });

    const active = document.getElementById("signup-step-" + step);
    if (active) active.classList.remove("signup-hidden");

    if (step === 3) {
      openCameraSection();
    }

    const card = document.querySelector(".signup-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });

    if (step === 2) {
      updateStep2ContinueState();
    }
  }

  function updateStep2ContinueState() {
    const btn = document.getElementById("signup-btn-step2-next");
    if (btn) btn.disabled = !otpVerified;
  }

  function validateStep2() {
    const first = document.getElementById("signup-first")?.value.trim();
    const last = document.getElementById("signup-last")?.value.trim();
    const campusId = document.getElementById("signup-campus-id")?.value.trim();
    const college = document.getElementById("signup-college")?.value;
    const email = document.getElementById("signup-email")?.value.trim();
    const phone = document.getElementById("signup-phone")?.value.trim();
    const pass = document.getElementById("signup-pass")?.value;
    const pass2 = document.getElementById("signup-pass2")?.value;
    const type = getAccountType();

    if (!first || !last) {
      showInlineAlert("Please enter your first and last name.");
      return false;
    }
    if (!campusId) {
      showInlineAlert(
        type === "faculty"
          ? "Please enter your employee ID."
          : "Please enter your student ID.",
      );
      return false;
    }
    if (!college) {
      showInlineAlert("Please select your college or department.");
      return false;
    }
    if (type === "student") {
      const year = document.getElementById("signup-year")?.value;
      const course = document.getElementById("signup-course")?.value;
      if (!year || !course) {
        showInlineAlert("Please select year level and course.");
        return false;
      }
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showInlineAlert("Please enter a valid email address.");
      return false;
    }
    if (!phone || !/^09[0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
      showInlineAlert("Please enter a valid PH mobile number (09XXXXXXXXX).");
      return false;
    }
    if (!pass || pass.length < 6) {
      showInlineAlert("Password must be at least 6 characters.");
      return false;
    }
    if (pass !== pass2) {
      showInlineAlert("Passwords do not match.");
      return false;
    }
    return true;
  }

  function issueEmailOtp() {
    const email = document.getElementById("signup-email")?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return false;
    }
    otpCode = String(Math.floor(100000 + Math.random() * 900000));
    otpVerified = false;
    const otpInput = document.getElementById("user-otp");
    if (otpInput) {
      otpInput.disabled = false;
      otpInput.value = "";
      otpInput.placeholder = "6-digit code";
      otpInput.focus();
    }
    const codeEl = document.getElementById("signup-otp-code-display");
    const sample = document.getElementById("signup-otp-sample");
    if (codeEl) codeEl.textContent = otpCode;
    if (sample) sample.classList.remove("signup-hidden");
    const statusEl = document.getElementById("otp-status");
    if (statusEl) {
      statusEl.textContent =
        "Code sent to " +
        email +
        ". Demo: the code is shown above — enter it and tap Verify code.";
      statusEl.style.color = "#555";
    }
    const otpVerifyBtn = document.getElementById("signup-otp-verify-btn");
    if (otpVerifyBtn) otpVerifyBtn.disabled = false;
    updateStep2ContinueState();
    return true;
  }

  function resetEmailOtpState() {
    otpCode = null;
    otpVerified = false;
    const otpInput = document.getElementById("user-otp");
    if (otpInput) {
      otpInput.disabled = true;
      otpInput.value = "";
      otpInput.placeholder = "Enter the 6-digit code";
    }
    const otpVerifyBtn = document.getElementById("signup-otp-verify-btn");
    if (otpVerifyBtn) otpVerifyBtn.disabled = true;
    const sample = document.getElementById("signup-otp-sample");
    if (sample) sample.classList.add("signup-hidden");
    const codeEl = document.getElementById("signup-otp-code-display");
    if (codeEl) codeEl.textContent = "";
    const statusEl = document.getElementById("otp-status");
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.style.color = "";
    }
    updateStep2ContinueState();
  }

  function verifyEnteredEmailCode() {
    hideInlineAlert();
    if (!otpCode) {
      showInlineAlert(
        'Tap "Verify" next to your email first to receive a code.',
      );
      return;
    }
    const entered = document.getElementById("user-otp")?.value.trim() || "";
    if (!entered) {
      showInlineAlert("Enter the 6-digit code from the demo box.");
      return;
    }
    const statusEl = document.getElementById("otp-status");
    if (entered !== otpCode) {
      otpVerified = false;
      if (statusEl) {
        statusEl.textContent = "That code does not match. Try again.";
        statusEl.style.color = "#d43434";
      }
      updateStep2ContinueState();
      return;
    }
    otpVerified = true;
    if (statusEl) {
      statusEl.textContent = "Email verified. You can tap Continue.";
      statusEl.style.color = "#0d6e4d";
    }
    updateStep2ContinueState();
  }

  function openCameraSection() {
    document
      .querySelectorAll(".signup-terms-row, .signup-step-actions")
      .forEach((el) => {
        el.classList.add("signup-hidden");
      });
    const cameraSection = document.getElementById("camera-capture-section");
    if (cameraSection) {
      cameraSection.classList.remove("signup-hidden");
      cameraSection.style.display = "flex";
    }
    const step1 = document.getElementById("camera-step-1");
    const step2 = document.getElementById("camera-step-2");
    const step4 = document.getElementById("camera-step-4");
    const step5 = document.getElementById("camera-step-5");
    const step3 = document.getElementById("camera-step-3");
    if (step1) step1.classList.remove("signup-hidden");
    if (step2) step2.classList.add("signup-hidden");
    if (step4) step4.classList.add("signup-hidden");
    if (step5) step5.classList.add("signup-hidden");
    if (step3) step3.classList.add("signup-hidden");
    faceMatchComplete = false;
    capturedIdDataUrl = null;
    capturedCorDataUrl = null;
    CameraCapture.stopIdCamera();
    CameraCapture.stopCorCamera();
    CameraCapture.stopFaceCamera();
    CameraCapture.initIdCamera();
  }

  function goToFormDisplay() {
    const cameraSection = document.getElementById("camera-capture-section");
    if (cameraSection) cameraSection.classList.add("signup-hidden");
    document
      .querySelectorAll(".signup-terms-row, .signup-step-actions")
      .forEach((el) => {
        el.classList.remove("signup-hidden");
      });
  }

  function togglePass(inputId) {
    const el = document.getElementById(inputId);
    const btn = document.querySelector(
      `.eye-btn[data-toggle-pass="${inputId}"]`,
    );
    if (!el || !btn) return;
    const isPassword = el.type === "password";
    el.type = isPassword ? "text" : "password";
    btn.classList.toggle("is-visible", isPassword);
    btn.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password",
    );
  }

  function renderFilePreview(input, previewWrap) {
    if (!input || !previewWrap || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const mb = (file.size / 1024 / 1024).toFixed(2);
    previewWrap.innerHTML = `<div class="signup-file-preview"><span class="signup-file-preview-name">${file.name} (${mb} MB)</span><button type="button" class="signup-file-preview-remove" data-clear-input="${input.id}" aria-label="Remove file">×</button></div>`;
    previewWrap.classList.remove("signup-hidden");
    previewWrap
      .querySelector(".signup-file-preview-remove")
      ?.addEventListener("click", function () {
        input.value = "";
        previewWrap.innerHTML = "";
        previewWrap.classList.add("signup-hidden");
      });
  }

  function initializeFileUploadZones() {
    const labels = [
      {
        labelId: "signup-doc-id-label",
        inputId: "signup-id",
        previewId: "signup-id-preview",
      },
    ];
    labels.forEach(({ labelId, inputId, previewId }) => {
      const label = document.getElementById(labelId);
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      if (!label || !input || !preview) return;
      label.addEventListener("click", (e) => {
        if (e.target === input) return;
        e.preventDefault();
        input.click();
      });
      label.addEventListener("dragover", (e) => {
        e.preventDefault();
        label.style.borderColor = "#8b0000";
        label.style.background = "#fff0f0";
      });
      label.addEventListener("dragleave", () => {
        label.style.borderColor = "";
        label.style.background = "";
      });
      label.addEventListener("drop", (e) => {
        e.preventDefault();
        label.style.borderColor = "";
        label.style.background = "";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          input.files = e.dataTransfer.files;
          renderFilePreview(input, preview);
        }
      });
      input.addEventListener("change", () => renderFilePreview(input, preview));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyRoleUI();

    document.querySelectorAll(".role-card").forEach((card) => {
      card.addEventListener("click", function () {
        const input = card.querySelector('input[type="radio"]');
        if (input) selectRole(input.value);
      });
    });

    document
      .getElementById("signup-college")
      ?.addEventListener("change", function () {
        if (
          getAccountType() === "student" &&
          typeof populateCourses === "function"
        ) {
          populateCourses("signup-college", "signup-course");
        }
      });

    document
      .getElementById("signup-btn-step1")
      ?.addEventListener("click", function () {
        hideInlineAlert();
        goToStep(2);
      });

    document
      .getElementById("signup-btn-step2-back")
      ?.addEventListener("click", function () {
        goToStep(1);
      });

    document
      .getElementById("signup-btn-step2-next")
      ?.addEventListener("click", function () {
        hideInlineAlert();
        if (!otpVerified) {
          showInlineAlert(
            'Verify your email: tap "Verify" by the email, enter the code, then "Verify code".',
          );
          return;
        }
        if (!validateStep2()) return;
        goToStep(3);
      });

    document
      .getElementById("signup-btn-step3-back")
      ?.addEventListener("click", function () {
        CameraCapture.stopIdCamera();
        CameraCapture.stopCorCamera();
        CameraCapture.stopFaceCamera();
        faceMatchComplete = false;
        capturedIdDataUrl = null;
        capturedCorDataUrl = null;
        const step1 = document.getElementById("camera-step-1");
        const step2 = document.getElementById("camera-step-2");
        const step3 = document.getElementById("camera-step-3");
        const step4 = document.getElementById("camera-step-4");
        const step5 = document.getElementById("camera-step-5");
        if (step1) step1.classList.remove("signup-hidden");
        if (step2) step2.classList.add("signup-hidden");
        if (step3) step3.classList.add("signup-hidden");
        if (step4) step4.classList.add("signup-hidden");
        if (step5) step5.classList.add("signup-hidden");
        goToStep(2);
      });

    document
      .getElementById("signup-email-verify-btn")
      ?.addEventListener("click", function () {
        hideInlineAlert();
        const email =
          document.getElementById("signup-email")?.value.trim() || "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showInlineAlert("Enter a valid email, then tap Verify.");
          return;
        }
        if (!issueEmailOtp()) {
          showInlineAlert("Enter a valid email address.");
        }
      });

    document
      .getElementById("signup-otp-verify-btn")
      ?.addEventListener("click", verifyEnteredEmailCode);

    document
      .getElementById("signup-email")
      ?.addEventListener("input", function () {
        if (otpCode !== null) resetEmailOtpState();
      });

    document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-toggle-pass");
        if (id) togglePass(id);
      });
    });

    document
      .getElementById("capture-id-btn")
      ?.addEventListener("click", function () {
        const snapshot = CameraCapture.captureIdSnapshot();
        if (snapshot) {
          capturedIdDataUrl = snapshot;
          const preview = document.getElementById("id-preview-img");
          if (preview) preview.src = snapshot;
          const step1 = document.getElementById("camera-step-1");
          const step2 = document.getElementById("camera-step-2");
          if (step1) step1.classList.add("signup-hidden");
          if (step2) step2.classList.remove("signup-hidden");
          CameraCapture.stopIdCamera();
        }
      });

    document
      .getElementById("retake-id-btn")
      ?.addEventListener("click", async function () {
        const step1 = document.getElementById("camera-step-1");
        const step2 = document.getElementById("camera-step-2");
        if (step1) step1.classList.remove("signup-hidden");
        if (step2) step2.classList.add("signup-hidden");
        capturedIdDataUrl = null;
        const preview = document.getElementById("id-preview-img");
        if (preview) preview.src = "";
        await CameraCapture.initIdCamera();
      });

    document
      .getElementById("next-after-id-btn")
      ?.addEventListener("click", async function () {
        const step2 = document.getElementById("camera-step-2");
        const step4 = document.getElementById("camera-step-4");
        if (step2) step2.classList.add("signup-hidden");
        if (step4) step4.classList.remove("signup-hidden");
        await CameraCapture.initCorCamera();
      });

    document
      .getElementById("capture-cor-btn")
      ?.addEventListener("click", function () {
        const snapshot = CameraCapture.captureCorSnapshot();
        if (snapshot) {
          capturedCorDataUrl = snapshot;
          const preview = document.getElementById("cor-preview-img");
          if (preview) preview.src = snapshot;
          const step4 = document.getElementById("camera-step-4");
          const step5 = document.getElementById("camera-step-5");
          if (step4) step4.classList.add("signup-hidden");
          if (step5) step5.classList.remove("signup-hidden");
          CameraCapture.stopCorCamera();
        }
      });

    document
      .getElementById("retake-cor-btn")
      ?.addEventListener("click", async function () {
        const step4 = document.getElementById("camera-step-4");
        const step5 = document.getElementById("camera-step-5");
        if (step4) step4.classList.remove("signup-hidden");
        if (step5) step5.classList.add("signup-hidden");
        capturedCorDataUrl = null;
        const preview = document.getElementById("cor-preview-img");
        if (preview) preview.src = "";
        await CameraCapture.initCorCamera();
      });

    document
      .getElementById("continue-to-face-btn")
      ?.addEventListener("click", async function () {
        const step5 = document.getElementById("camera-step-5");
        const step3 = document.getElementById("camera-step-3");
        if (step5) step5.classList.add("signup-hidden");
        if (step3) step3.classList.remove("signup-hidden");
        await CameraCapture.initFaceCamera();
        const statusEl = document.getElementById("face-status");
        if (statusEl) {
          statusEl.textContent = "Face verification complete.";
          statusEl.classList.add("matched");
        }
        faceMatchComplete = true;
        setTimeout(goToFormDisplay, 1000);
      });

    document
      .getElementById("signup-form")
      ?.addEventListener("submit", function (e) {
        e.preventDefault();
        hideInlineAlert();

        if (!validateStep2()) {
          goToStep(2);
          return;
        }
        if (!capturedIdDataUrl) {
          showInlineAlert("Please capture your ID using the camera.");
          return;
        }
        if (!capturedCorDataUrl) {
          showInlineAlert("Please capture your First semester COR.");
          return;
        }
        if (!otpVerified) {
          showAlert(
            "Email not verified",
            "Go back to step 2. Verify your email, enter the code, and tap Verify code.",
          );
          return;
        }
        if (!faceMatchComplete) {
          showAlert(
            "Face verification",
            "Please complete the face verification step.",
          );
          return;
        }

        showAlert(
          "Registration complete!",
          "Your account has been created in demo mode.",
        );

        document.getElementById("signup-form")?.reset();
        otpCode = null;
        otpVerified = false;
        capturedIdDataUrl = null;
        capturedCorDataUrl = null;
        faceMatchComplete = false;
        resetEmailOtpState();
        goToStep(1);
      });

    initializeFileUploadZones();
  });
})();
