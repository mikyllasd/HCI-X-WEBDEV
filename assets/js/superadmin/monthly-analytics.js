"use strict";

/* ==========================================================
   MONTHLY ANALYTICS PAGE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  makeChart("monthly-chart", {
    type: "bar",
    data: {
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
      datasets: [
        {
          label: "Orders",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 4],
          backgroundColor: C_RED,
          borderRadius: 4,
        },
        {
          label: "Income (₱)",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 750, 0, 1000],
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
