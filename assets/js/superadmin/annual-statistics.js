"use strict";

/* ==========================================================
   ANNUAL STATISTICS PAGE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  makeChart("annual-line-chart", {
    type: "line",
    data: {
      labels: ["2026"],
      datasets: [
        {
          label: "Transactions",
          data: [9],
          borderColor: C_RED,
          pointBackgroundColor: C_RED,
          backgroundColor: "transparent",
          pointRadius: 6,
        },
        {
          label: "Revenue (₱)",
          data: [1750],
          borderColor: C_GREEN,
          pointBackgroundColor: C_GREEN,
          backgroundColor: "transparent",
          pointRadius: 6,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Transactions",
            font: { family: "DM Sans" },
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Revenue (₱)",
            font: { family: "DM Sans" },
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });

  makeChart("annual-volume-chart", {
    type: "bar",
    data: {
      labels: ["2026"],
      datasets: [
        {
          label: "Transactions",
          data: [9],
          backgroundColor: C_RED,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  makeChart("annual-users-chart", {
    type: "bar",
    data: {
      labels: ["2024", "2025", "2026"],
      datasets: [
        {
          label: "New Users",
          data: [15, 25, 8],
          backgroundColor: C_BLUE,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
});
