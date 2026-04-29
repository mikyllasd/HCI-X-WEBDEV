/* ============================================================
   UPRESSease Admin Portal – System Settings Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");
  const s = state.settings;

  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
      <p class="page-sub">Configure system-wide settings and information</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Institution Information</div>
          <div class="settings-section-sub">Basic information about your institution</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Institution Name</label>
        <input type="text" class="form-input" id="sInstitution" value="${s.institution}" />
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Address</label>
        <textarea class="form-input" id="sAddress" rows="2" style="resize:vertical">${s.address}</textarea>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Contact Information</div>
          <div class="settings-section-sub">Contact details displayed to users</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Contact Email</label>
        <div class="input-icon-wrap">
          <input type="email" class="form-input" id="sEmail" value="${s.email}" style="padding-left:42px"/>
          <span class="input-icon-btn" style="left:12px;right:auto;pointer-events:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Contact Phone</label>
        <div class="input-icon-wrap">
          <input type="tel" class="form-input" id="sPhone" value="${s.phone}" style="padding-left:42px"/>
          <span class="input-icon-btn" style="left:12px;right:auto;pointer-events:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6.29 6.29l1.61-1.61a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Operating Hours</div>
          <div class="settings-section-sub">Service availability hours</div>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Hours of Operation</label>
        <input type="text" class="form-input" id="sHours" value="${s.hours}" />
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

      <div class="maintenance-alert ${s.maintenance ? "active" : "normal"}" id="maintenanceAlert">
        <div class="maintenance-alert-text">
          <strong id="maintenanceStatus">${s.maintenance ? "⚠ Maintenance Mode Active" : "System Operating Normally"}</strong>
          <span id="maintenanceSubStatus">${s.maintenance ? "Students cannot access the system" : "System is available to all users"}</span>
        </div>
        <button class="btn btn-sm ${s.maintenance ? "btn-danger" : "btn-ghost"}" id="maintenanceToggleBtn">
          ${s.maintenance ? "Disable" : "Enable"}
        </button>
      </div>

      <div id="maintenanceMsgWrap" style="${s.maintenance ? "" : "display:none"}">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Maintenance Message</label>
          <textarea class="form-input" id="sMaintenanceMsg" rows="2" style="resize:vertical">${s.maintenanceMsg}</textarea>
        </div>
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
      s.maintenance = !s.maintenance;
      const alert = document.getElementById("maintenanceAlert");
      const statusEl = document.getElementById("maintenanceStatus");
      const subStatusEl = document.getElementById("maintenanceSubStatus");
      const btn = document.getElementById("maintenanceToggleBtn");
      const msgWrap = document.getElementById("maintenanceMsgWrap");

      if (s.maintenance) {
        alert.className = "maintenance-alert active";
        statusEl.textContent = "⚠ Maintenance Mode Active";
        subStatusEl.textContent = "Students cannot access the system";
        btn.className = "btn btn-sm btn-danger";
        btn.textContent = "Disable";
        msgWrap.style.display = "";
        msgWrap.style.marginTop = "16px";
      } else {
        alert.className = "maintenance-alert normal";
        statusEl.textContent = "System Operating Normally";
        subStatusEl.textContent = "System is available to all users";
        btn.className = "btn btn-sm btn-ghost";
        btn.textContent = "Enable";
        msgWrap.style.display = "none";
      }
    });

  document.getElementById("saveSettings").addEventListener("click", () => {
    s.institution = document.getElementById("sInstitution").value;
    s.address = document.getElementById("sAddress").value;
    s.email = document.getElementById("sEmail").value;
    s.phone = document.getElementById("sPhone").value;
    s.hours = document.getElementById("sHours").value;
    const msgEl = document.getElementById("sMaintenanceMsg");
    if (msgEl) s.maintenanceMsg = msgEl.value;
    persistState();
    showToast("System settings saved!");
  });
})();
