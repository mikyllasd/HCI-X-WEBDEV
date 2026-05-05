(function () {
  const db = getDB();
  const totalAccountsEl = document.getElementById("infoTotalAccounts");
  const activeStudentsEl = document.getElementById("infoActiveStudents");
  const facultyAccountsEl = document.getElementById("infoFacultyAccounts");
  const pendingEl = document.getElementById("infoPending");
  const recordsBody = document.getElementById("informationRecordsBody");
  const emptyState = document.getElementById("informationEmptyState");
  const chartCanvas = document.getElementById("informationChart");

  const roleSelect = document.getElementById("infoRole");
  const organizationSelect = document.getElementById("infoOrganization");
  const collegeSelect = document.getElementById("infoCollege");
  const courseSelect = document.getElementById("infoCourse");
  const yearLevelSelect = document.getElementById("infoYearLevel");
  const studentTypeSelect = document.getElementById("infoStudentType");

  let distributionChart = null;

  function normalizeStatus(user) {
    const status = String(user.status || "pending").toLowerCase();
    if (["approved", "rejected", "disabled", "pending"].includes(status)) {
      return status;
    }
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

  function normalizeType(user) {
    return (
      String(user.type || user.studentType || user.accountType || "regular")
        .trim()
        .toLowerCase() || "regular"
    );
  }

  function formatValue(value) {
    return value ? String(value) : "Unknown";
  }

  function getUsers() {
    return (db.users || []).map((user) => ({
      ...user,
      role: normalizeRole(user),
      status: normalizeStatus(user),
      studentType: normalizeType(user),
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
    const roleFilter = roleSelect?.value || "all";
    const organizationFilter = organizationSelect?.value || "all";
    const collegeFilter = collegeSelect?.value || "all";
    const courseFilter = courseSelect?.value || "all";
    const yearFilter = yearLevelSelect?.value || "all";
    const studentTypeFilter = studentTypeSelect?.value || "all";

    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (
        organizationFilter !== "all" &&
        user.organization.toLowerCase() !== organizationFilter
      )
        return false;
      if (
        collegeFilter !== "all" &&
        user.college.toLowerCase() !== collegeFilter
      )
        return false;
      if (courseFilter !== "all" && user.course.toLowerCase() !== courseFilter)
        return false;
      if (yearFilter !== "all" && user.yearLevel.toLowerCase() !== yearFilter)
        return false;
      if (studentTypeFilter !== "all" && user.studentType !== studentTypeFilter)
        return false;
      return true;
    });
  }

  function updateSummary(users) {
    const total = users.length;
    const activeStudents = users.filter(
      (user) =>
        user.role === "student" &&
        user.status === "approved" &&
        user.active !== false,
    ).length;
    const facultyCount = users.filter((user) => user.role === "faculty").length;
    const pending = users.filter((user) => user.status === "pending").length;

    if (totalAccountsEl) totalAccountsEl.textContent = total;
    if (activeStudentsEl) activeStudentsEl.textContent = activeStudents;
    if (facultyAccountsEl) facultyAccountsEl.textContent = facultyCount;
    if (pendingEl) pendingEl.textContent = pending;
  }

  function buildCollegeDistribution(users) {
    const distribution = {};
    users.forEach((user) => {
      if (!user.college) return;
      distribution[user.college] = (distribution[user.college] || 0) + 1;
    });
    return distribution;
  }

  function renderChart(users) {
    if (!chartCanvas) return;

    const distribution = buildCollegeDistribution(users);
    const labels = Object.keys(distribution);
    const data = labels.map((label) => distribution[label]);

    if (distributionChart) {
      distributionChart.destroy();
    }

    distributionChart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Accounts",
            data,
            backgroundColor: "#60a5fa",
            borderRadius: 8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: "#475569" } },
          y: {
            grid: { color: "rgba(148,163,184,0.16)" },
            ticks: { color: "#475569", stepSize: 1 },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  function renderRecords(users) {
    if (!recordsBody) return;
    if (users.length === 0) {
      recordsBody.innerHTML =
        '<tr><td colspan="8" class="text-center">No user records found.</td></tr>';
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
        <tr>
          <td>${formatValue(user.fullName || user.email || "Unknown")}</td>
          <td>${String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1)}</td>
          <td>${formatValue(user.organization)}</td>
          <td>${formatValue(user.college)}</td>
          <td>${formatValue(user.course)}</td>
          <td>${formatValue(user.yearLevel)}</td>
          <td>${String(user.studentType).replace(/\b\w/g, (c) => c.toUpperCase())}</td>
          <td>${String(user.status).toUpperCase()}</td>
        </tr>
      `,
      )
      .join("");
  }

  function applyFilters() {
    const filtered = filterUsers(getUsers());
    updateSummary(filtered);
    renderChart(filtered);
    renderRecords(filtered);
  }

  function init() {
    updateFilters();
    applyFilters();
    [
      roleSelect,
      organizationSelect,
      collegeSelect,
      courseSelect,
      yearLevelSelect,
      studentTypeSelect,
    ].forEach((input) => {
      if (input) input.addEventListener("change", applyFilters);
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
