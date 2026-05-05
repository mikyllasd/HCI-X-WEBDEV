(function () {
  // Wait for storage.js to load
  function init() {
    if (typeof getDB === "undefined") {
      setTimeout(init, 10);
      return;
    }

    const db = getDB();
    const pageContainer = document.getElementById("pageContainer");
    const accountModal = document.getElementById("accountModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalSub = document.getElementById("modalSub");
    const modalApproveBtn = document.getElementById("modalApproveBtn");
    const modalRejectBtn = document.getElementById("modalRejectBtn");
    const modalFlagBtn = document.getElementById("modalFlagBtn");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalCancelBtn = document.getElementById("modalCancelBtn");

    let editingAccountId = null;
    let accountSearchQuery = "";
    let accountPage = 1;
    let accountTypeFilter = "all"; // all, faculty, student
    let collegeFilter = "all";
    let statusFilter = "all"; // all, approved, pending, disabled, rejected, suspicious
    const ACCOUNTS_PAGE_SIZE = 6;

    function generateAccountId() {
      return "account_" + Math.random().toString(36).substr(2, 9);
    }

    function getAccountInitials(name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    function renderAccounts() {
      const accountsSection = document.getElementById("accountsSection");
      if (!accountsSection) return;

      const filteredAccounts = db.facultyStudentAccounts.filter((account) => {
        const query = accountSearchQuery.trim().toLowerCase();
        if (
          query &&
          ![
            account.fullName,
            account.email,
            account.studentId || account.employeeId || "",
            account.college,
            account.department || "",
            account.course || "",
            account.yearLevel || "",
            account.role,
            account.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        ) {
          return false;
        }

        if (accountTypeFilter !== "all" && account.role !== accountTypeFilter) {
          return false;
        }

        if (collegeFilter !== "all" && account.college !== collegeFilter) {
          return false;
        }

        if (statusFilter !== "all" && account.status !== statusFilter) {
          return false;
        }

        return true;
      });

      const totalPages = Math.max(
        1,
        Math.ceil(filteredAccounts.length / ACCOUNTS_PAGE_SIZE),
      );
      accountPage = Math.min(Math.max(accountPage, 1), totalPages);
      const start = (accountPage - 1) * ACCOUNTS_PAGE_SIZE;
      const visibleAccounts = filteredAccounts.slice(
        start,
        start + ACCOUNTS_PAGE_SIZE,
      );

      const countEl = document.getElementById("accountsResultCount");
      if (countEl) {
        countEl.textContent = `${filteredAccounts.length} of ${db.facultyStudentAccounts.length} accounts`;
      }

      if (db.facultyStudentAccounts.length === 0) {
        accountsSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M16 11h6"/>
            </svg>
          </div>
          <div class="empty-state__title">No accounts yet</div>
          <div class="empty-state__sub">Faculty and student accounts will appear here once they sign up</div>
        </div>
      `;
        return;
      }

      if (filteredAccounts.length === 0) {
        accountsSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No accounts found</div>
          <div class="empty-state__sub">Try adjusting your filters or search terms</div>
        </div>
      `;
        return;
      }

      accountsSection.innerHTML = `
      <div class="accounts-grid">
        ${visibleAccounts
          .map(
            (account) => `
          <div class="account-card ${account.status} ${account.suspicious ? "suspicious" : ""}">
            ${account.suspicious ? '<div class="account-warning">!</div>' : ""}
            <div class="account-card-top">
              <div class="account-avatar">${getAccountInitials(account.fullName)}</div>
              <div class="account-status ${account.status}">
                <span>●</span>
                <span>${account.status.charAt(0).toUpperCase() + account.status.slice(1)}</span>
              </div>
            </div>
            <h3 class="account-name">${account.fullName}</h3>
            <p class="account-details">${account.role.charAt(0).toUpperCase() + account.role.slice(1)} • ${account.college}</p>
            <div class="account-meta">
              <div><strong>ID:</strong> ${account.studentId || account.employeeId || "N/A"}</div>
              <div><strong>Email:</strong> ${account.email}</div>
              ${
                account.role === "student"
                  ? `<div><strong>Course:</strong> ${account.course || "N/A"} • <strong>Year:</strong> ${account.yearLevel || "N/A"}</div>`
                  : `<div><strong>Department:</strong> ${account.department || "N/A"}</div>`
              }
              <div><strong>Joined:</strong> ${new Date(account.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="account-card-actions">
              <button class="account-action-btn" data-id="${account.id}" title="Review account">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Review
              </button>
              ${
                account.status === "pending" || account.status === "disabled"
                  ? `<button class="account-action-btn success" data-id="${account.id}" title="Approve account">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Approve
                </button>`
                  : ""
              }
              ${
                account.status === "approved"
                  ? `<button class="account-action-btn danger" data-id="${account.id}" title="Disable account">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Disable
                </button>`
                  : ""
              }
              ${
                !account.suspicious
                  ? `<button class="account-action-btn warning" data-id="${account.id}" title="Flag as suspicious">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Flag
                </button>`
                  : `<button class="account-action-btn" data-id="${account.id}" title="Remove suspicious flag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Unflag
                </button>`
              }
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="list-pagination" aria-label="Accounts pagination">
        <span class="list-pagination__summary">Page ${accountPage} of ${totalPages}</span>
        <div class="list-pagination__actions">
          <button type="button" class="btn btn-ghost btn-sm" id="accountsPrevPage" ${accountPage === 1 ? "disabled" : ""}>Previous</button>
          <button type="button" class="btn btn-ghost btn-sm" id="accountsNextPage" ${accountPage === totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
    `;

      document.querySelectorAll(".account-action-btn").forEach((btn) => {
        if (btn.title.includes("Review")) {
          btn.addEventListener("click", () => openReviewModal(btn.dataset.id));
        } else if (btn.title.includes("Approve")) {
          btn.addEventListener("click", () =>
            updateAccountStatus(btn.dataset.id, "approved"),
          );
        } else if (btn.title.includes("Disable")) {
          btn.addEventListener("click", () =>
            updateAccountStatus(btn.dataset.id, "disabled"),
          );
        } else if (btn.title.includes("Flag")) {
          btn.addEventListener("click", () =>
            toggleSuspiciousFlag(btn.dataset.id, true),
          );
        } else if (btn.title.includes("Unflag")) {
          btn.addEventListener("click", () =>
            toggleSuspiciousFlag(btn.dataset.id, false),
          );
        }
      });

      document
        .getElementById("accountsPrevPage")
        ?.addEventListener("click", () => {
          accountPage -= 1;
          renderAccounts();
        });

      document
        .getElementById("accountsNextPage")
        ?.addEventListener("click", () => {
          accountPage += 1;
          renderAccounts();
        });
    }

    function openReviewModal(accountId) {
      const account = db.facultyStudentAccounts.find((a) => a.id === accountId);
      if (!account) return;

      editingAccountId = accountId;
      modalTitle.textContent = `Review ${account.fullName}`;
      modalSub.textContent = `${account.role.charAt(0).toUpperCase() + account.role.slice(1)} Account Review`;

      document.getElementById("accountDetails").innerHTML = `
      <div class="account-details-grid">
        <div class="account-detail-item">
          <div class="account-detail-label">Full Name</div>
          <div class="account-detail-value">${account.fullName}</div>
        </div>
        <div class="account-detail-item">
          <div class="account-detail-label">Email</div>
          <div class="account-detail-value">${account.email}</div>
        </div>
        <div class="account-detail-item">
          <div class="account-detail-label">${account.role === "student" ? "Student ID" : "Employee ID"}</div>
          <div class="account-detail-value">${account.studentId || account.employeeId || "N/A"}</div>
        </div>
        <div class="account-detail-item">
          <div class="account-detail-label">Phone</div>
          <div class="account-detail-value">${account.phone || "N/A"}</div>
        </div>
        <div class="account-detail-item">
          <div class="account-detail-label">College</div>
          <div class="account-detail-value">${account.college}</div>
        </div>
        ${
          account.role === "student"
            ? `
          <div class="account-detail-item">
            <div class="account-detail-label">Course</div>
            <div class="account-detail-value">${account.course || "N/A"}</div>
          </div>
          <div class="account-detail-item">
            <div class="account-detail-label">Year Level</div>
            <div class="account-detail-value">${account.yearLevel || "N/A"}</div>
          </div>
        `
            : `
          <div class="account-detail-item">
            <div class="account-detail-label">Department</div>
            <div class="account-detail-value">${account.department || "N/A"}</div>
          </div>
        `
        }
        <div class="account-detail-item">
          <div class="account-detail-label">Status</div>
          <div class="account-detail-value">
            <span class="account-detail-status ${account.status}">${account.status.charAt(0).toUpperCase() + account.status.slice(1)}</span>
            ${account.suspicious ? '<span class="account-detail-status suspicious">Suspicious</span>' : ""}
          </div>
        </div>
        <div class="account-detail-item">
          <div class="account-detail-label">Joined</div>
          <div class="account-detail-value">${new Date(account.createdAt).toLocaleString()}</div>
        </div>
        ${
          account.idPhoto
            ? `
          <div class="account-detail-item">
            <div class="account-detail-label">ID Photo</div>
            <div class="account-detail-value">
              <img src="${account.idPhoto}" alt="ID Photo" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

      // Update button states based on current status
      modalApproveBtn.style.display =
        account.status === "pending" || account.status === "disabled"
          ? "inline-flex"
          : "none";
      modalRejectBtn.style.display =
        account.status !== "rejected" ? "inline-flex" : "none";
      modalFlagBtn.textContent = account.suspicious
        ? "Remove Suspicious Flag"
        : "Flag as Suspicious";

      accountModal.classList.add("open");
    }

    function closeModal() {
      accountModal.classList.remove("open");
      editingAccountId = null;
    }

    function updateAccountStatus(accountId, newStatus) {
      const account = db.facultyStudentAccounts.find((a) => a.id === accountId);
      if (account) {
        account.status = newStatus;
        if (newStatus === "approved") {
          account.suspicious = false; // Clear suspicious flag when approving
        }
        saveDB(db);
        showToast(`Account ${newStatus}`);
        closeModal();
        renderAccounts();
      }
    }

    function toggleSuspiciousFlag(accountId, flag) {
      const account = db.facultyStudentAccounts.find((a) => a.id === accountId);
      if (account) {
        account.suspicious = flag;
        saveDB(db);
        showToast(
          flag ? "Account flagged as suspicious" : "Suspicious flag removed",
        );
        if (!flag) closeModal();
        renderAccounts();
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

    function populateFilters() {
      const collegeSelect = document.getElementById("collegeFilter");
      const uniqueColleges = [
        ...new Set(db.facultyStudentAccounts.map((a) => a.college)),
      ].sort();

      collegeSelect.innerHTML =
        '<option value="all">All Colleges</option>' +
        uniqueColleges
          .map((college) => `<option value="${college}">${college}</option>`)
          .join("");
    }

    // Render initial page
    pageContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Faculty & Student Accounts</h1>
        <p class="page-sub">Manage faculty and student accounts with categorization and review</p>
      </div>
    </div>
    <div class="accounts-filters">
      <div class="filter-group">
        <label class="filter-label" for="accountTypeFilter">Account Type</label>
        <select class="filter-select" id="accountTypeFilter">
          <option value="all">All Types</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label" for="collegeFilter">College</label>
        <select class="filter-select" id="collegeFilter">
          <option value="all">All Colleges</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label" for="statusFilter">Status</label>
        <select class="filter-select" id="statusFilter">
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="disabled">Disabled</option>
          <option value="rejected">Rejected</option>
          <option value="suspicious">Suspicious</option>
        </select>
      </div>
    </div>
    <div class="list-toolbar">
      <label class="list-search" for="accountsSearchInput">
        <span>Search accounts</span>
        <input type="search" id="accountsSearchInput" class="list-search__input" placeholder="Search name, email, ID, college, course, department" />
      </label>
      <div class="list-toolbar__count" id="accountsResultCount">0 accounts</div>
    </div>
    <div id="accountsSection"></div>
  `;

    // Event listeners
    document
      .getElementById("accountTypeFilter")
      .addEventListener("change", (e) => {
        accountTypeFilter = e.target.value;
        accountPage = 1;
        renderAccounts();
      });

    document.getElementById("collegeFilter").addEventListener("change", (e) => {
      collegeFilter = e.target.value;
      accountPage = 1;
      renderAccounts();
    });

    document.getElementById("statusFilter").addEventListener("change", (e) => {
      statusFilter = e.target.value;
      accountPage = 1;
      renderAccounts();
    });

    document
      .getElementById("accountsSearchInput")
      .addEventListener("input", (event) => {
        accountSearchQuery = event.target.value;
        accountPage = 1;
        renderAccounts();
      });

    modalCloseBtn.addEventListener("click", closeModal);
    modalCancelBtn.addEventListener("click", closeModal);
    modalApproveBtn.addEventListener("click", () => {
      if (editingAccountId) updateAccountStatus(editingAccountId, "approved");
    });
    modalRejectBtn.addEventListener("click", () => {
      if (editingAccountId) updateAccountStatus(editingAccountId, "rejected");
    });
    modalFlagBtn.addEventListener("click", () => {
      if (editingAccountId) {
        const account = db.facultyStudentAccounts.find(
          (a) => a.id === editingAccountId,
        );
        if (account)
          toggleSuspiciousFlag(editingAccountId, !account.suspicious);
      }
    });

    accountModal.addEventListener("click", (e) => {
      if (e.target === accountModal) {
        closeModal();
      }
    });

    populateFilters();
    renderAccounts();

    // Seed some demo accounts if empty
    if (db.facultyStudentAccounts.length === 0) {
      const demoAccounts = [
        {
          id: generateAccountId(),
          fullName: "Dr. Maria Santos",
          email: "maria.santos@wmsu.edu.ph",
          employeeId: "EMP-2024-001",
          role: "faculty",
          college: "College of Computing Studies",
          department: "Computer Science",
          phone: "09123456789",
          status: "approved",
          suspicious: false,
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          id: generateAccountId(),
          fullName: "Juan Dela Cruz",
          email: "juan.delacruz@wmsu.edu.ph",
          studentId: "2024-00123",
          role: "student",
          college: "College of Computing Studies",
          course: "Bachelor of Science in Computer Science",
          yearLevel: "3rd Year",
          phone: "09987654321",
          status: "pending",
          suspicious: false,
          createdAt: "2024-02-01T14:30:00Z",
        },
        {
          id: generateAccountId(),
          fullName: "Ana Reyes",
          email: "ana.reyes@wmsu.edu.ph",
          studentId: "2024-00124",
          role: "student",
          college: "College of Business Administration",
          course: "Bachelor of Science in Business Administration",
          yearLevel: "4th Year",
          phone: "09112233445",
          status: "approved",
          suspicious: false,
          createdAt: "2024-01-20T09:15:00Z",
        },
        {
          id: generateAccountId(),
          fullName: "Prof. Carlos Mendoza",
          email: "carlos.mendoza@wmsu.edu.ph",
          employeeId: "EMP-2023-045",
          role: "faculty",
          college: "College of Engineering",
          department: "Electrical Engineering",
          phone: "09223344556",
          status: "disabled",
          suspicious: true,
          createdAt: "2023-08-10T11:45:00Z",
        },
        {
          id: generateAccountId(),
          fullName: "Pedro Garcia",
          email: "pedro.garcia@wmsu.edu.ph",
          studentId: "2024-00125",
          role: "student",
          college: "College of Engineering",
          course: "Bachelor of Science in Civil Engineering",
          yearLevel: "2nd Year",
          phone: "09334455667",
          status: "rejected",
          suspicious: false,
          createdAt: "2024-03-05T16:20:00Z",
        },
      ];

      db.facultyStudentAccounts = demoAccounts;
      saveDB(db);
    }
  }

  init();
})();
