/**
 * Shared UI for organization custom requests (staff / admin / superadmin).
 */
(function () {
  /** Set while staff modal is open for org custom review. */
  let ocrModalContext = null;

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
        <div class="request-card__actions">
          <button type="button" class="btn btn--primary btn--sm" data-ocr-action="open_review_modal" data-ocr-id="${esc(r.id)}">Review and quote in modal</button>
        </div>`;
    } else if (role === "admin_readonly") {
      actions = "";
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
          ${r.quotedPrice != null && r.quotedPrice !== "" && Number.isFinite(Number(r.quotedPrice)) ? `<div class="request-card__item"><span class="request-card__label">Quoted price</span><span class="request-card__value">₱${esc(Number(r.quotedPrice).toFixed(2))}</span></div>` : ""}
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
    if (nextStatus === "doable") {
      patch.quotedPrice = quotedPrice;
    } else {
      patch.quotedPrice = null;
    }
    const row = window.UpressOrgCustomRequests.update(id, patch);
    if (!row) return;
    let msg = "";
    if (nextStatus === "doable")
      msg =
        "Your organization custom request was approved: UPress can accommodate it. Quoted amount: ₱" +
        Number(quotedPrice).toFixed(2) +
        ". Notes: " +
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

  function buildOrgCustomReviewModalHtml(r) {
    return `
      <div class="sd-modal__grid" style="display:grid;gap:12px;text-align:left;max-width:100%">
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Organization</div>
          <div style="font-size:14px">${esc(r.organizationName || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Contact</div>
          <div style="font-size:14px">${esc(r.userName || "—")} · ${esc(r.userEmail || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Category</div>
          <div style="font-size:14px">${esc(fmtCat(r.requestCategory))}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Quantity / specs</div>
          <div style="font-size:14px">${esc(r.quantityOrSpecs || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Details</div>
          <div style="font-size:14px;white-space:pre-wrap;line-height:1.45">${esc(r.requestDetails || "—")}</div>
        </div>
        <hr style="border:0;border-top:1px solid var(--color-border,#e6e6e6);margin:4px 0" />
        <label style="font-size:12px;font-weight:600">Staff notes (sent to the student in a notification)</label>
        <textarea id="ocr-modal-notes" class="form-input" rows="3" placeholder="Timeline, materials, pickup, etc.">${esc(r.staffNotes || "")}</textarea>
        <label style="font-size:12px;font-weight:600">Quoted price if you approve (₱)</label>
        <input id="ocr-modal-price" type="number" class="form-input" min="0" step="0.01" placeholder="Required when you approve" />
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
          <button type="button" class="btn btn--success btn--sm" onclick="window.UpressOrgCustomRequestsUI.applyModalDecision('doable')">Approve — can accommodate</button>
          <button type="button" class="btn btn--danger btn--sm" onclick="window.UpressOrgCustomRequestsUI.applyModalDecision('not_doable')">Not feasible</button>
          <button type="button" class="btn btn--outline btn--sm" onclick="window.UpressOrgCustomRequestsUI.applyModalDecision('needs_info')">Request more info</button>
        </div>
      </div>`;
  }

  function openOrgCustomReviewModal(r, container, role) {
    ocrModalContext = { rowId: r.id, container, role };
    const title = "Review: " + (r.requestTitle || "Organization custom request");
    const html = buildOrgCustomReviewModalHtml(r);
    if (typeof window.openStaffModal === "function") {
      window.openStaffModal(title, html);
    } else {
      ocrModalContext = null;
      window.alert("Staff modal is not available. Open this page from the staff Order Queue.");
    }
  }

  function buildOrgCustomViewModalHtml(r) {
    const q =
      r.quotedPrice != null && Number.isFinite(Number(r.quotedPrice))
        ? "₱" + Number(r.quotedPrice).toFixed(2)
        : "—";
    return `
      <div class="sd-modal__grid" style="display:grid;gap:12px;text-align:left;max-width:100%">
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Organization</div>
          <div style="font-size:14px">${esc(r.organizationName || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Contact</div>
          <div style="font-size:14px">${esc(r.userName || "—")} · ${esc(r.userEmail || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Category</div>
          <div style="font-size:14px">${esc(fmtCat(r.requestCategory))}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Quantity / specs</div>
          <div style="font-size:14px">${esc(r.quantityOrSpecs || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Details</div>
          <div style="font-size:14px;white-space:pre-wrap;line-height:1.45">${esc(r.requestDetails || "—")}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Quoted price</div>
          <div style="font-size:16px;font-weight:700">${esc(q)}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.04em">Staff notes</div>
          <div style="font-size:14px;white-space:pre-wrap">${esc(r.staffNotes || "—")}</div>
        </div>
        <p style="margin:8px 0 0;font-size:12px;color:#667085">Status: ${esc(fmtStatus(r.status))}</p>
      </div>`;
  }

  function openOrgCustomViewModal(r) {
    if (typeof window.openStaffModal !== "function") return;
    window.openStaffModal(
      r.requestTitle || "Organization custom request",
      buildOrgCustomViewModalHtml(r),
    );
  }

  function applyModalDecision(action) {
    const ctx = ocrModalContext;
    if (!ctx || !ctx.rowId) return;
    const body = document.getElementById("staffModalBody");
    const notes =
      body && body.querySelector("#ocr-modal-notes")
        ? body.querySelector("#ocr-modal-notes").value.trim()
        : "";
    const raw =
      body && body.querySelector("#ocr-modal-price")
        ? body.querySelector("#ocr-modal-price").value.trim()
        : "";
    if (action === "doable") {
      const priceNum = raw === "" ? NaN : Number(raw);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        window.alert("Enter a valid quoted price (₱) before approving.");
        return;
      }
      staffDecision(ctx.rowId, action, notes, priceNum);
    } else {
      staffDecision(ctx.rowId, action, notes);
    }
    if (typeof window.closeStaffModal === "function") {
      window.closeStaffModal();
    }
    if (ctx.container) mount(ctx.container, { role: ctx.role });
    ocrModalContext = null;
    window.dispatchEvent(new CustomEvent("staff:data-changed"));
  }

  function bind(container) {
    container.addEventListener("click", (e) => {
      const role = container.dataset.ocrRole || "staff";
      const btn = e.target.closest("[data-ocr-action]");
      if (!btn) return;
      const id = btn.getAttribute("data-ocr-id");
      const action = btn.getAttribute("data-ocr-action");
      if (!id || !action) return;

      if (action === "open_review_modal") {
        const row = window.UpressOrgCustomRequests.list().find((x) => x.id === id);
        if (row) openOrgCustomReviewModal(row, container, role);
        return;
      }

      if (action === "doable" || action === "not_doable" || action === "needs_info") {
        const ta = container.querySelector(`textarea[data-ocr-notes="${id}"]`);
        const notes = ta ? ta.value.trim() : "";
        if (action === "doable") {
          const priceEl = container.querySelector(`input[data-ocr-price="${id}"]`);
          const raw = priceEl ? priceEl.value.trim() : "";
          const priceNum = raw === "" ? NaN : Number(raw);
          if (!Number.isFinite(priceNum) || priceNum < 0) {
            window.alert("Enter a valid quoted price (₱) before approving this request.");
            return;
          }
          staffDecision(id, action, notes, priceNum);
        } else {
          staffDecision(id, action, notes);
        }
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

  window.UpressOrgCustomRequestsUI = {
    mount,
    applyModalDecision,
    openStaffReviewModal: openOrgCustomReviewModal,
    openStaffViewModal: openOrgCustomViewModal,
  };
})();
