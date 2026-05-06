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

  const initialState = {
    search: "",
    status: "all",
    type: "all",
  };

  let filterState = { ...initialState };
  let currentRequest = null;

  function getAffiliationRequests() {
    const db = getDB();
    return db.affiliationRequests || [];
  }

  function normalizeStatus(request) {
    const status = String(request.status || "").toLowerCase();
    return ["approved", "rejected", "pending"].includes(status)
      ? status
      : "pending";
  }

  function getFilteredRequests() {
    const requests = getAffiliationRequests();

    return requests.filter((request) => {
      const status = normalizeStatus(request);
      const matchesSearch =
        !filterState.search ||
        request.userName
          ?.toLowerCase()
          .includes(filterState.search.toLowerCase()) ||
        request.userEmail
          ?.toLowerCase()
          .includes(filterState.search.toLowerCase()) ||
        request.organizationName
          ?.toLowerCase()
          .includes(filterState.search.toLowerCase());

      const matchesStatus =
        filterState.status === "all" || status === filterState.status;
      const matchesType =
        filterState.type === "all" ||
        request.organizationType === filterState.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  function updateStats(requests) {
    const stats = requests.reduce(
      (acc, request) => {
        const status = normalizeStatus(request);
        acc.total++;
        acc[status]++;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 },
    );

    if (totalEl) totalEl.textContent = stats.total;
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (approvedEl) approvedEl.textContent = stats.approved;
    if (rejectedEl) rejectedEl.textContent = stats.rejected;
  }

  function addOrUpdateOrganizationDirectory(request) {
    const db = getDB();
    db.organizations = Array.isArray(db.organizations) ? db.organizations : [];

    const orgName = String(request.organizationName || "").trim();
    const college = String(
      request.college || request.organizationTypeDisplay || "",
    ).trim();
    if (!orgName) return;

    const exists = db.organizations.some((org) => {
      return (
        String(org.name || "")
          .trim()
          .toLowerCase() === orgName.toLowerCase() &&
        String(org.college || "")
          .trim()
          .toLowerCase() === college.toLowerCase()
      );
    });

    if (!exists) {
      db.organizations.push({
        id: `ORG_${Date.now()}`,
        name: orgName,
        college: college || "Unknown College",
        type:
          request.organizationType === "known"
            ? "Known Organization"
            : "Other Organization",
        description:
          request.description ||
          `Verified organization recognized by WMSU ${college}`,
        proofImage: request.proofImage || "",
        approvedBy: "Admin",
        approvedAt: new Date().toISOString(),
        recognizedAt: new Date().toISOString(),
      });
    }

    saveDB(db);
  }

  function buildStatusBadge(status) {
    const statusConfig = {
      pending: { class: "status-pending", text: "Pending" },
      approved: { class: "status-approved", text: "Approved" },
      rejected: { class: "status-rejected", text: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return `<span class="status-badge ${config.class}">${config.text}</span>`;
  }

  function formatField(value) {
    return value || "—";
  }

  function renderRequestCard(request) {
    const status = normalizeStatus(request);
    const submittedDate = request.submittedAt
      ? new Date(request.submittedAt).toLocaleDateString()
      : "—";

    let details = "";
    if (request.organizationType === "known") {
      details = `
        <div class="request-card__item">
          <span class="request-card__label">Organization</span>
          <span class="request-card__value">${formatField(request.organizationName)}</span>
        </div>
        <div class="request-card__item">
          <span class="request-card__label">Position</span>
          <span class="request-card__value">${formatField(request.position)}</span>
        </div>
        <div class="request-card__item">
          <span class="request-card__label">Contact</span>
          <span class="request-card__value">${formatField(request.contactNumber)}</span>
        </div>
      `;
    } else {
      details = `
        <div class="request-card__item">
          <span class="request-card__label">Organization</span>
          <span class="request-card__value">${formatField(request.organizationName)}</span>
        </div>
        <div class="request-card__item">
          <span class="request-card__label">Type</span>
          <span class="request-card__value">${formatField(request.organizationTypeDisplay)}</span>
        </div>
        <div class="request-card__item">
          <span class="request-card__label">Contact</span>
          <span class="request-card__value">${formatField(request.contactNumber)}</span>
        </div>
      `;
    }

    const uploadedImage = request.proofImage
      ? `<img src="${request.proofImage}" alt="Uploaded proof document" />`
      : `<div class="request-card__image-icon" aria-hidden="true"><i data-lucide="image"></i></div>`;

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
          <div class="request-card__item">
            <span class="request-card__label">Type</span>
            <span class="request-card__value">${request.organizationType === "known" ? "Known Organization" : "Other Organization"}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Submitted</span>
            <span class="request-card__value">${submittedDate}</span>
          </div>
        </div>

        <div class="request-card__image">
          ${uploadedImage}
        </div>

        <div class="request-card__actions">
          <button class="btn btn--outline btn--sm" type="button" data-action="view" data-request="${request.id}">View Details</button>
          ${
            status === "pending"
              ? `
            <button class="btn btn--success btn--sm" type="button" data-action="approve" data-request="${request.id}">Approve</button>
            <button class="btn btn--danger btn--sm" type="button" data-action="reject" data-request="${request.id}">Reject</button>
          `
              : ""
          }
        </div>
      </article>
    `;
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
    lucide.createIcons();
  }

  function handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const requestId = button.dataset.request;

    if (action === "view") {
      viewRequest(requestId);
    } else if (action === "approve") {
      approveRequest(requestId);
    } else if (action === "reject") {
      rejectRequest(requestId);
    }
  }

  function viewRequest(requestId) {
    const requests = getAffiliationRequests();
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    currentRequest = request;
    showAffiliationModal(request);
  }

  function approveRequest(requestId) {
    const requests = getAffiliationRequests();
    const requestIndex = requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) return;

    requests[requestIndex].status = "approved";
    requests[requestIndex].reviewedAt = new Date().toISOString();

    // Add to user's affiliations
    const db = getDB();
    const userIndex = db.users.findIndex(
      (u) => u.id === requests[requestIndex].userId,
    );
    if (userIndex !== -1) {
      if (!db.users[userIndex].affiliations) {
        db.users[userIndex].affiliations = [];
      }
      db.users[userIndex].affiliations.push({
        id: requestId,
        organizationName: requests[requestIndex].organizationName,
        position: requests[requestIndex].position,
        contactNumber: requests[requestIndex].contactNumber,
        organizationType: requests[requestIndex].organizationType,
        verifiedAt: new Date().toISOString(),
        status: "verified",
      });
    }

    addOrUpdateOrganizationDirectory(requests[requestIndex]);
    renderRequests();
    closeAffiliationModal();
  }

  function rejectRequest(requestId) {
    const requests = getAffiliationRequests();
    const requestIndex = requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) return;

    requests[requestIndex].status = "rejected";
    requests[requestIndex].reviewedAt = new Date().toISOString();

    const db = getDB();
    saveDB(db);
    renderRequests();
    closeAffiliationModal();
  }

  function showAffiliationModal(request) {
    const modal = document.getElementById("affiliationModal");
    const modalBody = document.getElementById("affiliationModalBody");

    let details = "";
    if (request.organizationType === "known") {
      details = `
        <div class="modal-detail">
          <strong>Organization:</strong> ${formatField(request.organizationName)}
        </div>
        <div class="modal-detail">
          <strong>Position:</strong> ${formatField(request.position)}
        </div>
        <div class="modal-detail">
          <strong>Contact:</strong> ${formatField(request.contactNumber)}
        </div>
      `;
    } else {
      details = `
        <div class="modal-detail">
          <strong>Organization:</strong> ${formatField(request.organizationName)}
        </div>
        <div class="modal-detail">
          <strong>Type:</strong> ${formatField(request.organizationTypeDisplay)}
        </div>
        <div class="modal-detail">
          <strong>Contact:</strong> ${formatField(request.contactNumber)}
        </div>
        <div class="modal-detail">
          <strong>Description:</strong> ${formatField(request.description)}
        </div>
      `;
    }

    const proofImage = request.proofImage
      ? `<img src="${request.proofImage}" alt="Proof document" style="max-width: 100%; height: auto;" />`
      : "<p>No proof document uploaded</p>";

    modalBody.innerHTML = `
      <div class="modal-details">
        <div class="modal-detail">
          <strong>User:</strong> ${formatField(request.userName)} (${formatField(request.userEmail)})
        </div>
        <div class="modal-detail">
          <strong>Type:</strong> ${request.organizationType === "known" ? "Known Organization" : "Other Organization"}
        </div>
        ${details}
        <div class="modal-detail">
          <strong>Submitted:</strong> ${request.submittedAt ? new Date(request.submittedAt).toLocaleString() : "—"}
        </div>
        <div class="modal-detail">
          <strong>Status:</strong> ${buildStatusBadge(normalizeStatus(request))}
        </div>
        <div class="modal-detail">
          <strong>Proof Document:</strong>
          <div style="margin-top: 10px;">
            ${proofImage}
          </div>
        </div>
      </div>
    `;

    modal.style.display = "flex";
    lucide.createIcons();
  }

  function closeAffiliationModal() {
    const modal = document.getElementById("affiliationModal");
    modal.style.display = "none";
    currentRequest = null;
  }

  function approveAffiliation() {
    if (currentRequest) {
      approveRequest(currentRequest.id);
    }
  }

  function rejectAffiliation() {
    if (currentRequest) {
      rejectRequest(currentRequest.id);
    }
  }

  function setupEventListeners() {
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        filterState.search = e.target.value;
        renderRequests();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        filterState.status = e.target.value;
        renderRequests();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener("change", (e) => {
        filterState.type = e.target.value;
        renderRequests();
      });
    }

    if (requestsContainer) {
      requestsContainer.addEventListener("click", handleAction);
    }
  }

  // Initialize
  setupEventListeners();
  renderRequests();

  // Make functions globally available
  window.closeAffiliationModal = closeAffiliationModal;
  window.approveAffiliation = approveAffiliation;
  window.rejectAffiliation = rejectAffiliation;
})();
