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

  function getOrganizations() {
    const db = getDB();
    return Array.isArray(db.organizations) ? db.organizations : [];
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
  }

  setupEventListeners();
  renderOrganizations();

  window.closeOrganizationModal = closeOrganizationModal;
})();
