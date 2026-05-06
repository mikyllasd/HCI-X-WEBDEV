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
    doable: "Doable — proceed with follow-up",
    not_doable: "Not feasible",
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
          <label style="font-size:12px;font-weight:600">Staff notes (visible to student in notification)</label>
          <textarea class="form-input" rows="2" data-ocr-notes="${esc(r.id)}" placeholder="What can / cannot be done, timeline, etc.">${esc(r.staffNotes || "")}</textarea>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <button type="button" class="btn btn--success btn--sm" data-ocr-action="doable" data-ocr-id="${esc(r.id)}">Mark doable</button>
            <button type="button" class="btn btn--danger btn--sm" data-ocr-action="not_doable" data-ocr-id="${esc(r.id)}">Not feasible</button>
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

  function staffDecision(id, nextStatus, notes) {
    const row = window.UpressOrgCustomRequests.update(id, {
      status: nextStatus,
      staffNotes: notes,
      staffReviewedAt: new Date().toISOString(),
    });
    if (!row) return;
    let msg = "";
    if (nextStatus === "doable")
      msg =
        "Your organization custom request was reviewed: UPress can accommodate it. Check your email or visit the org officer for next steps. Notes: " +
        (notes || "—");
    else if (nextStatus === "not_doable")
      msg =
        "Your organization custom request was reviewed: we cannot accommodate this scope. Notes: " +
        (notes || "—");
    else
      msg =
        "UPress needs more information about your organization custom request. Notes: " +
        (notes || "—");
    window.UpressOrgCustomRequests.notifyUser(row.userId, msg, nextStatus === "doable" ? "success" : "warning");
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
        const ta = container.querySelector(`textarea[data-ocr-notes="${id}"]`);
        const notes = ta ? ta.value.trim() : "";
        staffDecision(id, action, notes);
        mount(container, { role });
        return;
      }

      if (action === "admin_save") {
        const ta = container.querySelector(`textarea[data-ocr-admin-notes="${id}"]`);
        const ack = container.querySelector(`input[data-ocr-admin-ack="${id}"]`);
        window.UpressOrgCustomRequests.update(id, {
          adminNotes: ta ? ta.value.trim() : "",
          adminAcknowledged: !!(ack && ack.checked),
          adminReviewedAt: new Date().toISOString(),
        });
        mount(container, { role });
        return;
      }

      if (action === "oversight_save") {
        const ta = container.querySelector(`textarea[data-ocr-oversight="${id}"]`);
        window.UpressOrgCustomRequests.update(id, {
          oversightNotes: ta ? ta.value.trim() : "",
        });
        mount(container, { role });
      }
    });
  }

  let bound = new WeakSet();

  function mount(container, opts) {
    if (!container || !window.UpressOrgCustomRequests) return;
    const role = opts && opts.role ? opts.role : "staff";
    container.dataset.ocrRole = role;
    const rows = window.UpressOrgCustomRequests.list();
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
