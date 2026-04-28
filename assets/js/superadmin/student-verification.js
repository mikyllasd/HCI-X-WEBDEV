"use strict";

/* ==========================================================
   STUDENT VERIFICATION PAGE
   ========================================================== */

let svFilter = "all";

function renderVerificationList() {
  const query = (
    document.getElementById("sv-search")?.value || ""
  ).toLowerCase();
  const list = document.getElementById("sv-list");
  if (!list) return;

  const filtered = VERIFICATION_REQUESTS.filter((req) => {
    const matchStatus = svFilter === "all" || req.status === svFilter;
    const matchQuery =
      !query ||
      req.name.toLowerCase().includes(query) ||
      req.studentId.toLowerCase().includes(query) ||
      req.email.toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  setText(
    "sv-count",
    `${filtered.length} request${filtered.length !== 1 ? "s" : ""} found`,
  );

  list.innerHTML =
    filtered.length === 0
      ? `<li class="empty-state"><p class="empty-state__title">No requests found</p><p class="empty-state__sub">Try adjusting your search or filter.</p></li>`
      : filtered
          .map(
            (req) => `
      <li class="request-item" data-id="${req.id}">
        <div class="request-item__body">
          <p class="request-item__name">
            ${escHtml(req.name)}
            <span class="status-badge status-badge--${req.status}">${statusIconSVG(req.status)} ${capitalise(req.status)}</span>
          </p>
          <div class="request-item__meta">
            <span><strong>Student ID:</strong> ${escHtml(req.studentId)}</span>
            <span><strong>Program:</strong> ${escHtml(req.program)}</span>
            <span><strong>Year Level:</strong> ${escHtml(req.yearLevel)}</span>
            <span><strong>Email:</strong> ${escHtml(req.email)}</span>
            <span><strong>Submitted:</strong> ${escHtml(req.submitted)}</span>
          </div>
        </div>
        <button class="request-item__view" data-id="${req.id}" aria-label="View details for ${escHtml(req.name)}">
          ${eyeIconSVG()}
        </button>
      </li>`,
          )
          .join("");

  list.querySelectorAll(".request-item__view").forEach((btn) => {
    btn.addEventListener("click", () => openVerificationModal(btn.dataset.id));
  });
}

function openVerificationModal(requestId) {
  const req = VERIFICATION_REQUESTS.find((r) => r.id === requestId);
  if (!req) return;

  document.getElementById("sv-modal-body").innerHTML = `
    <dl>
      <div class="detail-row"><dt>Full Name</dt>    <dd>${escHtml(req.name)}</dd></div>
      <div class="detail-row"><dt>Student ID</dt>   <dd>${escHtml(req.studentId)}</dd></div>
      <div class="detail-row"><dt>Program</dt>      <dd>${escHtml(req.program)}</dd></div>
      <div class="detail-row"><dt>Year Level</dt>   <dd>${escHtml(req.yearLevel)}</dd></div>
      <div class="detail-row"><dt>Email</dt>        <dd>${escHtml(req.email)}</dd></div>
      <div class="detail-row"><dt>Submitted</dt>    <dd>${escHtml(req.submitted)}</dd></div>
      <div class="detail-row"><dt>Status</dt>
        <dd><span class="status-badge status-badge--${req.status}">${capitalise(req.status)}</span></dd>
      </div>
    </dl>`;

  const footer = document.getElementById("sv-modal-footer");
  if (req.status === "pending") {
    footer.innerHTML = `
      <button class="btn btn--danger btn--sm"  id="sv-reject-btn">Reject</button>
      <button class="btn btn--success btn--sm" id="sv-approve-btn">Approve</button>`;
    document.getElementById("sv-approve-btn").onclick = () => {
      setVerificationStatus(requestId, "approved");
      closeVerificationModal();
    };
    document.getElementById("sv-reject-btn").onclick = () => {
      setVerificationStatus(requestId, "rejected");
      closeVerificationModal();
    };
  } else {
    footer.innerHTML = `<button class="btn btn--outline btn--sm" id="sv-close-footer">Close</button>`;
    document.getElementById("sv-close-footer").onclick = closeVerificationModal;
  }

  document.getElementById("sv-modal-overlay").classList.remove("hidden");
}

function closeVerificationModal() {
  document.getElementById("sv-modal-overlay").classList.add("hidden");
}

function setVerificationStatus(id, newStatus) {
  const req = VERIFICATION_REQUESTS.find((r) => r.id === id);
  if (!req) return;
  AppData.updateUser(id, { verificationStatus: newStatus });
  refreshVerificationCounters();
  renderVerificationList();
  showToast(`Request for ${req.name} has been ${newStatus}.`);
}

function refreshVerificationCounters() {
  const pending = VERIFICATION_REQUESTS.filter(
    (r) => r.status === "pending",
  ).length;
  const approved = VERIFICATION_REQUESTS.filter(
    (r) => r.status === "approved",
  ).length;
  const rejected = VERIFICATION_REQUESTS.filter(
    (r) => r.status === "rejected",
  ).length;
  setText("sv-total", VERIFICATION_REQUESTS.length);
  setText("sv-pending", pending);
  setText("sv-approved", approved);
  setText("sv-rejected", rejected);
}

document.addEventListener("DOMContentLoaded", () => {
  refreshVerificationCounters();
  renderVerificationList();

  document
    .getElementById("sv-search")
    ?.addEventListener("input", renderVerificationList);

  document.querySelectorAll(".filter-tab[data-filter]").forEach((tab) => {
    tab.addEventListener("click", () => {
      svFilter = tab.dataset.filter;
      document.querySelectorAll(".filter-tab[data-filter]").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      renderVerificationList();
    });
  });

  document
    .getElementById("sv-modal-close")
    ?.addEventListener("click", closeVerificationModal);
  document
    .getElementById("sv-modal-overlay")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeVerificationModal();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeVerificationModal();
  });
});
