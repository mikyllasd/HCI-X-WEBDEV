(function () {
  const db = getDB();
  const pageContainer = document.getElementById("pageContainer");

  let currentFilters = {
    service: "",
    category: "",
    academicYear: db.academicYear,
    semester: "",
    period: "daily",
  };

  let paymentChart = null;
  let performanceChart = null;
  let transactionSearchQuery = "";
  let transactionPage = 1;
  const TRANSACTIONS_PAGE_SIZE = 10;

  /** Matches admin dashboard reports: daily = today, monthly = this month, yearly = this year */
  let performancePeriod = "daily";

  const PERF_C_RED = "#8B0000";
  const PERF_C_GREEN = "#10B981";

  function statusTone(status) {
    const s = String(status || "").toLowerCase();
    if (s === "completed" || s === "paid") return "completed";
    if (s === "cancelled" || s === "canceled") return "cancelled";
    if (s.includes("pending") || s.includes("process")) return "pending";
    return "pending";
  }

  function normalizeStatus(status) {
    const value = String(status || "").toLowerCase();
    return ["completed", "paid"].includes(value) ? "completed" : value;
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

  function escapeCsvCell(value) {
    const s = String(value ?? "");
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function paymentTypeLabel(txn) {
    const t = getPaymentType(txn);
    if (t === "gcash") return "GCash / Online";
    if (t === "credit") return "Credit / Onsite";
    return "Other";
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
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
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

  function inSelectedReportPeriod(txn) {
    const date = parseTxnDate(txn);
    if (!date) return false;
    const range = getPeriodRange(currentFilters.period || "daily");
    return date >= range.start && date <= range.end;
  }

  /** CSV download of rows matching current filters (same scope as the table). */
  function exportFilteredTransactionsCsv() {
    const rows = getSearchFilteredTransactions();
    const headers = [
      "Service",
      "Category",
      "Amount (PHP)",
      "Status",
      "Semester",
      "Date (ISO)",
      "Email",
      "Payment",
      "Academic year",
      "Transaction ID",
    ];
    const lines = [headers.map(escapeCsvCell).join(",")];
    rows.forEach((txn) => {
      const d = parseTxnDate(txn);
      const dateStr = d ? d.toISOString() : String(txn.date || "");
      lines.push(
        [
          escapeCsvCell(txn.serviceName),
          escapeCsvCell(txn.category),
          escapeCsvCell(Number(txn.amount || 0).toFixed(2)),
          escapeCsvCell(txn.status),
          escapeCsvCell(txn.semester || ""),
          escapeCsvCell(dateStr),
          escapeCsvCell(txn.email || ""),
          escapeCsvCell(paymentTypeLabel(txn)),
          escapeCsvCell(txn.academicYear || db.academicYear || ""),
          escapeCsvCell(txn.id),
        ].join(","),
      );
    });
    const slug = String(db.academicYear || "export").replace(/[^\w-]+/g, "-");
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([`\ufeff${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upress-superadmin-reports-${slug}-${stamp}.csv`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getFilteredData() {
    if (!db.academicYear || !db.transactions || db.transactions.length === 0) {
      return [];
    }

    return db.transactions.filter((txn) => {
      if (txn.academicYear && txn.academicYear !== db.academicYear) {
        return false;
      }
      if (!inSelectedReportPeriod(txn)) {
        return false;
      }
      if (currentFilters.service && txn.serviceId !== currentFilters.service) {
        return false;
      }
      if (currentFilters.category && txn.category !== currentFilters.category) {
        return false;
      }
      if (currentFilters.semester && txn.semester !== currentFilters.semester) {
        return false;
      }
      return true;
    });
  }

  function getSearchFilteredTransactions() {
    const query = transactionSearchQuery.trim().toLowerCase();
    if (!query) return getFilteredData();
    return getFilteredData().filter((txn) =>
      [
        txn.id,
        txn.serviceName,
        txn.category,
        txn.amount,
        txn.status,
        txn.semester,
        txn.email,
        paymentTypeLabel(txn),
        txn.date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }

  /** Completed transactions only — same basis as admin reports payment chart */
  function getChartTransactions() {
    return getFilteredData().filter(
      (txn) => normalizeStatus(txn.status) === "completed",
    );
  }

  function parseTxnDate(txn) {
    const d = new Date(txn.date);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Admin reports chart: income from completed / paid / ready */
  function countsTowardPerformanceIncome(txn) {
    const s = String(txn.status || "").toLowerCase();
    return (
      s === "completed" ||
      s === "paid" ||
      s === "ready"
    );
  }

  /** Filtered rows restricted to the performance period */
  function getPeriodTransactions() {
    const all = getFilteredData();
    const now = new Date();
    return all.filter((txn) => {
      const d = parseTxnDate(txn);
      if (!d) return false;
      if (performancePeriod === "daily") {
        return d.toDateString() === now.toDateString();
      }
      if (performancePeriod === "weekly") {
        const range = getPeriodRange("weekly");
        return d >= range.start && d <= range.end;
      }
      if (performancePeriod === "monthly") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      return d.getFullYear() === now.getFullYear();
    });
  }

  function getYearlyData() {
    const filtered = getFilteredData();
    const yearly = {
      total: 0,
      count: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      byService: {},
    };

    filtered.forEach((txn) => {
      yearly.total += parseFloat(txn.amount) || 0;
      yearly.count++;
      const st = String(txn.status || "").toLowerCase();
      if (st === "completed" || st === "paid") yearly.completed++;
      else if (st === "pending" || st === "processing") yearly.pending++;
      else if (st === "cancelled" || st === "canceled") yearly.cancelled++;

      if (!yearly.byService[txn.serviceName]) {
        yearly.byService[txn.serviceName] = 0;
      }
      yearly.byService[txn.serviceName] += parseFloat(txn.amount) || 0;
    });

    return yearly;
  }

  function renderPaymentChart() {
    const canvas = document.getElementById("reportsPaymentChart");
    if (!canvas || typeof Chart === "undefined") return;

    const txns = getChartTransactions();
    const paid = txns
      .filter((txn) => getPaymentType(txn) === "gcash")
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
    const unpaid = txns
      .filter((txn) => getPaymentType(txn) === "credit")
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

    if (paymentChart) {
      paymentChart.destroy();
      paymentChart = null;
    }

    paymentChart = new Chart(canvas, {
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

  /**
   * Bar chart aligned with admin dashboard `renderReportsChart`:
   * Orders (all statuses) + Income (completed / paid / ready) by time buckets.
   */
  function renderPerformanceChart() {
    const canvas = document.getElementById("reportsPerformanceChart");
    if (!canvas || typeof Chart === "undefined") return;

    const periodOrders = getPeriodTransactions();
    let labels = [];
    let orderCounts = [];
    let incomeValues = [];

    if (performancePeriod === "daily") {
      const hourOrders = new Array(24).fill(0);
      const hourIncome = new Array(24).fill(0);
      periodOrders.forEach((o) => {
        const d = parseTxnDate(o);
        if (!d) return;
        const h = d.getHours();
        hourOrders[h]++;
        if (countsTowardPerformanceIncome(o)) {
          hourIncome[h] += Number(o.amount || 0);
        }
      });
      labels = ["12am–6am", "6am–12pm", "12pm–6pm", "6pm–12am"];
      orderCounts = [
        hourOrders.slice(0, 6).reduce((a, b) => a + b, 0),
        hourOrders.slice(6, 12).reduce((a, b) => a + b, 0),
        hourOrders.slice(12, 18).reduce((a, b) => a + b, 0),
        hourOrders.slice(18, 24).reduce((a, b) => a + b, 0),
      ];
      incomeValues = [
        hourIncome.slice(0, 6).reduce((a, b) => a + b, 0),
        hourIncome.slice(6, 12).reduce((a, b) => a + b, 0),
        hourIncome.slice(12, 18).reduce((a, b) => a + b, 0),
        hourIncome.slice(18, 24).reduce((a, b) => a + b, 0),
      ];
    } else if (performancePeriod === "monthly") {
      const weeks = 5;
      const wOrders = new Array(weeks).fill(0);
      const wIncome = new Array(weeks).fill(0);
      periodOrders.forEach((o) => {
        const d = parseTxnDate(o);
        if (!d) return;
        const day = d.getDate();
        const w = Math.min(Math.floor((day - 1) / 7), weeks - 1);
        wOrders[w]++;
        if (countsTowardPerformanceIncome(o)) {
          wIncome[w] += Number(o.amount || 0);
        }
      });
      labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
      orderCounts = wOrders;
      incomeValues = wIncome;
    } else if (performancePeriod === "weekly") {
      const labelsByDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dOrders = new Array(7).fill(0);
      const dIncome = new Array(7).fill(0);
      const range = getPeriodRange("weekly");
      periodOrders.forEach((o) => {
        const d = parseTxnDate(o);
        if (!d) return;
        const idx = Math.floor((d - range.start) / 86400000);
        if (idx < 0 || idx > 6) return;
        dOrders[idx]++;
        if (countsTowardPerformanceIncome(o)) {
          dIncome[idx] += Number(o.amount || 0);
        }
      });
      labels = labelsByDay;
      orderCounts = dOrders;
      incomeValues = dIncome;
    } else {
      const mOrders = new Array(12).fill(0);
      const mIncome = new Array(12).fill(0);
      periodOrders.forEach((o) => {
        const d = parseTxnDate(o);
        if (!d) return;
        const m = d.getMonth();
        mOrders[m]++;
        if (countsTowardPerformanceIncome(o)) {
          mIncome[m] += Number(o.amount || 0);
        }
      });
      labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      orderCounts = mOrders;
      incomeValues = mIncome;
    }

    const labelEl = document.getElementById("saPerfChartLabel");
    if (labelEl) {
      const map = {
        daily: "Today — order volume and revenue by time of day",
        weekly: "This week — by day",
        monthly: "This month — by week of month",
        yearly: "This year — by calendar month",
      };
      labelEl.textContent = map[performancePeriod] || "";
    }

    if (performanceChart) {
      performanceChart.destroy();
      performanceChart = null;
    }
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    performanceChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Orders",
            data: orderCounts,
            backgroundColor: PERF_C_RED,
            borderRadius: 4,
            yAxisID: "y",
          },
          {
            label: "Income (₱)",
            data: incomeValues,
            backgroundColor: PERF_C_GREEN,
            borderRadius: 4,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { family: "Inter, sans-serif", size: 12 },
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Orders",
              font: { family: "Inter, sans-serif" },
            },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            title: {
              display: true,
              text: "Income (₱)",
              font: { family: "Inter, sans-serif" },
            },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  function renderTransactions() {
    const filtered = getSearchFilteredTransactions();
    const tbody = document.getElementById("reportsRecordsBody");
    if (!tbody) return;

    const countEl = document.getElementById("reportsRecordsCount");
    if (countEl) {
      countEl.textContent = `${filtered.length} records`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No transaction records match the selected filters.</td>
        </tr>
      `;
      renderTransactionPagination(0, 1);
      return;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(filtered.length / TRANSACTIONS_PAGE_SIZE),
    );
    transactionPage = Math.min(Math.max(transactionPage, 1), totalPages);
    const start = (transactionPage - 1) * TRANSACTIONS_PAGE_SIZE;
    const visibleRows = filtered.slice(start, start + TRANSACTIONS_PAGE_SIZE);

    tbody.innerHTML = visibleRows
      .map(
        (txn) => `
      <tr>
        <td>${txn.serviceName}</td>
        <td>${txn.category}</td>
        <td>₱${parseFloat(txn.amount).toFixed(2)}</td>
        <td><span class="transaction-status ${statusTone(txn.status)}">${txn.status}</span></td>
        <td>${txn.semester || "N/A"}</td>
        <td>${new Date(txn.date).toLocaleDateString()}</td>
      </tr>
    `,
      )
      .join("");

    renderTransactionPagination(filtered.length, totalPages);
  }

  function renderTransactionPagination(totalRecords, totalPages) {
    const container = document.getElementById("reportsPagination");
    if (!container) return;
    if (totalRecords === 0) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <span class="list-pagination__summary">Page ${transactionPage} of ${totalPages}</span>
      <div class="list-pagination__actions">
        <button type="button" class="btn btn--outline" id="reportsPrevPage" ${transactionPage === 1 ? "disabled" : ""}>Previous</button>
        <button type="button" class="btn btn--outline" id="reportsNextPage" ${transactionPage === totalPages ? "disabled" : ""}>Next</button>
      </div>
    `;
    document.getElementById("reportsPrevPage")?.addEventListener("click", () => {
      transactionPage -= 1;
      renderTransactions();
    });
    document.getElementById("reportsNextPage")?.addEventListener("click", () => {
      transactionPage += 1;
      renderTransactions();
    });
  }

  function renderPage() {
    if (!db.academicYear) {
      pageContainer.innerHTML = `
        <section class="page-section active" id="page-reports" aria-labelledby="reports-heading">
          <div class="page-header">
            <div>
              <h1 id="reports-heading">Reports</h1>
              <p class="page-subtitle">Academic year is not configured.</p>
            </div>
          </div>
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div class="empty-state__title">Academic Year Not Set</div>
            <div class="empty-state__sub">Set the current academic year in System Settings to view reports for that period.</div>
            <a href="settings.html" class="btn btn--primary" style="margin-top: 16px; display: inline-flex;">Go to Settings</a>
          </div>
        </section>
      `;
      return;
    }

    const services = db.services || [];
    const serviceOptions = services
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");

    pageContainer.innerHTML = `
      <section class="page-section active" id="page-reports" aria-labelledby="reports-heading">
        <div class="page-header page-header--row rpt-page-header">
          <div class="page-header__intro">
            <h1 id="reports-heading">Reports</h1>
            <p class="page-subtitle">Filter activity and sales for <strong>${db.academicYear}</strong>.</p>
          </div>
          <button type="button" class="btn btn--primary rpt-export-btn page-header__action" id="reportsExportBtn" aria-label="Export filtered transaction records as CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export report
          </button>
        </div>

        <div class="card reports-filter-card">
          <div class="reports-filter-row">
            <div class="form-group">
              <label class="form-label" for="filterPeriod">Report Period</label>
              <select class="form-input form-select" id="filterPeriod">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="filterService">Service</label>
              <select class="form-input form-select" id="filterService">
                <option value="">All Services</option>
                ${serviceOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="filterCategory">Category</label>
              <select class="form-input form-select" id="filterCategory">
                <option value="">All Categories</option>
                <option value="printing">Printing</option>
                <option value="merchandise">Merchandise</option>
                <option value="special">Special Services</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="filterSemester">Semester</label>
              <select class="form-input form-select" id="filterSemester">
                <option value="">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
              </select>
            </div>
          </div>
          <div class="reports-filter-actions">
            <button type="button" class="btn btn--outline" id="resetFiltersBtn">Reset</button>
          </div>
        </div>

        <div class="stats-grid stats-grid--4 reports-summary-grid">
          <article class="stat-card stat-card--blue">
            <div class="stat-card__header">
              <span>Total transactions</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/>
              </svg>
            </div>
            <p class="stat-card__value" id="totalTransactions">0</p>
            <p class="stat-card__label">Matching current filters</p>
          </article>
          <article class="stat-card stat-card--green">
            <div class="stat-card__header">
              <span>Completed</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M16 12l-4 4-2-2"/>
              </svg>
            </div>
            <p class="stat-card__value" id="completedCount">0</p>
            <p class="stat-card__label">Completed or paid orders</p>
          </article>
          <article class="stat-card stat-card--yellow">
            <div class="stat-card__header">
              <span>Total revenue</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M12 18V6"/>
              </svg>
            </div>
            <p class="stat-card__value" id="totalRevenue">₱0.00</p>
            <p class="stat-card__label">Sum of filtered amounts</p>
          </article>
          <article class="stat-card stat-card--purple">
            <div class="stat-card__header">
              <span>Avg transaction</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <p class="stat-card__value" id="avgTransaction">₱0.00</p>
            <p class="stat-card__label">Per filtered row</p>
          </article>
        </div>

        <div class="reports-grid sa-reports-charts-grid">
          <div class="card reports-chart-card">
            <div class="card-title-group">
              <div>
                <h2 class="card-title">Paid vs Unpaid</h2>
                <p class="card-subtitle">Completed orders: GCash vs credit revenue (current filters).</p>
              </div>
            </div>
            <div class="reports-chart-wrapper">
              <canvas id="reportsPaymentChart" aria-label="Payment type comparison chart"></canvas>
            </div>
          </div>
          <div class="card reports-chart-card">
            <div class="card-title-group sa-chart-card-head">
              <div>
                <h2 class="card-title">Performance chart</h2>
                <p class="card-subtitle" id="saPerfChartLabel">Today — order volume and revenue by time of day</p>
              </div>
            </div>
            <div class="reports-chart-wrapper">
              <canvas id="reportsPerformanceChart" aria-label="Orders and income performance chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card reports-records-card">
          <div class="card-title-group reports-records-head">
            <div>
              <h2 class="card-title">Transaction records</h2>
              <p class="card-subtitle">Rows matching service, category, and semester filters.</p>
            </div>
            <div class="reports-records-tools">
              <div class="record-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="search" id="reportsRecordsSearch" class="list-search__input" placeholder="Search service, category, status, email, or amount" />
              </div>
              <span class="list-toolbar__count" id="reportsRecordsCount">0 records</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="data-table" aria-label="Filtered transaction records">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Semester</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="reportsRecordsBody"></tbody>
            </table>
          </div>
          <div class="list-pagination" id="reportsPagination" aria-label="Transaction records pagination"></div>
        </div>
      </section>
    `;

    const syncReportFilters = () => {
      currentFilters.period = document.getElementById("filterPeriod").value;
      currentFilters.service = document.getElementById("filterService").value;
      currentFilters.category = document.getElementById("filterCategory").value;
      currentFilters.semester = document.getElementById("filterSemester").value;
      performancePeriod = currentFilters.period;
      transactionPage = 1;
      applyFilters();
    };

    ["filterPeriod", "filterService", "filterCategory", "filterSemester"].forEach(
      (id) => document.getElementById(id)?.addEventListener("change", syncReportFilters),
    );

    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      currentFilters = {
        service: "",
        category: "",
        semester: "",
        period: "daily",
      };
      document.getElementById("filterPeriod").value = "daily";
      document.getElementById("filterService").value = "";
      document.getElementById("filterCategory").value = "";
      document.getElementById("filterSemester").value = "";
      performancePeriod = "daily";
      transactionSearchQuery = "";
      transactionPage = 1;
      const recordsSearch = document.getElementById("reportsRecordsSearch");
      if (recordsSearch) recordsSearch.value = "";
      applyFilters();
    });

    document.getElementById("reportsRecordsSearch")?.addEventListener("input", (event) => {
      transactionSearchQuery = event.target.value;
      transactionPage = 1;
      renderTransactions();
    });

    document
      .getElementById("reportsExportBtn")
      ?.addEventListener("click", () => exportFilteredTransactionsCsv());

    applyFilters();
  }

  function updateStats() {
    const summary = getYearlyData();
    const filtered = getFilteredData();

    document.getElementById("totalTransactions").textContent = summary.count;
    document.getElementById("completedCount").textContent = summary.completed;
    document.getElementById("totalRevenue").textContent =
      "₱" + summary.total.toFixed(2);
    document.getElementById("avgTransaction").textContent =
      filtered.length > 0
        ? "₱" + (summary.total / filtered.length).toFixed(2)
        : "₱0.00";
  }

  function applyFilters() {
    renderPaymentChart();
    renderPerformanceChart();
    renderTransactions();
    updateStats();
  }

  renderPage();
})();
