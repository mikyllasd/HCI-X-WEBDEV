/**
 * Shared UI for organization custom requests (staff / admin / superadmin).
 */
(function () {
  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const STATUS_LABEL = {
    pending: "Pending staff review",
    doable: "Approved — quoted",
    not_doable: "Rejected",
    needs_info: "More information needed",
  };

  const CAT_LABEL = {
    printing: "Printing",
    binding: "Binding",
    merchandise: "Merchandise / giveaways",
    event_collateral: "Event collateral",
    other: "Other / mixed",
  };

  function fmtStatus(status) {
    return STATUS_LABEL[String(status)] || String(status || "—");
  }

  function fmtCat(c) {
    return CAT_LABEL[String(c)] || String(c || "—");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function card(r, role) {
    const st = String(r.status || "pending");
    const attSrc = r.attachmentDataUrl
      ? String(r.attachmentDataUrl).replace(/"/g, "&quot;")
      : "";
    const att = attSrc
      ? `<div class="request-card__image-block"><p class="request-card__image-label">Attachment</p><img src="${attSrc}" alt="" style="max-width:100%;border-radius:8px;border:1px solid var(--color-border, #e0e0e0)"/></div>`
      : "";

    let actions = "";

    if (role === "staff" && st === "pending") {
      actions = `
        <div class="request-card__actions" style="flex-direction:column;align-items:stretch;gap:10px">
          <label style="font-size:12px;font-weight:600">Quoted price (PHP) *</label>
          <input type="number" class="form-input" min="0.01" step="0.01" data-ocr-price="${esc(r.id)}" placeholder="e.g. 1500.00" />
          <label style="font-size:12px;font-weight:600">Message to student (included in notification)</label>
          <textarea class="form-input" rows="2" data-ocr-notes="${esc(r.id)}" placeholder="Timeline, pickup, what is included, etc.">${esc(r.staffNotes || "")}</textarea>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <button type="button" class="btn btn--success btn--sm" data-ocr-action="doable" data-ocr-id="${esc(r.id)}">Approve at this price</button>
            <button type="button" class="btn btn--danger btn--sm" data-ocr-action="not_doable" data-ocr-id="${esc(r.id)}">Reject</button>
            <button type="button" class="btn btn--outline btn--sm" data-ocr-action="needs_info" data-ocr-id="${esc(r.id)}">Request more info</button>
          </div>
        </div>`;
    } else if (role === "admin") {
      actions = `
        <div class="request-card__actions" style="flex-direction:column;align-items:stretch;gap:10px">
          <label style="font-size:12px;font-weight:600">Admin oversight note</label>
          <textarea class="form-input" rows="2" data-ocr-admin-notes="${esc(r.id)}" placeholder="Internal or policy note (optional)">${esc(r.adminNotes || "")}</textarea>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" data-ocr-admin-ack="${esc(r.id)}" ${r.adminAcknowledged ? "checked" : ""} />
            Record oversight / acknowledgement
          </label>
          <button type="button" class="btn btn--primary btn--sm" data-ocr-action="admin_save" data-ocr-id="${esc(r.id)}" style="align-self:flex-start">Save admin record</button>
        </div>`;
    } else if (role === "superadmin") {
      actions = `
        <div class="request-card__actions" style="flex-direction:column;align-items:stretch;gap:10px">
          <label style="font-size:12px;font-weight:600">Superadmin oversight (optional)</label>
          <textarea class="form-input" rows="2" data-ocr-oversight="${esc(r.id)}" placeholder="Audit trail / escalation note">${esc(r.oversightNotes || "")}</textarea>
          <button type="button" class="btn btn--outline btn--sm" data-ocr-action="oversight_save" data-ocr-id="${esc(r.id)}">Save oversight note</button>
        </div>`;
    }

    return `
      <article class="request-card" data-ocr-card="${esc(r.id)}">
        <div class="request-card__header">
          <div>
            <h3 class="card-title">${esc(r.requestTitle || "Custom request")}</h3>
            <p class="card-subtitle">${esc(r.organizationName || "")} · ${esc(r.userName || "")} · ${esc(r.userEmail || "")}</p>
          </div>
          <span class="request-card__badge ${st === "doable" ? "request-card__badge--approved" : st === "not_doable" ? "request-card__badge--rejected" : "request-card__badge--pending"}">${esc(fmtStatus(st))}</span>
        </div>
        <div class="request-card__meta">
          <div class="request-card__item"><span class="request-card__label">Category</span><span class="request-card__value">${esc(fmtCat(r.requestCategory))}</span></div>
          <div class="request-card__item"><span class="request-card__label">Quantity / specs</span><span class="request-card__value">${esc(r.quantityOrSpecs || "—")}</span></div>
          <div class="request-card__item"><span class="request-card__label">Submitted</span><span class="request-card__value">${esc(fmtDate(r.submittedAt))}</span></div>
          ${r.quotedPrice != null && r.quotedPrice !== "" && Number.isFinite(Number(r.quotedPrice)) ? `<div class="request-card__item"><span class="request-card__label">Quoted price</span><span class="request-card__value">₱${Number(r.quotedPrice).toFixed(2)}</span></div>` : ""}
          ${r.staffReviewedAt ? `<div class="request-card__item"><span class="request-card__label">Staff reviewed</span><span class="request-card__value">${esc(fmtDate(r.staffReviewedAt))}</span></div>` : ""}
          ${r.adminReviewedAt ? `<div class="request-card__item"><span class="request-card__label">Admin recorded</span><span class="request-card__value">${esc(fmtDate(r.adminReviewedAt))}</span></div>` : ""}
        </div>
        <div class="request-card__meta" style="margin-top:8px">
          <div class="request-card__item" style="grid-column:1/-1"><span class="request-card__label">Details</span><span class="request-card__value" style="white-space:pre-wrap">${esc(r.requestDetails || "—")}</span></div>
          ${r.staffNotes ? `<div class="request-card__item" style="grid-column:1/-1"><span class="request-card__label">Staff notes</span><span class="request-card__value" style="white-space:pre-wrap">${esc(r.staffNotes)}</span></div>` : ""}
          ${r.adminNotes ? `<div class="request-card__item" style="grid-column:1/-1"><span class="request-card__label">Admin notes</span><span class="request-card__value" style="white-space:pre-wrap">${esc(r.adminNotes)}</span></div>` : ""}
          ${r.oversightNotes ? `<div class="request-card__item" style="grid-column:1/-1"><span class="request-card__label">Superadmin oversight</span><span class="request-card__value" style="white-space:pre-wrap">${esc(r.oversightNotes)}</span></div>` : ""}
        </div>
        ${att ? `<div class="request-card__image">${att}</div>` : ""}
        ${actions}
      </article>`;
  }

  function staffDecision(id, nextStatus, notes, quotedPrice) {
    const patch = {
      status: nextStatus,
      staffNotes: notes,
      staffReviewedAt: new Date().toISOString(),
    };
    if (nextStatus === "doable" && quotedPrice != null && Number.isFinite(Number(quotedPrice))) {
      patch.quotedPrice = Number(quotedPrice);
    }
    if (nextStatus === "not_doable") {
      patch.quotedPrice = null;
    }
    const row = window.UpressOrgCustomRequests.update(id, patch);
    if (!row) return;
    let msg = "";
    if (nextStatus === "doable") {
      const p =
        row.quotedPrice != null && Number.isFinite(Number(row.quotedPrice))
          ? `Quoted price: ₱${Number(row.quotedPrice).toFixed(2)}. `
          : "";
      msg =
        "Your organization custom request was approved. " +
        p +
        (notes ? "Details: " + notes : "Visit the office or check notifications for next steps.");
    } else if (nextStatus === "not_doable")
      msg =
        "Your organization custom request was not approved. " +
        (notes || "Please contact UPress if you have questions.");
    else
      msg =
        "UPress needs more information about your organization custom request. " +
        (notes || "");
    window.UpressOrgCustomRequests.notifyUser(
      row.userId,
      msg,
      nextStatus === "doable" ? "success" : nextStatus === "not_doable" ? "error" : "warning",
    );
  }

  function bind(container) {
    container.addEventListener("click", (e) => {
      const role = container.dataset.ocrRole || "staff";
      const btn = e.target.closest("[data-ocr-action]");
      if (!btn) return;
      const id = btn.getAttribute("data-ocr-id");
      const action = btn.getAttribute("data-ocr-action");
      if (!id || !action) return;

      if (action === "doable" || action === "not_doable" || action === "needs_info") {
        const ta = container.querySelector(`textarea[data-ocr-notes="${CSS.escape(id)}"]`);
        const notes = ta ? ta.value.trim() : "";
        if (action === "doable") {
          const priceEl = container.querySelector(`input[data-ocr-price="${CSS.escape(id)}"]`);
          const raw = priceEl ? priceEl.value.trim() : "";
          const price = parseFloat(raw, 10);
          if (!Number.isFinite(price) || price <= 0) {
            window.alert("Enter a quoted price greater than zero (PHP) to approve.");
            return;
          }
          staffDecision(id, action, notes, price);
        } else {
          staffDecision(id, action, notes);
        }
        mount(container, { role, sortPendingFirst: container.dataset.ocrSortPending === "1" });
        return;
      }

      if (action === "admin_save") {
        const ta = container.querySelector(`textarea[data-ocr-admin-notes="${CSS.escape(id)}"]`);
        const ack = container.querySelector(`input[data-ocr-admin-ack="${CSS.escape(id)}"]`);
        window.UpressOrgCustomRequests.update(id, {
          adminNotes: ta ? ta.value.trim() : "",
          adminAcknowledged: !!(ack && ack.checked),
          adminReviewedAt: new Date().toISOString(),
        });
        mount(container, { role, sortPendingFirst: container.dataset.ocrSortPending === "1" });
        return;
      }

      if (action === "oversight_save") {
        const ta = container.querySelector(`textarea[data-ocr-oversight="${CSS.escape(id)}"]`);
        window.UpressOrgCustomRequests.update(id, {
          oversightNotes: ta ? ta.value.trim() : "",
        });
        mount(container, { role, sortPendingFirst: container.dataset.ocrSortPending === "1" });
      }
    });
  }

  let bound = new WeakSet();

  function mount(container, opts) {
    if (!container || !window.UpressOrgCustomRequests) return;
    const role = opts && opts.role ? opts.role : "staff";
    const sortPendingFirst = !!(opts && opts.sortPendingFirst);
    container.dataset.ocrRole = role;
    if (sortPendingFirst) container.dataset.ocrSortPending = "1";
    else delete container.dataset.ocrSortPending;
    let rows = window.UpressOrgCustomRequests.list();
    if (sortPendingFirst) {
      rows = [...rows].sort((a, b) => {
        const pr = (s) => (String(s || "").toLowerCase() === "pending" ? 0 : 1);
        const d = pr(a.status) - pr(b.status);
        if (d !== 0) return d;
        return String(b.submittedAt || "").localeCompare(String(a.submittedAt || ""));
      });
    }
    if (!rows.length) {
      container.innerHTML =
        '<p class="page-subtitle" style="margin:0">No organization custom requests yet.</p>';
      return;
    }
    container.innerHTML = rows.map((r) => card(r, role)).join("");
    if (!bound.has(container)) {
      bind(container);
      bound.add(container);
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  window.UpressOrgCustomRequestsUI = { mount };
})();
