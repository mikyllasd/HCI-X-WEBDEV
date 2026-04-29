/* ============================================================
   UPRESSease Admin Portal – Reports Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");

  // ── Mock report data ──
  const reportData = {
    daily: {
      labels: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"],
      orders: [4, 3, 0, 0, 2, 0, 0],
      income: [780, 620, 0, 0, 350, 0, 0],
    },
    monthly: {
      labels: [
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
      ],
      orders: [12, 8, 22, 9, 15, 18, 6, 9, 11, 14, 7, 0],
      income: [
        2400, 1600, 4400, 1800, 3000, 3600, 1200, 1800, 2200, 2800, 1400, 0,
      ],
    },
    yearly: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      orders: [85, 132, 168, 201, 9],
      income: [17000, 26400, 33600, 40200, 1750],
    },
  };

  let reportType = "daily";
  let chartInstance = null;

  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Reports</h1>
      <p class="page-sub">View and analyze system performance over time</p>
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
            <option value="monthly">Monthly (This Year)</option>
            <option value="yearly">Yearly (All Time)</option>
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

    <div class="stats-grid" style="margin-bottom:20px">
      ${statCard("Total Orders", "9", "Across selected period", "red", "accent-red", iconBox())}
      ${statCard("Total Income", "₱1,750.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Avg Order Value", "₱194.44", "Per completed order", "blue", "accent-blue", iconTrend())}
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Performance Chart</div>
          <div class="card-sub" id="chartSubtitle">Daily Report</div>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-container">
          <canvas id="perfChart"></canvas>
        </div>
      </div>
    </div>
  `;

  function buildChart(type) {
    const data = reportData[type];
    const ctx = document.getElementById("perfChart").getContext("2d");

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Orders",
            data: data.orders,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.08)",
            borderWidth: 2,
            pointBackgroundColor: "#ef4444",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
            yAxisID: "y",
          },
          {
            label: "Income (₱)",
            data: data.income,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.06)",
            borderWidth: 2,
            pointBackgroundColor: "#22c55e",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: "600",
              },
              usePointStyle: true,
              pointStyleWidth: 8,
              padding: 20,
              color: "#5a6170",
            },
          },
          tooltip: {
            backgroundColor: "white",
            titleColor: "#1a1d23",
            bodyColor: "#5a6170",
            borderColor: "#e4e8ef",
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: "'Plus Jakarta Sans', sans-serif",
              weight: "700",
              size: 13,
            },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label === "Income (₱)")
                  return `Income (₱) : ${ctx.parsed.y.toLocaleString()}`;
                return `Orders : ${ctx.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(0,0,0,0.04)" },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: "#9aa1b0",
            },
          },
          y: {
            position: "left",
            grid: { color: "rgba(0,0,0,0.04)" },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: "#ef4444",
              stepSize: 1,
            },
          },
          y1: {
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: "#22c55e",
            },
          },
        },
      },
    });
  }

  buildChart(reportType);

  document.getElementById("reportType").addEventListener("change", (e) => {
    reportType = e.target.value;
    const subtitles = {
      daily: "Daily Report",
      monthly: "Monthly Report",
      yearly: "Yearly Report",
    };
    document.getElementById("chartSubtitle").textContent =
      subtitles[reportType];
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    buildChart(reportType);
  });
})();
