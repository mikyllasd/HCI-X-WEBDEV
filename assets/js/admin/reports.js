(function () {
  const db = getDB();
  const recordsBody = document.getElementById("reportsRecordsBody");
  const totalSalesEl = document.getElementById("reportsTotalSales");
  const gcashSalesEl = document.getElementById("reportsGCashSales");
  const creditSalesEl = document.getElementById("reportsCreditSales");
  const verifiedUsersEl = document.getElementById("reportsVerifiedUsers");
  const dailyEl = document.getElementById("reportsDaily");
  const weeklyEl = document.getElementById("reportsWeekly");
  const monthlyEl = document.getElementById("reportsMonthly");
  const semesterEl = document.getElementById("reportsSemester");
  const paymentChartCanvas = document.getElementById("reportsPaymentChart");
  const emptyState = document.getElementById("reportsEmptyState");

  const paymentTypeSelect = document.getElementById("reportsPaymentType");
  const userTypeSelect = document.getElementById("reportsUserType");
  const collegeSelect = document.getElementById("reportsCollege");
  const courseSelect = document.getElementById("reportsCourse");
  const yearLevelSelect = document.getElementById("reportsYearLevel");
  const startDateInput = document.getElementById("reportsStartDate");
  const endDateInput = document.getElementById("reportsEndDate");

  let paymentChart = null;

  function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function toMoney(amount) {
    return `₱${Number(amount || 0).toFixed(2)}`;
  }

  function normalizeStatus(status) {
    const value = String(status || "").toLowerCase();
    return ["completed", "paid"].includes(value) ? "completed" : value;
  }

  function getUserType(user) {
    const value = String(
      user.type || user.accountType || user.role || "student",
    ).toLowerCase();
    if (value.includes("faculty")) return "faculty";
    return "student";
  }

  function getPaymentType(transaction) {
    const value = String(
      transaction.paymentType ||
        transaction.paymentMethod ||
        transaction.payment ||
        transaction.method ||
        "",
    ).toLowerCase();
    if (value.includes("gcash") || value.includes("online")) return "gcash";
    if (
      value.includes("credit") ||
      value.includes("pay onsite") ||
      value.includes("cash")
    )
      return "credit";
    return "other";
  }

  function inDateRange(date, start, end) {
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  function getCurrentAcademicTransactions() {
    return (db.transactions || []).filter((transaction) => {
      const date = parseDate(transaction.date);
      return (
        date &&
        (!db.academicYear || transaction.academicYear === db.academicYear)
      );
    });
  }

  function getFilteredTransactions() {
    const transactions = getCurrentAcademicTransactions().filter(
      (transaction) => normalizeStatus(transaction.status) === "completed",
    );
    const paymentType = paymentTypeSelect?.value || "all";
    const userType = userTypeSelect?.value || "all";
    const college = collegeSelect?.value || "all";
    const course = courseSelect?.value || "all";
    const yearLevel = yearLevelSelect?.value || "all";
    const startDate = parseDate(startDateInput?.value);
    const endDate = parseDate(endDateInput?.value);

    return transactions.filter((transaction) => {
      const type = getPaymentType(transaction);
      if (paymentType !== "all" && type !== paymentType) return false;

      const user =
        (db.users || []).find(
          (item) =>
            item.email === transaction.email || item.id === transaction.userId,
        ) || {};
      const typeFilter = getUserType(user);
      if (userType !== "all" && typeFilter !== userType) return false;

      const collegeValue = String(user.college || "").toLowerCase();
      if (college !== "all" && collegeValue !== college) return false;

      const courseValue = String(user.course || "").toLowerCase();
      if (course !== "all" && courseValue !== course) return false;

      const yearValue = String(user.yearLevel || "").toLowerCase();
      if (yearLevel !== "all" && yearValue !== yearLevel) return false;

      const date = parseDate(transaction.date);
      return inDateRange(date, startDate, endDate);
    });
  }

  function getSummaryMetrics(transactions) {
    const today = new Date();
    const dailyStart = new Date(today);
    dailyStart.setHours(0, 0, 0, 0);
    const dailyEnd = new Date(today);
    dailyEnd.setHours(23, 59, 59, 999);

    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const semesterStart = new Date(
      today.getFullYear(),
      today.getMonth() <= 5 ? 0 : 6,
      1,
    );
    const semesterEnd = new Date(
      today.getFullYear(),
      today.getMonth() <= 5 ? 5 : 11,
      31,
      23,
      59,
      59,
      999,
    );

    const totals = {
      total: 0,
      gcash: 0,
      credit: 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
      semester: 0,
    };

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount || 0);
      const paymentType = getPaymentType(transaction);
      const date = parseDate(transaction.date);
      totals.total += amount;
      if (paymentType === "gcash") totals.gcash += amount;
      if (paymentType === "credit") totals.credit += amount;
      if (date && date >= dailyStart && date <= dailyEnd)
        totals.daily += amount;
      if (date && date >= weekStart && date <= weekEnd) totals.weekly += amount;
      if (date && date >= monthStart && date <= monthEnd)
        totals.monthly += amount;
      if (date && date >= semesterStart && date <= semesterEnd)
        totals.semester += amount;
    });

    return totals;
  }

  function updateSummaryCards(transactions) {
    const metrics = getSummaryMetrics(transactions);
    if (totalSalesEl) totalSalesEl.textContent = toMoney(metrics.total);
    if (gcashSalesEl) gcashSalesEl.textContent = toMoney(metrics.gcash);
    if (creditSalesEl) creditSalesEl.textContent = toMoney(metrics.credit);
    if (verifiedUsersEl)
      verifiedUsersEl.textContent = (db.users || []).filter(
        (user) => String(user.status || "").toLowerCase() === "approved",
      ).length;
    if (dailyEl) dailyEl.textContent = toMoney(metrics.daily);
    if (weeklyEl) weeklyEl.textContent = toMoney(metrics.weekly);
    if (monthlyEl) monthlyEl.textContent = toMoney(metrics.monthly);
    if (semesterEl) semesterEl.textContent = toMoney(metrics.semester);
  }

  function renderUsersFilters() {
    const users = db.users || [];
    const colleges = Array.from(
      new Set(
        users.map((user) => String(user.college || "").trim()).filter(Boolean),
      ),
    ).sort();
    const courses = Array.from(
      new Set(
        users.map((user) => String(user.course || "").trim()).filter(Boolean),
      ),
    ).sort();
    const yearLevels = Array.from(
      new Set(
        users
          .map((user) => String(user.yearLevel || "").trim())
          .filter(Boolean),
      ),
    ).sort();

    function renderOptions(select, values) {
      if (!select) return;
      const currentValue = select.value || "all";
      select.innerHTML =
        `<option value="all">All ${select.dataset.label || "options"}</option>` +
        values
          .map(
            (value) =>
              ` <option value="${value.toLowerCase()}">${value}</option>`,
          )
          .join("");
      if (values.includes(currentValue)) select.value = currentValue;
    }

    renderOptions(collegeSelect, colleges);
    renderOptions(courseSelect, courses);
    renderOptions(yearLevelSelect, yearLevels);
  }

  function renderPaymentChart(transactions) {
    if (!paymentChartCanvas) return;
    const paid = transactions
      .filter((transaction) => getPaymentType(transaction) === "gcash")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const unpaid = transactions
      .filter((transaction) => getPaymentType(transaction) === "credit")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    if (paymentChart) {
      paymentChart.destroy();
    }

    paymentChart = new Chart(paymentChartCanvas, {
      type: "doughnut",
      data: {
        labels: ["GCash Paid", "Credit Unpaid"],
        datasets: [
          {
            data: [paid, unpaid],
            backgroundColor: ["#34d399", "#facc15"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.label}: ₱${Number(context.parsed || 0).toFixed(2)}`,
            },
          },
        },
      },
    });
  }

  function renderRecords(transactions) {
    if (!recordsBody) return;
    const rows = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((transaction) => {
        const paymentType = getPaymentType(transaction);
        const date = parseDate(transaction.date);
        return `
          <tr>
            <td>${date ? date.toLocaleDateString() : "N/A"}</td>
            <td>${String(transaction.studentName || transaction.email || "Unknown")}</td>
            <td>${String(transaction.serviceName || transaction.service || "—")}</td>
            <td>${paymentType === "gcash" ? "GCash" : paymentType === "credit" ? "Credit" : "Other"}</td>
            <td>${toMoney(transaction.amount)}</td>
            <td>${String(transaction.status || "").toUpperCase()}</td>
          </tr>
        `;
      })
      .join("");

    if (!rows) {
      recordsBody.innerHTML =
        '<tr><td colspan=6 class="text-center">No matching transaction records found.</td></tr>';
      emptyState?.classList.remove("hidden");
      return;
    }

    recordsBody.innerHTML = rows;
    emptyState?.classList.add("hidden");
  }

  function applyFilters() {
    const filtered = getFilteredTransactions();
    updateSummaryCards(filtered);
    renderPaymentChart(filtered);
    renderRecords(filtered);
  }

  function initFilters() {
    const inputs = [
      paymentTypeSelect,
      userTypeSelect,
      collegeSelect,
      courseSelect,
      yearLevelSelect,
      startDateInput,
      endDateInput,
    ];
    inputs.forEach((input) => {
      if (!input) return;
      input.addEventListener("change", applyFilters);
    });
  }

  function init() {
    if (collegeSelect) collegeSelect.dataset.label = "Colleges";
    if (courseSelect) courseSelect.dataset.label = "Courses";
    if (yearLevelSelect) yearLevelSelect.dataset.label = "Year Levels";

    renderUsersFilters();
    applyFilters();
    initFilters();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
