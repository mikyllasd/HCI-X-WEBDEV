(function () {
  const db = getDB();

  const averageEl = document.getElementById("ratingsAverage");
  const countEl = document.getElementById("ratingsCount");
  const commentedEl = document.getElementById("ratingsCommented");
  const flaggedEl = document.getElementById("ratingsFlagged");
  const fiveEl = document.getElementById("ratingsFiveCount");
  const fourEl = document.getElementById("ratingsFourCount");
  const threeEl = document.getElementById("ratingsThreeCount");
  const twoEl = document.getElementById("ratingsTwoCount");
  const oneEl = document.getElementById("ratingsOneCount");
  const recordsBody = document.getElementById("ratingsRecordsBody");
  const emptyState = document.getElementById("ratingsEmptyState");
  const chartCanvas = document.getElementById("ratingsChart");

  const starsSelect = document.getElementById("ratingsStars");
  const paymentSelect = document.getElementById("ratingsPaymentType");
  const collegeSelect = document.getElementById("ratingsCollege");
  const organizationSelect = document.getElementById("ratingsOrganization");
  const courseSelect = document.getElementById("ratingsCourse");
  const yearLevelSelect = document.getElementById("ratingsYearLevel");
  const startDateInput = document.getElementById("ratingsStartDate");
  const endDateInput = document.getElementById("ratingsEndDate");

  let ratingsChart = null;

  function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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

  function getRatedTransactions() {
    return (db.ratings || []).filter((rating) => {
      if (!rating.transactionId) return false;
      const transaction = getTransaction(rating.transactionId);
      if (!transaction.id) return false;
      if (db.academicYear && transaction.academicYear !== db.academicYear)
        return false;
      return true;
    });
  }

  function getTransaction(transactionId) {
    return (
      (db.transactions || []).find(
        (transaction) => transaction.id === transactionId,
      ) || {}
    );
  }

  function getUser(transaction) {
    return (
      (db.users || []).find(
        (user) =>
          user.id === transaction.userId || user.email === transaction.email,
      ) || {}
    );
  }

  function inDateRange(date, start, end) {
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  function formatStars(value) {
    const rating = Number(value) || 0;
    return (
      Array.from({ length: rating }, () => "★").join("") +
      Array.from({ length: 5 - rating }, () => "☆").join("")
    );
  }

  function buildRatingRecord(rating, transaction, user) {
    const date = parseDate(rating.createdAt || transaction.date);
    const paymentType = getPaymentType(transaction);
    const studentName =
      user.fullName ||
      transaction.studentName ||
      transaction.email ||
      "Unknown";

    return {
      date,
      studentName,
      serviceName: transaction.serviceName || transaction.service || "—",
      rating: Number(rating.rating) || 0,
      paymentType:
        paymentType === "gcash"
          ? "GCash"
          : paymentType === "credit"
            ? "Credit"
            : "Other",
      comment: String(rating.comment || "").trim(),
      status: String(transaction.status || "").toLowerCase(),
      organization: String(
        user.organization ||
          transaction.order_org ||
          transaction.organization ||
          "",
      ).toLowerCase(),
      college: String(user.college || "").toLowerCase(),
      course: String(user.course || "").toLowerCase(),
      yearLevel: String(user.yearLevel || "").toLowerCase(),
    };
  }

  function getFilteredRatings() {
    const starsFilter = starsSelect?.value || "all";
    const paymentFilter = paymentSelect?.value || "all";
    const collegeFilter = collegeSelect?.value || "all";
    const organizationFilter = organizationSelect?.value || "all";
    const courseFilter = courseSelect?.value || "all";
    const yearLevelFilter = yearLevelSelect?.value || "all";
    const startDate = parseDate(startDateInput?.value);
    const endDate = parseDate(endDateInput?.value);

    return getRatedTransactions()
      .map((rating) => {
        const transaction = getTransaction(rating.transactionId);
        const user = getUser(transaction);
        return buildRatingRecord(rating, transaction, user);
      })
      .filter((record) => {
        if (!record.status || record.status !== "completed") return false;
        if (starsFilter !== "all" && record.rating !== Number(starsFilter))
          return false;
        if (
          paymentFilter !== "all" &&
          record.paymentType.toLowerCase() !== paymentFilter
        )
          return false;
        if (
          organizationFilter !== "all" &&
          record.organization !== organizationFilter
        )
          return false;
        if (collegeFilter !== "all" && record.college !== collegeFilter)
          return false;
        if (courseFilter !== "all" && record.course !== courseFilter)
          return false;
        if (yearLevelFilter !== "all" && record.yearLevel !== yearLevelFilter)
          return false;
        if (!inDateRange(record.date, startDate, endDate)) return false;
        return true;
      });
  }

  function updateFilters() {
    const users = db.users || [];
    const colleges = Array.from(
      new Set(
        users.map((user) => String(user.college || "").trim()).filter(Boolean),
      ),
    ).sort();
    const organizations = Array.from(
      new Set(
        [
          ...users.map((user) => String(user.organization || "").trim()),
          ...(db.transactions || []).map((txn) =>
            String(txn.order_org || txn.organization || "").trim(),
          ),
        ].filter(Boolean),
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

    function renderOptions(select, values, label) {
      if (!select) return;
      const currentValue = select.value || "all";
      select.innerHTML =
        `<option value="all">All ${label}</option>` +
        values
          .map(
            (value) =>
              `<option value="${value.toLowerCase()}">${value}</option>`,
          )
          .join("");
      if (values.map((value) => value.toLowerCase()).includes(currentValue)) {
        select.value = currentValue;
      }
    }

    renderOptions(organizationSelect, organizations, "Organizations");
    renderOptions(collegeSelect, colleges, "Colleges");
    renderOptions(courseSelect, courses, "Courses");
    renderOptions(yearLevelSelect, yearLevels, "Years");
  }

  function updateSummary(records) {
    const total = records.length;
    const average =
      total > 0
        ? records.reduce((sum, record) => sum + record.rating, 0) / total
        : 0;
    const commented = records.filter((record) => record.comment).length;
    const flagged = records.filter(
      (record) =>
        record.comment.toLowerCase().includes("issue") ||
        record.comment.toLowerCase().includes("problem") ||
        record.comment.toLowerCase().includes("unhappy"),
    ).length;

    if (averageEl) averageEl.textContent = average.toFixed(1);
    if (countEl) countEl.textContent = total;
    if (commentedEl) commentedEl.textContent = commented;
    if (flaggedEl) flaggedEl.textContent = flagged;
    if (fiveEl)
      fiveEl.textContent = records.filter(
        (record) => record.rating === 5,
      ).length;
    if (fourEl)
      fourEl.textContent = records.filter(
        (record) => record.rating === 4,
      ).length;
    if (threeEl)
      threeEl.textContent = records.filter(
        (record) => record.rating === 3,
      ).length;
    if (twoEl)
      twoEl.textContent = records.filter(
        (record) => record.rating === 2,
      ).length;
    if (oneEl)
      oneEl.textContent = records.filter(
        (record) => record.rating === 1,
      ).length;
  }

  function renderChart(records) {
    if (!chartCanvas) return;
    const distribution = [5, 4, 3, 2, 1].map(
      (value) => records.filter((record) => record.rating === value).length,
    );

    if (ratingsChart) {
      ratingsChart.destroy();
    }

    ratingsChart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels: ["5★", "4★", "3★", "2★", "1★"],
        datasets: [
          {
            label: "Review count",
            data: distribution,
            backgroundColor: [
              "#4ade80",
              "#facc15",
              "#60a5fa",
              "#fb7185",
              "#f43f5e",
            ],
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
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  function renderRecords(records) {
    if (!recordsBody) return;
    if (records.length === 0) {
      recordsBody.innerHTML =
        '<tr><td colspan=6 class="text-center">No feedback records found.</td></tr>';
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");
    recordsBody.innerHTML = records
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .map(
        (record) => `
        <tr>
          <td>${record.date ? record.date.toLocaleDateString() : "N/A"}</td>
          <td>${record.studentName}</td>
          <td>${record.serviceName}</td>
          <td><span class="rating-stars">${formatStars(record.rating)}</span></td>
          <td>${record.paymentType}</td>
          <td><span class="rating-comment">${record.comment || "No comment"}</span></td>
        </tr>
      `,
      )
      .join("");
  }

  function formatStars(value) {
    const filled = Number(value) || 0;
    const empty = 5 - filled;
    return "★".repeat(filled) + "☆".repeat(empty);
  }

  function applyFilters() {
    const records = getFilteredRatings();
    updateSummary(records);
    renderChart(records);
    renderRecords(records);
  }

  function init() {
    updateFilters();
    applyFilters();

    [
      starsSelect,
      paymentSelect,
      organizationSelect,
      collegeSelect,
      courseSelect,
      yearLevelSelect,
      startDateInput,
      endDateInput,
    ].forEach((input) => {
      if (!input) return;
      input.addEventListener("change", applyFilters);
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
