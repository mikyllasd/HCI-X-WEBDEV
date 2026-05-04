(function () {
  const requestsContainer = document.getElementById("verificationList");
  const emptyState = document.getElementById("verificationEmpty");
  const totalEl = document.getElementById("verificationTotal");
  const pendingEl = document.getElementById("verificationPending");
  const approvedEl = document.getElementById("verificationApproved");
  const rejectedEl = document.getElementById("verificationRejected");
  const searchInput = document.getElementById("verificationSearch");
  const statusSelect = document.getElementById("verificationStatus");
  const collegeSelect = document.getElementById("verificationCollege");
  const courseSelect = document.getElementById("verificationCourse");
  const yearLevelSelect = document.getElementById("verificationYearLevel");

  const initialState = {
    search: "",
    status: "all",
    college: "all",
    course: "all",
    yearLevel: "all",
  };

  let filterState = { ...initialState };

  function getVerificationRequests() {
    const db = getDB();
    return (db.users || []).filter((user) => {
      const role = String(user.role || "").toLowerCase();
      const hasStudentDetails = Boolean(
        user.studentId || user.college || user.course || user.yearLevel,
      );
      return (
        role === "student" ||
        user.accountType === "student" ||
        hasStudentDetails
      );
    });
  }

  function normalizeStatus(user) {
    const raw = user.status;
    const status = String(raw != null ? raw : "").toLowerCase();
    if (["approved", "rejected", "disabled", "pending"].includes(status)) {
      return status;
    }
    /* Legacy demo roster rows had no status field — treat as already cleared. */
    if (raw === undefined || raw === null || raw === "") {
      const id = String(user.id || "");
      if (id.startsWith("stu_pending")) return "pending";
      return "approved";
    }
    return "pending";
  }

  function getUniqueValues(items, key) {
    const values = new Set();
    items.forEach((item) => {
      const value = String(item[key] || "").trim();
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  }

  function updateStats(requests) {
    if (totalEl) totalEl.textContent = requests.length;
    if (pendingEl)
      pendingEl.textContent = requests.filter(
        (user) => normalizeStatus(user) === "pending",
      ).length;
    if (approvedEl)
      approvedEl.textContent = requests.filter(
        (user) => normalizeStatus(user) === "approved",
      ).length;
    if (rejectedEl)
      rejectedEl.textContent = requests.filter(
        (user) => normalizeStatus(user) === "rejected",
      ).length;
  }

  function getFilteredRequests() {
    return getVerificationRequests().filter((user) => {
      const status = normalizeStatus(user);
      const college = String(user.college || "").toLowerCase();
      const course = String(user.course || "").toLowerCase();
      const yearLevel = String(user.yearLevel || "").toLowerCase();
      const search = filterState.search.toLowerCase();
      const matchesSearch =
        !search ||
        String(user.fullName || "")
          .toLowerCase()
          .includes(search) ||
        String(user.email || "")
          .toLowerCase()
          .includes(search) ||
        String(user.studentId || "")
          .toLowerCase()
          .includes(search);
      const matchesStatus =
        filterState.status === "all" || filterState.status === status;
      const matchesCollege =
        filterState.college === "all" || college === filterState.college;
      const matchesCourse =
        filterState.course === "all" || course === filterState.course;
      const matchesYear =
        filterState.yearLevel === "all" || yearLevel === filterState.yearLevel;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCollege &&
        matchesCourse &&
        matchesYear
      );
    });
  }

  function renderOptionList(select, values) {
    if (!select) return;
    select.innerHTML =
      `<option value="all">All</option>` +
      values
        .map(
          (value) => `<option value="${value.toLowerCase()}">${value}</option>`,
        )
        .join("");
  }

  function renderFilters(requests) {
    if (!collegeSelect || !courseSelect || !yearLevelSelect) return;

    renderOptionList(collegeSelect, getUniqueValues(requests, "college"));
    renderOptionList(courseSelect, getUniqueValues(requests, "course"));
    renderOptionList(yearLevelSelect, getUniqueValues(requests, "yearLevel"));
  }

  function formatField(value) {
    return value ? String(value) : "—";
  }

  function buildStatusBadge(status) {
    const classNames = ["request-card__badge"];
    if (status === "approved") classNames.push("request-card__badge--approved");
    if (status === "pending") classNames.push("request-card__badge--pending");
    if (status === "rejected") classNames.push("request-card__badge--rejected");
    return `<span class="${classNames.join(" ")}">${status.toUpperCase()}</span>`;
  }

  function renderRequest(user) {
    const status = normalizeStatus(user);
    const uploadedImage = user.imageUrl
      ? `<img src="${user.imageUrl}" alt="Uploaded student document" />`
      : `<div class="request-card__image-icon" aria-hidden="true"><i data-lucide="image"></i></div>`;

    return `
      <article class="request-card">
        <div class="request-card__header">
          <div>
            <h3 class="card-title">${formatField(user.fullName)}</h3>
            <p class="card-subtitle">${formatField(user.studentId)} · ${formatField(user.college)} · ${formatField(user.course)}</p>
          </div>
          ${buildStatusBadge(status)}
        </div>

        <div class="request-card__meta">
          <div class="request-card__item">
            <span class="request-card__label">Email</span>
            <span class="request-card__value">${formatField(user.email)}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Year Level</span>
            <span class="request-card__value">${formatField(user.yearLevel)}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Type</span>
            <span class="request-card__value">${formatField(user.type || user.studentType || "Regular")}</span>
          </div>
          <div class="request-card__item">
            <span class="request-card__label">Submitted</span>
            <span class="request-card__value">${formatField(user.submittedAt || user.createdAt || "—")}</span>
          </div>
        </div>

        <div class="request-card__image">
          ${uploadedImage}
        </div>

        <div class="request-card__actions">
          <button class="btn btn--success btn--sm" type="button" data-action="approve" data-user="${user.id}">Approve</button>
          <button class="btn btn--danger btn--sm" type="button" data-action="reject" data-user="${user.id}">Reject</button>
          <button class="btn btn--outline btn--sm" type="button" data-action="flag" data-user="${user.id}">${user.flagged ? "Unflag" : "Flag Suspicious"}</button>
        </div>
      </article>
    `;
  }

  function renderRequests() {
    const requests = getFilteredRequests();
    updateStats(getVerificationRequests());
    renderFilters(getVerificationRequests());

    if (!requestsContainer) return;

    if (requests.length === 0) {
      requestsContainer.innerHTML = "";
      emptyState?.classList.add("active");
      return;
    }

    emptyState?.classList.remove("active");
    requestsContainer.innerHTML = requests.map(renderRequest).join("");
  }

  function saveChanges() {
    renderRequests();
  }

  function updateUserStatus(id, newStatus) {
    const db = getDB();
    const user = (db.users || []).find((item) => item.id === id);
    if (!user) return;
    user.status = newStatus;
    user.verified = newStatus === "approved";
    user.active = newStatus === "approved";
    user.accountStatus =
      newStatus === "approved"
        ? "verified"
        : newStatus === "rejected"
          ? "rejected"
          : "pending";
    user.reviewedAt = new Date().toISOString();
    saveDB(db);
    saveChanges();
  }

  function toggleFlagged(id) {
    const db = getDB();
    const user = (db.users || []).find((item) => item.id === id);
    if (!user) return;
    user.flagged = !user.flagged;
    saveDB(db);
    saveChanges();
  }

  function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.user;
    if (!id) return;

    if (action === "approve") {
      updateUserStatus(id, "approved");
    } else if (action === "reject") {
      updateUserStatus(id, "rejected");
    } else if (action === "flag") {
      toggleFlagged(id);
    }
  }

  function initFilters() {
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        filterState.search = event.target.value || "";
        renderRequests();
      });
    }
    if (statusSelect) {
      statusSelect.addEventListener("change", (event) => {
        filterState.status = event.target.value;
        renderRequests();
      });
    }
    if (collegeSelect) {
      collegeSelect.addEventListener("change", (event) => {
        filterState.college = event.target.value;
        renderRequests();
      });
    }
    if (courseSelect) {
      courseSelect.addEventListener("change", (event) => {
        filterState.course = event.target.value;
        renderRequests();
      });
    }
    if (yearLevelSelect) {
      yearLevelSelect.addEventListener("change", (event) => {
        filterState.yearLevel = event.target.value;
        renderRequests();
      });
    }
  }

  function init() {
    renderRequests();
    if (requestsContainer) {
      requestsContainer.addEventListener("click", handleListClick);
    }
    initFilters();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
