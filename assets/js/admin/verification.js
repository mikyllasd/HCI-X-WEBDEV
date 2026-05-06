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

  let filterState = { search: "", status: "all", college: "all" };

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

  function getAllFaculty() {
    const db = getDB();
    const merged = [
      ...(Array.isArray(db.users) ? db.users : []),
      ...(Array.isArray(db.authUsers) ? db.authUsers : [])
    ];
    const seen = new Set();
    return merged.filter(user => {
      if (!user || !user.id) return false;
      if (seen.has(user.id)) return false;
      seen.add(user.id);
      const role = String(user.role || user.accountType || "").toLowerCase();
      return role === "faculty" || user.accountType === "faculty";
    });
  }

  function normalizeStatus(user) {
    const raw = String(user.status || user.accountStatus || "").toLowerCase();
    if (raw === "approved" || raw === "verified") return "approved";
    if (raw === "rejected") return "rejected";
    if (raw === "disabled") return "disabled";
    return "pending";
  }

  // ── STATS ──────────────────────────────────────────────────────────────────

  function updateStats(all) {
    if (totalEl) totalEl.textContent = all.length;
    if (pendingEl) pendingEl.textContent = all.filter(u => normalizeStatus(u) === "pending").length;
    if (approvedEl) approvedEl.textContent = all.filter(u => normalizeStatus(u) === "approved").length;
    if (rejectedEl) rejectedEl.textContent = all.filter(u => normalizeStatus(u) === "rejected").length;
  }

  // ── FILTERS ────────────────────────────────────────────────────────────────

  function getUniqueValues(items, key) {
    const values = new Set();
    items.forEach(item => { const v = String(item[key] || "").trim(); if (v && v !== "undefined") values.add(v); });
    return Array.from(values).sort();
  }

  function renderOptionList(select, values) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="all">All</option>` +
      values.map(v => `<option value="${v.toLowerCase()}" ${current === v.toLowerCase() ? "selected" : ""}>${v}</option>`).join("");
  }

  function renderFilters(all) {
    renderOptionList(collegeSelect, getUniqueValues(all, "college"));
  }

  function getFiltered(all) {
    return all.filter(user => {
      const status = normalizeStatus(user);
      const college = String(user.college || "").toLowerCase();
      const search = filterState.search.toLowerCase().trim();
      const matchesSearch = !search ||
        String(user.fullName || user.name || "").toLowerCase().includes(search) ||
        String(user.email || "").toLowerCase().includes(search) ||
        String(user.campusId || user.facultyId || "").toLowerCase().includes(search);
      const matchesStatus = filterState.status === "all" || filterState.status === status;
      const matchesCollege = filterState.college === "all" || college === filterState.college;
      return matchesSearch && matchesStatus && matchesCollege;
    });
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────

  function formatField(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "string" && value.includes("T") && value.includes("-")) {
      try {
        return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      } catch { return value; }
    }
    return String(value);
  }

  function buildStatusBadge(status) {
    const map = {
      approved: "request-card__badge--approved",
      pending: "request-card__badge--pending",
      rejected: "request-card__badge--rejected",
      disabled: "request-card__badge--rejected"
    };
    return `<span class="request-card__badge ${map[status] || "request-card__badge--pending"}">${status.toUpperCase()}</span>`;
  }

  function buildDocImages(user) {
    const parts = [];
    if (user.idPhotoUrl) parts.push(`<div class="request-card__image-block"><p class="request-card__image-label">Captured ID</p><img src="${user.idPhotoUrl}" alt="Faculty captured ID" style="max-width:100%;border-radius:6px;border:1px solid #ddd;" /></div>`);
    if (user.corPhotoUrl) parts.push(`<div class="request-card__image-block"><p class="request-card__image-label">Proof of Employment</p><img src="${user.corPhotoUrl}" alt="Proof of employment" style="max-width:100%;border-radius:6px;border:1px solid #ddd;" /></div>`);
    if (user.imageUrl) parts.push(`<div class="request-card__image-block"><p class="request-card__image-label">Uploaded document</p><img src="${user.imageUrl}" alt="Uploaded document" style="max-width:100%;border-radius:6px;border:1px solid #ddd;" /></div>`);
    return parts.length ? parts.join("") : `<em style="font-size:12px;color:#999">No documents captured yet.</em>`;
  }

  function renderCard(user) {
    const status = normalizeStatus(user);
    const displayId = user.campusId || user.facultyId || "—";
    const displayName = user.fullName || user.name || "—";

    return `
      <article class="request-card" data-user-id="${user.id}">
        <div class="request-card__header">
          <div>
            <h3 class="card-title">${displayName}</h3>
            <p class="card-subtitle">
              ${displayId} &nbsp;·&nbsp; Faculty &nbsp;·&nbsp; ${formatField(user.college)}
            </p>
          </div>
          ${buildStatusBadge(status)}
        </div>
        <div class="request-card__meta">
          <div class="request-card__item"><span class="request-card__label">Email</span><span class="request-card__value">${formatField(user.email)}</span></div>
          <div class="request-card__item"><span class="request-card__label">Mobile</span><span class="request-card__value">${formatField(user.phone)}</span></div>
          <div class="request-card__item"><span class="request-card__label">Department</span><span class="request-card__value">${formatField(user.college)}</span></div>
          <div class="request-card__item"><span class="request-card__label">Face Verified</span><span class="request-card__value">${user.faceVerified ? "Yes" : "Pending"}</span></div>
          <div class="request-card__item"><span class="request-card__label">Signup Path</span><span class="request-card__value">${user.signupPath ? "Path " + user.signupPath : "—"}</span></div>
          <div class="request-card__item"><span class="request-card__label">Submitted</span><span class="request-card__value">${formatField(user.createdAt || user.submittedAt)}</span></div>
          ${user.reviewedAt ? `<div class="request-card__item"><span class="request-card__label">Reviewed</span><span class="request-card__value">${formatField(user.reviewedAt)}</span></div>` : ""}
          ${user.flagged ? `<div class="request-card__item"><span class="request-card__label" style="color:#c00">Flagged</span><span class="request-card__value" style="color:#c00">Suspicious account</span></div>` : ""}
        </div>
        <div class="request-card__image">${buildDocImages(user)}</div>
        <div class="request-card__actions">
          ${status !== "approved" ? `<button class="btn btn--success btn--sm" type="button" data-action="approve" data-user="${user.id}">Approve</button>` : `<button class="btn btn--outline btn--sm" type="button" disabled>Approved</button>`}
          ${status !== "rejected" ? `<button class="btn btn--danger btn--sm" type="button" data-action="reject" data-user="${user.id}">Reject</button>` : `<button class="btn btn--outline btn--sm" type="button" disabled>Rejected</button>`}
          <button class="btn btn--outline btn--sm" type="button" data-action="flag" data-user="${user.id}">${user.flagged ? "Unflag" : "Flag Suspicious"}</button>
        </div>
      </article>`;
  }

  function renderRequests() {
    const all = getAllFaculty();
    const filtered = getFiltered(all);
    updateStats(all);
    renderFilters(all);
    if (!requestsContainer) return;
    if (filtered.length === 0) {
      requestsContainer.innerHTML = "";
      emptyState?.classList.add("active");
      return;
    }
    emptyState?.classList.remove("active");
    requestsContainer.innerHTML = filtered.map(renderCard).join("");
  }

  // ── ACTIONS ────────────────────────────────────────────────────────────────

  function updateUserStatus(id, newStatus) {
    const db = getDB();
    ["users", "authUsers"].forEach(key => {
      const arr = Array.isArray(db[key]) ? db[key] : [];
      const user = arr.find(item => item.id === id);
      if (!user) return;
      user.status = newStatus;
      user.accountStatus = newStatus === "approved" ? "verified" : newStatus;
      user.verified = newStatus === "approved";
      user.active = newStatus === "approved";
      user.reviewedAt = new Date().toISOString();
    });
    saveDB(db);

    try {
      const session = JSON.parse(localStorage.getItem("upressUser") || "null");
      if (session && session.id === id) {
        session.status = newStatus;
        session.accountStatus = newStatus === "approved" ? "verified" : newStatus;
        session.verified = newStatus === "approved";
        localStorage.setItem("upressUser", JSON.stringify(session));
      }
    } catch { /* ignore */ }

    if (newStatus === "approved") {
      notifyUser(id, `Your faculty account has been verified and approved. You now have full access to UPRESSease services.`, "success");
    } else if (newStatus === "rejected") {
      notifyUser(id, `Your faculty account verification was rejected. Please contact the admin for assistance.`, "error");
    }

    renderRequests();
  }

  function toggleFlagged(id) {
    const db = getDB();
    ["users", "authUsers"].forEach(key => {
      const arr = Array.isArray(db[key]) ? db[key] : [];
      const user = arr.find(item => item.id === id);
      if (user) user.flagged = !user.flagged;
    });
    saveDB(db);
    renderRequests();
  }

  function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.user;
    if (!id) return;
    if (action === "approve") updateUserStatus(id, "approved");
    else if (action === "reject") updateUserStatus(id, "rejected");
    else if (action === "flag") toggleFlagged(id);
  }

  function initFilters() {
    searchInput?.addEventListener("input", e => { filterState.search = e.target.value || ""; renderRequests(); });
    statusSelect?.addEventListener("change", e => { filterState.status = e.target.value; renderRequests(); });
    collegeSelect?.addEventListener("change", e => { filterState.college = e.target.value; renderRequests(); });
  }

  function init() {
    renderRequests();
    requestsContainer?.addEventListener("click", handleListClick);
    initFilters();
    window.addEventListener("storage", e => { if (e.key === "upressDB") renderRequests(); });
  }

  window.addEventListener("DOMContentLoaded", init);

})();