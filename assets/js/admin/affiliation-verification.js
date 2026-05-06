(function () {
  const requestsContainer = document.getElementById("affiliationList");
  const emptyState = document.getElementById("affiliationEmpty");
  const totalEl = document.getElementById("affiliationTotal");
  const pendingEl = document.getElementById("affiliationPending");
  const approvedEl = document.getElementById("affiliationApproved");
  const rejectedEl = document.getElementById("affiliationRejected");
  const searchInput = document.getElementById("affiliationSearch");
  const statusSelect = document.getElementById("affiliationStatus");
  const typeSelect = document.getElementById("affiliationType");

  let filterState = { search: "", status: "all", type: "all" };
  let currentRequest = null;

  // ── DB ─────────────────────────────────────────────────────────────────────

  function getDB() {
    if (typeof window.getDB === "function") return window.getDB();
    try { return JSON.parse(localStorage.getItem("upressDB") || "{}"); } catch { return {}; }
  }

  function saveDB(db) {
    if (typeof window.saveDB === "function") return window.saveDB(db);
    try { localStorage.setItem("upressDB", JSON.stringify(db)); } catch (e) { console.error(e); }
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────

  function notifyUser(userId, message, type) {
    const db = getDB();
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      userId,
      message,
      type: type || "info",
      read: false,
      createdAt: new Date().toISOString()
    });
    saveDB(db);
  }

  // ── DATA ───────────────────────────────────────────────────────────────────

  function getAffiliationRequests() {
    return getDB().affiliationRequests || [];
  }

  function normalizeStatus(request) {
    const status = String(request.status || "").toLowerCase();
    return ["approved", "rejected", "pending"].includes(status) ? status : "pending";
  }

  function getFilteredRequests() {
    return getAffiliationRequests().filter(request => {
      const status = normalizeStatus(request);
      const matchesSearch = !filterState.search ||
        (request.userName || "").toLowerCase().includes(filterState.search.toLowerCase()) ||
        (request.userEmail || "").toLowerCase().includes(filterState.search.toLowerCase()) ||
        (request.organizationName || "").toLowerCase().includes(filterState.search.toLowerCase());
      const matchesStatus = filterState.status === "all" || status === filterState.status;
      const matchesType = filterState.type === "all" || request.organizationType === filterState.type;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  function updateStats(requests) {
    const stats = requests.reduce((acc, r) => {
      acc.total++;
      acc[normalizeStatus(r)]++;
      return acc;
    }, { total: 0, pending: 0, approved: 0, rejected: 0 });
    if (totalEl) totalEl.textContent = stats.total;
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (approvedEl) approvedEl.textContent = stats.approved;
    if (rejectedEl) rejectedEl.textContent = stats.rejected;
  }

  function buildStatusBadge(status) {
    const map = {
      pending: ["status-pending", "Pending"],
      approved: ["status-approved", "Approved"],
      rejected: ["status-rejected", "Rejected"]
    };
    const [cls, label] = map[status] || map.pending;
    return `<span class="status-badge ${cls}">${label}</span>`;
  }

  function formatField(value) { return value || "—"; }

  // ── RENDER ─────────────────────────────────────────────────────────────────

  function renderRequestCard(request) {
    const status = normalizeStatus(request);
    const submittedDate = request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : "—";

    const details = request.organizationType === "known"
      ? `<div class="request-card__item"><span class="request-card__label">Organization</span><span class="request-card__value">${formatField(request.organizationName)}</span></div>
         <div class="request-card__item"><span class="request-card__label">Position</span><span class="request-card__value">${formatField(request.position)}</span></div>
         <div class="request-card__item"><span class="request-card__label">Contact</span><span class="request-card__value">${formatField(request.contactNumber)}</span></div>`
      : `<div class="request-card__item"><span class="request-card__label">Organization</span><span class="request-card__value">${formatField(request.organizationName)}</span></div>
         <div class="request-card__item"><span class="request-card__label">College</span><span class="request-card__value">${formatField(request.college)}</span></div>
         <div class="request-card__item"><span class="request-card__label">Contact</span><span class="request-card__value">${formatField(request.contactNumber)}</span></div>`;

    const uploadedImage = request.proofImage
      ? `<img src="${request.proofImage}" alt="Proof document" style="max-width:100%;border-radius:6px;" />`
      : `<em style="font-size:12px;color:#999">No proof uploaded.</em>`;

    return `
      <article class="request-card">
        <div class="request-card__header">
          <div>
            <h3 class="card-title">${formatField(request.userName)}</h3>
            <p class="card-subtitle">${formatField(request.userEmail)}</p>
          </div>
          ${buildStatusBadge(status)}
        </div>
        <div class="request-card__meta">
          ${details}
          <div class="request-card__item"><span class="request-card__label">Type</span><span class="request-card__value">${request.organizationType === "known" ? "Known Organization" : "Other Organization"}</span></div>
          <div class="request-card__item"><span class="request-card__label">Submitted</span><span class="request-card__value">${submittedDate}</span></div>
        </div>
        <div class="request-card__image">${uploadedImage}</div>
        <div class="request-card__actions">
          <button class="btn btn--outline btn--sm" type="button" data-action="view" data-request="${request.id}">View Details</button>
          ${status === "pending" ? `
            <button class="btn btn--success btn--sm" type="button" data-action="approve" data-request="${request.id}">Approve</button>
            <button class="btn btn--danger btn--sm" type="button" data-action="reject" data-request="${request.id}">Reject</button>
          ` : ""}
        </div>
      </article>`;
  }

  function renderRequests() {
    const requests = getFilteredRequests();
    updateStats(getAffiliationRequests());
    if (!requestsContainer) return;
    if (requests.length === 0) {
      requestsContainer.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }
    if (emptyState) emptyState.style.display = "none";
    requestsContainer.innerHTML = requests.map(renderRequestCard).join("");
  }

  // ── ACTIONS ────────────────────────────────────────────────────────────────

  function approveRequest(requestId) {
    const db = getDB();
    const requests = db.affiliationRequests || [];
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return;

    const request = requests[idx];
    requests[idx].status = "approved";
    requests[idx].reviewedAt = new Date().toISOString();

    // Add to user affiliations
    const userIdx = (db.users || []).findIndex(u => u.id === request.userId);
    if (userIdx !== -1) {
      if (!Array.isArray(db.users[userIdx].affiliations)) db.users[userIdx].affiliations = [];
      // Avoid duplicates
      const alreadyExists = db.users[userIdx].affiliations.find(a => a.id === requestId);
      if (!alreadyExists) {
        db.users[userIdx].affiliations.push({
          id: requestId,
          organizationName: request.organizationName,
          position: request.position,
          contactNumber: request.contactNumber,
          organizationType: request.organizationType,
          college: request.college,
          verifiedAt: new Date().toISOString(),
          status: "verified"
        });
      }
    }

    saveDB(db);

    // Notify the user
    notifyUser(
      request.userId,
      `Your affiliation request for "${request.organizationName}" has been approved. You can now use your organization when creating orders.`,
      "success"
    );

    renderRequests();
    closeAffiliationModal();
  }

  function rejectRequest(requestId) {
    const db = getDB();
    const requests = db.affiliationRequests || [];
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return;

    const request = requests[idx];
    requests[idx].status = "rejected";
    requests[idx].reviewedAt = new Date().toISOString();
    saveDB(db);

    // Notify the user
    notifyUser(
      request.userId,
      `Your affiliation request for "${request.organizationName}" has been rejected. Please contact the admin for more information.`,
      "error"
    );

    renderRequests();
    closeAffiliationModal();
  }

  function viewRequest(requestId) {
    const request = getAffiliationRequests().find(r => r.id === requestId);
    if (!request) return;
    currentRequest = request;
    showAffiliationModal(request);
  }

  function handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const requestId = button.dataset.request;
    if (action === "view") viewRequest(requestId);
    else if (action === "approve") approveRequest(requestId);
    else if (action === "reject") rejectRequest(requestId);
  }

  // ── MODAL ──────────────────────────────────────────────────────────────────

  function showAffiliationModal(request) {
    const modal = document.getElementById("affiliationModal");
    const modalBody = document.getElementById("affiliationModalBody");
    if (!modal || !modalBody) return;

    const status = normalizeStatus(request);
    const proofImage = request.proofImage
      ? `<img src="${request.proofImage}" alt="Proof document" style="max-width:100%;height:auto;border-radius:6px;" />`
      : "<p>No proof document uploaded.</p>";

    const details = request.organizationType === "known"
      ? `<div class="modal-detail"><strong>Organization:</strong> ${formatField(request.organizationName)}</div>
         <div class="modal-detail"><strong>College:</strong> ${formatField(request.college)}</div>
         <div class="modal-detail"><strong>Position:</strong> ${formatField(request.position)}</div>
         <div class="modal-detail"><strong>Contact:</strong> ${formatField(request.contactNumber)}</div>`
      : `<div class="modal-detail"><strong>Organization:</strong> ${formatField(request.organizationName)}</div>
         <div class="modal-detail"><strong>College:</strong> ${formatField(request.college)}</div>
         <div class="modal-detail"><strong>Position:</strong> ${formatField(request.position)}</div>
         <div class="modal-detail"><strong>Contact:</strong> ${formatField(request.contactNumber)}</div>`;

    modalBody.innerHTML = `
      <div class="modal-details">
        <div class="modal-detail"><strong>User:</strong> ${formatField(request.userName)} (${formatField(request.userEmail)})</div>
        <div class="modal-detail"><strong>Type:</strong> ${request.organizationType === "known" ? "Known Organization" : "Other Organization"}</div>
        ${details}
        <div class="modal-detail"><strong>Submitted:</strong> ${request.submittedAt ? new Date(request.submittedAt).toLocaleString() : "—"}</div>
        <div class="modal-detail"><strong>Status:</strong> ${buildStatusBadge(status)}</div>
        ${request.reviewedAt ? `<div class="modal-detail"><strong>Reviewed:</strong> ${new Date(request.reviewedAt).toLocaleString()}</div>` : ""}
        <div class="modal-detail"><strong>Proof Document:</strong><div style="margin-top:10px;">${proofImage}</div></div>
      </div>`;

    modal.style.display = "flex";
  }

  function closeAffiliationModal() {
    const modal = document.getElementById("affiliationModal");
    if (modal) modal.style.display = "none";
    currentRequest = null;
  }

  function approveAffiliation() {
    if (currentRequest) approveRequest(currentRequest.id);
  }

  function rejectAffiliation() {
    if (currentRequest) rejectRequest(currentRequest.id);
  }

  // ── FILTERS ────────────────────────────────────────────────────────────────

  function setupEventListeners() {
    if (searchInput) searchInput.addEventListener("input", e => { filterState.search = e.target.value; renderRequests(); });
    if (statusSelect) statusSelect.addEventListener("change", e => { filterState.status = e.target.value; renderRequests(); });
    if (typeSelect) typeSelect.addEventListener("change", e => { filterState.type = e.target.value; renderRequests(); });
    if (requestsContainer) requestsContainer.addEventListener("click", handleAction);
  }

  // ── INIT ───────────────────────────────────────────────────────────────────

  setupEventListeners();
  renderRequests();

  window.addEventListener("storage", e => { if (e.key === "upressDB") renderRequests(); });

  window.closeAffiliationModal = closeAffiliationModal;
  window.approveAffiliation = approveAffiliation;
  window.rejectAffiliation = rejectAffiliation;

})();