(function () {
  // Wait for storage.js to load
  function init() {
    if (typeof getDB === "undefined") {
      setTimeout(init, 10);
      return;
    }

    const db = getDB();
    const pageContainer = document.getElementById("pageContainer");

    function ensureSettingsDefaults() {
      if (!db.systemSettings || typeof db.systemSettings !== "object") {
        db.systemSettings = {};
      }
      if (typeof db.systemSettings.maintenanceMode !== "boolean") {
        db.systemSettings.maintenanceMode = false;
      }
      if (!Array.isArray(db.systemSettings.customRoles)) {
        db.systemSettings.customRoles = [];
      }
      if (
        !db.systemSettings.features ||
        typeof db.systemSettings.features !== "object"
      ) {
        db.systemSettings.features = {};
      }
      const f = db.systemSettings.features;
      if (typeof f.requireStudentVerification !== "boolean")
        f.requireStudentVerification = true;
      if (typeof f.allowWalkInSales !== "boolean") f.allowWalkInSales = true;
      if (typeof f.allowOnlinePayments !== "boolean")
        f.allowOnlinePayments = true;
      if (typeof f.enableRatings !== "boolean") f.enableRatings = true;
    }

    /** Consecutive school years "YYYY-(YYYY+1)", e.g. 2025-2026 */
    function schoolYearOptions(selected) {
      const y = new Date().getFullYear();
      const back = 12;
      const ahead = 6;
      const labels = [];
      for (let start = y - back; start <= y + ahead; start++) {
        labels.push(`${start}-${start + 1}`);
      }
      if (selected && !labels.includes(selected)) {
        labels.unshift(selected);
      }
      return labels
        .map((label) => {
          const sel = label === selected ? " selected" : "";
          return `<option value="${label}"${sel}>${label}</option>`;
        })
        .join("");
    }

    function escHtml(s) {
      return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function slugRoleKey(label) {
      return String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 32);
    }

    ensureSettingsDefaults();

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
        <label class="form-label" for="academicYear">Academic Year <span class="required">*</span></label>
        <select class="form-input" id="academicYear" required>
          <option value="">Select school year…</option>
          ${schoolYearOptions(db.academicYear || "")}
        </select>
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
          School years run as two consecutive calendar years (e.g. 2025–2026). Required for dashboards, users, and services.
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Roles &amp; Access</div>
          <div class="settings-section-sub">Add custom roles you can assign to users</div>
        </div>
      </div>

      <div class="role-form">
        <div class="form-group">
          <label class="form-label" for="roleLabel">Role name <span class="required">*</span></label>
          <input class="form-input" id="roleLabel" type="text" placeholder="e.g. Finance Officer" />
        </div>
        <div class="form-group">
          <label class="form-label" for="roleKey">Role key</label>
          <input class="form-input" id="roleKey" type="text" placeholder="e.g. finance_officer" />
          <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
            Used internally for filtering/permissions later. Auto-generated from role name if left blank.
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="roleDesc">Description</label>
          <input class="form-input" id="roleDesc" type="text" placeholder="Optional description" />
        </div>
        <div class="role-actions">
          <button class="btn btn-ghost btn-sm" id="roleClearBtn" type="button">Clear</button>
          <button class="btn btn-primary btn-sm" id="roleAddBtn" type="button">Add role</button>
        </div>
      </div>

      <div class="role-list-head">
        <strong>Custom roles</strong>
        <span class="role-count">${db.systemSettings.customRoles.length} role(s)</span>
      </div>
      <div id="roleList" class="role-list"></div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </div>
        <div>
          <div class="settings-section-title">System Configuration</div>
          <div class="settings-section-sub">Toggle optional behaviors across portals</div>
        </div>
      </div>

      <div class="toggle-list">
        <label class="toggle-row">
          <input type="checkbox" id="cfgRequireVerification" ${db.systemSettings.features.requireStudentVerification ? "checked" : ""} />
          <span class="toggle-text">
            <strong>Require student verification</strong>
            <span>Students must be approved before ordering.</span>
          </span>
        </label>
        <label class="toggle-row">
          <input type="checkbox" id="cfgAllowOnlinePayments" ${db.systemSettings.features.allowOnlinePayments ? "checked" : ""} />
          <span class="toggle-text">
            <strong>Allow online payments</strong>
            <span>Enable “Online Payment” options in order flows.</span>
          </span>
        </label>
        <label class="toggle-row">
          <input type="checkbox" id="cfgAllowWalkInSales" ${db.systemSettings.features.allowWalkInSales ? "checked" : ""} />
          <span class="toggle-text">
            <strong>Allow walk-in sales</strong>
            <span>Enable walk-in sales features in the staff portal.</span>
          </span>
        </label>
        <label class="toggle-row">
          <input type="checkbox" id="cfgEnableRatings" ${db.systemSettings.features.enableRatings ? "checked" : ""} />
          <span class="toggle-text">
            <strong>Enable ratings</strong>
            <span>Show service ratings and collect feedback.</span>
          </span>
        </label>
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

    function renderRoleList() {
      const list = document.getElementById("roleList");
      if (!list) return;
      const roles = db.systemSettings.customRoles || [];
      if (roles.length === 0) {
        list.innerHTML = `<div class="role-empty">No custom roles yet.</div>`;
        return;
      }
      list.innerHTML = roles
        .slice()
        .sort((a, b) => String(a.label).localeCompare(String(b.label)))
        .map(
          (r) => `
        <div class="role-item">
          <div class="role-main">
            <div class="role-label">${escHtml(r.label)}</div>
            <div class="role-meta">
              <span class="role-key">@${escHtml(r.key)}</span>
              ${r.description ? `<span class="role-desc">${escHtml(r.description)}</span>` : ""}
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm role-remove" data-key="${escHtml(r.key)}">Remove</button>
        </div>
      `,
        )
        .join("");

      list.querySelectorAll(".role-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-key");
          db.systemSettings.customRoles = (
            db.systemSettings.customRoles || []
          ).filter((r) => r.key !== key);
          saveDB(db);
          renderRoleList();
          showToast("Role removed.");
        });
      });
    }

    function clearRoleForm() {
      document.getElementById("roleLabel").value = "";
      document.getElementById("roleKey").value = "";
      document.getElementById("roleDesc").value = "";
    }

    document
      .getElementById("roleClearBtn")
      ?.addEventListener("click", clearRoleForm);
    document.getElementById("roleLabel")?.addEventListener("input", (e) => {
      const label = e.target.value;
      const keyEl = document.getElementById("roleKey");
      if (!keyEl.value.trim()) {
        keyEl.value = slugRoleKey(label);
      }
    });
    document.getElementById("roleAddBtn")?.addEventListener("click", () => {
      const label = document.getElementById("roleLabel").value.trim();
      const keyRaw = document.getElementById("roleKey").value.trim();
      const description = document.getElementById("roleDesc").value.trim();
      if (!label) {
        showToast("Role name is required.");
        return;
      }
      const key = keyRaw ? slugRoleKey(keyRaw) : slugRoleKey(label);
      if (!key) {
        showToast("Role key is invalid.");
        return;
      }
      const existing = (db.systemSettings.customRoles || []).some(
        (r) => String(r.key).toLowerCase() === String(key).toLowerCase(),
      );
      if (existing) {
        showToast("That role key already exists.");
        return;
      }
      db.systemSettings.customRoles.push({
        key,
        label,
        description,
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      renderRoleList();
      clearRoleForm();
      showToast("Role added!");
    });

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
        showToast("Please select an academic year.");
        return;
      }
      if (!/^\d{4}-\d{4}$/.test(academicYear)) {
        showToast("Invalid academic year format.");
        return;
      }
      const parts = academicYear.split("-").map(Number);
      if (parts.length !== 2 || parts[1] !== parts[0] + 1) {
        showToast("School year must be consecutive years (e.g. 2025-2026).");
        return;
      }

      if (db.academicYear !== academicYear) {
        setAcademicYear(academicYear);
      } else {
        saveDB(db);
      }

      db.systemSettings.features.requireStudentVerification =
        !!document.getElementById("cfgRequireVerification")?.checked;
      db.systemSettings.features.allowOnlinePayments =
        !!document.getElementById("cfgAllowOnlinePayments")?.checked;
      db.systemSettings.features.allowWalkInSales = !!document.getElementById(
        "cfgAllowWalkInSales",
      )?.checked;
      db.systemSettings.features.enableRatings =
        !!document.getElementById("cfgEnableRatings")?.checked;

      saveDB(db);

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

    renderRoleList();
  }

  init();
})();
