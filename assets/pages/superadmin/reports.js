(function () {
  // Wait for storage.js to load
  function init() {
    if (typeof getDB === "undefined") {
      setTimeout(init, 10);
      return;
    }

    const db = getDB();
    const pageContainer = document.getElementById("pageContainer");

    let currentFilters = {
      service: "",
      category: "",
      organization: "",
      college: "",
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

    function getTransactionOrganization(txn) {
      return String(
        txn.order_org || txn.organization || txn.orderOrg || "",
      ).trim();
    }

    function getTransactionCollege(txn) {
      const user = (db.users || []).find(
        (u) => u.id === txn.userId || u.email === txn.email,
      );
      return String(user?.college || txn.college || "").trim();
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
        "Organization",
        "College",
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
            escapeCsvCell(getTransactionOrganization(txn)),
            escapeCsvCell(getTransactionCollege(txn)),
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
      if (
        !db.academicYear ||
        !db.transactions ||
        db.transactions.length === 0
      ) {
        return [];
      }

      return db.transactions.filter((txn) => {
        if (txn.academicYear && txn.academicYear !== db.academicYear) {
          return false;
        }
        if (!inSelectedReportPeriod(txn)) {
          return false;
        }
        if (
          currentFilters.service &&
          txn.serviceId !== currentFilters.service
        ) {
          return false;
        }
        if (
          currentFilters.category &&
          txn.category !== currentFilters.category
        ) {
          return false;
        }
        if (
          currentFilters.organization &&
          getTransactionOrganization(txn).toLowerCase() !==
            currentFilters.organization.toLowerCase()
        ) {
          return false;
        }
        if (
          currentFilters.college &&
          getTransactionCollege(txn).toLowerCase() !==
            currentFilters.college.toLowerCase()
        ) {
          return false;
        }
        if (
          currentFilters.semester &&
          txn.semester !== currentFilters.semester
        ) {
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
          getTransactionOrganization(txn),
          getTransactionCollege(txn),
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
      return s === "completed" || s === "paid" || s === "ready";
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
      const period = currentFilters.period || "daily";
      let labels = [];
      let revenueValues = [];

      if (period === "daily") {
        const buckets = [0, 0, 0, 0];
        txns.forEach((txn) => {
          const date = parseTxnDate(txn);
          if (!date) return;
          const hour = date.getHours();
          if (hour < 6) buckets[0] += Number(txn.amount || 0);
          else if (hour < 12) buckets[1] += Number(txn.amount || 0);
          else if (hour < 18) buckets[2] += Number(txn.amount || 0);
          else buckets[3] += Number(txn.amount || 0);
        });
        labels = ["12am–6am", "6am–12pm", "12pm–6pm", "6pm–12am"];
        revenueValues = buckets;
      } else if (period === "weekly") {
        const labelsByDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const range = getPeriodRange("weekly");
        const dayTotals = new Array(7).fill(0);
        txns.forEach((txn) => {
          const date = parseTxnDate(txn);
          if (!date || date < range.start || date > range.end) return;
          const diff = Math.floor((date - range.start) / 86400000);
          if (diff >= 0 && diff < 7) {
            dayTotals[diff] += Number(txn.amount || 0);
          }
        });
        labels = labelsByDay;
        revenueValues = dayTotals;
      } else if (period === "monthly") {
        const weeks = 5;
        const weekTotals = new Array(weeks).fill(0);
        txns.forEach((txn) => {
          const date = parseTxnDate(txn);
          if (!date) return;
          const weekIndex = Math.min(
            Math.floor((date.getDate() - 1) / 7),
            weeks - 1,
          );
          weekTotals[weekIndex] += Number(txn.amount || 0);
        });
        labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
        revenueValues = weekTotals;
      } else {
        const monthTotals = new Array(12).fill(0);
        txns.forEach((txn) => {
          const date = parseTxnDate(txn);
          if (!date) return;
          monthTotals[date.getMonth()] += Number(txn.amount || 0);
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
        revenueValues = monthTotals;
      }

      if (paymentChart) {
        paymentChart.destroy();
        paymentChart = null;
      }

      paymentChart = new Chart(canvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Total revenue (₱)",
              data: revenueValues,
              backgroundColor: "#34d399",
              borderRadius: 4,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `₱${Number(context.parsed.y || context.parsed || 0).toFixed(2)}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Revenue (₱)",
              },
            },
          },
        },
      });
    }

    /**
     * Bar chart showing revenue by the selected performance period.
     */
    function renderPerformanceChart() {
      const canvas = document.getElementById("reportsPerformanceChart");
      if (!canvas || typeof Chart === "undefined") return;

      const periodOrders = getPeriodTransactions();
      let labels = [];
      let revenueValues = [];

      if (performancePeriod === "daily") {
        const buckets = [0, 0, 0, 0];
        periodOrders.forEach((o) => {
          const d = parseTxnDate(o);
          if (!d) return;
          const hour = d.getHours();
          if (hour < 6) buckets[0] += Number(o.amount || 0);
          else if (hour < 12) buckets[1] += Number(o.amount || 0);
          else if (hour < 18) buckets[2] += Number(o.amount || 0);
          else buckets[3] += Number(o.amount || 0);
        });
        labels = ["12am–6am", "6am–12pm", "12pm–6pm", "6pm–12am"];
        revenueValues = buckets;
      } else if (performancePeriod === "weekly") {
        const labelsByDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayRevenue = new Array(7).fill(0);
        const range = getPeriodRange("weekly");
        periodOrders.forEach((o) => {
          const d = parseTxnDate(o);
          if (!d) return;
          const idx = Math.floor((d - range.start) / 86400000);
          if (idx < 0 || idx > 6) return;
          dayRevenue[idx] += Number(o.amount || 0);
        });
        labels = labelsByDay;
        revenueValues = dayRevenue;
      } else if (performancePeriod === "monthly") {
        const weeks = 5;
        const weekRevenue = new Array(weeks).fill(0);
        periodOrders.forEach((o) => {
          const d = parseTxnDate(o);
          if (!d) return;
          const weekIndex = Math.min(
            Math.floor((d.getDate() - 1) / 7),
            weeks - 1,
          );
          weekRevenue[weekIndex] += Number(o.amount || 0);
        });
        labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
        revenueValues = weekRevenue;
      } else {
        const monthRevenue = new Array(12).fill(0);
        periodOrders.forEach((o) => {
          const d = parseTxnDate(o);
          if (!d) return;
          monthRevenue[d.getMonth()] += Number(o.amount || 0);
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
        revenueValues = monthRevenue;
      }

      const labelEl = document.getElementById("saPerfChartLabel");
      if (labelEl) {
        const map = {
          daily: "Today — revenue by time of day",
          weekly: "This week — revenue by day",
          monthly: "This month — revenue by week",
          yearly: "This year — revenue by month",
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
              label: "Revenue (₱)",
              data: revenueValues,
              backgroundColor: PERF_C_GREEN,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `₱${Number(context.parsed.y || context.parsed || 0).toFixed(2)}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Revenue (₱)",
                font: { family: "Inter, sans-serif" },
              },
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
      document
        .getElementById("reportsPrevPage")
        ?.addEventListener("click", () => {
          transactionPage -= 1;
          renderTransactions();
        });
      document
        .getElementById("reportsNextPage")
        ?.addEventListener("click", () => {
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
      const organizationOptions = Array.from(
        new Set(
          (db.transactions || [])
            .map(getTransactionOrganization)
            .filter(Boolean),
        ),
      )
        .sort()
        .map((org) => `<option value="${org.toLowerCase()}">${org}</option>`)
        .join("");
      const collegeOptions = Array.from(
        new Set(
          (db.transactions || []).map(getTransactionCollege).filter(Boolean),
        ),
      )
        .sort()
        .map(
          (college) =>
            `<option value="${college.toLowerCase()}">${college}</option>`,
        )
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
            <div class="form-group">
              <label class="form-label" for="filterOrganization">Organization</label>
              <select class="form-input form-select" id="filterOrganization">
                <option value="">All Organizations</option>
                ${organizationOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="filterCollege">College</label>
              <select class="form-input form-select" id="filterCollege">
                <option value="">All Colleges</option>
                ${collegeOptions}
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
                <h2 class="card-title">Total revenue</h2>
                <p class="card-subtitle">Revenue for the selected period and filters.</p>
              </div>
            </div>
            <div class="reports-chart-wrapper">
              <canvas id="reportsPaymentChart" aria-label="Total revenue chart"></canvas>
            </div>
          </div>
          <div class="card reports-chart-card">
            <div class="card-title-group sa-chart-card-head">
              <div>
                <h2 class="card-title">Revenue performance</h2>
                <p class="card-subtitle" id="saPerfChartLabel">Today — revenue by time of day</p>
              </div>
            </div>
            <div class="reports-chart-wrapper">
              <canvas id="reportsPerformanceChart" aria-label="Revenue performance chart"></canvas>
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
        currentFilters.category =
          document.getElementById("filterCategory").value;
        currentFilters.organization =
          document.getElementById("filterOrganization").value;
        currentFilters.college = document.getElementById("filterCollege").value;
        currentFilters.semester =
          document.getElementById("filterSemester").value;
        performancePeriod = currentFilters.period;
        transactionPage = 1;
        applyFilters();
      };

      [
        "filterPeriod",
        "filterService",
        "filterCategory",
        "filterOrganization",
        "filterCollege",
        "filterSemester",
      ].forEach((id) =>
        document
          .getElementById(id)
          ?.addEventListener("change", syncReportFilters),
      );

      document
        .getElementById("resetFiltersBtn")
        .addEventListener("click", () => {
          currentFilters = {
            service: "",
            category: "",
            organization: "",
            college: "",
            semester: "",
            period: "daily",
          };
          document.getElementById("filterPeriod").value = "daily";
          document.getElementById("filterService").value = "";
          document.getElementById("filterCategory").value = "";
          document.getElementById("filterOrganization").value = "";
          document.getElementById("filterCollege").value = "";
          document.getElementById("filterSemester").value = "";
          performancePeriod = "daily";
          transactionSearchQuery = "";
          transactionPage = 1;
          const recordsSearch = document.getElementById("reportsRecordsSearch");
          if (recordsSearch) recordsSearch.value = "";
          applyFilters();
        });

      document
        .getElementById("reportsRecordsSearch")
        ?.addEventListener("input", (event) => {
          transactionSearchQuery = event.target.value;
          transactionPage = 1;
          renderTransactions();
        });

      document
        .getElementById("reportsExportBtn")
        ?.addEventListener("click", () => exportFilteredTransactionsCsv());

      applyFilters();
      if (typeof lucide !== "undefined") lucide.createIcons();
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
  }

  init();
})();
