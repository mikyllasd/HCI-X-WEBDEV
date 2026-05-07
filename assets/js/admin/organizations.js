(function () {
  const listContainer = document.getElementById("organizationList");
  const emptyState = document.getElementById("organizationEmpty");
  const totalEl = document.getElementById("organizationTotal");
  const collegeCountEl = document.getElementById("organizationCollegeCount");
  const searchInput = document.getElementById("organizationSearch");
  const collegeFilter = document.getElementById("organizationCollegeFilter");
  const clearFiltersBtn = document.getElementById("clearFilters");

  const filterState = {
    search: "",
    college: "all",
  };

  // Tab elements
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Affiliation elements
  const requestsContainer = document.getElementById("affiliationList");
  const affiliationEmptyState = document.getElementById("affiliationEmpty");
  const affiliationTotalEl = document.getElementById("affiliationTotal");
  const affiliationPendingEl = document.getElementById("affiliationPending");
  const affiliationApprovedEl = document.getElementById("affiliationApproved");
  const affiliationRejectedEl = document.getElementById("affiliationRejected");
  const affiliationSearchInput = document.getElementById("affiliationSearch");
  const affiliationStatusSelect = document.getElementById("affiliationStatus");
  const affiliationTypeSelect = document.getElementById("affiliationType");

  let affiliationFilterState = { search: "", status: "all", type: "all" };
  let currentRequest = null;

  const modal = document.getElementById("organizationModal");
  const modalBody = document.getElementById("organizationModalBody");

  // Tab switching
  function switchTab(tabName) {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeBtn) activeBtn.classList.add("active");
    if (activeContent) activeContent.classList.add("active");

    if (tabName === "custom-requests" && window.UpressOrgCustomRequestsUI) {
      const el = document.getElementById("orgCustomRequestsList");
      if (el) window.UpressOrgCustomRequestsUI.mount(el, { role: "admin" });
      if (typeof lucide !== "undefined") lucide.createIcons();
    }
  }

  // ── AFFILIATION FUNCTIONS ──────────────────────────────────────────────────

  function getAffiliationRequests() {
    return getDB().affiliationRequests || [];
  }

  function normalizeStatus(request) {
    const status = String(request.status || "").toLowerCase();
    return ["approved", "rejected", "pending"].includes(status)
      ? status
      : "pending";
  }

  function getFilteredAffiliationRequests() {
    return getAffiliationRequests().filter((request) => {
      const status = normalizeStatus(request);
      const matchesSearch =
        !affiliationFilterState.search ||
        request.userName
          ?.toLowerCase()
          .includes(affiliationFilterState.search.toLowerCase()) ||
        request.userEmail
          ?.toLowerCase()
          .includes(affiliationFilterState.search.toLowerCase()) ||
        request.organizationName
          ?.toLowerCase()
          .includes(affiliationFilterState.search.toLowerCase());

      const matchesStatus =
        affiliationFilterState.status === "all" ||
        status === affiliationFilterState.status;
      const matchesType =
        affiliationFilterState.type === "all" ||
        request.organizationType === affiliationFilterState.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  function updateAffiliationStats(requests) {
    const stats = requests.reduce(
      (acc, request) => {
        const status = normalizeStatus(request);
        acc.total++;
        acc[status]++;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 },
    );

    if (affiliationTotalEl) affiliationTotalEl.textContent = stats.total;
    if (affiliationPendingEl) affiliationPendingEl.textContent = stats.pending;
    if (affiliationApprovedEl)
      affiliationApprovedEl.textContent = stats.approved;
    if (affiliationRejectedEl)
      affiliationRejectedEl.textContent = stats.rejected;
  }

  function buildAffiliationStatusBadge(status) {
    const map = {
      pending: ["status-pending", "Pending"],
      approved: ["status-approved", "Approved"],
      rejected: ["status-rejected", "Rejected"],
    };
    const [cls, label] = map[status] || map.pending;
    return `<span class="status-badge ${cls}">${label}</span>`;
  }

  function formatField(value) {
    return value || "—";
  }

  function getCampusIdForRequest(request) {
    const direct =
      request.campusId || request.studentId || request.facultyId || "";
    if (direct) return direct;
    const db = getDB();
    const uid = request.userId;
    const u =
      (db.users || []).find((x) => x && x.id === uid) ||
      (db.authUsers || []).find((x) => x && x.id === uid) ||
      {};
    return u.campusId || u.studentId || u.facultyId || "";
  }

  function renderAffiliationRequestCard(request) {
    const status = normalizeStatus(request);
    const submittedDate = request.submittedAt
      ? new Date(request.submittedAt).toLocaleDateString()
      : "—";
    const idNum = formatField(getCampusIdForRequest(request));

    const details =
      request.organizationType === "known"
        ? `<div class="request-card__item"><span class="request-card__label">Organization</span><span class="request-card__value">${formatField(request.organizationName)}</span></div>
         <div class="request-card__item"><span class="request-card__label">College</span><span class="request-card__value">${formatField(request.college)}</span></div>
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
          ${buildAffiliationStatusBadge(status)}
        </div>
        <div class="request-card__meta">
          <div class="request-card__item"><span class="request-card__label">ID number</span><span class="request-card__value">${idNum}</span></div>
          ${details}
          <div class="request-card__item"><span class="request-card__label">Type</span><span class="request-card__value">${request.organizationType === "known" ? "Known Organization" : "Other Organization"}</span></div>
          <div class="request-card__item"><span class="request-card__label">Submitted</span><span class="request-card__value">${submittedDate}</span></div>
        </div>
        <div class="request-card__image">${uploadedImage}</div>
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
      </article>`;
  }

  function renderAffiliationRequests() {
    const requests = getFilteredAffiliationRequests();
    updateAffiliationStats(getAffiliationRequests());
    if (!requestsContainer) return;
    if (requests.length === 0) {
      requestsContainer.innerHTML = "";
      if (affiliationEmptyState) affiliationEmptyState.style.display = "block";
      return;
    }
    if (affiliationEmptyState) affiliationEmptyState.style.display = "none";
    requestsContainer.innerHTML = requests
      .map(renderAffiliationRequestCard)
      .join("");
  }

  /** When `db` is passed, mutates that object only; caller must `saveDB(db)`. */
  function addOrUpdateOrganizationDirectory(request, db) {
    const target = db || getDB();
    target.organizations = Array.isArray(target.organizations)
      ? target.organizations
      : [];

    const orgName = String(request.organizationName || "").trim();
    const college = String(
      request.college || request.organizationTypeDisplay || "",
    ).trim();
    if (!orgName) return;

    const exists = target.organizations.some((org) => {
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
      target.organizations.push({
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

    if (!db) saveDB(target);
  }

  function notifyUser(userId, message, type) {
    const db = getDB();
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      userId,
      message,
      type: type || "info",
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveDB(db);
  }

  function approveAffiliationRequest(requestId) {
    const db = getDB();
    if (!Array.isArray(db.affiliationRequests)) db.affiliationRequests = [];
    const requests = db.affiliationRequests;
    const requestIndex = requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) return;

    requests[requestIndex].status = "approved";
    requests[requestIndex].reviewedAt = new Date().toISOString();

    const affPayload = {
      id: requestId,
      organizationName: requests[requestIndex].organizationName,
      position: requests[requestIndex].position,
      contactNumber: requests[requestIndex].contactNumber,
      organizationType: requests[requestIndex].organizationType,
      verifiedAt: new Date().toISOString(),
      status: "verified",
    };
    const uid = requests[requestIndex].userId;
    ["users", "authUsers"].forEach((key) => {
      const arr = Array.isArray(db[key]) ? db[key] : [];
      const userIndex = arr.findIndex((u) => u && u.id === uid);
      if (userIndex === -1) return;
      if (!arr[userIndex].affiliations) arr[userIndex].affiliations = [];
      arr[userIndex].affiliations.push({ ...affPayload });
    });

    addOrUpdateOrganizationDirectory(requests[requestIndex], db);
    saveDB(db);
    const orgLabel =
      requests[requestIndex].organizationName || "your organization";
    notifyUser(
      uid,
      `Your affiliation request for ${orgLabel} has been approved. You can now place organization orders.`,
      "success",
    );
    renderAffiliationRequests();
    renderOrganizations();
    closeAffiliationModal();
  }

  function rejectAffiliationRequest(requestId) {
    const db = getDB();
    if (!Array.isArray(db.affiliationRequests)) db.affiliationRequests = [];
    const requests = db.affiliationRequests;
    const requestIndex = requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) return;

    const uid = requests[requestIndex].userId;
    const orgLabel =
      requests[requestIndex].organizationName || "your organization";

    requests[requestIndex].status = "rejected";
    requests[requestIndex].reviewedAt = new Date().toISOString();
    saveDB(db);

    notifyUser(
      uid,
      `Your affiliation request for ${orgLabel} was not approved. Your profile remains without this affiliation.`,
      "warning",
    );
    renderAffiliationRequests();
    closeAffiliationModal();
  }

  function viewAffiliationRequest(requestId) {
    const requests = getAffiliationRequests();
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    currentRequest = request;
    showAffiliationModal(request);
  }

  function showAffiliationModal(request) {
    const modal = document.getElementById("affiliationModal");
    const modalBody = document.getElementById("affiliationModalBody");
    if (!modal || !modalBody) return;

    const status = normalizeStatus(request);
    const proofImage = request.proofImage
      ? `<img src="${request.proofImage}" alt="Proof document" style="max-width:100%;height:auto;border-radius:6px;" />`
      : "<p>No proof document uploaded.</p>";

    const details =
      request.organizationType === "known"
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
        <div class="modal-detail"><strong>ID number:</strong> ${formatField(getCampusIdForRequest(request))}</div>
        <div class="modal-detail"><strong>Type:</strong> ${request.organizationType === "known" ? "Known Organization" : "Other Organization"}</div>
        ${details}
        <div class="modal-detail"><strong>Submitted:</strong> ${request.submittedAt ? new Date(request.submittedAt).toLocaleString() : "—"}</div>
        <div class="modal-detail"><strong>Status:</strong> ${buildAffiliationStatusBadge(status)}</div>
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

  function handleAffiliationAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const requestId = button.dataset.request;

    if (action === "view") {
      viewAffiliationRequest(requestId);
    } else if (action === "approve") {
      approveAffiliationRequest(requestId);
    } else if (action === "reject") {
      rejectAffiliationRequest(requestId);
    }
  }

  function formatField(value) {
    return value || "—";
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function getFilteredOrganizations() {
    const query = normalizeText(filterState.search);
    const selectedCollege = normalizeText(filterState.college);
    return getOrganizations().filter((org) => {
      const name = normalizeText(org.name);
      const college = normalizeText(org.college);
      const matchesSearch =
        !query || name.includes(query) || college.includes(query);
      const matchesCollege =
        selectedCollege === "all" || college === selectedCollege;
      return matchesSearch && matchesCollege;
    });
  }

  function getUniqueColleges() {
    const colleges = new Set();
    getOrganizations().forEach((org) => {
      if (org.college) colleges.add(org.college);
    });
    return [...colleges].sort((a, b) => a.localeCompare(b));
  }

  function updateStats(organizations) {
    if (totalEl) totalEl.textContent = String(organizations.length);
    if (collegeCountEl)
      collegeCountEl.textContent = String(
        new Set(organizations.map((org) => org.college || "")).size,
      );
  }

  function buildStatusBadge(type) {
    const label = type ? formatField(type) : "Approved";
    return `<span class="status-badge status-badge--approved">${label}</span>`;
  }

  function buildOrganizationCard(org) {
    const proofPreview = org.proofImage
      ? `<button class="btn btn--outline btn--sm" type="button" data-action="preview" data-id="${org.id}">Preview Document</button>`
      : '<span class="text-muted">No document available</span>';

    return `
      <article class="request-card">
        <div class="request-card__header">
          <div>
            <h3 class="card-title">${formatField(org.name)}</h3>
            <p class="card-subtitle">${formatField(org.college)}</p>
          </div>
          ${buildStatusBadge(org.type || "Approved")}
        </div>

        <div class="request-card__meta">
          <div class="request-card__item">
            <span class="request-card__label">Organization Type</span>
            <span class="request-card__value">${formatField(org.type)}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Recognized</span>
            <span class="request-card__value">${org.recognizedAt ? new Date(org.recognizedAt).toLocaleDateString() : "—"}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Approved By</span>
            <span class="request-card__value">${formatField(org.approvedBy || "Admin")}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Approved At</span>
            <span class="request-card__value">${org.approvedAt ? new Date(org.approvedAt).toLocaleDateString() : "—"}</span>
          </div>
        </div>

        <div class="request-card__actions">
          ${proofPreview}
          <button class="btn btn--outline btn--sm" type="button" data-action="details" data-id="${org.id}">View Info</button>
        </div>
      </article>
    `;
  }

  function renderOrganizationGroups(filteredOrgs) {
    if (!listContainer) return;

    if (filteredOrgs.length === 0) {
      listContainer.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    const groups = filteredOrgs.reduce((acc, org) => {
      const college = org.college || "Unassigned";
      if (!acc[college]) acc[college] = [];
      acc[college].push(org);
      return acc;
    }, {});

    const sortedCollegeNames = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b),
    );
    const html = sortedCollegeNames
      .map((college) => {
        const itemsHtml = groups[college].map(buildOrganizationCard).join("");
        return `
          <section class="organization-group">
            <div class="organization-group__header">
              <h2>${college}</h2>
              <p>${groups[college].length} organization${groups[college].length === 1 ? "" : "s"}</p>
            </div>
            ${itemsHtml}
          </section>
        `;
      })
      .join("");

    listContainer.innerHTML = html;
    lucide.createIcons();
  }

  function syncCollegeFilter() {
    if (!collegeFilter) return;
    const colleges = getUniqueColleges();
    collegeFilter.innerHTML = `<option value="all">All Colleges</option>`;
    colleges.forEach((college) => {
      const option = document.createElement("option");
      option.value = college;
      option.textContent = college;
      collegeFilter.appendChild(option);
    });
  }

  function renderOrganizations() {
    const organizations = getOrganizations();
    updateStats(organizations);
    syncCollegeFilter();
    const filtered = getFilteredOrganizations();
    renderOrganizationGroups(filtered);
  }

  function openOrganizationModal(orgId) {
    const org = getOrganizations().find((item) => item.id === orgId);
    if (!org) return;

    const proofSection = org.proofImage
      ? `<div class="modal-detail"><strong>Document:</strong><div style="margin-top: 10px;"><img src="${org.proofImage}" alt="Organization proof" style="width: 100%; height: auto; border-radius: 12px;" /></div></div>`
      : '<div class="modal-detail"><strong>Document:</strong> No proof document available.</div>';

    modalBody.innerHTML = `
      <div class="modal-details">
        <div class="modal-detail"><strong>Name:</strong> ${formatField(org.name)}</div>
        <div class="modal-detail"><strong>College:</strong> ${formatField(org.college)}</div>
        <div class="modal-detail"><strong>Type:</strong> ${formatField(org.type)}</div>
        <div class="modal-detail"><strong>Description:</strong> ${formatField(org.description)}</div>
        <div class="modal-detail"><strong>Approved By:</strong> ${formatField(org.approvedBy || "Admin")}</div>
        <div class="modal-detail"><strong>Recognized At:</strong> ${org.recognizedAt ? new Date(org.recognizedAt).toLocaleString() : "—"}</div>
        ${proofSection}
      </div>
    `;

    modal.style.display = "flex";
    lucide.createIcons();
  }

  function closeOrganizationModal() {
    if (!modal) return;
    modal.style.display = "none";
  }

  function handleListClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const orgId = button.dataset.id;
    if (action === "details" || action === "preview") {
      openOrganizationModal(orgId);
    }
  }

  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        switchTab(tabName);
      });
    });

    // Organization events
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        filterState.search = e.target.value;
        renderOrganizationGroups(getFilteredOrganizations());
      });
    }
    if (collegeFilter) {
      collegeFilter.addEventListener("change", (e) => {
        filterState.college = e.target.value;
        renderOrganizationGroups(getFilteredOrganizations());
      });
    }
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        filterState.search = "";
        filterState.college = "all";
        if (searchInput) searchInput.value = "";
        if (collegeFilter) collegeFilter.value = "all";
        renderOrganizationGroups(getFilteredOrganizations());
      });
    }
    if (listContainer) {
      listContainer.addEventListener("click", handleListClick);
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeOrganizationModal();
      });
    }

    // Affiliation events
    if (affiliationSearchInput) {
      affiliationSearchInput.addEventListener("input", (e) => {
        affiliationFilterState.search = e.target.value.toLowerCase();
        renderAffiliationRequests();
      });
    }
    if (affiliationStatusSelect) {
      affiliationStatusSelect.addEventListener("change", (e) => {
        affiliationFilterState.status = e.target.value;
        renderAffiliationRequests();
      });
    }
    if (affiliationTypeSelect) {
      affiliationTypeSelect.addEventListener("change", (e) => {
        affiliationFilterState.type = e.target.value;
        renderAffiliationRequests();
      });
    }
    if (requestsContainer) {
      requestsContainer.addEventListener("click", handleAffiliationAction);
    }
    const affiliationModal = document.getElementById("affiliationModal");
    if (affiliationModal) {
      affiliationModal.addEventListener("click", (e) => {
        if (e.target === affiliationModal) closeAffiliationModal();
      });
    }
  }

  setupEventListeners();
  renderOrganizations();
  renderAffiliationRequests();

  window.closeOrganizationModal = closeOrganizationModal;
  window.closeAffiliationModal = closeAffiliationModal;
  window.approveAffiliation = () => {
    if (currentRequest) approveAffiliationRequest(currentRequest.id);
  };
  window.rejectAffiliation = () => {
    if (currentRequest) rejectAffiliationRequest(currentRequest.id);
  };
})();
