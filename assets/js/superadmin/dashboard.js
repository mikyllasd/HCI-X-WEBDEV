"use strict";

/* ==========================================================
   DASHBOARD PAGE — renders today's order stats + transaction table
   ========================================================== */

function setDashboardDate() {
  const el = document.getElementById("dash-date");
  if (!el) return;
  el.textContent =
    "Today's Overview – " +
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
}

function renderDashboardStats() {
  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const todayOrders = ORDERS.filter((o) => o.date === todayStr);

  const pending = ORDERS.filter(
    (o) => o.status === "pending" || o.status === "paid",
  ).length;
  const processing = ORDERS.filter((o) => o.status === "processing").length;
  const ready = ORDERS.filter((o) => o.status === "ready").length;
  const completed = ORDERS.filter((o) => o.status === "completed").length;
  const income = ORDERS.filter((o) => o.status === "completed").reduce(
    (s, o) => s + o.amount,
    0,
  );

  setText("dash-orders", ORDERS.length);
  setText("dash-income", "₱" + income.toFixed(2));
  setText("dash-pending", pending);
  setText("dash-processing", processing);
  setText("dash-ready", ready);
  setText("dash-completed", completed);

  const empty = document.getElementById("dash-empty");
  const table = document.getElementById("dash-table");
  const tbody = document.getElementById("dash-table-body");

  if (todayOrders.length === 0) {
    empty?.classList.remove("hidden");
    table?.classList.add("hidden");
  } else {
    empty?.classList.add("hidden");
    table?.classList.remove("hidden");
    if (tbody) {
      tbody.innerHTML = todayOrders
        .map(
          (o) => `
        <tr>
          <td><strong>${escHtml(o.id)}</strong></td>
          <td>${escHtml(o.email)}</td>
          <td>${escHtml(o.service)}</td>
          <td style="color:var(--clr-primary);font-weight:600">₱${o.amount.toFixed(2)}</td>
          <td>${statusBadgeHTML(o.status)}</td>
          <td>${escHtml(o.payment)}</td>
        </tr>`,
        )
        .join("");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setDashboardDate();
  renderDashboardStats();
});
