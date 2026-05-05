(function () {
  // Wait for storage.js to load
  function init() {
    if (typeof getDB === "undefined") {
      setTimeout(init, 10);
      return;
    }

    const db = getDB();
    const pageContainer = document.getElementById("pageContainer");
    const userModal = document.getElementById("userModal");
    const userForm = document.getElementById("userForm");
    const modalTitle = document.getElementById("modalTitle");
    const modalSub = document.getElementById("modalSub");
    const modalSaveBtn = document.getElementById("modalSaveBtn");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalCancelBtn = document.getElementById("modalCancelBtn");
    const formCollege = document.getElementById("formCollege");
    const formOrganization = document.getElementById("formOrganization");

    let editingUserId = null;
    let userSearchQuery = "";
    let userPage = 1;
    let userTab = "active"; // active, disabled, removed
    let selectedAcademicYear = db.academicYear || "";
    const USERS_PAGE_SIZE = 6;

    function generateUserId() {
      return "user_" + Math.random().toString(36).substr(2, 9);
    }

    function getUserInitials(name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    function syncAddUserButton() {
      const btn = document.getElementById("addUserBtn");
      if (!btn) return;
      const ok = !!db.academicYear;
      btn.disabled = !ok;
      btn.setAttribute("aria-disabled", ok ? "false" : "true");
      btn.title = ok
        ? ""
        : "Set the academic year in System Settings before adding users.";
    }

    function renderUsers() {
      const usersSection = document.getElementById("usersSection");
      if (!usersSection) return;

      syncAddUserButton();

      if (!db.academicYear) {
        usersSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div class="empty-state__title">Academic Year Not Set</div>
          <div class="empty-state__sub">Please set the academic year in System Settings before adding users.</div>
          <a href="settings.html" class="sd-hero__cta" style="margin-top: 16px; display: inline-block;">Go to Settings</a>
        </div>
      `;
        return;
      }

      // Get users based on selected academic year and tab
      let usersToShow = [];
      if (selectedAcademicYear === db.academicYear) {
        // Current year - show from active database
        if (userTab === "active") {
          usersToShow = db.users.filter((u) => !u.suspended && !u.deleted);
        } else if (userTab === "disabled") {
          usersToShow = db.users.filter((u) => u.suspended && !u.deleted);
        } else if (userTab === "removed") {
          usersToShow = db.users.filter((u) => u.deleted);
        }
      } else if (db.archives[selectedAcademicYear]) {
        // Archived year - show from archives
        const archivedUsers = db.archives[selectedAcademicYear].users || [];
        if (userTab === "active") {
          usersToShow = archivedUsers.filter((u) => !u.suspended && !u.deleted);
        } else if (userTab === "disabled") {
          usersToShow = archivedUsers.filter((u) => u.suspended && !u.deleted);
        } else if (userTab === "removed") {
          usersToShow = archivedUsers.filter((u) => u.deleted);
        }
      }

      // Apply search filter
      const filteredUsers = usersToShow.filter((user) => {
        const query = userSearchQuery.trim().toLowerCase();
        if (!query) return true;
        return [
          user.fullName,
          user.email,
          user.username,
          user.role,
          user.college,
          user.organization,
          user.suspended ? "suspended" : "active",
          user.deleted ? "deleted" : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

      const totalPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / USERS_PAGE_SIZE),
      );
      userPage = Math.min(Math.max(userPage, 1), totalPages);
      const start = (userPage - 1) * USERS_PAGE_SIZE;
      const visibleUsers = filteredUsers.slice(start, start + USERS_PAGE_SIZE);

      const countEl = document.getElementById("usersResultCount");
      if (countEl) {
        const tabLabel = userTab.charAt(0).toUpperCase() + userTab.slice(1);
        countEl.textContent = `${filteredUsers.length} ${tabLabel.toLowerCase()} users`;
      }

      if (usersToShow.length === 0) {
        const tabLabel = userTab.charAt(0).toUpperCase() + userTab.slice(1);
        usersSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No ${tabLabel.toLowerCase()} users</div>
          <div class="empty-state__sub">No ${tabLabel.toLowerCase()} staff/admin users found for ${selectedAcademicYear}.</div>
        </div>
      `;
        return;
      }

      if (filteredUsers.length === 0) {
        const tabLabel = userTab.charAt(0).toUpperCase() + userTab.slice(1);
        usersSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No users found</div>
          <div class="empty-state__sub">Try a different search term for ${tabLabel.toLowerCase()} users.</div>
        </div>
      `;
        return;
      }

      usersSection.innerHTML = `
      <div class="users-grid">
        ${visibleUsers
          .map(
            (user) => `
          <div class="user-card role-${user.role} ${user.suspended ? "suspended" : ""} ${user.deleted ? "deleted" : ""}">
            <div class="user-card-top">
              <div style="flex: 1;">
                <div class="user-avatar">${getUserInitials(user.fullName)}</div>
              </div>
              <div class="user-status ${user.suspended ? "suspended" : user.deleted ? "deleted" : "active"}">
                <span>●</span>
                <span>${user.deleted ? "Removed" : user.suspended ? "Suspended" : "Active"}</span>
              </div>
            </div>
            <h3 class="user-name">${user.fullName}</h3>
            <p class="user-role">${user.role}</p>
            ${user.college ? `<p class="user-meta">College: ${user.college}</p>` : ""}
            ${user.organization ? `<p class="user-meta">Organization: ${user.organization}</p>` : ""}
            <p class="user-email">${user.email}</p>
            <p class="user-username">@${user.username}</p>
            <div class="user-card-actions">
              ${
                selectedAcademicYear === db.academicYear && !user.deleted
                  ? `
                <button class="user-action-btn edit-btn" data-id="${user.id}" title="Edit user">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button class="user-action-btn ${user.suspended ? "" : "danger"} suspend-btn" data-id="${user.id}" title="${user.suspended ? "Reactivate user" : "Suspend user"}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  ${user.suspended ? "Reactivate" : "Suspend"}
                </button>
                <button class="user-action-btn danger delete-btn" data-id="${user.id}" title="Remove user">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Remove
                </button>
              `
                  : `
                <div class="user-card-meta">
                  <small>Archived from ${selectedAcademicYear}</small>
                </div>
              `
              }
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="list-pagination" aria-label="Users pagination">
        <span class="list-pagination__summary">Page ${userPage} of ${totalPages}</span>
        <div class="list-pagination__actions">
          <button type="button" class="btn btn-ghost btn-sm" id="usersPrevPage" ${userPage === 1 ? "disabled" : ""}>Previous</button>
          <button type="button" class="btn btn-ghost btn-sm" id="usersNextPage" ${userPage === totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
    `;

      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => openEditModal(btn.dataset.id));
      });

      document.querySelectorAll(".suspend-btn").forEach((btn) => {
        btn.addEventListener("click", () =>
          toggleUserSuspension(btn.dataset.id),
        );
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteUser(btn.dataset.id));
      });

      document
        .getElementById("usersPrevPage")
        ?.addEventListener("click", () => {
          userPage -= 1;
          renderUsers();
        });

      document
        .getElementById("usersNextPage")
        ?.addEventListener("click", () => {
          userPage += 1;
          renderUsers();
        });
    }

    function openAddModal() {
      if (!db.academicYear) {
        showToast(
          "Set the academic year in System Settings before adding users.",
        );
        return;
      }
      editingUserId = null;
      modalTitle.textContent = "Add User";
      modalSub.textContent = "Create a new system user";
      modalSaveBtn.textContent = "Save User";
      userForm.reset();
      userModal.classList.add("open");
    }

    function openEditModal(userId) {
      const user = db.users.find((u) => u.id === userId);
      if (!user) return;

      editingUserId = userId;
      modalTitle.textContent = "Edit User";
      modalSub.textContent = "Update user information";
      modalSaveBtn.textContent = "Update User";

      document.getElementById("formFullName").value = user.fullName;
      document.getElementById("formEmail").value = user.email;
      document.getElementById("formUsername").value = user.username;
      document.getElementById("formRole").value = user.role;
      document.getElementById("formCollege").value = user.college || "";
      document.getElementById("formOrganization").value =
        user.organization || "";

      userModal.classList.add("open");
    }

    function closeModal() {
      userModal.classList.remove("open");
      editingUserId = null;
      userForm.reset();
    }

    function saveUser() {
      const fullName = document.getElementById("formFullName").value.trim();
      const email = document.getElementById("formEmail").value.trim();
      const username = document.getElementById("formUsername").value.trim();
      const role = document.getElementById("formRole").value;
      const college = document.getElementById("formCollege").value.trim();
      const organization = document
        .getElementById("formOrganization")
        .value.trim();

      if (!fullName || !email || !username || !role) {
        showToast("Please fill in all fields");
        return;
      }

      if (editingUserId) {
        const userIndex = db.users.findIndex((u) => u.id === editingUserId);
        if (userIndex !== -1) {
          db.users[userIndex] = {
            ...db.users[userIndex],
            fullName,
            email,
            username,
            role,
            college,
            organization,
          };
        }
        showToast("User updated successfully");
      } else {
        const newUser = {
          id: generateUserId(),
          fullName,
          email,
          username,
          role,
          college,
          organization,
          suspended: false,
          createdAt: new Date().toISOString(),
        };
        db.users.push(newUser);
        showToast("User added successfully");
      }

      saveDB(db);
      closeModal();
      renderUsers();
    }

    function toggleUserSuspension(userId) {
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.suspended = !user.suspended;
        saveDB(db);
        showToast(user.suspended ? "User suspended" : "User reactivated");
        renderUsers();
      }
    }

    function deleteUser(userId) {
      if (
        confirm(
          "Are you sure you want to remove this user? The user will be marked as removed and can be viewed in the 'Removed' tab.",
        )
      ) {
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.deleted = true;
          user.deletedAt = new Date().toISOString();
          saveDB(db);
          showToast("User removed successfully");
          renderUsers();
        }
      }
    }

    function showToast(message) {
      const toast = document.getElementById("toast");
      const toastMsg = document.getElementById("toastMsg");
      toastMsg.textContent = message;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }

    // Render initial page
    pageContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Manage Users</h1>
        <p class="page-sub">Add, edit, and manage staff/admin users</p>
      </div>
      <button class="btn btn-primary" id="addUserBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add User
      </button>
    </div>
    <div class="users-filters">
      <div class="users-tabs">
        <button class="tab-btn ${userTab === "active" ? "active" : ""}" data-tab="active">Active Users</button>
        <button class="tab-btn ${userTab === "disabled" ? "active" : ""}" data-tab="disabled">Disabled Users</button>
        <button class="tab-btn ${userTab === "removed" ? "active" : ""}" data-tab="removed">Removed Users</button>
      </div>
      <div class="academic-year-selector">
        <label for="academicYearSelect">Academic Year:</label>
        <select id="academicYearSelect" class="form-select">
          ${db.academicYear ? `<option value="${db.academicYear}">${db.academicYear}</option>` : ""}
          ${Object.keys(db.archives || {})
            .filter((year) => year !== db.academicYear)
            .map(
              (year) =>
                `<option value="${year}" ${selectedAcademicYear === year ? "selected" : ""}>${year}</option>`,
            )
            .join("")}
        </select>
      </div>
    </div>
    <div class="list-toolbar">
      <label class="list-search" for="usersSearchInput">
        <span>Search users</span>
        <input type="search" id="usersSearchInput" class="list-search__input" placeholder="Search name, email, username, role, college, organization, or status" />
      </label>
      <div class="list-toolbar__count" id="usersResultCount">0 users</div>
    </div>
    <div id="usersSection"></div>
  `;

    document
      .getElementById("addUserBtn")
      .addEventListener("click", openAddModal);
    document
      .getElementById("usersSearchInput")
      .addEventListener("input", (event) => {
        userSearchQuery = event.target.value;
        userPage = 1;
        renderUsers();
      });

    // Tab switching
    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("tab-btn")) {
        userTab = event.target.dataset.tab;
        userPage = 1;
        renderUsers();
        // Update active tab styling
        document
          .querySelectorAll(".tab-btn")
          .forEach((btn) => btn.classList.remove("active"));
        event.target.classList.add("active");
      }
    });

    // Academic year selection
    document
      .getElementById("academicYearSelect")
      .addEventListener("change", (event) => {
        selectedAcademicYear = event.target.value;
        userPage = 1;
        renderUsers();
      });

    modalCloseBtn.addEventListener("click", closeModal);
    modalCancelBtn.addEventListener("click", closeModal);
    modalSaveBtn.addEventListener("click", saveUser);
    userForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveUser();
    });

    userModal.addEventListener("click", (e) => {
      if (e.target === userModal) {
        closeModal();
      }
    });

    renderUsers();
  }

  init();
})();
