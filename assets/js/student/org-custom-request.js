(function () {
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("upressUser") || "null");
    } catch {
      return null;
    }
  }

  const user = getUser();
  if (!user) {
    window.location.href = "../auth/portal.html";
    return;
  }

  if (localStorage.getItem("upress_order_type") !== "organization") {
    alert("Switch to an organization order first (Create order → Organization).");
    window.location.href = "create-order.html";
    return;
  }

  const orgName = localStorage.getItem("upress_order_org") || "";
  if (!orgName) {
    alert("Select your organization on the previous step.");
    window.location.href = "create-order.html";
    return;
  }

  const summary = document.getElementById("ocr-summary");
  if (summary) {
    summary.innerHTML = `<span class="co-sum-emoji">🏫</span> <span>Organization: ${orgName.replace(/</g, "&lt;")} · Custom / Other request</span>`;
  }

  document.getElementById("ocr-form")?.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!window.UpressOrgCustomRequests) {
      alert("Storage not ready. Refresh and try again.");
      return;
    }

    const title = document.getElementById("ocr-title")?.value.trim() || "";
    const category = document.getElementById("ocr-category")?.value || "";
    const qty = document.getElementById("ocr-qty")?.value.trim() || "";
    const details = document.getElementById("ocr-details")?.value.trim() || "";
    const fileInput = document.getElementById("ocr-file");

    if (!title || !category || !details) {
      alert("Please fill in all required fields.");
      return;
    }

    function saveRow(dataUrl) {
      window.UpressOrgCustomRequests.add({
        userId: user.id,
        userName: user.fullName || user.name || "",
        userEmail: user.email || "",
        organizationName: orgName,
        requestTitle: title,
        requestCategory: category,
        quantityOrSpecs: qty,
        requestDetails: details,
        attachmentDataUrl: dataUrl || null,
      });
      alert(
        "Request submitted. UPress staff will review and you will get a dashboard notification when there is an update.",
      );
      window.location.href = "dashboard.html";
    }

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const f = fileInput.files[0];
      if (f.size > 5 * 1024 * 1024) {
        alert("File is too large (max 5MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        saveRow(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(f);
      return;
    }

    saveRow(null);
  });
})();
