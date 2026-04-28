"use strict";

/* ==========================================================
   SHARED CHART HELPERS — loaded by all analytics pages
   ========================================================== */

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        font: { family: "DM Sans", size: 12 },
        usePointStyle: true,
        padding: 20,
      },
    },
  },
};

const C_RED = "#8B0000";
const C_GREEN = "#10B981";
const C_BLUE = "#2563EB";

/**
 * Creates (or re-creates) a Chart.js chart on a given canvas.
 * Destroys any existing instance first to avoid duplicates.
 */
const chartInstances = {};

function makeChart(canvasId, config) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  chartInstances[canvasId] = new Chart(canvas, config);
  return chartInstances[canvasId];
}
