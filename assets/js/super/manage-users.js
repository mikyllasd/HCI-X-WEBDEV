/* ============================================================
   UPRESSease Admin Portal – Manage Users Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");
  const modalBackdrop = document.getElementById("modalBackdrop");

  // ── Modal helpers ──
  function openModal() {
    modalBackdrop.classList.add("open");
  }
  function closeModal() {
    modalBackdrop.classList.remove("open");
    clearModalForm();
  }
  function clearModalForm() {
    ["newUsername", "newFullName", "newEmail", "newPassword"].forEach((id) => {
      document.getElementById(id).value = "";
    });
    document.getElementById("newRole").value = "Admin";
  }

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalCancel").addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.getElementById("togglePassword").addEventListener("click", () => {
    const pw = document.getElementById("newPassword");
    pw.type = pw.type === "password" ? "text" : "password";
  });

  document.getElementById("modalSubmit").addEventListener("click", () => {
    const username = document.getElementById("newUsername").value.trim();
    const fullName = document.getElementById("newFullName").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("newPassword").value;
    const role = document.getElementById("newRole").value;

    const usernameInput = document.getElementById("newUsername");
    if (!username) {
      usernameInput.style.borderColor = "var(--red)";
      usernameInput.focus();
      return;
    }
    if (!fullName) {
      document.getElementById("newFullName").focus();
      return;
    }
    if (!email) {
      document.getElementById("newEmail").focus();
      return;
    }
    if (!password) {
      document.getElementById("newPassword").focus();
      return;
    }

    usernameInput.style.borderColor = "";
    state.users.push({ username, fullName, email, role });
    persistState();
    closeModal();
    showToast("User added successfully!");
    renderUsers();
  });

  // ── Render ──
  function userCard(u, i) {
    const roleClass = u.role === "Admin" ? "admin" : "staff";
    const suspendedStyle = u.suspended ? "opacity:0.55;" : "";
    return `
      <div class="user-card" style="${suspendedStyle}">
        <div class="user-card-top">
          <div>
            <div class="user-name">${u.fullName.toUpperCase()}</div>
            <div class="user-handle-sm">@${u.username}</div>
          </div>
          <span class="role-badge ${roleClass}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${u.role}
          </span>
        </div>
        <div class="user-email">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          ${u.email}
        </div>
        <div class="user-actions">
          <button class="action-btn edit" data-idx="${i}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="action-btn suspend" data-idx="${i}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            ${u.suspended ? "Restore" : "Suspend"}
          </button>
          <button class="action-btn delete" data-idx="${i}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderUsers() {
    const usersHTML =
      state.users.length === 0
        ? `<div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div class="empty-title">No users yet</div>
            <div class="empty-desc">Add admin or staff users to get started</div>
           </div>`
        : `<div class="users-grid">${state.users.map((u, i) => userCard(u, i)).join("")}</div>`;

    pageContainer.innerHTML = `
      <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <h1 class="page-title">Manage Users</h1>
          <p class="page-sub">Add, edit, suspend, or delete admin and staff accounts</p>
        </div>
        <button class="btn btn-primary" id="addUserBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Add User
        </button>
      </div>
      <div class="card"><div class="card-body" style="padding:0">${usersHTML}</div></div>
    `;

    document.getElementById("addUserBtn").addEventListener("click", openModal);

    pageContainer.querySelectorAll(".action-btn.delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        state.users.splice(idx, 1);
        persistState();
        showToast("User removed.");
        renderUsers();
      });
    });

    pageContainer.querySelectorAll(".action-btn.suspend").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        state.users[idx].suspended = !state.users[idx].suspended;
        persistState();
        showToast(
          state.users[idx].suspended ? "User suspended." : "User restored.",
        );
        renderUsers();
      });
    });
  }

  renderUsers();
})();
