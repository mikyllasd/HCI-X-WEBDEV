/* ============================================================
   UPRESSease Admin Portal – Pricing Settings Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");
  const p = state.pricing;

  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Pricing Settings</h1>
      <p class="page-sub">Configure base prices and additional charges for printing services</p>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Base Price Per Page</div>
          <div class="settings-section-sub">Standard charge for black and white printing per page</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Price (₱)</label>
        <div class="price-input-wrap">
          <span class="price-currency">₱</span>
          <input type="number" class="form-input" id="priceBW" value="${p.bw.toFixed(2)}" step="0.50" min="0" />
        </div>
        <div class="form-help" id="helpBW">Current: ₱${p.bw.toFixed(2)} per page</div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Color Printing Charge</div>
          <div class="settings-section-sub">Additional charge for color printing (added to base price)</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Additional Price (₱)</label>
        <div class="price-input-wrap">
          <span class="price-currency">₱</span>
          <input type="number" class="form-input" id="priceColor" value="${p.color.toFixed(2)}" step="0.50" min="0" />
        </div>
        <div class="form-help" id="helpColor">Total color price: ₱${(p.bw + p.color).toFixed(2)} per page</div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <div>
          <div class="settings-section-title">Large Image Surcharge</div>
          <div class="settings-section-sub">Extra charge for documents containing large images or graphics</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Surcharge (₱)</label>
        <div class="price-input-wrap">
          <span class="price-currency">₱</span>
          <input type="number" class="form-input" id="priceSurcharge" value="${p.surcharge.toFixed(2)}" step="0.50" min="0" />
        </div>
        <div class="form-help">Applied when images exceed 30% of page content</div>
      </div>
    </div>

    <div class="summary-block" id="pricingSummary">
      <div class="summary-title">Pricing Summary</div>
      <div class="summary-row">
        <span class="summary-key">B&W Printing:</span>
        <span class="summary-val" id="sumBW">₱${p.bw.toFixed(2)} /page</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Color Printing:</span>
        <span class="summary-val" id="sumColor">₱${(p.bw + p.color).toFixed(2)} /page</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Large Image Surcharge:</span>
        <span class="summary-val" id="sumSurcharge">+₱${p.surcharge.toFixed(2)}</span>
      </div>
    </div>

    <div class="sticky-save">
      <button class="btn btn-primary" id="savePricing">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Changes
      </button>
    </div>
  `;

  function updateSummary() {
    const bw = parseFloat(document.getElementById("priceBW").value) || 0;
    const col = parseFloat(document.getElementById("priceColor").value) || 0;
    const sur =
      parseFloat(document.getElementById("priceSurcharge").value) || 0;
    document.getElementById("helpBW").textContent =
      `Current: ₱${bw.toFixed(2)} per page`;
    document.getElementById("helpColor").textContent =
      `Total color price: ₱${(bw + col).toFixed(2)} per page`;
    document.getElementById("sumBW").textContent = `₱${bw.toFixed(2)} /page`;
    document.getElementById("sumColor").textContent =
      `₱${(bw + col).toFixed(2)} /page`;
    document.getElementById("sumSurcharge").textContent = `+₱${sur.toFixed(2)}`;
  }

  ["priceBW", "priceColor", "priceSurcharge"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateSummary);
  });

  document.getElementById("savePricing").addEventListener("click", () => {
    state.pricing.bw =
      parseFloat(document.getElementById("priceBW").value) || 0;
    state.pricing.color =
      parseFloat(document.getElementById("priceColor").value) || 0;
    state.pricing.surcharge =
      parseFloat(document.getElementById("priceSurcharge").value) || 0;
    persistState();
    showToast("Pricing settings saved!");
  });
})();
