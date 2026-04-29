/* ============================================================
   UPRESSease Admin Portal – Policies Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");
  const pol = state.policies;

  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Policies</h1>
      <p class="page-sub">Configure system policies and discount settings</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
        </div>
        <div>
          <div class="settings-section-title">QR Code Pickup System</div>
          <div class="settings-section-sub">Enable or disable QR code scanning for order pickup verification</div>
        </div>
      </div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-label">QR Code Feature</div>
          <div class="toggle-desc" id="qrDesc">${pol.qrCode ? "QR codes are required for order pickup" : "QR code feature is disabled"}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="qrToggle" ${pol.qrCode ? "checked" : ""} />
          <span class="toggle-track"></span>
        </label>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Time-Based Discounts</div>
          <div class="settings-section-sub">Set up automatic discounts for specific time periods</div>
        </div>
      </div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-label">Enable Discounts</div>
          <div class="toggle-desc" id="discountDesc">${pol.discounts ? "Discount feature is active" : "Discount feature is disabled"}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="discountToggle" ${pol.discounts ? "checked" : ""} />
          <span class="toggle-track"></span>
        </label>
      </div>
    </div>

    <div class="summary-block">
      <div class="summary-title">Policy Summary</div>
      <div class="summary-row">
        <span class="summary-key">QR Code Pickup:</span>
        <span class="summary-val ${pol.qrCode ? "enabled" : "disabled"}" id="sumQR">
          ${pol.qrCode ? "✓ Enabled" : "✗ Inactive"}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Discount System:</span>
        <span class="summary-val ${pol.discounts ? "enabled" : "disabled"}" id="sumDiscount">
          ${pol.discounts ? "✓ Enabled" : "✗ Inactive"}
        </span>
      </div>
    </div>

    <div class="sticky-save">
      <button class="btn btn-primary" id="savePolicies">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Changes
      </button>
    </div>
  `;

  document.getElementById("qrToggle").addEventListener("change", (e) => {
    pol.qrCode = e.target.checked;
    document.getElementById("qrDesc").textContent = pol.qrCode
      ? "QR codes are required for order pickup"
      : "QR code feature is disabled";
    const el = document.getElementById("sumQR");
    el.textContent = pol.qrCode ? "✓ Enabled" : "✗ Inactive";
    el.className = `summary-val ${pol.qrCode ? "enabled" : "disabled"}`;
  });

  document.getElementById("discountToggle").addEventListener("change", (e) => {
    pol.discounts = e.target.checked;
    document.getElementById("discountDesc").textContent = pol.discounts
      ? "Discount feature is active"
      : "Discount feature is disabled";
    const el = document.getElementById("sumDiscount");
    el.textContent = pol.discounts ? "✓ Enabled" : "✗ Inactive";
    el.className = `summary-val ${pol.discounts ? "enabled" : "disabled"}`;
  });

  document.getElementById("savePolicies").addEventListener("click", () => {
    persistState();
    showToast("Policy settings saved!");
  });
})();
