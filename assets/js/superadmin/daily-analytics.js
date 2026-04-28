"use strict";

/* ==========================================================
   DAILY ANALYTICS PAGE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("da-date");
  if (el)
    el.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  makeChart("daily-chart", {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Orders",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: C_RED,
          backgroundColor: "transparent",
          tension: 0.35,
          pointBackgroundColor: C_RED,
          pointRadius: 4,
        },
        {
          label: "Income (₱)",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: C_GREEN,
          backgroundColor: "transparent",
          tension: 0.35,
          pointBackgroundColor: C_GREEN,
          pointRadius: 4,
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
