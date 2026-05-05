(function () {
<<<<<<< HEAD
    let currentStep = 1;
    let otpCode = null;
    let otpVerified = false;
    let capturedIdDataUrl = null;  // Store captured ID as data URL
    let capturedCorDataUrl = null;  // Store captured COR as data URL
    let faceMatchComplete = false;

    // ============================================================
    // CAMERA CAPTURE + OCR + FACE MATCH MODULE
    // ============================================================
    const CameraCapture = {
        idVideoStream: null,
        corVideoStream: null,
        faceVideoStream: null,

        async initIdCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                const video = document.getElementById('id-camera-video');
                if (video) {
                    video.srcObject = stream;
                    this.idVideoStream = stream;
                }
                return true;
            } catch (err) {
                console.error('Camera error:', err);
                showAlert('Camera access denied', 'Please allow camera access to capture your ID.');
                return false;
            }
        },

        async initCorCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                const video = document.getElementById('cor-camera-video');
                if (video) {
                    video.srcObject = stream;
                    this.corVideoStream = stream;
                }
                return true;
            } catch (err) {
                console.error('COR camera error:', err);
                showAlert('Camera access denied', 'Please allow camera access to capture your COR.');
                return false;
            }
        },

        async initFaceCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
                });
                const video = document.getElementById('face-camera-video');
                if (video) {
                    video.srcObject = stream;
                    this.faceVideoStream = stream;
                }
                return true;
            } catch (err) {
                console.error('Face camera error:', err);
                showAlert('Camera access denied', 'Please allow camera access for face verification.');
                return false;
            }
        },

        captureIdSnapshot() {
            const video = document.getElementById('id-camera-video');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            capturedIdDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            return capturedIdDataUrl;
        },

        captureCorSnapshot() {
            const video = document.getElementById('cor-camera-video');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            capturedCorDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            return capturedCorDataUrl;
        },

        stopIdCamera() {
            if (this.idVideoStream) {
                this.idVideoStream.getTracks().forEach(track => track.stop());
                this.idVideoStream = null;
            }
        },

        stopCorCamera() {
            if (this.corVideoStream) {
                this.corVideoStream.getTracks().forEach(track => track.stop());
                this.corVideoStream = null;
            }
        },

        stopFaceCamera() {
            if (this.faceVideoStream) {
                this.faceVideoStream.getTracks().forEach(track => track.stop());
                this.faceVideoStream = null;
            }
=======
  let currentStep = 1;
  let otpCode = null;
  let otpVerified = false;
  let capturedIdDataUrl = null; // Store captured ID as data URL
  let faceMatchComplete = false;

  // ============================================================
  // CAMERA CAPTURE + OCR + FACE MATCH MODULE
  // ============================================================
  const CameraCapture = {
    idVideoStream: null,
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
          this.idVideoStream = stream;
>>>>>>> 2c2aa209a316e1c664555a02e04d6ae86fb572ea
        }
        return true;
      } catch (err) {
        console.error("Camera error:", err);
        showAlert(
          "Camera access denied",
          "Please allow camera access to capture your ID.",
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
          this.faceVideoStream = stream;
        }
        return true;
      } catch (err) {
        console.error("Face camera error:", err);
        showAlert(
          "Camera access denied",
          "Please allow camera access for face verification.",
        );
        return false;
      }
    },

    captureIdSnapshot() {
      const video = document.getElementById("id-camera-video");
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      capturedIdDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      return capturedIdDataUrl;
    },

    stopIdCamera() {
      if (this.idVideoStream) {
        this.idVideoStream.getTracks().forEach((track) => track.stop());
        this.idVideoStream = null;
      }
    },

    stopFaceCamera() {
      if (this.faceVideoStream) {
        this.faceVideoStream.getTracks().forEach((track) => track.stop());
        this.faceVideoStream = null;
      }
    },
  };

  // OCR using Tesseract.js from CDN
  async function performOCR(imageDataUrl) {
    const spinnerEl = document.getElementById("ocr-spinner");
    if (spinnerEl) spinnerEl.classList.remove("signup-hidden");

    try {
      // Load Tesseract from CDN
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.onload = async () => {
        try {
          const { createWorker } = window.Tesseract;
          const worker = await createWorker();
          const {
            data: { text },
          } = await worker.recognize(imageDataUrl);
          await worker.terminate();

          const extracted = extractIdInfo(text);
          preFillFormFields(extracted);
          showOCRResults(extracted);

          if (spinnerEl) spinnerEl.classList.add("signup-hidden");
        } catch (err) {
          console.error("OCR error:", err);
          if (spinnerEl) spinnerEl.classList.add("signup-hidden");
          showInlineAlert(
            "Could not read ID. Please check image clarity and try again.",
          );
        }
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error("OCR init error:", err);
      if (spinnerEl) spinnerEl.classList.add("signup-hidden");
    }
  }

  function extractIdInfo(text) {
    // Simple extraction - looks for patterns in OCR text
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const result = {
      fullName: "",
      studentId: "",
      course: "",
      department: "",
    };

    // Try to extract student ID (usually format like 2024-12345)
    const idMatch = text.match(/\b(\d{4}-\d{4,6})\b/);
    if (idMatch) result.studentId = idMatch[1];

    // Try to find full name (usually first 2-3 lines)
    if (lines.length > 0) result.fullName = lines[0];
    if (lines.length > 1 && !lines[1].includes("Student"))
      result.fullName = lines[0] + " " + lines[1];

    // Try to extract course/program
    const courseMatch = text.match(
      /(Bachelor|BS|AB|Certificate|Associate)[\s\w]*/i,
    );
    if (courseMatch) result.course = courseMatch[0];

    return result;
  }

  function preFillFormFields(extracted) {
    // Pre-fill name fields
    if (extracted.fullName) {
      const parts = extracted.fullName.split(/\s+/);
      if (parts.length >= 1) {
        const firstEl = document.getElementById("signup-first");
        if (firstEl) firstEl.value = parts[0];
      }
      if (parts.length >= 2) {
        const lastEl = document.getElementById("signup-last");
        if (lastEl) lastEl.value = parts.slice(1).join(" ");
      }
    }

    // Pre-fill student ID
    if (extracted.studentId) {
      const idEl = document.getElementById("signup-campus-id");
      if (idEl) idEl.value = extracted.studentId;
    }

    // Pre-fill course if detected
    if (extracted.course) {
      const courseEl = document.getElementById("signup-course");
      if (courseEl) {
        for (let opt of courseEl.options) {
          if (
            opt.textContent
              .toUpperCase()
              .includes(extracted.course.toUpperCase())
          ) {
            courseEl.value = opt.value;
            break;
          }
        }
      }
    }
  }

  function showOCRResults(extracted) {
    const resultsEl = document.getElementById("ocr-results");
    if (!resultsEl) return;

    let html =
      "<div><strong>Name:</strong> " + (extracted.fullName || "—") + "</div>";
    html +=
      "<div><strong>ID:</strong> " + (extracted.studentId || "—") + "</div>";
    html +=
      "<div><strong>Course:</strong> " + (extracted.course || "—") + "</div>";

    resultsEl.innerHTML = html;
    resultsEl.classList.remove("signup-hidden");
  }

  // Face matching using face-api.js
  async function startFaceMatching() {
    const statusEl = document.getElementById("face-status");
    if (!statusEl) return;

    try {
      // Load face-api.js
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
      script.onload = async () => {
        try {
          // Load face-api models
          const MODEL_URL =
            "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
          await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
          await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
          await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
          await faceapi.nets.faceExpressionNet.load(MODEL_URL);

          // Get face from captured ID
          const idImg = document.createElement("img");
          idImg.src = capturedIdDataUrl;
          idImg.onload = async () => {
            const idDetections = await faceapi
              .detectAllFaces(idImg, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptors();

            if (idDetections.length === 0) {
              statusEl.textContent =
                "No face detected on ID. Please try again.";
              statusEl.classList.remove("scanning", "matched");
              statusEl.classList.add("no-match");
              return;
            }

            const idFaceDescriptor = idDetections[0].descriptor;

            // Now check live video feed
            statusEl.textContent = "Scanning...";
            statusEl.classList.add("scanning");

            const liveVideo = document.getElementById("face-camera-video");
            let noFaceCounter = 0;
            const checkInterval = setInterval(async () => {
              try {
                const liveDetections = await faceapi
                  .detectAllFaces(
                    liveVideo,
                    new faceapi.TinyFaceDetectorOptions(),
                  )
                  .withFaceLandmarks()
                  .withFaceDescriptors();

                if (liveDetections.length === 0) {
                  noFaceCounter++;
                  if (noFaceCounter > 10) {
                    const warningEl = document.getElementById("face-warning");
                    if (warningEl) warningEl.classList.remove("signup-hidden");
                  }
                  return;
                }

                noFaceCounter = 0;
                const warningEl = document.getElementById("face-warning");
                if (warningEl) warningEl.classList.add("signup-hidden");

                const liveFaceDescriptor = liveDetections[0].descriptor;

<<<<<<< HEAD
        // Try to find full name (usually first 2-3 lines)
        if (lines.length > 0) result.fullName = lines[0];
        if (lines.length > 1 && !lines[1].includes('Student')) result.fullName = lines[0] + ' ' + lines[1];

        // Try to extract course/program
        const courseMatch = text.match(/(Bachelor|BS|AB|Certificate|Associate)[\s\w]*/i);
        if (courseMatch) result.course = courseMatch[0];

        return result;
    }

    function preFillFormFields(extracted) {
        // Pre-fill name fields
        if (extracted.fullName) {
            const parts = extracted.fullName.split(/\s+/);
            if (parts.length >= 1) {
                const firstEl = document.getElementById('signup-first');
                if (firstEl) firstEl.value = parts[0];
            }
            if (parts.length >= 2) {
                const lastEl = document.getElementById('signup-last');
                if (lastEl) lastEl.value = parts.slice(1).join(' ');
            }
        }

        // Pre-fill student ID
        if (extracted.studentId) {
            const idEl = document.getElementById('signup-campus-id');
            if (idEl) idEl.value = extracted.studentId;
        }

        // Pre-fill course if detected
        if (extracted.course) {
            const courseEl = document.getElementById('signup-course');
            if (courseEl) {
                for (let opt of courseEl.options) {
                    if (opt.textContent.toUpperCase().includes(extracted.course.toUpperCase())) {
                        courseEl.value = opt.value;
                        break;
                    }
                }
            }
        }
    }

    function showOCRResults(extracted) {
        const resultsEl = document.getElementById('ocr-results');
        if (!resultsEl) return;

        let html = '<div><strong>Name:</strong> ' + (extracted.fullName || '—') + '</div>';
        html += '<div><strong>ID:</strong> ' + (extracted.studentId || '—') + '</div>';
        html += '<div><strong>Course:</strong> ' + (extracted.course || '—') + '</div>';

        resultsEl.innerHTML = html;
        resultsEl.classList.remove('signup-hidden');
    }

    // Face matching using face-api.js
    async function startFaceMatching() {
        const statusEl = document.getElementById('face-status');
        if (!statusEl) return;

        try {
            // Demo mode: Auto-verify after 1 second of scanning for demo purposes
            statusEl.textContent = 'Scanning...';
            statusEl.classList.add('scanning');

            setTimeout(() => {
                statusEl.textContent = 'Face matched';
                statusEl.classList.remove('scanning');
                statusEl.classList.add('matched');
                CameraCapture.stopFaceCamera();
                faceMatchComplete = true;

                // Auto-move to form display after a short delay
                setTimeout(() => {
                    goToFormDisplay();
                }, 1500);
            }, 1000);

            return;

            // Original face-api.js implementation (commented out for demo)
            /*
            // Load face-api.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
            script.onload = async () => {
                try {
                    // Load face-api models
                    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
                    await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
                    await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
                    await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
                    await faceapi.nets.faceExpressionNet.load(MODEL_URL);

                    // Get face from captured ID
                    const idImg = document.createElement('img');
                    idImg.src = capturedIdDataUrl;
                    idImg.onload = async () => {
                        const idDetections = await faceapi
                            .detectAllFaces(idImg, new faceapi.TinyFaceDetectorOptions())
                            .withFaceLandmarks()
                            .withFaceDescriptors();

                        if (idDetections.length === 0) {
                            statusEl.textContent = 'No face detected on ID. Please try again.';
                            statusEl.classList.remove('scanning', 'matched');
                            statusEl.classList.add('no-match');
                            return;
                        }

                        const idFaceDescriptor = idDetections[0].descriptor;

                        // Now check live video feed
                        statusEl.textContent = 'Scanning...';
                        statusEl.classList.add('scanning');

                        const liveVideo = document.getElementById('face-camera-video');
                        let noFaceCounter = 0;
                        const checkInterval = setInterval(async () => {
                            try {
                                const liveDetections = await faceapi
                                    .detectAllFaces(liveVideo, new faceapi.TinyFaceDetectorOptions())
                                    .withFaceLandmarks()
                                    .withFaceDescriptors();

                                if (liveDetections.length === 0) {
                                    noFaceCounter++;
                                    if (noFaceCounter > 10) {
                                        const warningEl = document.getElementById('face-warning');
                                        if (warningEl) warningEl.classList.remove('signup-hidden');
                                    }
                                    return;
                                }

                                noFaceCounter = 0;
                                const warningEl = document.getElementById('face-warning');
                                if (warningEl) warningEl.classList.add('signup-hidden');

                                const liveFaceDescriptor = liveDetections[0].descriptor;

                                // Compare faces
                                const distance = faceapi.euclideanDistance(idFaceDescriptor, liveFaceDescriptor);

                                if (distance < 0.6) {
                                    statusEl.textContent = 'Face matched';
                                    statusEl.classList.remove('scanning');
                                    statusEl.classList.add('matched');
                                    clearInterval(checkInterval);
                                    CameraCapture.stopFaceCamera();
                                    faceMatchComplete = true;

                                    // Auto-move to form display after a short delay
                                    setTimeout(() => {
                                        goToFormDisplay();
                                    }, 1500);
                                }
                            } catch (err) {
                                console.error('Face check error:', err);
                            }
                        }, 500);

                        // Timeout after 30 seconds
                        setTimeout(() => {
                            clearInterval(checkInterval);
                        }, 30000);
                    };
                } catch (err) {
                    console.error('Face API error:', err);
                    statusEl.textContent = 'Face verification unavailable. Proceeding...';
                    faceMatchComplete = true;
                    goToFormDisplay();
                }
            };
            document.head.appendChild(script);
            */
        } catch (err) {
            console.error('Face match error:', err);
            faceMatchComplete = true;
            goToFormDisplay();
        }
    }

    function goToFormDisplay() {
        const step1 = document.getElementById('camera-step-1');
        const step2 = document.getElementById('camera-step-2');
        const step3 = document.getElementById('camera-step-3');
        const step4 = document.getElementById('camera-step-4');
        const step5 = document.getElementById('camera-step-5');
        if (step1) step1.classList.add('signup-hidden');
        if (step2) step2.classList.add('signup-hidden');
        if (step3) step3.classList.add('signup-hidden');
        if (step4) step4.classList.add('signup-hidden');
        if (step5) step5.classList.add('signup-hidden');

        const captureSection = document.getElementById('camera-capture-section');
        if (captureSection) captureSection.classList.add('signup-hidden');

        document.querySelectorAll('.signup-terms-row, .signup-step-actions').forEach(function (el) {
            el.classList.remove('signup-hidden');
        });
    }

    // ============================================================
    // END CAMERA MODULE
    // ============================================================

    function escapeHtml(str) {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function showInlineAlert(msg) {
        const el = document.getElementById("signup-inline-alert");
        if (!el) return;
        el.textContent = msg;
        el.classList.remove("signup-hidden");
    }

    function hideInlineAlert() {
        const el = document.getElementById("signup-inline-alert");
        if (!el) return;
        el.textContent = "";
        el.classList.add("signup-hidden");
    }

    function getAccountType() {
        const r = document.querySelector('input[name="signup-account-type"]:checked');
        return r && r.value === "faculty" ? "faculty" : "student";
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
            if (lead2) lead2.textContent = "Tell us who you are and how to reach you.";
            if (title3) title3.textContent = "Upload verification";
            if (lead3)
                lead3.textContent =
                    "Upload clear photos or scans. PDF, JPG, or PNG up to 5MB each (demo — files stay in your browser only).";
            if (docCor) docCor.textContent = "First semester COR *";
            if (typeof populateCourses === "function") populateCourses("signup-college", "signup-course");
        }
    }

    function selectRole(role) {
        document.querySelectorAll(".role-card").forEach(function (card) {
            const input = card.querySelector('input[type="radio"]');
            const match = input && input.value === role;
            card.classList.toggle("selected", !!match);
            if (input) input.checked = !!match;
        });
        applyRoleUI();
    }

    function goToStep(step) {
        hideInlineAlert();
        currentStep = step;

        document.querySelectorAll(".signup-step").forEach(function (stepEl, index) {
            const n = index + 1;
            stepEl.classList.remove("active", "completed");
            if (n < step) stepEl.classList.add("completed");
            else if (n === step) stepEl.classList.add("active");
        });

        document.querySelectorAll(".signup-form-step").forEach(function (sec) {
            sec.classList.add("signup-hidden");
        });
        const active = document.getElementById("signup-step-" + step);
        if (active) active.classList.remove("signup-hidden");

        const card = document.querySelector(".signup-card");
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });

        if (step === 2) updateStep2ContinueState();
    }

    function updateStep2ContinueState() {
        const btn = document.getElementById("signup-btn-step2-next");
        if (!btn) return;
        btn.disabled = !otpVerified;
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
                "Code sent to " + email + ". Demo: the code is shown above — enter it and tap Verify code.";
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

    function handleStep2Continue() {
        hideInlineAlert();
        if (!otpVerified) {
            showInlineAlert('Verify your email: tap "Verify" by the email, enter the code, then "Verify code".');
            return;
        }
        if (!validateStep2()) return;
        goToStep(3);
    }

    function togglePass(inputId) {
        const el = document.getElementById(inputId);
        const btn = document.querySelector('.eye-btn[data-toggle-pass="' + inputId + '"]');
        if (!el || !btn) return;
        const showPlain = el.type === "password";
        el.type = showPlain ? "text" : "password";
        btn.classList.toggle("is-visible", showPlain);
        btn.setAttribute("aria-label", showPlain ? "Hide password" : "Show password");
    }

    function renderFilePreview(input, previewWrap) {
        if (!input || !previewWrap || !input.files || !input.files[0]) return;
        const file = input.files[0];
        const mb = (file.size / 1024 / 1024).toFixed(2);
        previewWrap.innerHTML =
            '<div class="signup-file-preview">' +
            '<span class="signup-file-preview-name">' +
            escapeHtml(file.name) +
            " (" +
            escapeHtml(mb) +
            " MB)</span>" +
            '<button type="button" class="signup-file-preview-remove" data-clear-input="' +
            escapeHtml(input.id) +
            '" aria-label="Remove file">×</button>' +
            "</div>";
        previewWrap.classList.remove("signup-hidden");
        previewWrap.querySelector(".signup-file-preview-remove")?.addEventListener("click", function () {
            input.value = "";
            previewWrap.innerHTML = "";
            previewWrap.classList.add("signup-hidden");
        });
    }

    function initFileUploadZone(labelId, inputId, previewId) {
        const label = document.getElementById(labelId);
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (!label || !input || !preview) return;

        label.addEventListener("click", function (e) {
            if (e.target === input) return;
            e.preventDefault();
            input.click();
        });

        label.addEventListener("dragover", function (e) {
            e.preventDefault();
            label.style.borderColor = "#8b0000";
            label.style.background = "#fff0f0";
        });
        label.addEventListener("dragleave", function () {
            label.style.borderColor = "";
            label.style.background = "";
        });
        label.addEventListener("drop", function (e) {
            e.preventDefault();
            label.style.borderColor = "";
            label.style.background = "";
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                input.files = e.dataTransfer.files;
                renderFilePreview(input, preview);
            }
        });

        input.addEventListener("change", function () {
            renderFilePreview(input, preview);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        applyRoleUI();

        document.querySelectorAll(".role-card").forEach(function (card) {
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

        document.getElementById("signup-btn-step2-next")?.addEventListener("click", handleStep2Continue);

        document.getElementById("signup-btn-step3-back")?.addEventListener("click", function () {
            CameraCapture.stopIdCamera();
            CameraCapture.stopCorCamera();
            CameraCapture.stopFaceCamera();
            faceMatchComplete = false;
            capturedIdDataUrl = null;
            capturedCorDataUrl = null;

            const step1 = document.getElementById('camera-step-1');
            const step2 = document.getElementById('camera-step-2');
            const step3 = document.getElementById('camera-step-3');
            const step4 = document.getElementById('camera-step-4');
            const step5 = document.getElementById('camera-step-5');
            if (step1) step1.classList.remove('signup-hidden');
            if (step2) step2.classList.add('signup-hidden');
            if (step3) step3.classList.add('signup-hidden');
            if (step4) step4.classList.add('signup-hidden');
            if (step5) step5.classList.add('signup-hidden');

            goToStep(2);
        });

        document.getElementById("signup-email-verify-btn")?.addEventListener("click", function () {
            hideInlineAlert();
            const email = document.getElementById("signup-email")?.value.trim() || "";
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showInlineAlert("Enter a valid email, then tap Verify.");
                return;
            }
            if (!issueEmailOtp()) {
                showInlineAlert("Enter a valid email address.");
            }
        });

        document.getElementById("signup-otp-verify-btn")?.addEventListener("click", verifyEnteredEmailCode);

        document.getElementById("signup-email")?.addEventListener("input", function () {
            if (otpCode !== null) resetEmailOtpState();
        });

        document.querySelectorAll("[data-toggle-pass]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const id = btn.getAttribute("data-toggle-pass");
                if (id) togglePass(id);
            });
        });

        // Initialize camera capture for ID
        document.getElementById('capture-id-btn')?.addEventListener('click', async function () {
            const snapshot = CameraCapture.captureIdSnapshot();
            if (snapshot) {
                capturedIdDataUrl = snapshot;
                const preview = document.getElementById('id-preview-img');
                if (preview) preview.src = snapshot;

                const step1 = document.getElementById('camera-step-1');
                const step2 = document.getElementById('camera-step-2');
                if (step1) step1.classList.add('signup-hidden');
                if (step2) step2.classList.remove('signup-hidden');

                CameraCapture.stopIdCamera();
                await performOCR(snapshot);
            }
        });

        document.getElementById('retake-id-btn')?.addEventListener('click', async function () {
            const step1 = document.getElementById('camera-step-1');
            const step2 = document.getElementById('camera-step-2');
            if (step1) step1.classList.remove('signup-hidden');
            if (step2) step2.classList.add('signup-hidden');

            capturedIdDataUrl = null;
            const preview = document.getElementById('id-preview-img');
            if (preview) preview.src = '';
            const resultsEl = document.getElementById('ocr-results');
            if (resultsEl) resultsEl.classList.add('signup-hidden');

            await CameraCapture.initIdCamera();
        });

        document.getElementById('next-after-id-btn')?.addEventListener('click', async function () {
            const step2 = document.getElementById('camera-step-2');
            const step4 = document.getElementById('camera-step-4');
            if (step2) step2.classList.add('signup-hidden');
            if (step4) step4.classList.remove('signup-hidden');

            await CameraCapture.initCorCamera();
        });

        document.getElementById('capture-cor-btn')?.addEventListener('click', async function () {
            const snapshot = CameraCapture.captureCorSnapshot();
            if (snapshot) {
                capturedCorDataUrl = snapshot;
                const preview = document.getElementById('cor-preview-img');
                if (preview) preview.src = snapshot;

                const step4 = document.getElementById('camera-step-4');
                const step5 = document.getElementById('camera-step-5');
                if (step4) step4.classList.add('signup-hidden');
                if (step5) step5.classList.remove('signup-hidden');

                CameraCapture.stopCorCamera();
            }
        });

        document.getElementById('retake-cor-btn')?.addEventListener('click', async function () {
            const step4 = document.getElementById('camera-step-4');
            const step5 = document.getElementById('camera-step-5');
            if (step4) step4.classList.remove('signup-hidden');
            if (step5) step5.classList.add('signup-hidden');

            capturedCorDataUrl = null;
            const preview = document.getElementById('cor-preview-img');
            if (preview) preview.src = '';

            await CameraCapture.initCorCamera();
        });

        document.getElementById('continue-to-face-btn')?.addEventListener('click', async function () {
            const step5 = document.getElementById('camera-step-5');
            const step3 = document.getElementById('camera-step-3');
            if (step5) step5.classList.add('signup-hidden');
            if (step3) step3.classList.remove('signup-hidden');

            await CameraCapture.initFaceCamera();
            startFaceMatching();
        });

        // Initialize camera for ID capture when showing step 3
        const origGoToStep = goToStep;
        goToStep = function (step) {
            origGoToStep(step);
            if (step === 3) {
                document.querySelectorAll('.signup-terms-row, .signup-step-actions').forEach(function (el) {
                    el.classList.add('signup-hidden');
                });
                const section = document.getElementById('camera-capture-section');
                if (section) {
                    section.classList.remove('signup-hidden');
                    section.style.display = 'flex';
                }
                const step1 = document.getElementById('camera-step-1');
                const step2 = document.getElementById('camera-step-2');
                const step3 = document.getElementById('camera-step-3');
                const step4 = document.getElementById('camera-step-4');
                const step5 = document.getElementById('camera-step-5');
                if (step1) step1.classList.remove('signup-hidden');
                if (step2) step2.classList.add('signup-hidden');
                if (step3) step3.classList.add('signup-hidden');
                if (step4) step4.classList.add('signup-hidden');
                if (step5) step5.classList.add('signup-hidden');
                capturedIdDataUrl = null;
                capturedCorDataUrl = null;
                CameraCapture.initIdCamera();
            }
        };

        document.getElementById("signup-form")?.addEventListener("submit", function (e) {
            e.preventDefault();
            hideInlineAlert();

            if (!validateStep2()) {
                goToStep(2);
                return;
            }

            // Check for captured ID
            if (!capturedIdDataUrl) {
                showInlineAlert("Please capture your ID using the camera.");
                return;
            }

            // Check for captured COR
            if (!capturedCorDataUrl) {
                showInlineAlert("Please capture your First semester COR.");
                return;
            }

            if (!otpVerified) {
                showAlert(
                    "Email not verified",
                    "Go back to step 2. Tap Verify by your email, enter the code, tap Verify by the code field, then continue.",
=======
                // Compare faces
                const distance = faceapi.euclideanDistance(
                  idFaceDescriptor,
                  liveFaceDescriptor,
>>>>>>> 2c2aa209a316e1c664555a02e04d6ae86fb572ea
                );

                if (distance < 0.6) {
                  statusEl.textContent = "Face matched";
                  statusEl.classList.remove("scanning");
                  statusEl.classList.add("matched");
                  clearInterval(checkInterval);
                  CameraCapture.stopFaceCamera();
                  faceMatchComplete = true;

                  // Auto-move to form display after a short delay
                  setTimeout(() => {
                    goToFormDisplay();
                  }, 1500);
                }
              } catch (err) {
                console.error("Face check error:", err);
              }
            }, 500);

            // Timeout after 30 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
            }, 30000);
          };
        } catch (err) {
          console.error("Face API error:", err);
          statusEl.textContent = "Face verification unavailable. Proceeding...";
          faceMatchComplete = true;
          goToFormDisplay();
        }
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error("Face API init error:", err);
      faceMatchComplete = true;
      goToFormDisplay();
    }
  }

  function goToFormDisplay() {
    const step1 = document.getElementById("camera-step-1");
    const step2 = document.getElementById("camera-step-2");
    const step3 = document.getElementById("camera-step-3");
    if (step1) step1.classList.add("signup-hidden");
    if (step2) step2.classList.add("signup-hidden");
    if (step3) step3.classList.add("signup-hidden");
    goToStep(2);
  }

  // ============================================================
  // END CAMERA MODULE
  // ============================================================

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showInlineAlert(msg) {
    const el = document.getElementById("signup-inline-alert");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("signup-hidden");
  }

  function hideInlineAlert() {
    const el = document.getElementById("signup-inline-alert");
    if (!el) return;
    el.textContent = "";
    el.classList.add("signup-hidden");
  }

  function getAccountType() {
    const r = document.querySelector(
      'input[name="signup-account-type"]:checked',
    );
    return r && r.value === "faculty" ? "faculty" : "student";
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
      if (typeof populateCourses === "function")
        populateCourses("signup-college", "signup-course");
    }
  }

  function selectRole(role) {
    document.querySelectorAll(".role-card").forEach(function (card) {
      const input = card.querySelector('input[type="radio"]');
      const match = input && input.value === role;
      card.classList.toggle("selected", !!match);
      if (input) input.checked = !!match;
    });
    applyRoleUI();
  }

  function goToStep(step) {
    hideInlineAlert();
    currentStep = step;

    document.querySelectorAll(".signup-step").forEach(function (stepEl, index) {
      const n = index + 1;
      stepEl.classList.remove("active", "completed");
      if (n < step) stepEl.classList.add("completed");
      else if (n === step) stepEl.classList.add("active");
    });

    document.querySelectorAll(".signup-form-step").forEach(function (sec) {
      sec.classList.add("signup-hidden");
    });
    const active = document.getElementById("signup-step-" + step);
    if (active) active.classList.remove("signup-hidden");

    const card = document.querySelector(".signup-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });

    if (step === 2) updateStep2ContinueState();
  }

  function updateStep2ContinueState() {
    const btn = document.getElementById("signup-btn-step2-next");
    if (!btn) return;
    btn.disabled = !otpVerified;
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

  function handleStep2Continue() {
    hideInlineAlert();
    if (!otpVerified) {
      showInlineAlert(
        'Verify your email: tap "Verify" by the email, enter the code, then "Verify code".',
      );
      return;
    }
    if (!validateStep2()) return;
    goToStep(3);
  }

  function togglePass(inputId) {
    const el = document.getElementById(inputId);
    const btn = document.querySelector(
      '.eye-btn[data-toggle-pass="' + inputId + '"]',
    );
    if (!el || !btn) return;
    const showPlain = el.type === "password";
    el.type = showPlain ? "text" : "password";
    btn.classList.toggle("is-visible", showPlain);
    btn.setAttribute(
      "aria-label",
      showPlain ? "Hide password" : "Show password",
    );
  }

  function renderFilePreview(input, previewWrap) {
    if (!input || !previewWrap || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const mb = (file.size / 1024 / 1024).toFixed(2);
    previewWrap.innerHTML =
      '<div class="signup-file-preview">' +
      '<span class="signup-file-preview-name">' +
      escapeHtml(file.name) +
      " (" +
      escapeHtml(mb) +
      " MB)</span>" +
      '<button type="button" class="signup-file-preview-remove" data-clear-input="' +
      escapeHtml(input.id) +
      '" aria-label="Remove file">×</button>' +
      "</div>";
    previewWrap.classList.remove("signup-hidden");
    previewWrap
      .querySelector(".signup-file-preview-remove")
      ?.addEventListener("click", function () {
        input.value = "";
        previewWrap.innerHTML = "";
        previewWrap.classList.add("signup-hidden");
      });
  }

  function initFileUploadZone(labelId, inputId, previewId) {
    const label = document.getElementById(labelId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!label || !input || !preview) return;

    label.addEventListener("click", function (e) {
      if (e.target === input) return;
      e.preventDefault();
      input.click();
    });

    label.addEventListener("dragover", function (e) {
      e.preventDefault();
      label.style.borderColor = "#8b0000";
      label.style.background = "#fff0f0";
    });
    label.addEventListener("dragleave", function () {
      label.style.borderColor = "";
      label.style.background = "";
    });
    label.addEventListener("drop", function (e) {
      e.preventDefault();
      label.style.borderColor = "";
      label.style.background = "";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        input.files = e.dataTransfer.files;
        renderFilePreview(input, preview);
      }
    });

    input.addEventListener("change", function () {
      renderFilePreview(input, preview);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyRoleUI();

    document.querySelectorAll(".role-card").forEach(function (card) {
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
      ?.addEventListener("click", handleStep2Continue);

    document
      .getElementById("signup-btn-step3-back")
      ?.addEventListener("click", function () {
        CameraCapture.stopIdCamera();
        CameraCapture.stopFaceCamera();
        faceMatchComplete = false;
        capturedIdDataUrl = null;
        const step1 = document.getElementById("camera-step-1");
        const step2 = document.getElementById("camera-step-2");
        const step3 = document.getElementById("camera-step-3");
        if (step1) step1.classList.remove("signup-hidden");
        if (step2) step2.classList.add("signup-hidden");
        if (step3) step3.classList.add("signup-hidden");
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

    document.querySelectorAll("[data-toggle-pass]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-toggle-pass");
        if (id) togglePass(id);
      });
    });

    // Initialize camera capture for ID
    document
      .getElementById("capture-id-btn")
      ?.addEventListener("click", async function () {
        const snapshot = CameraCapture.captureIdSnapshot();
        if (snapshot) {
          const preview = document.getElementById("id-preview-img");
          if (preview) preview.src = snapshot;

          const step1 = document.getElementById("camera-step-1");
          const step2 = document.getElementById("camera-step-2");
          if (step1) step1.classList.add("signup-hidden");
          if (step2) step2.classList.remove("signup-hidden");

          CameraCapture.stopIdCamera();
          await performOCR(snapshot);
        }
      });

    document
      .getElementById("retake-id-btn")
      ?.addEventListener("click", async function () {
        const step1 = document.getElementById("camera-step-1");
        const step2 = document.getElementById("camera-step-2");
        if (step1) step1.classList.remove("signup-hidden");
        if (step2) step2.classList.add("signup-hidden");

        const resultsEl = document.getElementById("ocr-results");
        if (resultsEl) resultsEl.classList.add("signup-hidden");

        await CameraCapture.initIdCamera();
      });

    document
      .getElementById("continue-after-id-btn")
      ?.addEventListener("click", async function () {
        const step2 = document.getElementById("camera-step-2");
        const step3 = document.getElementById("camera-step-3");
        if (step2) step2.classList.add("signup-hidden");
        if (step3) step3.classList.remove("signup-hidden");

        await CameraCapture.initFaceCamera();
        startFaceMatching();
      });

    // Init file upload zones for COR (keep existing COR upload, remove ID)
    initFileUploadZone("signup-cor-upload", "signup-cor", "signup-cor-preview");

    // Initialize camera for ID capture when showing step 3
    const origGoToStep = goToStep;
    goToStep = function (step) {
      origGoToStep(step);
      if (step === 3) {
        // Show camera capture UI
        const section = document.getElementById("camera-capture-section");
        if (section) section.style.display = "flex";
        CameraCapture.initIdCamera();
      }
    };

    document
      .getElementById("signup-form")
      ?.addEventListener("submit", function (e) {
        e.preventDefault();
        hideInlineAlert();

        if (!validateStep2()) {
          goToStep(2);
          return;
        }

        // Check for captured ID
        if (!capturedIdDataUrl) {
          showInlineAlert("Please capture your ID using the camera.");
          return;
        }

        // Check for COR file
        const corFile = document.getElementById("signup-cor")?.files?.[0];
        if (!corFile) {
          showInlineAlert("Please upload your First semester COR.");
          return;
        }
        const maxMb = 5;
        if (corFile.size > maxMb * 1024 * 1024) {
          showInlineAlert("COR file must be 5MB or smaller.");
          return;
        }

        if (!otpVerified) {
          showAlert(
            "Email not verified",
            "Go back to step 2. Tap Verify by your email, enter the code, tap Verify by the code field, then continue.",
          );
          return;
        }

        const terms = document.getElementById("terms-check");
        if (!terms?.checked) {
          showAlert(
            "Terms required",
            "Please agree to the terms and conditions.",
          );
          return;
        }
        const privacy = document.getElementById("privacy-check");
        if (!privacy?.checked) {
          showAlert(
            "Privacy consent",
            "Please confirm data privacy consent to continue.",
          );
          return;
        }

        const first = document.getElementById("signup-first").value.trim();
        const last = document.getElementById("signup-last").value.trim();
        const name = (first + " " + last).trim();
        const email = document.getElementById("signup-email").value.trim();
        const phone = document.getElementById("signup-phone").value.trim();
        const college = document.getElementById("signup-college").value;
        const pass = document.getElementById("signup-pass").value;
        const type = getAccountType();
        const year =
          type === "student"
            ? document.getElementById("signup-year").value
            : "";
        const course =
          type === "student"
            ? document.getElementById("signup-course").value
            : "";
        const campusId = document
          .getElementById("signup-campus-id")
          .value.trim();

        // Student/faculty account creation is disabled
        showAlert(
          "Account creation disabled",
          "Student and faculty account creation has been disabled. Please contact your administrator for account setup.",
          function () {
            window.location.href = "../auth/portal.html";
          },
        );
      });

    updateStep2ContinueState();
  });
})();
