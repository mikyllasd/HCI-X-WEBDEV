(function () {
  let currentStep = 1;
  let otpCode = null;
  let otpVerified = false;
  let capturedIdDataUrl = null;
  let capturedCorDataUrl = null;
  let faceMatchComplete = false;

  // ── DB ─────────────────────────────────────────────────────────────────────
  // Always use the same key "upressDB" so admin pages read the same data.

  function getDB() {
    if (typeof window.getDB === "function") return window.getDB();
    try { return JSON.parse(localStorage.getItem("upressDB") || "{}"); }
    catch { return {}; }
  }

  function saveDB(db) {
    if (typeof window.saveDB === "function") return window.saveDB(db);
    try { localStorage.setItem("upressDB", JSON.stringify(db)); }
    catch (err) { console.error("saveDB error:", err); }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  function showInlineAlert(message, detail) {
    const el = document.getElementById("signup-inline-alert");
    if (!el) return;
    el.textContent = detail ? `${message} ${detail}` : message;
    el.classList.remove("signup-hidden");
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideInlineAlert() {
    const el = document.getElementById("signup-inline-alert");
    if (!el) return;
    el.textContent = "";
    el.classList.add("signup-hidden");
  }

  function showAlert(title, text, callback) {
    window.alert(`${title}\n\n${text}`);
    if (typeof callback === "function") callback();
  }

  function getAccountType() {
    const selected = document.querySelector('input[name="signup-account-type"]:checked');
    return selected && selected.value === "faculty" ? "faculty" : "student";
  }

  // ── CAMERA ─────────────────────────────────────────────────────────────────

  const CameraCapture = {
    idVideoStream: null,
    corVideoStream: null,
    faceVideoStream: null,

    async _initCamera(videoId, facingMode, width, height) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: width }, height: { ideal: height } },
        });
        const video = document.getElementById(videoId);
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        return stream;
      } catch (err) {
        console.error("Camera error:", err);
        showInlineAlert(
          "Camera access denied.",
          "Please allow camera access in your browser settings and try again."
        );
        return null;
      }
    },

    async initIdCamera() {
      const stream = await this._initCamera("id-camera-video", "environment", 1280, 720);
      if (stream) this.idVideoStream = stream;
      return !!stream;
    },

    async initCorCamera() {
      const stream = await this._initCamera("cor-camera-video", "environment", 1280, 720);
      if (stream) this.corVideoStream = stream;
      return !!stream;
    },

    async initFaceCamera() {
      const stream = await this._initCamera("face-camera-video", "user", 640, 480);
      if (stream) this.faceVideoStream = stream;
      return !!stream;
    },

    _captureSnapshot(videoId) {
      const video = document.getElementById(videoId);
      if (!video || !video.videoWidth || !video.videoHeight) {
        showInlineAlert("Camera not ready.", "Please wait for the camera to load and try again.");
        return null;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.9);
    },

    captureIdSnapshot() {
      const data = this._captureSnapshot("id-camera-video");
      if (data) capturedIdDataUrl = data;
      return data;
    },

    captureCorSnapshot() {
      const data = this._captureSnapshot("cor-camera-video");
      if (data) capturedCorDataUrl = data;
      return data;
    },

    _stopStream(stream) {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    },

    stopIdCamera() { this._stopStream(this.idVideoStream); this.idVideoStream = null; },
    stopCorCamera() { this._stopStream(this.corVideoStream); this.corVideoStream = null; },
    stopFaceCamera() { this._stopStream(this.faceVideoStream); this.faceVideoStream = null; },
    stopAll() { this.stopIdCamera(); this.stopCorCamera(); this.stopFaceCamera(); },
  };

  // ── CAMERA STEPS ───────────────────────────────────────────────────────────

  function showCameraStep(stepId) {
    ["camera-step-1", "camera-step-2", "camera-step-3", "camera-step-4", "camera-step-5"]
      .forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === stepId) el.classList.remove("signup-hidden");
        else el.classList.add("signup-hidden");
      });
  }

  // ── ROLE UI ────────────────────────────────────────────────────────────────

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
      avatar.innerHTML = type === "faculty"
        ? '<span class="upress-icon upress-icon--users upress-icon--md" aria-hidden="true"></span>'
        : '<span class="upress-icon upress-icon--grad upress-icon--md" aria-hidden="true"></span>';
    }

    if (type === "faculty") {
      studentBlock?.classList.add("signup-hidden");
      if (yearEl) { yearEl.removeAttribute("required"); yearEl.value = ""; }
      if (courseEl) { courseEl.removeAttribute("required"); courseEl.innerHTML = '<option value="">—</option>'; }
      if (idLabel) idLabel.textContent = "Employee ID *";
      if (collegeLabel) collegeLabel.textContent = "College / department *";
      if (lead2) lead2.textContent = "Faculty contact and sign-in credentials.";
      if (title3) title3.textContent = "Verify your affiliation";
      if (lead3) lead3.textContent = "Capture your valid ID, proof of employment, and complete face verification.";
      if (docCor) docCor.textContent = "Proof of employment *";
    } else {
      studentBlock?.classList.remove("signup-hidden");
      yearEl?.setAttribute("required", "required");
      courseEl?.setAttribute("required", "required");
      if (idLabel) idLabel.textContent = "Student ID *";
      if (collegeLabel) collegeLabel.textContent = "College *";
      if (lead2) lead2.textContent = "Tell us who you are and how to reach you.";
      if (title3) title3.textContent = "Upload verification";
      if (lead3) lead3.textContent = "Capture your valid ID and COR using your camera, then complete face verification.";
      if (docCor) docCor.textContent = "First semester COR *";
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

  // ── STEP NAVIGATION ────────────────────────────────────────────────────────

  function goToStep(step) {
    hideInlineAlert();
    currentStep = step;

    document.querySelectorAll(".signup-step").forEach((el, i) => {
      const n = i + 1;
      el.classList.remove("active", "completed");
      if (n < step) el.classList.add("completed");
      else if (n === step) el.classList.add("active");
    });

    document.querySelectorAll(".signup-form-step").forEach((s) => {
      s.classList.add("signup-hidden");
    });

    const active = document.getElementById("signup-step-" + step);
    if (active) active.classList.remove("signup-hidden");

    if (step === 3) openCameraSection();
    if (step === 2) updateStep2ContinueState();

    document.querySelector(".signup-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateStep2ContinueState() {
    const btn = document.getElementById("signup-btn-step2-next");
    if (btn) btn.disabled = !otpVerified;
  }

  // ── VALIDATION ─────────────────────────────────────────────────────────────

  function validateStep2() {
    const type = getAccountType();
    const first = document.getElementById("signup-first")?.value.trim();
    const last = document.getElementById("signup-last")?.value.trim();
    const campusId = document.getElementById("signup-campus-id")?.value.trim();
    const college = document.getElementById("signup-college")?.value;
    const email = document.getElementById("signup-email")?.value.trim();
    const phone = document.getElementById("signup-phone")?.value.trim();
    const pass = document.getElementById("signup-pass")?.value;
    const pass2 = document.getElementById("signup-pass2")?.value;

    if (!first || !last) {
      showInlineAlert("Please enter your first and last name.");
      return false;
    }
    if (!campusId) {
      showInlineAlert(type === "faculty" ? "Please enter your employee ID." : "Please enter your student ID.");
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
        showInlineAlert("Please select your year level and course.");
        return false;
      }
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showInlineAlert("Please enter a valid email address.");
      return false;
    }
    if (!otpVerified) {
      showInlineAlert('Please verify your email first. Tap "Verify", enter the code, then tap "Verify code".');
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

  // ── PERSIST TO DB ──────────────────────────────────────────────────────────

  function persistUserToDB(user) {
    if (!user || !user.email) return;
    try {
      const db = getDB();

      ["users", "authUsers"].forEach((key) => {
        db[key] = Array.isArray(db[key]) ? db[key] : [];
        const idx = db[key].findIndex(
          (item) => String(item.email || "").toLowerCase() === String(user.email || "").toLowerCase()
        );
        if (idx !== -1) {
          db[key][idx] = { ...db[key][idx], ...user };
        } else {
          db[key].unshift(user);
        }
      });

      saveDB(db);
    } catch (err) {
      console.error("persistUserToDB error:", err);
    }
  }

  // ── OTP ────────────────────────────────────────────────────────────────────

  function issueEmailOtp() {
    const email = document.getElementById("signup-email")?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

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
      statusEl.textContent = `Code sent to ${email}. (Demo: code is shown above — enter it and tap Verify code.)`;
      statusEl.style.color = "#555";
    }

    document.getElementById("signup-otp-verify-btn")
      ? (document.getElementById("signup-otp-verify-btn").disabled = false)
      : null;

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

    document.getElementById("signup-otp-sample")?.classList.add("signup-hidden");

    const codeEl = document.getElementById("signup-otp-code-display");
    if (codeEl) codeEl.textContent = "";

    const statusEl = document.getElementById("otp-status");
    if (statusEl) { statusEl.textContent = ""; statusEl.style.color = ""; }

    updateStep2ContinueState();
  }

  function verifyEnteredEmailCode() {
    hideInlineAlert();
    if (!otpCode) {
      showInlineAlert('Tap "Verify" next to your email first to receive a code.');
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
      if (statusEl) { statusEl.textContent = "That code does not match. Try again."; statusEl.style.color = "#d43434"; }
      updateStep2ContinueState();
      return;
    }
    otpVerified = true;
    if (statusEl) { statusEl.textContent = "✓ Email verified. You can now tap Continue."; statusEl.style.color = "#0d6e4d"; }
    updateStep2ContinueState();
  }

  // ── CAMERA SECTION ─────────────────────────────────────────────────────────

  function openCameraSection() {
    document.querySelectorAll(".signup-terms-row, .signup-step-actions").forEach((el) => {
      el.classList.add("signup-hidden");
    });

    const cameraSection = document.getElementById("camera-capture-section");
    if (cameraSection) {
      cameraSection.classList.remove("signup-hidden");
      cameraSection.style.display = "flex";
    }

    faceMatchComplete = false;
    capturedIdDataUrl = null;
    capturedCorDataUrl = null;

    CameraCapture.stopAll();
    showCameraStep("camera-step-1");
    CameraCapture.initIdCamera();
  }

  function goToFormDisplay() {
    CameraCapture.stopAll();

    const cameraSection = document.getElementById("camera-capture-section");
    if (cameraSection) cameraSection.classList.add("signup-hidden");

    document.querySelectorAll(".signup-terms-row, .signup-step-actions").forEach((el) => {
      el.classList.remove("signup-hidden");
    });
  }

  // ── FACE VERIFICATION ──────────────────────────────────────────────────────

  function runFaceVerification() {
    const statusEl = document.getElementById("face-status");
    const warningEl = document.getElementById("face-warning");

    if (statusEl) { statusEl.textContent = "Scanning face…"; statusEl.className = "face-status"; }
    if (warningEl) warningEl.classList.add("signup-hidden");

    const noFaceTimer = setTimeout(() => {
      if (warningEl) warningEl.classList.remove("signup-hidden");
    }, 10000);

    setTimeout(() => {
      clearTimeout(noFaceTimer);
      CameraCapture.stopFaceCamera();

      if (statusEl) {
        statusEl.textContent = "✓ Face verified successfully.";
        statusEl.classList.add("matched");
      }
      if (warningEl) warningEl.classList.add("signup-hidden");

      faceMatchComplete = true;
      setTimeout(goToFormDisplay, 900);
    }, 1800);
  }

  // ── PASSWORD TOGGLE ────────────────────────────────────────────────────────

  function togglePass(inputId) {
    const el = document.getElementById(inputId);
    const btn = document.querySelector(`.eye-btn[data-toggle-pass="${inputId}"]`);
    if (!el || !btn) return;
    const isPassword = el.type === "password";
    el.type = isPassword ? "text" : "password";
    btn.classList.toggle("is-visible", isPassword);
    btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  }

  // ── FILE PREVIEW ───────────────────────────────────────────────────────────

  function renderFilePreview(input, previewWrap) {
    if (!input || !previewWrap || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const mb = (file.size / 1024 / 1024).toFixed(2);
    previewWrap.innerHTML = `
      <div class="signup-file-preview">
        <span class="signup-file-preview-name">${file.name} (${mb} MB)</span>
        <button type="button" class="signup-file-preview-remove" aria-label="Remove file">×</button>
      </div>`;
    previewWrap.classList.remove("signup-hidden");
    previewWrap.querySelector(".signup-file-preview-remove")?.addEventListener("click", () => {
      input.value = "";
      previewWrap.innerHTML = "";
      previewWrap.classList.add("signup-hidden");
    });
  }

  // ── BUILD USER OBJECT ──────────────────────────────────────────────────────

  function buildUserObject() {
    const type = getAccountType();
    const first = document.getElementById("signup-first")?.value.trim() || "";
    const last = document.getElementById("signup-last")?.value.trim() || "";
    const campusId = document.getElementById("signup-campus-id")?.value.trim() || "";
    const college = document.getElementById("signup-college")?.value || "";
    const course = document.getElementById("signup-course")?.value || "";
    const yearLevel = document.getElementById("signup-year")?.value || "";
    const email = document.getElementById("signup-email")?.value.trim() || "";
    const phone = document.getElementById("signup-phone")?.value.trim() || "";
    const pass = document.getElementById("signup-pass")?.value || "";
    const fullName = `${first} ${last}`.trim();

    return {
      id: `UPRESS_USER_${Date.now()}`,
      // role and accountType are BOTH set to the same value
      // so both student-verification.js and faculty-verification.js
      // can filter correctly using either field
      accountType: type,
      role: type,
      firstName: first,
      lastName: last,
      name: fullName,
      fullName: fullName,
      email: email,
      phone: phone,
      password: pass,
      campusId: campusId,
      // faculty uses campusId as facultyId too so legacy filters still work
      facultyId: type === "faculty" ? campusId : undefined,
      studentId: type === "student" ? campusId : undefined,
      college: college,
      course: course,
      yearLevel: yearLevel,
      // Always start as pending so admin sees them in the queue
      status: "pending",
      accountStatus: "pending",
      verified: false,
      active: false,
      flagged: false,
      disabled: false,
      faceVerified: faceMatchComplete,
      signupPath: email.toLowerCase().endsWith("@wmsu.edu.ph") ? "A" : "B",
      idPhotoUrl: capturedIdDataUrl || null,
      corPhotoUrl: capturedCorDataUrl || null,
      createdAt: new Date().toISOString(),
    };
  }

  // ── INIT ───────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    applyRoleUI();

    document.querySelectorAll(".role-card").forEach((card) => {
      card.addEventListener("click", function () {
        const input = card.querySelector('input[type="radio"]');
        if (input) selectRole(input.value);
      });
    });

    document.getElementById("signup-college")?.addEventListener("change", function () {
      if (getAccountType() === "student" && typeof populateCourses === "function") {
        populateCourses("signup-college", "signup-course");
      }
    });

    document.getElementById("signup-btn-step1")?.addEventListener("click", function () {
      hideInlineAlert();
      goToStep(2);
    });

    document.getElementById("signup-btn-step2-back")?.addEventListener("click", function () {
      goToStep(1);
    });

    document.getElementById("signup-btn-step2-next")?.addEventListener("click", function () {
      hideInlineAlert();
      if (!otpVerified) {
        showInlineAlert('Please verify your email first. Tap "Verify", enter the code, then "Verify code".');
        return;
      }
      if (!validateStep2()) return;
      goToStep(3);
    });

    document.getElementById("signup-btn-step3-back")?.addEventListener("click", function () {
      CameraCapture.stopAll();
      faceMatchComplete = false;
      capturedIdDataUrl = null;
      capturedCorDataUrl = null;
      goToStep(2);
    });

    document.getElementById("signup-email-verify-btn")?.addEventListener("click", function () {
      hideInlineAlert();
      const email = document.getElementById("signup-email")?.value.trim() || "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineAlert("Enter a valid email address first, then tap Verify.");
        return;
      }
      issueEmailOtp();
    });

    document.getElementById("signup-otp-verify-btn")?.addEventListener("click", verifyEnteredEmailCode);

    document.getElementById("signup-email")?.addEventListener("input", function () {
      if (otpCode !== null) resetEmailOtpState();
    });

    document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-toggle-pass");
        if (id) togglePass(id);
      });
    });

    // Camera: Step 1 — capture ID
    document.getElementById("capture-id-btn")?.addEventListener("click", function () {
      const snapshot = CameraCapture.captureIdSnapshot();
      if (!snapshot) return;
      const preview = document.getElementById("id-preview-img");
      if (preview) preview.src = snapshot;
      CameraCapture.stopIdCamera();
      showCameraStep("camera-step-2");
    });

    // Camera: Step 2 — retake ID
    document.getElementById("retake-id-btn")?.addEventListener("click", async function () {
      capturedIdDataUrl = null;
      const preview = document.getElementById("id-preview-img");
      if (preview) preview.src = "";
      showCameraStep("camera-step-1");
      await CameraCapture.initIdCamera();
    });

    // Camera: Step 2 — proceed to COR
    document.getElementById("next-after-id-btn")?.addEventListener("click", async function () {
      showCameraStep("camera-step-4");
      await CameraCapture.initCorCamera();
    });

    // Camera: Step 4 — capture COR
    document.getElementById("capture-cor-btn")?.addEventListener("click", function () {
      const snapshot = CameraCapture.captureCorSnapshot();
      if (!snapshot) return;
      const preview = document.getElementById("cor-preview-img");
      if (preview) preview.src = snapshot;
      CameraCapture.stopCorCamera();
      showCameraStep("camera-step-5");
    });

    // Camera: Step 5 — retake COR
    document.getElementById("retake-cor-btn")?.addEventListener("click", async function () {
      capturedCorDataUrl = null;
      const preview = document.getElementById("cor-preview-img");
      if (preview) preview.src = "";
      showCameraStep("camera-step-4");
      await CameraCapture.initCorCamera();
    });

    // Camera: Step 5 — proceed to face
    document.getElementById("continue-to-face-btn")?.addEventListener("click", async function () {
      showCameraStep("camera-step-3");
      const ok = await CameraCapture.initFaceCamera();
      if (ok) runFaceVerification();
    });

    // Form submit
    document.getElementById("signup-form")?.addEventListener("submit", function (e) {
      e.preventDefault();
      hideInlineAlert();

      if (!validateStep2()) { goToStep(2); return; }

      if (!capturedIdDataUrl) {
        showInlineAlert("Please capture your ID card using the camera (Step 3).");
        return;
      }
      if (!capturedCorDataUrl) {
        showInlineAlert("Please capture your COR / proof of employment using the camera (Step 3).");
        return;
      }
      if (!faceMatchComplete) {
        showInlineAlert("Please complete the face verification step (Step 3).");
        return;
      }

      const termsChecked = document.getElementById("terms-check")?.checked;
      const privacyChecked = document.getElementById("privacy-check")?.checked;
      if (!termsChecked) {
        showInlineAlert("Please agree to the terms and conditions.");
        return;
      }
      if (!privacyChecked) {
        showInlineAlert("Please consent to the data privacy notice.");
        return;
      }

      const user = buildUserObject();

      // Save session
      try {
        localStorage.setItem("upressUser", JSON.stringify(user));
      } catch (err) {
        console.error("Error saving session user:", err);
      }

      // Save to shared DB — this is what the admin pages read
      persistUserToDB(user);

      // Reset
      document.getElementById("signup-form")?.reset();
      otpCode = null;
      otpVerified = false;
      capturedIdDataUrl = null;
      capturedCorDataUrl = null;
      faceMatchComplete = false;
      resetEmailOtpState();
      goToStep(1);

      showAlert(
        "Registration complete!",
        "Your account has been created and is pending review. You will be redirected to your dashboard.",
        () => { window.location.href = "dashboard.html"; }
      );
    });

    // File upload fallback
    const idInput = document.getElementById("signup-id");
    const idPreview = document.getElementById("signup-id-preview");
    if (idInput && idPreview) {
      idInput.addEventListener("change", () => renderFilePreview(idInput, idPreview));
    }
  });
})();