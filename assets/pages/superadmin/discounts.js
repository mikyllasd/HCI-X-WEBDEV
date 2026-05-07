(function () {
  function refreshIcons() {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  function init() {
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") {
      setTimeout(init, 10);
      return;
    }

    const page = {
      editingId: null,
      q: "",
    };

    const els = {
      container: document.getElementById("pageContainer"),
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

    /** @type {HTMLElement | null} */
    let bodyEl = null;
    /** @type {HTMLElement | null} */
    let emptyEl = null;
    /** @type {HTMLElement | null} */
    let tableWrapEl = null;

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

    function renderShell() {
      if (!els.container) return;
      els.container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Discount codes</h1>
            <p class="page-sub">
              Manage promotion codes for student checkout and walk-in POS. Reports use gross, discount, and net columns.
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="addDiscountBtn" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add discount
            </button>
          </div>
        </div>

        <div class="stats-grid stats-grid--4" aria-label="Discount summary">
          <article class="stat-card stat-card--blue">
            <div class="stat-card__header">
              <span>Total codes</span>
              <i data-lucide="layers" aria-hidden="true"></i>
            </div>
            <p class="stat-card__value" id="discStatTotal">0</p>
            <p class="stat-card__label">All codes in this environment</p>
          </article>
          <article class="stat-card stat-card--green">
            <div class="stat-card__header">
              <span>Active</span>
              <i data-lucide="check-circle" aria-hidden="true"></i>
            </div>
            <p class="stat-card__value" id="discStatActive">0</p>
            <p class="stat-card__label">Shown at checkout &amp; POS</p>
          </article>
          <article class="stat-card stat-card--yellow">
            <div class="stat-card__header">
              <span>Inactive</span>
              <i data-lucide="pause-circle" aria-hidden="true"></i>
            </div>
            <p class="stat-card__value" id="discStatInactive">0</p>
            <p class="stat-card__label">Hidden until re-enabled</p>
          </article>
          <article class="stat-card stat-card--purple">
            <div class="stat-card__header">
              <span>Percent-based</span>
              <i data-lucide="percent" aria-hidden="true"></i>
            </div>
            <p class="stat-card__value" id="discStatPct">0</p>
            <p class="stat-card__label">Non-fixed amount codes</p>
          </article>
        </div>

        <div class="list-toolbar">
          <label class="list-search" for="discountSearch">
            <span>Search codes</span>
            <input
              class="list-search__input"
              id="discountSearch"
              type="search"
              autocomplete="off"
              placeholder="Code, label, notes, type, or amount"
            />
          </label>
          <div class="list-toolbar__count" id="discountCount">0 shown · 0 total</div>
        </div>

        <section class="card discounts-table-card">
          <div id="discountsEmpty" class="empty-state" hidden>
            <div class="empty-state__icon">
              <i data-lucide="badge-percent" aria-hidden="true"></i>
            </div>
            <div class="empty-state__title" id="discountsEmptyTitle">No discount codes yet</div>
            <div class="empty-state__sub" id="discountsEmptySub">
              Create your first code to unlock student checkout discounts and POS dropdowns.
            </div>
            <button type="button" class="btn btn-primary" id="discountsEmptyCta">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create discount
            </button>
          </div>
          <div id="discountsTableWrap" class="table-wrapper">
            <table class="data-table discounts-table" aria-label="Discount codes">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Label</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Offer</th>
                  <th scope="col">Min. spend</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody id="discountsBody"></tbody>
            </table>
          </div>
        </section>
      `;

      bodyEl = document.getElementById("discountsBody");
      emptyEl = document.getElementById("discountsEmpty");
      tableWrapEl = document.getElementById("discountsTableWrap");

      document.getElementById("addDiscountBtn")?.addEventListener("click", () =>
        openModal({ title: "Add discount", sub: "New code applies across checkout and POS when active." }),
      );
      document.getElementById("discountsEmptyCta")?.addEventListener("click", () =>
        openModal({ title: "Add discount", sub: "New code applies across checkout and POS when active." }),
      );
      document.getElementById("discountSearch")?.addEventListener("input", (e) => {
        page.q = e.target?.value || "";
        render();
      });

      els.container.addEventListener("click", onTableClick);

      refreshIcons();
    }

    function onTableClick(e) {
      const btn = e.target?.closest?.("button[data-action]");
      if (!btn || !btn.closest("#discountsBody")) return;
      const tr = btn.closest("tr[data-id]");
      const id = tr?.getAttribute("data-id") || "";
      if (!id) return;

      const db = readDiscounts();
      const idx = db.discounts.findIndex((d) => String(d?.id || "") === id);
      if (idx < 0) return;

      const action = btn.getAttribute("data-action");
      if (action === "edit") {
        openModal({ title: "Edit discount", sub: "Update how this code applies.", discount: db.discounts[idx] });
        return;
      }
      if (action === "toggle") {
        db.discounts[idx].active = !(db.discounts[idx].active !== false);
        db.discounts[idx].updatedAt = new Date().toISOString();
        window.saveDB(db);
        render();
      }
    }

    function openModal({ title, sub, discount } = {}) {
      if (!els.modal) return;
      page.editingId = discount?.id || null;
      if (els.modalTitle)
        els.modalTitle.textContent = title || (page.editingId ? "Edit discount" : "Add discount");
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
      refreshIcons();
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
      if (d.startsAt && d.endsAt && Date.parse(d.endsAt) < Date.parse(d.startsAt))
        return "End date must be after start date.";
      return "";
    }

    function updateSummaryStats(all) {
      const totalEl = document.getElementById("discStatTotal");
      const activeEl = document.getElementById("discStatActive");
      const inactiveEl = document.getElementById("discStatInactive");
      const pctEl = document.getElementById("discStatPct");

      let active = 0;
      let pct = 0;
      all.forEach((d) => {
        if (d.active !== false) active++;
        if (String(d.type || "").toLowerCase() !== "fixed") pct++;
      });
      if (totalEl) totalEl.textContent = String(all.length);
      if (activeEl) activeEl.textContent = String(active);
      if (inactiveEl) inactiveEl.textContent = String(Math.max(0, all.length - active));
      if (pctEl) pctEl.textContent = String(pct);
    }

    function renderEmptyState(listLen, filteredLen, hasQuery) {
      if (!emptyEl || !tableWrapEl) return;
      const titleEl = document.getElementById("discountsEmptyTitle");
      const subEl = document.getElementById("discountsEmptySub");
      const cta = document.getElementById("discountsEmptyCta");

      const showEmpty = filteredLen === 0;
      if (!showEmpty) {
        emptyEl.hidden = true;
        tableWrapEl.hidden = false;
        return;
      }

      emptyEl.hidden = false;
      tableWrapEl.hidden = true;

      if (hasQuery || listLen > 0) {
        if (titleEl) titleEl.textContent = "No matching discounts";
        if (subEl)
          subEl.textContent =
            "Try another search keyword, or clear the filter to see all codes.";
        if (cta) cta.hidden = listLen === 0;
      } else {
        if (titleEl) titleEl.textContent = "No discount codes yet";
        if (subEl)
          subEl.textContent =
            "Create your first code — students enter it at checkout; staff choose it from the walk-in POS ticket.";
        if (cta) cta.hidden = false;
      }
      refreshIcons();
    }

    function render() {
      const db = readDiscounts();
      const list = db.discounts.slice();
      const q = String(page.q || "").trim().toLowerCase();
      updateSummaryStats(list);

      const filtered = !q
        ? list
        : list.filter((d) =>
            [d.code, d.name, d.type, d.value, d.notes]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(q),
          );

      const countEl = document.getElementById("discountCount");
      if (countEl) countEl.textContent = `${filtered.length} shown · ${list.length} total`;

      renderEmptyState(list.length, filtered.length, !!q);

      if (!bodyEl || !filtered.length) {
        if (bodyEl && filtered.length === 0) bodyEl.innerHTML = "";
        refreshIcons();
        return;
      }

      filtered.sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
      bodyEl.innerHTML = filtered
        .map((d) => {
          const isPct = String(d.type || "").toLowerCase() !== "fixed";
          const typeLabel = isPct ? "Percent" : "Fixed";
          const pillClass = isPct ? "discounts-type-pill--percent" : "discounts-type-pill--fixed";
          const valueLabel = isPct ? `${Number(d.value || 0)}%` : money(d.value);
          const minLabel = d.minAmount ? money(d.minAmount) : "—";
          const isActive = d.active !== false;
          const statusHtml = isActive
            ? '<span class="badge badge-complete">Active</span>'
            : '<span class="badge badge-pending">Off</span>';
          return `
            <tr data-id="${esc(d.id)}">
              <td><span class="discounts-code">${esc(d.code)}</span></td>
              <td><strong>${esc(d.name || "—")}</strong></td>
              <td><span class="discounts-type-pill ${pillClass}">${esc(typeLabel)}</span></td>
              <td><span class="discounts-value-strong">${esc(valueLabel)}</span></td>
              <td>${esc(minLabel)}</td>
              <td>${statusHtml}</td>
              <td class="data-table__col-actions">
                <div class="data-table__actions">
                  <button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-action="toggle">${isActive ? "Disable" : "Enable"}</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      refreshIcons();
    }

    els.close?.addEventListener("click", closeModal);
    els.cancel?.addEventListener("click", closeModal);
    els.modal?.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
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

      const dbread = readDiscounts();
      const dup = dbread.discounts.find(
        (d) =>
          String(d?.code || "").toUpperCase() === code && String(d?.id || "") !== payload.id,
      );
      if (dup) {
        alert("That discount code already exists.");
        return;
      }

      if (page.editingId) {
        const idx = dbread.discounts.findIndex((d) => String(d?.id || "") === payload.id);
        if (idx >= 0) {
          const createdAt = dbread.discounts[idx].createdAt || new Date().toISOString();
          dbread.discounts[idx] = { ...dbread.discounts[idx], ...payload, createdAt };
        } else {
          dbread.discounts.unshift({ ...payload, createdAt: new Date().toISOString() });
        }
      } else {
        dbread.discounts.unshift({ ...payload, createdAt: new Date().toISOString() });
      }

      window.saveDB(dbread);
      closeModal();
      render();
    });

    renderShell();
    render();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
