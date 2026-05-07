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
  const recordsSearchInput = document.getElementById("reportsRecordsSearch");
  const recordsCountEl = document.getElementById("reportsRecordsCount");
  const recordsPagination = document.getElementById("reportsRecordsPagination");

  const periodSelect = document.getElementById("reportsPeriod");
  const paymentTypeSelect = document.getElementById("reportsPaymentType");
  const userTypeSelect = document.getElementById("reportsUserType");
  const organizationSelect = document.getElementById("reportsOrganization");
  const collegeSelect = document.getElementById("reportsCollege");
  const courseSelect = document.getElementById("reportsCourse");
  const yearLevelSelect = document.getElementById("reportsYearLevel");
  const startDateInput = document.getElementById("reportsStartDate");
  const endDateInput = document.getElementById("reportsEndDate");

  let paymentChart = null;
  let recordsSearchQuery = "";
  let recordsPage = 1;
  const RECORDS_PAGE_SIZE = 10;

  function getTxnDateValue(transaction) {
    if (!transaction) return "";
    return (
      transaction.date ||
      transaction.dateOrdered ||
      transaction.createdAt ||
      transaction.ts ||
      ""
    );
  }

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
    if (value.includes("organization") || value.includes("org"))
      return "organization";
    return "student";
  }

  function getUserOrganization(user, transaction) {
    return String(
      user?.organization ||
        user?.organizationName ||
        user?.org ||
        transaction.order_org ||
        transaction.organization ||
        transaction.orderOrg ||
        transaction.org ||
        "",
    ).trim();
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

  function getPaymentLabel(paymentType) {
    if (paymentType === "gcash") return "Online";
    if (paymentType === "credit") return "Cash (Paid)";
    return "Other";
  }

  function inDateRange(date, start, end) {
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  function getPeriodRange(period) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === "weekly") {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (period === "monthly") {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      };
    }

    if (period === "yearly") {
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  function applyFilters() {
    const transactions = getFilteredTransactions();
    updateSummaryCards(transactions);
    renderPaymentChart(transactions);
    renderRecords(transactions);
  }

  function getCurrentAcademicTransactions() {
    return (db.transactions || []).filter((transaction) => {
      const date = parseDate(getTxnDateValue(transaction));
      return (
        date &&
        (!db.academicYear ||
          !transaction.academicYear ||
          transaction.academicYear === db.academicYear)
      );
    });
  }

  function getFilteredTransactions() {
    const transactions = getCurrentAcademicTransactions();
    const paymentType = paymentTypeSelect?.value || "all";
    const userType = userTypeSelect?.value || "all";
    const organization = organizationSelect?.value || "all";
    const college = collegeSelect?.value || "all";
    const course = courseSelect?.value || "all";
    const yearLevel = yearLevelSelect?.value || "all";
    const period = periodSelect?.value || "daily";
    const periodRange = getPeriodRange(period);
    const startDate = parseDate(startDateInput?.value);
    const endDate = parseDate(endDateInput?.value);

    return transactions.filter((transaction) => {
      const date = parseDate(getTxnDateValue(transaction));
      if (!inDateRange(date, periodRange.start, periodRange.end)) return false;

      const type = getPaymentType(transaction);
      if (paymentType !== "all" && type !== paymentType) return false;

      const user =
        (db.users || []).find(
          (item) =>
            item.email === transaction.email || item.id === transaction.userId,
        ) || {};
      const typeFilter = getUserType(user);
      if (userType !== "all" && typeFilter !== userType) return false;

      const organizationValue = getUserOrganization(
        user,
        transaction,
      ).toLowerCase();
      if (organization !== "all" && organizationValue !== organization)
        return false;

      const collegeValue = String(user.college || "").toLowerCase();
      if (college !== "all" && collegeValue !== college) return false;

      const courseValue = String(user.course || "").toLowerCase();
      if (course !== "all" && courseValue !== course) return false;

      const yearValue = String(user.yearLevel || "").toLowerCase();
      if (yearLevel !== "all" && yearValue !== yearLevel) return false;

      return inDateRange(date, startDate, endDate);
    });
  }

  function getSummaryMetrics(transactions) {
    const completed = transactions.filter(
      (t) => normalizeStatus(t.status) === "completed",
    );
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

    completed.forEach((transaction) => {
      const amount = Number(transaction.amount || 0);
      const paymentType = getPaymentType(transaction);
      const date = parseDate(getTxnDateValue(transaction));
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
        (user) =>
          String(user.status || "approved").toLowerCase() === "approved" &&
          String(user.role || "student").toLowerCase() === "student",
      ).length;
    if (dailyEl) dailyEl.textContent = toMoney(metrics.daily);
    if (weeklyEl) weeklyEl.textContent = toMoney(metrics.weekly);
    if (monthlyEl) monthlyEl.textContent = toMoney(metrics.monthly);
    if (semesterEl) semesterEl.textContent = toMoney(metrics.semester);
  }

  function renderUsersFilters() {
    const users = db.users || [];
    function getTransactionOrganization(transaction) {
      const user = (db.users || []).find(
        (item) =>
          item.email === transaction.email || item.id === transaction.userId,
      );
      return String(
        user?.organization ||
          user?.organizationName ||
          user?.org ||
          transaction.order_org ||
          transaction.organization ||
          transaction.orderOrg ||
          transaction.org ||
          "",
      ).trim();
    }

    const organizations = Array.from(
      new Set(
        [
          ...users.map((user) => String(user.organization || "").trim()),
          ...(db.transactions || []).map(getTransactionOrganization),
        ].filter(Boolean),
      ),
    ).sort();

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

    renderOptions(organizationSelect, organizations);
    renderOptions(collegeSelect, colleges);
    renderOptions(courseSelect, courses);
    renderOptions(yearLevelSelect, yearLevels);
  }

  function renderPaymentChart(transactions) {
    if (!paymentChartCanvas) return;
    const completed = transactions.filter(
      (t) => normalizeStatus(t.status) === "completed",
    );
    const paid = completed
      .filter((transaction) => getPaymentType(transaction) === "gcash")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const unpaid = completed
      .filter((transaction) => getPaymentType(transaction) === "credit")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    if (paymentChart) {
      paymentChart.destroy();
    }

    paymentChart = new Chart(paymentChartCanvas, {
      type: "doughnut",
      data: {
        labels: ["Online Paid", "Cash (Paid)"],
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
    const query = recordsSearchQuery.trim().toLowerCase();
    const searched = !query
      ? transactions
      : transactions.filter((transaction) => {
          const paymentType = getPaymentType(transaction);
          const dateLabel = parseDate(getTxnDateValue(transaction))?.toLocaleDateString() || "";
          return [
            transaction.id,
            transaction.studentName,
            transaction.email,
            transaction.serviceName,
            transaction.service,
            paymentType,
            transaction.amount,
            transaction.status,
            transaction.date,
            transaction.dateOrdered,
            transaction.createdAt,
            dateLabel,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });

    if (recordsCountEl) {
      recordsCountEl.textContent = `${searched.length} record${searched.length === 1 ? "" : "s"}`;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(searched.length / RECORDS_PAGE_SIZE),
    );
    recordsPage = Math.min(Math.max(recordsPage, 1), totalPages);
    const start = (recordsPage - 1) * RECORDS_PAGE_SIZE;
    const visibleRows = searched.slice(start, start + RECORDS_PAGE_SIZE);

    const rows = visibleRows
      .sort((a, b) => new Date(getTxnDateValue(b)) - new Date(getTxnDateValue(a)))
      .map((transaction) => {
        const paymentType = getPaymentType(transaction);
        const date = parseDate(getTxnDateValue(transaction));
        return `
          <tr>
            <td>${date ? date.toLocaleDateString() : "N/A"}</td>
            <td>${String(transaction.studentName || transaction.email || "Unknown")}</td>
            <td>${String(transaction.serviceName || transaction.service || "—")}</td>
            <td>${getPaymentLabel(paymentType)}</td>
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
      renderRecordsPagination(0, 1);
      return;
    }

    recordsBody.innerHTML = rows;
    emptyState?.classList.add("hidden");
    renderRecordsPagination(searched.length, totalPages);
  }

  function renderRecordsPagination(totalRecords, totalPages) {
    if (!recordsPagination) return;
    if (totalRecords === 0) {
      recordsPagination.innerHTML = "";
      return;
    }
    recordsPagination.innerHTML = `
      <span class="reports-pagination__summary">Page ${recordsPage} of ${totalPages}</span>
      <div class="reports-pagination__actions">
        <button type="button" class="btn btn--outline" id="reportsRecordsPrev" ${recordsPage === 1 ? "disabled" : ""}>Previous</button>
        <button type="button" class="btn btn--outline" id="reportsRecordsNext" ${recordsPage === totalPages ? "disabled" : ""}>Next</button>
      </div>
    `;
    document
      .getElementById("reportsRecordsPrev")
      ?.addEventListener("click", () => {
        recordsPage -= 1;
        applyFilters();
      });
    document
      .getElementById("reportsRecordsNext")
      ?.addEventListener("click", () => {
        recordsPage += 1;
        applyFilters();
      });
  }

  function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Get current filtered data
    const transactions = getFilteredTransactions();

    // Add title
    doc.setFontSize(18);
    doc.text("UPRESSease Transaction Report", 20, 20);

    // Add date range
    const period = periodSelect?.value || "daily";
    const { start, end } = getPeriodRange(period);
    doc.setFontSize(12);
    doc.text(
      `Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      20,
      35,
    );

    // Add summary
    const totalSales = transactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );
    const gcashSales = transactions
      .filter((t) => getPaymentType(t) === "gcash")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const creditSales = transactions
      .filter((t) => getPaymentType(t) === "credit")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    doc.text(`Total Sales: ₱${totalSales.toFixed(2)}`, 20, 50);
    doc.text(`Online Paid: ₱${gcashSales.toFixed(2)}`, 20, 60);
    doc.text(`Cash (Paid): ₱${creditSales.toFixed(2)}`, 20, 70);
    doc.text(`Total Records: ${transactions.length}`, 20, 80);

    // Add table headers
    let yPosition = 100;
    doc.setFontSize(10);
    doc.text("Date", 20, yPosition);
    doc.text("Student", 60, yPosition);
    doc.text("Service", 120, yPosition);
    doc.text("Payment", 160, yPosition);
    doc.text("Amount", 190, yPosition);

    // Add table data
    yPosition += 10;
    transactions.slice(0, 50).forEach((transaction) => {
      // Limit to 50 records for PDF
      const date = parseDate(getTxnDateValue(transaction))?.toLocaleDateString() || "—";
      const student = getUserName(transaction.email) || "—";
      const service = transaction.serviceName || transaction.service || "—";
      const payment = getPaymentLabel(getPaymentType(transaction));
      const amount = `₱${Number(transaction.amount || 0).toFixed(2)}`;

      doc.text(date, 20, yPosition);
      doc.text(student.substring(0, 15), 60, yPosition);
      doc.text(service.substring(0, 15), 120, yPosition);
      doc.text(payment, 160, yPosition);
      doc.text(amount, 190, yPosition);

      yPosition += 8;
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Save the PDF
    const fileName = `upress-reports-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  }

  function exportToExcel() {
    const transactions = getFilteredTransactions();

    // Prepare data for Excel
    const data = [
      ["Date", "Student", "Service", "Payment", "Amount", "Status"],
      ...transactions.map((transaction) => [
        parseDate(getTxnDateValue(transaction))?.toLocaleDateString() || "—",
        getUserName(transaction.email) || "—",
        transaction.serviceName || transaction.service || "—",
        getPaymentLabel(getPaymentType(transaction)),
        Number(transaction.amount || 0),
        transaction.status || "—",
      ]),
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = [
      { wch: 12 }, // Date
      { wch: 25 }, // Student
      { wch: 20 }, // Service
      { wch: 10 }, // Payment
      { wch: 12 }, // Amount
      { wch: 10 }, // Status
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Save the file
    const fileName = `upress-reports-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function getUserName(email) {
    const user = (db.users || []).find((u) => u.email === email);
    return user?.fullName || user?.name || email?.split("@")[0] || "—";
  }

  /**
   * Some builds store reportable orders in `db.orders` (and only later mirror to `db.transactions`).
   * Admin reports rely on `db.transactions`, so we backfill missing transactions from orders
   * (non-destructive; one-time per order id).
   */
  function mergeTransactionsFromOrders() {
    try {
      if (typeof window.getDB !== "function" || typeof window.saveDB !== "function")
        return;
      const fresh = window.getDB();
      const existing = Array.isArray(fresh.transactions) ? fresh.transactions : [];
      const orders = Array.isArray(fresh.orders) ? fresh.orders : [];
      if (!orders.length) return;

      const year = fresh.academicYear || db.academicYear || "";
      const seen = new Set(existing.map((t) => String(t?.id || t?.orderId || "")));
      const txs = [];
      for (const o of orders) {
        const oid = String(o?.orderId || o?.id || "").trim();
        if (!oid || seen.has(oid)) continue;
        seen.add(oid);
        const dateVal = o?.date || o?.dateOrdered || o?.createdAt || new Date().toISOString();
        txs.push({
          id: "txn_" + oid,
          orderId: oid,
          serviceId: o?.serviceId || "",
          serviceName: o?.service || o?.serviceName || "—",
          amount: Number(o?.amount || o?.total || 0),
          category: o?.category || "",
          status: o?.status || "pending",
          semester: o?.semester || "",
          date: dateVal,
          academicYear: year,
          paymentType: "",
          paymentMethod: o?.payment || o?.paymentMethod || "",
          email: o?.email || o?.userEmail || "",
          userId: o?.userId || "",
          order_type: o?.order_type || "",
          order_org: o?.order_org || "",
        });
      }
      if (!txs.length) return;
      fresh.transactions = existing.concat(txs);
      window.saveDB(fresh);
      db.transactions = fresh.transactions;
    } catch (e) {
      console.warn("mergeTransactionsFromOrders:", e);
    }
  }

  function initFilters() {
    const inputs = [
      paymentTypeSelect,
      periodSelect,
      userTypeSelect,
      organizationSelect,
      collegeSelect,
      courseSelect,
      yearLevelSelect,
      startDateInput,
      endDateInput,
    ];
    inputs.forEach((input) => {
      if (!input) return;
      input.addEventListener("change", () => {
        recordsPage = 1;
        applyFilters();
      });
    });
    recordsSearchInput?.addEventListener("input", (event) => {
      recordsSearchQuery = event.target.value;
      recordsPage = 1;
      applyFilters();
    });

    // Add export button listeners
    document
      .getElementById("exportPdfBtn")
      ?.addEventListener("click", exportToPDF);
    document
      .getElementById("exportExcelBtn")
      ?.addEventListener("click", exportToExcel);
  }

  function init() {
    if (organizationSelect) organizationSelect.dataset.label = "Organizations";
    if (collegeSelect) collegeSelect.dataset.label = "Colleges";
    if (courseSelect) courseSelect.dataset.label = "Courses";
    if (yearLevelSelect) yearLevelSelect.dataset.label = "Year Levels";

    mergeTransactionsFromOrders();
    renderUsersFilters();
    applyFilters();
    initFilters();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
