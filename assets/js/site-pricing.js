(function (global) {
  const STORAGE_KEY = "upressease_state";
  const PUBLIC_PRICING_KEY = "upressease_public_pricing";

  const defaultPricing = {
    printing: {
      shortBw: 3,
      shortColor: 5,
      a4Bw: 3,
      a4Color: 5,
      a3Bw: 3,
      a3Color: 5,
      longBw: 3,
      longColor: 5,
      legalBw: 3,
      legalColor: 5,
      customBw: 3,
      customColor: 5,
      surcharge: 15,
    },
    binding: {
      softBind: 50,
      hardBind: 350,
      ringBind: 45,
      spiralBind: 55,
    },
    idAccessories: {
      newId: 150,
      lostId: 300,
      damagedId: 200,
      renewalId: 180,
    },
    lanyards: {
      official: 120,
      department: 150,
      custom: 200,
    },
    mugs: {
      wmsuLogo: 200,
      department: 220,
      photo: 250,
      largeSizeAddon: 30,
    },
  };

  const landingCellMap = [
    ["landing-print-short-bw", ["printing", "shortBw"]],
    ["landing-print-short-color", ["printing", "shortColor"]],
    ["landing-print-a4-bw", ["printing", "a4Bw"]],
    ["landing-print-a4-color", ["printing", "a4Color"]],
    ["landing-print-long-bw", ["printing", "longBw"]],
    ["landing-print-long-color", ["printing", "longColor"]],
    ["landing-print-legal-bw", ["printing", "legalBw"]],
    ["landing-print-legal-color", ["printing", "legalColor"]],
    ["landing-bind-soft", ["binding", "softBind"]],
    ["landing-bind-hard", ["binding", "hardBind"]],
    ["landing-bind-ring", ["binding", "ringBind"]],
    ["landing-bind-spiral", ["binding", "spiralBind"]],
    ["landing-id-new", ["idAccessories", "newId"]],
    ["landing-id-lost", ["idAccessories", "lostId"]],
    ["landing-id-damaged", ["idAccessories", "damagedId"]],
    ["landing-id-renewal", ["idAccessories", "renewalId"]],
    ["landing-lanyard-official", ["lanyards", "official"]],
    ["landing-lanyard-dept", ["lanyards", "department"]],
    ["landing-lanyard-custom", ["lanyards", "custom"]],
    ["landing-mug-wmsu", ["mugs", "wmsuLogo"]],
    ["landing-mug-dept", ["mugs", "department"]],
    ["landing-mug-photo", ["mugs", "photo"]],
    ["landing-mug-large", ["mugs", "largeSizeAddon"]],
  ];

  function getDefaultPricing() {
    return JSON.parse(JSON.stringify(defaultPricing));
  }

  function deepMergeNumbers(base, patch) {
    const out = JSON.parse(JSON.stringify(base));
    if (!patch || typeof patch !== "object") return out;
    for (const k of Object.keys(patch)) {
      const pv = patch[k];
      const bv = out[k];
      if (pv !== null && typeof pv === "object" && !Array.isArray(pv) && typeof bv === "object") {
        out[k] = deepMergeNumbers(bv, pv);
      } else if (typeof pv === "number" && !Number.isNaN(pv)) {
        out[k] = pv;
      }
    }
    return out;
  }

  function stripLegacyPricingKeys(p) {
    if (!p || typeof p !== "object") return p;
    delete p.bw;
    delete p.color;
    delete p.surcharge;
    return p;
  }

  function migrateLegacySplitFields(p) {
    if (!p || typeof p !== "object") return p;
    if (p.idAccessories && typeof p.idAccessories === "object") {
      if (typeof p.idAccessories.lanyard === "number") {
        if (!p.lanyards || typeof p.lanyards !== "object") p.lanyards = getDefaultPricing().lanyards;
        p.lanyards.official = p.idAccessories.lanyard;
        delete p.idAccessories.lanyard;
      }
      if (typeof p.idAccessories.customMug === "number") {
        if (!p.mugs || typeof p.mugs !== "object") p.mugs = getDefaultPricing().mugs;
        p.mugs.photo = p.idAccessories.customMug;
        delete p.idAccessories.customMug;
      }
    }
    return p;
  }

  function migrateLegacyDefaultPrinting(p) {
    if (!p || !p.printing) return p;
    const pr = p.printing;
    const looksLikeOldDefaults =
      pr.shortBw === 2 &&
      pr.shortColor === 10 &&
      pr.a4Bw === 3 &&
      pr.a4Color === 15 &&
      pr.surcharge === 5;
    if (!looksLikeOldDefaults) return p;
    const d = getDefaultPricing().printing;
    p.printing = deepMergeNumbers(d, {
      a3Bw: pr.a3Bw,
      a3Color: pr.a3Color,
      customBw: pr.customBw,
      customColor: pr.customColor,
    });
    return p;
  }

  function normalizePricing(raw) {
    const d = getDefaultPricing();
    let merged;
    if (!raw || typeof raw !== "object") merged = d;
    else if (raw.printing && typeof raw.printing === "object") {
      merged = stripLegacyPricingKeys(deepMergeNumbers(d, raw));
    } else if (typeof raw.bw === "number") {
      merged = getDefaultPricing();
      merged.printing.a4Bw = raw.bw;
      const addon = typeof raw.color === "number" ? raw.color : 0;
      merged.printing.a4Color = raw.bw + addon;
      if (typeof raw.surcharge === "number") merged.printing.surcharge = raw.surcharge;
    } else merged = stripLegacyPricingKeys(deepMergeNumbers(d, raw));
    merged = migrateLegacySplitFields(merged);
    merged = migrateLegacyDefaultPrinting(merged);
    return deepMergeNumbers(getDefaultPricing(), merged);
  }

  function getByPath(obj, path) {
    let cur = obj;
    for (let i = 0; i < path.length; i++) {
      if (cur == null) return undefined;
      cur = cur[path[i]];
    }
    return cur;
  }

  function setByPath(obj, path, value) {
    let cur = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i];
      if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    }
    cur[path[path.length - 1]] = value;
  }

  function formatLandingPeso(n) {
    const v = Number(n);
    const x = Number.isFinite(v) ? v : 0;
    return "P" + x.toFixed(2);
  }

  function mirrorPublicPricing(pricing) {
    try {
      localStorage.setItem(PUBLIC_PRICING_KEY, JSON.stringify(normalizePricing(pricing)));
    } catch (_) {}
  }

  function readPricingFromSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.pricing) return normalizePricing(o.pricing);
      }
    } catch (_) {}
    try {
      const raw2 = localStorage.getItem(PUBLIC_PRICING_KEY);
      if (raw2) return normalizePricing(JSON.parse(raw2));
    } catch (_) {}
    return normalizePricing(null);
  }

  function applyLandingPricing() {
    const p = readPricingFromSession();
    for (let i = 0; i < landingCellMap.length; i++) {
      const id = landingCellMap[i][0];
      const path = landingCellMap[i][1];
      const el = document.getElementById(id);
      if (!el) continue;
      const val = getByPath(p, path);
      el.textContent = formatLandingPeso(val);
    }
  }

  function compactPesoInput(path, value) {
    const pathStr = path.join(".");
    const v = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    return `<div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="${pathStr}" value="${v.toFixed(2)}" step="0.5" min="0" /></div>`;
  }

  function miniField(label, path, p) {
    return `<div class="pricing-mini-field"><span class="pricing-mini-label">${label}</span>${compactPesoInput(path, getByPath(p, path))}</div>`;
  }

  function editorCard(iconClass, title, sub, body) {
    return `
    <div class="settings-section settings-section--dense">
      <div class="settings-section-header settings-section-header--dense">
        <div class="settings-section-icon ${iconClass}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <div class="settings-section-title">${title}</div>
          <div class="settings-section-sub">${sub}</div>
        </div>
      </div>
      ${body}
    </div>`;
  }

  function buildPricingSettingsHTML(pricing) {
    const p = normalizePricing(pricing);
    const printSpec = [
      ["Short", ["printing", "shortBw"], ["printing", "shortColor"]],
      ["A4", ["printing", "a4Bw"], ["printing", "a4Color"]],
      ["A3", ["printing", "a3Bw"], ["printing", "a3Color"]],
      ["Long", ["printing", "longBw"], ["printing", "longColor"]],
      ["Legal", ["printing", "legalBw"], ["printing", "legalColor"]],
      ["Custom", ["printing", "customBw"], ["printing", "customColor"]],
    ];
    const printingBody = `
      <div class="pricing-print-table" role="group" aria-label="Printing per page">
        <div class="pricing-print-row pricing-print-row--head">
          <span>Size</span><span>B&amp;W</span><span>Color</span>
        </div>
        ${printSpec
          .map(
            ([label, bwPath, cPath]) => `
        <div class="pricing-print-row">
          <span class="pricing-print-size">${label}</span>
          ${compactPesoInput(bwPath, getByPath(p, bwPath))}
          ${compactPesoInput(cPath, getByPath(p, cPath))}
        </div>`,
          )
          .join("")}
      </div>
      <div class="pricing-surcharge-row">
        <span class="pricing-surcharge-label">Large image surcharge</span>
        ${compactPesoInput(["printing", "surcharge"], getByPath(p, ["printing", "surcharge"]))}
      </div>`;

    const bindPairs = [
      ["Soft", ["binding", "softBind"]],
      ["Hard", ["binding", "hardBind"]],
      ["Ring", ["binding", "ringBind"]],
      ["Spiral", ["binding", "spiralBind"]],
    ];
    const bindingBody = `<div class="pricing-mini-grid">${bindPairs.map(([lbl, path]) => miniField(lbl, path, p)).join("")}</div>`;

    const idPairs = [
      ["New ID", ["idAccessories", "newId"]],
      ["Lost ID", ["idAccessories", "lostId"]],
      ["Damaged", ["idAccessories", "damagedId"]],
      ["Renewal", ["idAccessories", "renewalId"]],
    ];
    const idBody = `<div class="pricing-mini-grid pricing-mini-grid--wide">${idPairs.map(([lbl, path]) => miniField(lbl, path, p)).join("")}</div>`;

    const lanyardPairs = [
      ["Official", ["lanyards", "official"]],
      ["Department", ["lanyards", "department"]],
      ["Custom", ["lanyards", "custom"]],
    ];
    const lanyardBody = `<div class="pricing-mini-grid pricing-mini-grid--3">${lanyardPairs.map(([lbl, path]) => miniField(lbl, path, p)).join("")}</div>`;

    const mugPairs = [
      ["WMSU logo", ["mugs", "wmsuLogo"]],
      ["Department", ["mugs", "department"]],
      ["Photo print", ["mugs", "photo"]],
      ["15oz add-on", ["mugs", "largeSizeAddon"]],
    ];
    const mugBody = `<div class="pricing-mini-grid pricing-mini-grid--wide">${mugPairs.map(([lbl, path]) => miniField(lbl, path, p)).join("")}</div>`;

    const summaryInner = `
      <div class="summary-title">Quick reference</div>
      <div class="summary-row">
        <span class="summary-key">A4 B&amp;W</span>
        <span class="summary-val" id="sumA4Bw">₱${getByPath(p, ["printing", "a4Bw"]).toFixed(2)} /page</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">A4 color</span>
        <span class="summary-val" id="sumA4Color">₱${getByPath(p, ["printing", "a4Color"]).toFixed(2)} /page</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Surcharge</span>
        <span class="summary-val" id="sumSurcharge">+₱${getByPath(p, ["printing", "surcharge"]).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Spiral</span>
        <span class="summary-val" id="sumSpiral">₱${getByPath(p, ["binding", "spiralBind"]).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">New ID</span>
        <span class="summary-val" id="sumNewId">₱${getByPath(p, ["idAccessories", "newId"]).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Lanyard official</span>
        <span class="summary-val" id="sumLanOff">₱${getByPath(p, ["lanyards", "official"]).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-key">Mug WMSU</span>
        <span class="summary-val" id="sumMugWmsu">₱${getByPath(p, ["mugs", "wmsuLogo"]).toFixed(2)}</span>
      </div>`;

    return `
    <div class="pricing-editor">
      <div class="pricing-editor__head page-header">
        <h1 class="page-title">Pricing Settings</h1>
        <p class="page-sub">These amounts appear on the public landing page after you save.</p>
      </div>
      <div class="pricing-editor__layout">
        <div class="pricing-editor__main">
          ${editorCard("blue", "Printing", "Per page by paper size, plus surcharge", printingBody)}
          <div class="pricing-editor__pair">
            ${editorCard("purple", "Binding", "Flat fee per type", bindingBody)}
            ${editorCard("orange", "ID printing", "New, lost, damaged, renewal", idBody)}
          </div>
          <div class="pricing-editor__pair">
            ${editorCard("green", "Lanyards", "Official, department, custom (per piece)", lanyardBody)}
            ${editorCard("yellow", "Mug printing", "Per piece; large add-on is extra on 15oz", mugBody)}
          </div>
        </div>
        <aside class="pricing-editor__aside" aria-label="Summary">
          <div class="summary-block summary-block--compact" id="pricingSummary">
            ${summaryInner}
          </div>
        </aside>
      </div>
      <div class="sticky-save">
        <button type="button" class="btn btn-primary" id="savePricing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Changes
        </button>
      </div>
    </div>`;
  }

  function collectPricingFromForm(root) {
    const out = getDefaultPricing();
    root.querySelectorAll("[data-pricing-path]").forEach((inp) => {
      const pathStr = inp.getAttribute("data-pricing-path");
      if (!pathStr) return;
      const path = pathStr.split(".");
      setByPath(out, path, parseFloat(inp.value) || 0);
    });
    return out;
  }

  function updatePricingSummary(root) {
    const p = collectPricingFromForm(root);
    const set = (id, text) => {
      const el = root.querySelector("#" + id);
      if (el) el.textContent = text;
    };
    set("sumA4Bw", "₱" + getByPath(p, ["printing", "a4Bw"]).toFixed(2) + " /page");
    set("sumA4Color", "₱" + getByPath(p, ["printing", "a4Color"]).toFixed(2) + " /page");
    set("sumSurcharge", "+₱" + getByPath(p, ["printing", "surcharge"]).toFixed(2));
    set("sumSpiral", "₱" + getByPath(p, ["binding", "spiralBind"]).toFixed(2));
    set("sumNewId", "₱" + getByPath(p, ["idAccessories", "newId"]).toFixed(2));
    set("sumLanOff", "₱" + getByPath(p, ["lanyards", "official"]).toFixed(2));
    set("sumMugWmsu", "₱" + getByPath(p, ["mugs", "wmsuLogo"]).toFixed(2));
  }

  function bindPricingSettingsForm(root, opts) {
    const setPricing = opts.setPricing;
    const persist = opts.persist;
    const showToast = opts.showToast;

    root.querySelectorAll("[data-pricing-path]").forEach((inp) => {
      inp.addEventListener("input", () => updatePricingSummary(root));
    });

    const saveBtn = root.querySelector("#savePricing");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const next = collectPricingFromForm(root);
        setPricing(next);
        if (typeof persist === "function") persist();
        if (typeof showToast === "function") showToast("Pricing settings saved!");
      });
    }
  }

  global.UPressPricing = {
    STORAGE_KEY,
    PUBLIC_PRICING_KEY,
    getDefaultPricing,
    normalizePricing,
    mirrorPublicPricing,
    readPricingFromSession,
    applyLandingPricing,
    buildPricingSettingsHTML,
    bindPricingSettingsForm,
    collectPricingFromForm,
    formatLandingPeso,
    getByPath,
  };
})(typeof window !== "undefined" ? window : globalThis);
