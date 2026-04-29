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
const C_PURPLE = "#7c3aed";
const C_ORANGE = "#ea580c";

const SERVICE_COLORS = [C_RED, C_GREEN, C_BLUE, C_PURPLE, C_ORANGE, "#f59e0b", "#06b6d4"];

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

/* ==========================================================
   ANALYTICS FILTER HELPERS — shared by all analytics pages
   Requires data.js (AppData) to be loaded first.
   ========================================================== */

function populateFilterOptions() {
  const colleges = AppData.getColleges();
  const orderServices = AppData.getOrders()
    .map((o) => o.service)
    .filter(Boolean);
  const serviceNames = [
    ...new Set([
      ...AppData.getServices().map((s) => s.name),
      ...orderServices,
    ]),
  ].sort();
  const years = AppData.getOrderYears();

  function fillSelect(id, values) {
    const el = document.getElementById(id);
    if (!el) return;
    while (el.options.length > 1) el.remove(1);
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = String(v);
      el.appendChild(opt);
    });
  }

  fillSelect("filter-college", colleges);
  fillSelect("filter-service", serviceNames);
  fillSelect("filter-year", years);
}

function readFilters() {
  return {
    college: document.getElementById("filter-college")?.value ?? "all",
    service: document.getElementById("filter-service")?.value ?? "all",
    year: document.getElementById("filter-year")?.value ?? "all",
  };
}

function bindFilterEvents(renderFn) {
  ["filter-college", "filter-service", "filter-year"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", renderFn);
  });
  document.getElementById("filter-reset")?.addEventListener("click", () => {
    ["filter-college", "filter-service", "filter-year"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "all";
    });
    renderFn();
  });
}
