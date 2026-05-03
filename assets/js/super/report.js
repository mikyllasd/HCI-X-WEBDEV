/* ============================================================
   UPRESSease Admin Portal – Reports Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");

  const reportData = {
    daily: {
      labels: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"],
      orders: [0, 0, 0, 0, 0, 0, 0],
      income: [0, 0, 0, 0, 0, 0, 0],
    },
    monthly: {
      labels: [
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
      ],
      orders: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      income: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1000],
    },
    yearly: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      orders: [0, 0, 0, 0, 9],
      income: [0, 0, 0, 0, 1750],
    },
  };

  let reportType = "daily";
  let chartInstance = null;

  pageContainer.innerHTML = `
    <div class="page-header page-header--row">
      <div class="page-header__intro">
        <h1 class="page-title">Reports</h1>
        <p class="page-sub">View and analyze system performance over time</p>
      </div>
      <button
        type="button"
        class="btn btn-primary page-header__action"
        id="reportsExportBtn"
        aria-label="Export Report"
      >
        <i data-lucide="download" aria-hidden="true"></i>
        Export Report
      </button>
    </div>

    <div class="reports-header-section">
      <div class="reports-filter-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Report Filters
      </div>
      <div class="reports-filter-sub">Select time period and date range for reports</div>
      <div class="filter-grid">
        <div>
          <div class="filter-label">Report Type</div>
          <select class="form-input form-select" id="reportType">
            <option value="daily" selected>Daily (Last 7 Days)</option>
            <option value="monthly">Monthly (Last 12 Months)</option>
            <option value="yearly">Yearly (Last 5 Years)</option>
          </select>
        </div>
        <div>
          <div class="filter-label">Start Date (Optional)</div>
          <input type="date" class="form-input" id="startDate" />
        </div>
        <div>
          <div class="filter-label">End Date (Optional)</div>
          <input type="date" class="form-input" id="endDate" />
        </div>
      </div>
    </div>

    <section class="sd-metrics" aria-label="Report summary">
      ${statCard("Total Orders", "9", "Across selected period", "red", "accent-red", iconBox())}
      ${statCard("Total Income", "₱1,750.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Avg Order Value", "₱194.44", "Per completed order", "blue", "accent-blue", iconTrend())}
    </section>

    <div class="card sp">
      <div class="card-title-group">
        <i data-lucide="bar-chart-2" aria-hidden="true"></i>
        <div>
          <h2 class="card-title">Performance Chart</h2>
          <p class="card-subtitle" id="rpt-chart-label">Daily Report</p>
        </div>
      </div>
      <div style="position:relative;height:300px;margin-top:1rem;">
        <canvas id="reports-chart" aria-label="Reports performance chart"></canvas>
      </div>
    </div>
  `;

  function buildChart(type) {
    const canvas = document.getElementById("reports-chart");
    if (!canvas) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    chartInstance = null;

    const data = reportData[type] || reportData.daily;

    chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Orders",
            data: data.orders,
            borderColor: "#1a1a1a",
            backgroundColor: "transparent",
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#1a1a1a",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2,
            tension: 0,
            yAxisID: "yLeft",
          },
          {
            label: "Income (₱)",
            data: data.income,
            borderColor: "#10B981",
            backgroundColor: "transparent",
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#10B981",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2,
            tension: 0,
            yAxisID: "yRight",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            align: "center",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: { family: "'Inter', sans-serif", size: 13 },
              color: "#374151",
            },
          },
          tooltip: {
            backgroundColor: "#fff",
            borderColor: "#e5e7eb",
            borderWidth: 1,
            titleColor: "#111827",
            bodyColor: "#6B7280",
            padding: 10,
            callbacks: {
              label(ctx) {
                if (ctx.dataset.label === "Income (₱)") {
                  return " Income: ₱" + ctx.parsed.y.toFixed(2);
                }
                return " Orders: " + ctx.parsed.y;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "#e5e7eb",
              lineWidth: 1,
              drawTicks: false,
            },
            border: { dash: [4, 4] },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 12 },
              color: "#6B7280",
              padding: 8,
            },
          },
          yLeft: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            grid: {
              color: "#e5e7eb",
              lineWidth: 1,
              drawTicks: false,
            },
            border: { dash: [4, 4] },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 12 },
              color: "#6B7280",
              padding: 8,
              stepSize: 1,
              precision: 0,
            },
            title: { display: false },
          },
          yRight: {
            type: "linear",
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 12 },
              color: "#10B981",
              padding: 8,
              callback(val) {
                return val;
              },
            },
            title: { display: false },
          },
        },
      },
    });
  }

  buildChart(reportType);

  document.getElementById("reportsExportBtn").addEventListener("click", () => {
    showToast("Export prepared (demo).");
  });

  document.getElementById("reportType").addEventListener("change", (e) => {
    reportType = e.target.value;
    const subtitles = {
      daily: "Daily Report",
      monthly: "Monthly Report",
      yearly: "Yearly Report",
    };
    const lbl = document.getElementById("rpt-chart-label");
    if (lbl) lbl.textContent = subtitles[reportType];
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    buildChart(reportType);
  });

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
})();
