let _mugType = "wmsu",
  _mugTypeName = "WMSU Logo Mug",
  _mugBasePrice = 200;

function getMugPrices() {
  const def = { wmsu: 200, department: 220, photo: 250, largeExtra: 30 };
  if (typeof window.UPressPricing === "undefined" || !UPressPricing.readPricingFromSession) {
    return def;
  }
  const p = UPressPricing.readPricingFromSession();
  const m = p && p.mugs ? p.mugs : {};
  return {
    wmsu: typeof m.wmsuLogo === "number" ? m.wmsuLogo : def.wmsu,
    department: typeof m.department === "number" ? m.department : def.department,
    photo: typeof m.photo === "number" ? m.photo : def.photo,
    largeExtra: typeof m.largeSizeAddon === "number" ? m.largeSizeAddon : def.largeExtra,
  };
}

function syncMugOptionLabels() {
  const pr = getMugPrices();
  const w = document.getElementById("mug-opt-price-wmsu");
  const d = document.getElementById("mug-opt-price-dept");
  const ph = document.getElementById("mug-opt-price-photo");
  if (w) w.textContent = "₱" + pr.wmsu;
  if (d) d.textContent = "₱" + pr.department;
  if (ph) ph.textContent = "₱" + pr.photo;
  const sizeEl = document.getElementById("mug-size");
  if (sizeEl) {
    const opt0 = sizeEl.querySelector('option[value="standard"]');
    const opt1 = sizeEl.querySelector('option[value="large"]');
    if (opt0) opt0.textContent = "Standard (11oz)";
    if (opt1) opt1.textContent = "Large (15oz) +₱" + pr.largeExtra;
  }
}

function selectMugType(type, el) {
  document.querySelectorAll("#mug-page .option").forEach((o) => o.classList.remove("active"));
  el.classList.add("active");
  _mugType = type;
  const deptField = document.getElementById("mug-dept-field");
  if (deptField) deptField.classList.add("hidden");
  const pr = getMugPrices();
  if (type === "wmsu") {
    _mugBasePrice = pr.wmsu;
    _mugTypeName = "WMSU Logo Mug";
  }
  if (type === "department") {
    _mugBasePrice = pr.department;
    _mugTypeName = "Department Mug";
    deptField?.classList.remove("hidden");
  }
  if (type === "photo") {
    _mugBasePrice = pr.photo;
    _mugTypeName = "Photo Print Mug";
  }
  buildMugPhotoForms();
  updateMugSummary();
}

function onMugQtyChange() {
  buildMugPhotoForms();
  updateMugSummary();
}

function buildMugPhotoForms() {
  const container = document.getElementById("mug-photo-forms");
  if (!container) return;
  container.innerHTML = "";
  if (_mugType !== "photo") return;
  const qty = Math.max(1, parseInt(document.getElementById("mug-qty")?.value) || 1);
  for (let i = 1; i <= qty; i++) {
    container.innerHTML += `
        <div style="border:1px solid #e0e0e0;border-radius:0.75rem;padding:1.25rem;margin-bottom:1rem;">
            <div style="font-weight:700;color:#8B0000;margin-bottom:0.75rem;">Mug ${i} of ${qty} — Upload Photo</div>
            <label class="dropzone" style="padding:1.25rem;cursor:pointer;">
                <input type="file" style="display:none;" id="mug-photo-${i}" accept="image/*">
                <div style="display:flex;justify-content:center;"><span class="upress-icon upress-icon--image upress-icon--lg" style="color:#8B0000" aria-hidden="true"></span></div>
                <div style="color:#a32020;font-weight:700;font-size:0.875rem;">Click to upload photo for Mug ${i}</div>
                <div style="color:#999;font-size:0.75rem;">PNG, JPG (MAX. 20MB)</div>
            </label>
            <div id="mug-file-${i}" style="display:none;font-size:0.8125rem;color:#555;margin-top:0.5rem;"></div>
            <div class="field" style="margin-top:0.75rem;margin-bottom:0;">
                <label class="label">Caption/Text (optional)</label>
                <input class="input" type="text" id="mug-caption-${i}" placeholder="e.g. John's Mug, Class 2025...">
            </div>
        </div>`;
  }
  for (let i = 1; i <= qty; i++) {
    const f = document.getElementById(`mug-photo-${i}`);
    if (f)
      f.addEventListener(
        "change",
        (function (idx) {
          return function () {
            const d = document.getElementById(`mug-file-${idx}`);
            if (d && this.files[0]) {
              d.innerHTML = '<span class="upress-icon upress-icon--clip" aria-hidden="true"></span> ' + escHtml(this.files[0].name);
              d.style.display = "block";
            }
          };
        })(i),
      );
  }
}

function updateMugSummary() {
  const qty = Math.max(1, parseInt(document.getElementById("mug-qty")?.value) || 1);
  const sizeEl = document.getElementById("mug-size");
  const pr = getMugPrices();
  const sizeExtra = sizeEl?.value === "large" ? pr.largeExtra : 0;
  const sizeLabel = sizeEl?.options[sizeEl.selectedIndex]?.text.split(" +")[0] || "Standard (11oz)";
  const unit = _mugBasePrice + sizeExtra;
  setText("mug-sum-type", _mugTypeName);
  setText("mug-sum-size", sizeLabel);
  setText("mug-sum-unit", "₱" + unit.toFixed(2));
  setText("mug-sum-qty", qty);
  setText("mug-sum-total", "₱" + (unit * qty).toFixed(2));
}

function validateMug() {
  const qty = Math.max(1, parseInt(document.getElementById("mug-qty")?.value) || 1);
  if (_mugType === "department" && !document.getElementById("mug-dept-select")?.value) {
    showAlert("Missing Info", "Please select a department.");
    return false;
  }
  if (_mugType === "photo") {
    for (let i = 1; i <= qty; i++) {
      if (!document.getElementById(`mug-photo-${i}`)?.files[0]) {
        showAlert("Missing Photo", `Please upload a photo for Mug ${i}.`);
        return false;
      }
    }
  }
  return true;
}

function getMugOrderData() {
  const qty = Math.max(1, parseInt(document.getElementById("mug-qty")?.value) || 1);
  const sizeEl = document.getElementById("mug-size");
  const pr = getMugPrices();
  const unit = _mugBasePrice + (sizeEl?.value === "large" ? pr.largeExtra : 0);
  const dept = _mugType === "department" ? document.getElementById("mug-dept-select")?.value : null;
  const sizeLabel = sizeEl?.options[sizeEl.selectedIndex]?.text.split(" +")[0] || "Standard";
  return {
    service: "Mug Printing",
    desc: `${qty} × ${_mugTypeName}${dept ? " (" + dept + ")" : ""} (${sizeLabel})`,
    qty,
    total: (unit * qty).toFixed(2),
    department: dept,
  };
}

function mugOrderNow() {
  if (!validateMug()) return;
  showConfirm("Proceed to Checkout", "Place this mug order and proceed to checkout?", () => {
    const data = getMugOrderData();
    Cart.clear();
    Cart.add(data);
    window.location.href = "payment.html";
  });
}

function mugAddToCart() {
  if (!validateMug()) return;
  Cart.add(getMugOrderData());
  showAlert("Added to Cart", `${_mugTypeName} × ${document.getElementById("mug-qty")?.value || 1} added to your cart.`);
}

const _mugInit = getMugPrices();
_mugBasePrice = _mugInit.wmsu;
syncMugOptionLabels();
updateMugSummary();
