(function () {
  const db = getDB();
  const pageContainer = document.getElementById("pageContainer");

  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
      <p class="page-sub">Configure system-wide settings</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Academic Year</div>
          <div class="settings-section-sub">Set the current academic year for data separation</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Academic Year <span class="required">*</span></label>
        <input type="text" class="form-input" id="academicYear" value="${db.academicYear || ""}" placeholder="e.g., 2024-2025" />
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
          Format: YYYY-YYYY (e.g., 2024-2025). This is required for the system to function.
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon orange">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Maintenance Mode</div>
          <div class="settings-section-sub">Temporarily disable the system for maintenance</div>
        </div>
      </div>

      <div class="maintenance-alert ${db.systemSettings.maintenanceMode ? "active" : "normal"}" id="maintenanceAlert">
        <div class="maintenance-alert-text">
          <strong id="maintenanceStatus">${db.systemSettings.maintenanceMode ? "Maintenance mode active" : "System operating normally"}</strong>
          <span id="maintenanceSubStatus">${db.systemSettings.maintenanceMode ? "Students cannot access the system" : "System is available to all users"}</span>
        </div>
        <button class="btn btn-sm ${db.systemSettings.maintenanceMode ? "btn-danger" : "btn-ghost"}" id="maintenanceToggleBtn">
          ${db.systemSettings.maintenanceMode ? "Disable" : "Enable"}
        </button>
      </div>
    </div>

    <div class="sticky-save">
      <button class="btn btn-primary" id="saveSettings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Settings
      </button>
    </div>
  `;

  document
    .getElementById("maintenanceToggleBtn")
    .addEventListener("click", () => {
      db.systemSettings.maintenanceMode = !db.systemSettings.maintenanceMode;
      saveDB(db);
      updateMaintenanceUI();
      showToast(
        db.systemSettings.maintenanceMode
          ? "Maintenance mode enabled"
          : "Maintenance mode disabled",
      );
    });

  document.getElementById("saveSettings").addEventListener("click", () => {
    const academicYear = document.getElementById("academicYear").value.trim();
    if (!academicYear) {
      showToast("Academic year is required!");
      return;
    }
    if (!/^\d{4}-\d{4}$/.test(academicYear)) {
      showToast("Invalid academic year format! Use YYYY-YYYY");
      return;
    }

    if (db.academicYear !== academicYear) {
      setAcademicYear(academicYear);
    } else {
      saveDB(db);
    }

    showToast("System settings saved!");
  });

  function updateMaintenanceUI() {
    const alert = document.getElementById("maintenanceAlert");
    const statusEl = document.getElementById("maintenanceStatus");
    const subStatusEl = document.getElementById("maintenanceSubStatus");
    const btn = document.getElementById("maintenanceToggleBtn");

    if (db.systemSettings.maintenanceMode) {
      alert.className = "maintenance-alert active";
      statusEl.textContent = "Maintenance mode active";
      subStatusEl.textContent = "Students cannot access the system";
      btn.className = "btn btn-sm btn-danger";
      btn.textContent = "Disable";
    } else {
      alert.className = "maintenance-alert normal";
      statusEl.textContent = "System operating normally";
      subStatusEl.textContent = "System is available to all users";
      btn.className = "btn btn-sm btn-ghost";
      btn.textContent = "Enable";
    }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");
    toastMsg.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
})();
