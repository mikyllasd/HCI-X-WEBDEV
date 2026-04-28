"use strict";

/* ==========================================================
   YEARLY ANALYTICS PAGE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  makeChart("yearly-chart", {
    type: "bar",
    data: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      datasets: [
        {
          label: "Orders",
          data: [0, 0, 0, 0, 9],
          backgroundColor: C_RED,
          borderRadius: 4,
        },
        {
          label: "Income (₱)",
          data: [0, 0, 0, 0, 1750],
          backgroundColor: C_GREEN,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Orders", font: { family: "DM Sans" } },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Income (₱)",
            font: { family: "DM Sans" },
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
});
