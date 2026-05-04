(function () {
  const db = getDB();
  const academicYear = db.academicYear || "";

  const totalSalesEl = document.getElementById("dashboardTotalSales");
  const dailySalesEl = document.getElementById("dashboardDailySales");
  const weeklySalesEl = document.getElementById("dashboardWeeklySales");
  const monthlySalesEl = document.getElementById("dashboardMonthlySales");
  const semestralSalesEl = document.getElementById("dashboardSemestralSales");
  const gcashPaidEl = document.getElementById("dashboardGCashPaid");
  const creditUnpaidEl = document.getElementById("dashboardCreditUnpaid");
  const verifiedUsersEl = document.getElementById("dashboardVerifiedUsers");
  const pendingRequestsEl = document.getElementById("dashboardPendingRequests");
  const transactionsBody = document.getElementById("dashboardTransactionsBody");
  const transactionsWrapper = document.getElementById(
    "dashboardTransactionsWrapper",
  );
  const emptyState = document.getElementById("dashboardEmptyState");
  const chartCanvas = document.getElementById("dashboardSalesChart");

  let salesChart = null;

  function normalizeTransactions() {
    return (db.transactions || []).filter((transaction) => {
      if (!transaction) return false;
      if (!transaction.date) return false;
      return !academicYear || transaction.academicYear === academicYear;
    });
  }

  function toMoney(amount) {
    return `₱${Number(amount || 0).toFixed(2)}`;
  }

  function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isCompleted(transaction) {
    const status = String(transaction.status || "").toLowerCase();
    return ["completed", "paid", "settled"].includes(status);
  }

  function getPaymentType(transaction) {
    const value = String(
      transaction.paymentType ||
        transaction.paymentMethod ||
        transaction.payment ||
        transaction.method ||
        "",
    ).toLowerCase();
    if (
      value.includes("gcash") ||
      value.includes("online payment") ||
      value.includes("maya")
    ) {
      return "gcash";
    }
    if (
      value.includes("credit") ||
      value.includes("pay onsite") ||
      value.includes("cash")
    ) {
      return "credit";
    }
    return value || "other";
  }

  function getCurrentSemester(date) {
    const month = date.getMonth() + 1;
    return month <= 6 ? "1st" : "2nd";
  }

  function getDailySales(transactions) {
    const today = new Date();
    return transactions
      .filter((transaction) => {
        const date = parseDate(transaction.date);
        return (
          date &&
          date.toDateString() === today.toDateString() &&
          isCompleted(transaction)
        );
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }

  function getWeeklySales(transactions) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return transactions
      .filter((transaction) => {
        const date = parseDate(transaction.date);
        return (
          date &&
          date >= weekStart &&
          date <= weekEnd &&
          isCompleted(transaction)
        );
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }

  function getMonthlySales(transactions) {
    const today = new Date();
    return transactions
      .filter((transaction) => {
        const date = parseDate(transaction.date);
        return (
          date &&
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          isCompleted(transaction)
        );
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }

  function getSemestralSales(transactions) {
    const today = new Date();
    const currentSemester = getCurrentSemester(today);
    return transactions
      .filter((transaction) => {
        const date = parseDate(transaction.date);
        return (
          date &&
          getCurrentSemester(date) === currentSemester &&
          isCompleted(transaction)
        );
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }

  function getSalesTrend(transactions) {
    const months = new Map();
    const now = new Date();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const label = month.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      months.set(label, 0);
    }

    transactions.forEach((transaction) => {
      const date = parseDate(transaction.date);
      if (!date || !isCompleted(transaction)) return;
      const label = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (months.has(label)) {
        months.set(label, months.get(label) + Number(transaction.amount || 0));
      }
    });

    return {
      labels: Array.from(months.keys()),
      values: Array.from(months.values()),
    };
  }

  function renderChart(transactions) {
    const trend = getSalesTrend(transactions);
    if (!chartCanvas) return;

    if (salesChart) {
      salesChart.destroy();
    }

    try {
      salesChart = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: trend.labels,
          datasets: [
            {
              label: "Completed sales",
              data: trend.values,
              borderColor: "#4f46e5",
              backgroundColor: "rgba(79, 70, 229, 0.16)",
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointBackgroundColor: "#4338ca",
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#475569" },
            },
            y: {
              grid: { color: "rgba(148,163,184,0.16)" },
              ticks: { color: "#475569", callback: (value) => `₱${value}` },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `₱${Number(context.parsed.y).toFixed(2)}`,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Unable to render chart:", error);
    }
  }

  function renderTransactionsTable(transactions) {
    if (!transactionsBody) return;

    const completed = transactions.filter(isCompleted);
    if (completed.length === 0) {
      transactionsWrapper?.classList.add("hidden");
      emptyState?.classList.remove("hidden");
      return;
    }

    transactionsWrapper?.classList.remove("hidden");
    emptyState?.classList.add("hidden");

    const rows = completed
      .slice(0, 8)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((transaction) => {
        const paymentType = getPaymentType(transaction);
        const date = parseDate(transaction.date);
        return `
          <tr>
            <td>${date ? date.toLocaleDateString() : "N/A"}</td>
            <td>${transaction.studentName || transaction.email || "Unknown"}</td>
            <td>${transaction.serviceName || transaction.service || "—"}</td>
            <td>${paymentType === "gcash" ? "GCash" : paymentType === "credit" ? "Credit" : "Other"}</td>
            <td>${toMoney(transaction.amount)}</td>
            <td>${String(transaction.status || "").toUpperCase()}</td>
          </tr>
        `;
      })
      .join("");

    transactionsBody.innerHTML = rows;
  }

  function renderDashboard() {
    const transactions = normalizeTransactions();
    const completed = transactions.filter(isCompleted);

    const totalSales = completed.reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0,
    );
    const dailySales = getDailySales(transactions);
    const weeklySales = getWeeklySales(transactions);
    const monthlySales = getMonthlySales(transactions);
    const semestralSales = getSemestralSales(transactions);
    const gcashPaid = completed
      .filter((transaction) => getPaymentType(transaction) === "gcash")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const creditUnpaid = transactions
      .filter(
        (transaction) =>
          getPaymentType(transaction) === "credit" && !isCompleted(transaction),
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const users = db.users || [];
    const verifiedUsers = users.filter(
      (user) => String(user.status || "").toLowerCase() === "approved",
    ).length;
    const pendingRequests = users.filter(
      (user) => String(user.status || "").toLowerCase() === "pending",
    ).length;

    if (totalSalesEl) totalSalesEl.textContent = toMoney(totalSales);
    if (dailySalesEl) dailySalesEl.textContent = toMoney(dailySales);
    if (weeklySalesEl) weeklySalesEl.textContent = toMoney(weeklySales);
    if (monthlySalesEl) monthlySalesEl.textContent = toMoney(monthlySales);
    if (semestralSalesEl)
      semestralSalesEl.textContent = toMoney(semestralSales);
    if (gcashPaidEl) gcashPaidEl.textContent = toMoney(gcashPaid);
    if (creditUnpaidEl) creditUnpaidEl.textContent = toMoney(creditUnpaid);
    if (verifiedUsersEl) verifiedUsersEl.textContent = verifiedUsers;
    if (pendingRequestsEl) pendingRequestsEl.textContent = pendingRequests;

    renderChart(transactions);
    renderTransactionsTable(transactions);
  }

  function init() {
    if (!academicYear) {
      const header = document.querySelector(".page-subtitle");
      if (header) {
        header.textContent =
          "Set the current academic year in system settings to populate dashboard data.";
      }
    }

    renderDashboard();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
