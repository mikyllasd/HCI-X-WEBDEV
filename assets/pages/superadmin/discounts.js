(function () {
  function init() {
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") {
      setTimeout(init, 10);
      return;
    }

    const page = {
      db: window.getDB(),
      editingId: null,
      q: "",
    };

    const els = {
      body: document.getElementById("discountsBody"),
      count: document.getElementById("discountCount"),
      search: document.getElementById("discountSearch"),
      addBtn: document.getElementById("addDiscountBtn"),
      modal: document.getElementById("discountModal"),
      modalTitle: document.getElementById("discountModalTitle"),
      modalSub: document.getElementById("discountModalSub"),
      close: document.getElementById("discountModalClose"),
      cancel: document.getElementById("discountCancel"),
      form: document.getElementById("discountForm"),
      code: document.getElementById("discCode"),
      name: document.getElementById("discName"),
      type: document.getElementById("discType"),
      value: document.getElementById("discValue"),
      min: document.getElementById("discMin"),
      max: document.getElementById("discMax"),
      start: document.getElementById("discStart"),
      end: document.getElementById("discEnd"),
      notes: document.getElementById("discNotes"),
      active: document.getElementById("discActive"),
    };

    function esc(s) {
      return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function money(n) {
      return "₱" + (Number(n) || 0).toFixed(2);
    }

    function normalizeCode(code) {
      return String(code || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
    }

    function readDiscounts() {
      const db = window.getDB();
      db.discounts = Array.isArray(db.discounts) ? db.discounts : [];
      return db;
    }

    function openModal({ title, sub, discount } = {}) {
      if (!els.modal) return;
      page.editingId = discount?.id || null;
      if (els.modalTitle) els.modalTitle.textContent = title || (page.editingId ? "Edit Discount" : "Add Discount");
      if (els.modalSub) els.modalSub.textContent = sub || "";

      els.code.value = discount?.code || "";
      els.name.value = discount?.name || "";
      els.type.value = discount?.type || "percent";
      els.value.value = discount?.value != null ? String(discount.value) : "";
      els.min.value = discount?.minAmount != null ? String(discount.minAmount) : "0";
      els.max.value = discount?.maxDiscount != null ? String(discount.maxDiscount) : "0";
      els.start.value = (discount?.startsAt || "").slice(0, 10);
      els.end.value = (discount?.endsAt || "").slice(0, 10);
      els.notes.value = discount?.notes || "";
      els.active.checked = discount?.active !== false;

      els.modal.classList.add("open");
      els.modal.setAttribute("aria-hidden", "false");
      setTimeout(() => els.code?.focus?.(), 0);
    }

    function closeModal() {
      if (!els.modal) return;
      els.modal.classList.remove("open");
      els.modal.setAttribute("aria-hidden", "true");
      page.editingId = null;
    }

    function validate(d) {
      if (!d.code) return "Code is required.";
      if (!d.name) return "Name is required.";
      if (!(d.type === "percent" || d.type === "fixed")) return "Type must be percent or fixed.";
      if (!Number.isFinite(d.value) || d.value <= 0) return "Value must be greater than 0.";
      if (d.type === "percent" && d.value > 100) return "Percent value must be 100 or below.";
      if (!Number.isFinite(d.minAmount) || d.minAmount < 0) return "Minimum amount must be 0 or higher.";
      if (!Number.isFinite(d.maxDiscount) || d.maxDiscount < 0) return "Max discount must be 0 or higher.";
      if (d.startsAt && Number.isNaN(Date.parse(d.startsAt))) return "Invalid start date.";
      if (d.endsAt && Number.isNaN(Date.parse(d.endsAt))) return "Invalid end date.";
      if (d.startsAt && d.endsAt && Date.parse(d.endsAt) < Date.parse(d.startsAt)) return "End date must be after start date.";
      return "";
    }

    function render() {
      const db = readDiscounts();
      const list = db.discounts.slice();
      const q = String(page.q || "").trim().toLowerCase();
      const filtered = !q
        ? list
        : list.filter((d) =>
            [d.code, d.name, d.type, d.value, d.notes]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(q),
          );

      if (els.count) els.count.textContent = `${filtered.length} discount${filtered.length === 1 ? "" : "s"}`;

      if (!els.body) return;
      if (!filtered.length) {
        els.body.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No discounts yet.</td></tr>`;
        return;
      }

      filtered.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
      els.body.innerHTML = filtered
        .map((d) => {
          const typeLabel = d.type === "fixed" ? "Fixed" : "Percent";
          const valueLabel = d.type === "fixed" ? money(d.value) : `${Number(d.value || 0)}%`;
          const minLabel = d.minAmount ? money(d.minAmount) : "—";
          const isActive = d.active !== false;
          return `
            <tr data-id="${esc(d.id)}">
              <td><code>${esc(d.code)}</code></td>
              <td><strong>${esc(d.name || "—")}</strong></td>
              <td>${esc(typeLabel)}</td>
              <td>${esc(valueLabel)}</td>
              <td>${esc(minLabel)}</td>
              <td>${isActive ? '<span class="badge badge-complete">Yes</span>' : '<span class="badge badge-pending">No</span>'}</td>
              <td class="data-table__col-actions">
                <div class="data-table__actions">
                  <button type="button" class="btn btn--outline btn--sm" data-action="edit">Edit</button>
                  <button type="button" class="btn btn--outline btn--sm" data-action="toggle">${isActive ? "Disable" : "Enable"}</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    els.addBtn?.addEventListener("click", () => openModal({ title: "Add Discount", sub: "Create a new discount code." }));
    els.close?.addEventListener("click", closeModal);
    els.cancel?.addEventListener("click", closeModal);
    els.modal?.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
    });

    els.search?.addEventListener("input", (e) => {
      page.q = e.target.value || "";
      render();
    });

    els.body?.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-action]");
      if (!btn) return;
      const tr = btn.closest("tr[data-id]");
      const id = tr?.getAttribute("data-id") || "";
      if (!id) return;

      const db = readDiscounts();
      const idx = db.discounts.findIndex((d) => String(d?.id || "") === id);
      if (idx < 0) return;

      const action = btn.getAttribute("data-action");
      if (action === "edit") {
        openModal({ title: "Edit Discount", sub: "Update discount details.", discount: db.discounts[idx] });
        return;
      }
      if (action === "toggle") {
        db.discounts[idx].active = !(db.discounts[idx].active !== false);
        db.discounts[idx].updatedAt = new Date().toISOString();
        window.saveDB(db);
        render();
      }
    });

    els.form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = normalizeCode(els.code?.value || "");
      const payload = {
        id: page.editingId || `disc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        code,
        name: String(els.name?.value || "").trim(),
        type: String(els.type?.value || "percent"),
        value: Number(els.value?.value || 0),
        active: !!els.active?.checked,
        startsAt: els.start?.value ? new Date(els.start.value).toISOString() : "",
        endsAt: els.end?.value ? new Date(els.end.value).toISOString() : "",
        minAmount: Number(els.min?.value || 0),
        maxDiscount: Number(els.max?.value || 0),
        notes: String(els.notes?.value || "").trim(),
        createdAt: page.editingId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const err = validate(payload);
      if (err) {
        alert(err);
        return;
      }

      const db = readDiscounts();
      const dup = db.discounts.find(
        (d) => String(d?.code || "").toUpperCase() === code && String(d?.id || "") !== payload.id,
      );
      if (dup) {
        alert("That discount code already exists.");
        return;
      }

      if (page.editingId) {
        const idx = db.discounts.findIndex((d) => String(d?.id || "") === payload.id);
        if (idx >= 0) {
          const createdAt = db.discounts[idx].createdAt || new Date().toISOString();
          db.discounts[idx] = { ...db.discounts[idx], ...payload, createdAt };
        } else {
          db.discounts.unshift({ ...payload, createdAt: new Date().toISOString() });
        }
      } else {
        db.discounts.unshift({ ...payload, createdAt: new Date().toISOString() });
      }

      window.saveDB(db);
      closeModal();
      render();
    });

    render();
    if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
  }

  window.addEventListener("DOMContentLoaded", init);
})();

