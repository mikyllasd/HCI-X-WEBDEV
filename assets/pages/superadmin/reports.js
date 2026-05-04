(function () {
  const db = getDB();
  const pageContainer = document.getElementById("pageContainer");

  let currentFilters = {
    service: "",
    category: "",
    academicYear: db.academicYear,
    semester: "",
  };

  let chartType = "monthly";

  function generateMockTransactions() {
    // Only generate mock data if no transactions exist
    if (!db.transactions || db.transactions.length === 0) {
      db.transactions = [];
      const services = db.services || [];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

      if (services.length > 0) {
        months.forEach((month, idx) => {
          for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
            const service =
              services[Math.floor(Math.random() * services.length)];
            db.transactions.push({
              id: "txn_" + Math.random().toString(36).substr(2, 9),
              serviceId: service.id,
              serviceName: service.name,
              amount: service.price,
              category: service.category,
              status: ["completed", "pending", "cancelled"][
                Math.floor(Math.random() * 3)
              ],
              semester: Math.random() > 0.5 ? "1st" : "2nd",
              date: new Date(
                2026,
                idx,
                Math.floor(Math.random() * 28) + 1,
              ).toISOString(),
            });
          }
        });
        saveDB(db);
      }
    }
  }

  function getFilteredData() {
    generateMockTransactions();

    if (!db.transactions || db.transactions.length === 0) {
      return [];
    }

    return db.transactions.filter((txn) => {
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

  function getMonthlyData() {
    const filtered = getFilteredData();
    const monthly = {};

    filtered.forEach((txn) => {
      const date = new Date(txn.date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthly[monthKey]) {
        monthly[monthKey] = { count: 0, total: 0, completed: 0 };
      }
      monthly[monthKey].count++;
      monthly[monthKey].total += parseFloat(txn.amount) || 0;
      if (txn.status === "completed") {
        monthly[monthKey].completed++;
      }
    });

    return monthly;
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
      yearly[txn.status]++;

      if (!yearly.byService[txn.serviceName]) {
        yearly.byService[txn.serviceName] = 0;
      }
      yearly.byService[txn.serviceName] += parseFloat(txn.amount) || 0;
    });

    return yearly;
  }

  function renderChart() {
    const chartContainer = document.getElementById("chartContainer");
    if (!chartContainer) return;

    const data = chartType === "monthly" ? getMonthlyData() : getYearlyData();

    if (chartType === "monthly") {
      const months = Object.keys(data).sort();
      const maxValue = Math.max(...months.map((m) => data[m].total), 1);

      chartContainer.innerHTML = `
        <div class="chart-bar-container">
          ${months
            .map((month) => {
              const value = data[month].total;
              const height = (value / maxValue) * 280;
              return `
              <div class="chart-bar">
                <div class="bar-visual" style="height: ${height}px;" title="₱${value.toFixed(2)}"></div>
                <div class="bar-label">${month}</div>
                <div class="bar-value">₱${(value / 1000).toFixed(1)}k</div>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
    } else {
      // Yearly view with service breakdown
      const services = Object.entries(data.byService)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      const maxValue = Math.max(...services.map((s) => s[1]), 1);

      chartContainer.innerHTML = `
        <div class="chart-bar-container">
          ${services
            .map(([service, value]) => {
              const height = (value / maxValue) * 280;
              return `
              <div class="chart-bar">
                <div class="bar-visual" style="height: ${height}px;" title="₱${value.toFixed(2)}"></div>
                <div class="bar-label">${service.substring(0, 12)}</div>
                <div class="bar-value">₱${(value / 1000).toFixed(1)}k</div>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
    }
  }

  function renderSummary() {
    const summary = getYearlyData();
    const summarySection = document.getElementById("summarySection");
    if (!summarySection) return;

    summarySection.innerHTML = `
      <div class="summary-item">
        <div class="summary-item-label">Total Revenue</div>
        <div class="summary-item-value">₱${summary.total.toFixed(2)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Total Transactions</div>
        <div class="summary-item-value">${summary.count}</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Completed</div>
        <div class="summary-item-value">${summary.completed}</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Pending</div>
        <div class="summary-item-value">${summary.pending}</div>
      </div>
    `;
  }

  function renderTransactions() {
    const filtered = getFilteredData();
    const tbody = document.querySelector(".transactions-table tbody");
    if (!tbody) return;

    if (filtered.length === 0) {
      const tableContainer = document.getElementById("transactionsSection");
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m0 0v10a2 2 0 0 0 2 2h4m0-14h4a2 2 0 0 1 2 2v4m0 0v10a2 2 0 0 1-2 2h-4"/>
              </svg>
            </div>
            <div class="empty-state__title">No data available</div>
            <div class="empty-state__sub">Try adjusting your filters</div>
          </div>
        `;
      }
      return;
    }

    tbody.innerHTML = filtered
      .map(
        (txn) => `
      <tr>
        <td>${txn.serviceName}</td>
        <td>${txn.category}</td>
        <td>₱${parseFloat(txn.amount).toFixed(2)}</td>
        <td><span class="transaction-status ${txn.status}">${txn.status}</span></td>
        <td>${txn.semester || "N/A"}</td>
        <td>${new Date(txn.date).toLocaleDateString()}</td>
      </tr>
    `,
      )
      .join("");
  }

  function applyFilters() {
    renderChart();
    renderSummary();
    renderTransactions();
  }

  function renderPage() {
    generateMockTransactions();

    const services = db.services || [];
    const serviceOptions = services
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");

    pageContainer.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Reports & Analytics</h1>
        <p class="page-sub">Monthly and yearly business reports with detailed analytics</p>
      </div>

      <div class="filter-section">
        <div class="filter-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filter Reports
        </div>
        <div class="filter-grid">
          <div class="filter-group">
            <label class="filter-label">Service</label>
            <select class="filter-input" id="filterService">
              <option value="">All Services</option>
              ${serviceOptions}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <select class="filter-input" id="filterCategory">
              <option value="">All Categories</option>
              <option value="printing">Printing</option>
              <option value="merchandise">Merchandise</option>
              <option value="special">Special Services</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Semester</label>
            <select class="filter-input" id="filterSemester">
              <option value="">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
            </select>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" id="applyFiltersBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Apply Filters
          </button>
          <button class="btn btn-ghost" id="resetFiltersBtn">Reset</button>
        </div>
      </div>

      <div class="stats-overview">
        <div class="stat-card accent-red">
          <div class="stat-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/>
            </svg>
          </div>
          <div class="stat-card__value" id="totalTransactions">0</div>
          <div class="stat-card__label">Total Transactions</div>
        </div>
        <div class="stat-card accent-green">
          <div class="stat-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M16 12l-4 4-2-2"/>
            </svg>
          </div>
          <div class="stat-card__value" id="completedCount">0</div>
          <div class="stat-card__label">Completed Orders</div>
        </div>
        <div class="stat-card accent-blue">
          <div class="stat-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
            </svg>
          </div>
          <div class="stat-card__value" id="totalRevenue">₱0.00</div>
          <div class="stat-card__label">Total Revenue</div>
        </div>
        <div class="stat-card accent-purple">
          <div class="stat-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
          </div>
          <div class="stat-card__value" id="avgTransaction">₱0.00</div>
          <div class="stat-card__label">Avg Transaction</div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-header">
          <h2 class="chart-title">Sales Performance</h2>
          <div class="chart-type-toggle">
            <button class="chart-type-btn active" data-type="monthly">Monthly</button>
            <button class="chart-type-btn" data-type="yearly">By Service</button>
          </div>
        </div>
        <div class="chart-container" id="chartContainer"></div>
      </div>

      <div class="summary-section">
        <h2 class="summary-title">Summary</h2>
        <div class="summary-grid" id="summarySection"></div>
      </div>

      <div class="transactions-section" id="transactionsSection">
        <h2 class="transactions-title">Transaction Details</h2>
        <div class="table-wrapper">
          <table class="transactions-table">
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
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById("applyFiltersBtn").addEventListener("click", () => {
      currentFilters.service = document.getElementById("filterService").value;
      currentFilters.category = document.getElementById("filterCategory").value;
      currentFilters.semester = document.getElementById("filterSemester").value;
      applyFilters();
    });

    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      currentFilters = {
        service: "",
        category: "",
        academicYear: db.academicYear,
        semester: "",
      };
      document.getElementById("filterService").value = "";
      document.getElementById("filterCategory").value = "";
      document.getElementById("filterSemester").value = "";
      applyFilters();
    });

    document.querySelectorAll(".chart-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".chart-type-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        chartType = btn.dataset.type;
        renderChart();
      });
    });

    // Initial render
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

  const originalRender = window.applyFilters;
  window.applyFilters = function () {
    renderChart();
    renderSummary();
    renderTransactions();
    updateStats();
  };

  renderPage();
})();
