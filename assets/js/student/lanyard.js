let _lanyardType = "wmsu",
  _lanyardTypeName = "WMSU Official",
  _lanyardPrice = 120;

function getLanyardPrices() {
  const def = { official: 120, department: 150, custom: 200 };
  if (typeof window.UPressPricing === "undefined" || !UPressPricing.readPricingFromSession) {
    return def;
  }
  const p = UPressPricing.readPricingFromSession();
  const l = p && p.lanyards ? p.lanyards : {};
  return {
    official: typeof l.official === "number" ? l.official : def.official,
    department: typeof l.department === "number" ? l.department : def.department,
    custom: typeof l.custom === "number" ? l.custom : def.custom,
  };
}

function syncLanyardOptionLabels() {
  const pr = getLanyardPrices();
  const w = document.getElementById("lanyard-opt-price-wmsu");
  const d = document.getElementById("lanyard-opt-price-dept");
  const c = document.getElementById("lanyard-opt-price-custom");
  if (w) w.textContent = "₱" + pr.official;
  if (d) d.textContent = "₱" + pr.department;
  if (c) c.textContent = "₱" + pr.custom;
}

function selectLanyardType(type, el) {
  document.querySelectorAll("#lanyard-page .option").forEach((o) => o.classList.remove("active"));
  el.classList.add("active");
  _lanyardType = type;
  const deptField = document.getElementById("lanyard-dept-field");
  if (deptField) deptField.classList.add("hidden");
  const pr = getLanyardPrices();
  if (type === "wmsu") {
    _lanyardPrice = pr.official;
    _lanyardTypeName = "WMSU Official";
  }
  if (type === "department") {
    _lanyardPrice = pr.department;
    _lanyardTypeName = "Department Lanyard";
    deptField?.classList.remove("hidden");
  }
  if (type === "custom") {
    _lanyardPrice = pr.custom;
    _lanyardTypeName = "Custom Design";
  }
  buildLanyardCustomForms();
  updateLanyardSummary();
}

function onLanyardQtyChange() {
  buildLanyardCustomForms();
  updateLanyardSummary();
}

function buildLanyardCustomForms() {
  const container = document.getElementById("lanyard-custom-forms");
  if (!container) return;
  container.innerHTML = "";
  if (_lanyardType !== "custom") return;
  const qty = Math.max(1, parseInt(document.getElementById("lanyard-qty")?.value) || 1);
  for (let i = 1; i <= qty; i++) {
    container.innerHTML += `
        <div style="border:1px solid #e0e0e0;border-radius:0.75rem;padding:1.25rem;margin-bottom:1rem;">
            <div style="font-weight:700;color:#8B0000;margin-bottom:0.75rem;">Design ${i} of ${qty}</div>
            <div class="grid-2">
                <div class="field"><label class="label">Length (cm)</label><input class="input" type="number" id="lanyard-len-${i}" placeholder="e.g. 90" min="1"></div>
                <div class="field"><label class="label">Width (cm)</label><input class="input" type="number" id="lanyard-wid-${i}" placeholder="e.g. 2" min="1"></div>
            </div>
            <div class="field">
                <label class="label">Upload Design File</label>
                <label class="dropzone" style="padding:1.25rem;cursor:pointer;">
                    <input type="file" style="display:none;" id="lanyard-file-${i}" accept="image/*,.pdf">
                    <div style="display:flex;justify-content:center;"><span class="upress-icon upress-icon--palette upress-icon--md" style="color:#8B0000" aria-hidden="true"></span></div>
                    <div style="color:#a32020;font-weight:700;font-size:0.875rem;">Click to upload design ${i}</div>
                    <div style="color:#999;font-size:0.75rem;">PNG, JPG, PDF (MAX. 20MB)</div>
                </label>
                <div id="lanyard-fname-${i}" style="display:none;font-size:0.8125rem;color:#555;margin-top:0.5rem;"></div>
            </div>
            <div class="field"><label class="label">Special Notes (optional)</label><input class="input" type="text" id="lanyard-note-${i}" placeholder="Any special instructions..."></div>
        </div>`;
  }
  for (let i = 1; i <= qty; i++) {
    const f = document.getElementById(`lanyard-file-${i}`);
    if (f)
      f.addEventListener(
        "change",
        (function (idx) {
          return function () {
            const d = document.getElementById(`lanyard-fname-${idx}`);
            if (d && this.files[0]) {
              d.innerHTML = '<span class="upress-icon upress-icon--clip" aria-hidden="true"></span> ' + escHtml(this.files[0].name);
              d.style.display = "block";
            }
          };
        })(i),
      );
  }
}

function updateLanyardSummary() {
  const qty = Math.max(1, parseInt(document.getElementById("lanyard-qty")?.value) || 1);
  setText("lanyard-sum-type", _lanyardTypeName);
  setText("lanyard-sum-unit", "₱" + _lanyardPrice.toFixed(2));
  setText("lanyard-sum-qty", qty);
  setText("lanyard-sum-total", "₱" + (_lanyardPrice * qty).toFixed(2));
}

function validateLanyard() {
  const qty = Math.max(1, parseInt(document.getElementById("lanyard-qty")?.value) || 1);
  if (_lanyardType === "department" && !document.getElementById("lanyard-dept-select")?.value) {
    showAlert("Missing Info", "Please select a department.");
    return false;
  }
  if (_lanyardType === "custom") {
    for (let i = 1; i <= qty; i++) {
      if (!document.getElementById(`lanyard-len-${i}`)?.value || !document.getElementById(`lanyard-wid-${i}`)?.value) {
        showAlert("Missing Info", `Please fill in dimensions for Design ${i}.`);
        return false;
      }
    }
  }
  return true;
}

function getLanyardOrderData() {
  const qty = Math.max(1, parseInt(document.getElementById("lanyard-qty")?.value) || 1);
  const dept = _lanyardType === "department" ? document.getElementById("lanyard-dept-select")?.value : null;
  return {
    service: "Lanyards",
    desc: `${qty} × ${_lanyardTypeName}${dept ? " (" + dept + ")" : ""}`,
    qty,
    total: (_lanyardPrice * qty).toFixed(2),
    department: dept,
  };
}

function lanyardOrderNow() {
  if (!validateLanyard()) return;
  showConfirm("Proceed to Checkout", "Place this lanyard order and proceed to checkout?", () => {
    const data = getLanyardOrderData();
    Cart.clear();
    Cart.add(data);
    window.location.href = "payment.html";
  });
}

function lanyardAddToCart() {
  if (!validateLanyard()) return;
  Cart.add(getLanyardOrderData());
  showAlert("Added to Cart", `${_lanyardTypeName} × ${document.getElementById("lanyard-qty")?.value || 1} added to your cart.`);
}

const _lanInit = getLanyardPrices();
_lanyardPrice = _lanInit.official;
syncLanyardOptionLabels();
updateLanyardSummary();
