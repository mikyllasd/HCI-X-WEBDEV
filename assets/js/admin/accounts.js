(function () {
  const db = getDB();
  const activeEl = document.getElementById("accountsActive");
  const disabledEl = document.getElementById("accountsDisabled");
  const rejectedEl = document.getElementById("accountsRejected");
  const flaggedEl = document.getElementById("accountsFlagged");
  const recordsBody = document.getElementById("accountsRecordsBody");
  const emptyState = document.getElementById("accountsEmptyState");

  const roleSelect = document.getElementById("accountsRole");
  const organizationSelect = document.getElementById("accountsOrganization");
  const collegeSelect = document.getElementById("accountsCollege");
  const courseSelect = document.getElementById("accountsCourse");
  const yearLevelSelect = document.getElementById("accountsYearLevel");

  function normalizeStatus(user) {
    const status = String(user.status || "pending").toLowerCase();
    if (["approved", "rejected", "disabled"].includes(status)) return status;
    return "pending";
  }

  function normalizeRole(user) {
    const role = String(
      user.role || user.accountType || "student",
    ).toLowerCase();
    if (role.includes("faculty") || role.includes("staff")) return "faculty";
    if (role.includes("organization") || role.includes("org"))
      return "organization";
    return "student";
  }

  function normalizeOrganization(user) {
    return String(
      user.organization || user.organizationName || user.org || "",
    ).trim();
  }

  function isDisabled(user) {
    return user.disabled === true || normalizeStatus(user) === "disabled";
  }

  function isActive(user) {
    if (user.active === true) return true;
    if (isDisabled(user)) return false;
    return normalizeStatus(user) === "approved";
  }

  function isFlagged(user) {
    return user.flagged === true;
  }

  function formatValue(value) {
    return value ? String(value) : "Unknown";
  }

  function getUsers() {
    return (db.users || []).map((user) => ({
      ...user,
      role: normalizeRole(user),
      status: normalizeStatus(user),
      disabled: isDisabled(user),
      active: isActive(user),
      flagged: isFlagged(user),
      college: formatValue(user.college),
      organization: formatValue(normalizeOrganization(user)),
      course: formatValue(user.course),
      yearLevel: formatValue(user.yearLevel),
    }));
  }

  function getUniqueValues(items, key) {
    return Array.from(
      new Set(
        items.map((item) => String(item[key] || "").trim()).filter(Boolean),
      ),
    ).sort();
  }

  function renderOptions(select, values, label) {
    if (!select) return;
    const currentValue = select.value || "all";
    select.innerHTML =
      `<option value="all">All ${label}</option>` +
      values
        .map(
          (value) => `<option value="${value.toLowerCase()}">${value}</option>`,
        )
        .join("");
    if (values.map((value) => value.toLowerCase()).includes(currentValue)) {
      select.value = currentValue;
    }
  }

  function updateFilters() {
    const users = getUsers();
    renderOptions(roleSelect, ["Student", "Faculty", "Organization"], "Roles");
    renderOptions(
      organizationSelect,
      getUniqueValues(users, "organization"),
      "Organizations",
    );
    renderOptions(collegeSelect, getUniqueValues(users, "college"), "Colleges");
    renderOptions(courseSelect, getUniqueValues(users, "course"), "Programs");
    renderOptions(
      yearLevelSelect,
      getUniqueValues(users, "yearLevel"),
      "Year Levels",
    );
  }

  function filterUsers(users) {
    const role = roleSelect?.value || "all";
    const organization = organizationSelect?.value || "all";
    const college = collegeSelect?.value || "all";
    const course = courseSelect?.value || "all";
    const year = yearLevelSelect?.value || "all";
    return users.filter((user) => {
      if (role !== "all" && user.role !== role) return false;
      if (
        organization !== "all" &&
        user.organization.toLowerCase() !== organization
      )
        return false;
      if (college !== "all" && user.college.toLowerCase() !== college)
        return false;
      if (course !== "all" && user.course.toLowerCase() !== course)
        return false;
      if (year !== "all" && user.yearLevel.toLowerCase() !== year) return false;
      return true;
    });
  }

  function updateSummary(users) {
    const active = users.filter((user) => user.active).length;
    const disabled = users.filter((user) => user.disabled).length;
    const rejected = users.filter((user) => user.status === "rejected").length;
    const flagged = users.filter((user) => user.flagged).length;

    if (activeEl) activeEl.textContent = active;
    if (disabledEl) disabledEl.textContent = disabled;
    if (rejectedEl) rejectedEl.textContent = rejected;
    if (flaggedEl) flaggedEl.textContent = flagged;
  }

  function renderRecords(users) {
    if (!recordsBody) return;
    if (users.length === 0) {
      recordsBody.innerHTML =
        '<tr><td colspan="9" class="text-center">No accounts found.</td></tr>';
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");
    recordsBody.innerHTML = users
      .sort((a, b) =>
        String(a.fullName || "").localeCompare(String(b.fullName || "")),
      )
      .map(
        (user) => `
        <tr data-user-id="${user.id}">
          <td>${formatValue(user.fullName || user.email)}</td>
          <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
          <td>${formatValue(user.organization)}</td>
          <td>${formatValue(user.college)}</td>
          <td>${formatValue(user.course)}</td>
          <td>${formatValue(user.yearLevel)}</td>
          <td>${String(user.status).toUpperCase()}</td>
          <td>${user.flagged ? "Yes" : "No"}</td>
          <td><div class="accounts-button-group"><button type="button" class="btn btn--outline btn--sm" data-action="toggle-disable" data-id="${user.id}">${user.disabled ? "Enable" : "Disable"}</button><button type="button" class="btn btn--danger btn--sm accounts-button accounts-button--flagged" data-action="toggle-flag" data-id="${user.id}">${user.flagged ? "Unflag" : "Flag"}</button></div></td>
        </tr>
      `,
      )
      .join("");
  }

  function saveUserUpdate(id, updates) {
    const index = (db.users || []).findIndex((user) => user.id === id);
    if (index === -1) return false;
    db.users[index] = {
      ...db.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDB(db);
    return true;
  }

  function handleTableClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id) return;

    const user = (db.users || []).find((item) => item.id === id);
    if (!user) return;

    if (action === "toggle-disable") {
      saveUserUpdate(id, {
        disabled: !isDisabled(user),
        active: isDisabled(user) ? true : false,
      });
    }
    if (action === "toggle-flag") {
      saveUserUpdate(id, { flagged: !isFlagged(user) });
    }
    refresh();
  }

  function refresh() {
    const users = filterUsers(getUsers());
    updateSummary(users);
    renderRecords(users);
  }

  function init() {
    updateFilters();
    refresh();
    if (roleSelect) roleSelect.addEventListener("change", refresh);
    if (organizationSelect)
      organizationSelect.addEventListener("change", refresh);
    if (collegeSelect) collegeSelect.addEventListener("change", refresh);
    if (courseSelect) courseSelect.addEventListener("change", refresh);
    if (yearLevelSelect) yearLevelSelect.addEventListener("change", refresh);
    recordsBody?.addEventListener("click", handleTableClick);
  }

  window.addEventListener("DOMContentLoaded", init);
})();
