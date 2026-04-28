"use strict";

/* ==========================================================
   TRANSACTION HISTORY PAGE
   Shows completed orders with search + filter
   ========================================================== */

/* Completed orders come from shared localStorage via AppData */
function getCompletedOrders() {
  return AppData.getOrders()
    .filter((o) => o.status === "completed")
    .map((o) => ({
      id: o.id || o.orderId,
      date: o.date || o.dateOrdered || "—",
      email: o.email || "—",
      service: o.service || "—",
      items: o.desc || "—",
      payment: o.payment || o.paymentMethod || "—",
      amount: parseFloat(o.amount || o.total || 0),
    }));
}

const SERVICE_BADGE_MAP = {
  "Mug Printing": "badge--mug",
  Merchandise: "badge--merch",
  Printing: "badge--mug",
  Binding: "badge--merch",
  Lanyards: "badge--merch",
};

const PAYMENT_BADGE_MAP = {
  "Online Payment": "badge--online",
  "Pay Onsite": "badge--onsite",
};

function renderTransactionTable() {
  const tbody = document.getElementById("th-table-body");
  if (!tbody) return;

  const query = (
    document.getElementById("th-search")?.value || ""
  ).toLowerCase();
  const service = (
    document.getElementById("th-service")?.value || ""
  ).toLowerCase();

  const filtered = getCompletedOrders().filter((o) => {
    const matchQuery =
      !query ||
      o.id.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query);
    const matchService = !service || o.service.toLowerCase() === service;
    return matchQuery && matchService;
  });

  const total = filtered.reduce((s, o) => s + o.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;

  setText("th-total", filtered.length);
  setText("th-revenue", "₱" + total.toFixed(2));
  setText("th-avg", "₱" + avg.toFixed(2));

  const svcBadge = (svc) =>
    `<span class="badge ${SERVICE_BADGE_MAP[svc] || "badge--merch"}">${escHtml(svc)}</span>`;
  const payBadge = (pay) =>
    `<span class="badge ${PAYMENT_BADGE_MAP[pay] || "badge--onsite"}">${escHtml(pay)}</span>`;

  tbody.innerHTML =
    filtered.length === 0
      ? `<tr><td colspan="7" class="text-center text-muted" style="padding:32px">No transactions found</td></tr>`
      : filtered
          .map(
            (o) => `
      <tr>
        <td><strong>${escHtml(o.id)}</strong></td>
        <td>${escHtml(o.date)}</td>
        <td>${escHtml(o.email)}</td>
        <td>${svcBadge(o.service)}</td>
        <td>${escHtml(o.items)}</td>
        <td>${payBadge(o.payment)}</td>
        <td class="font-semibold">₱${o.amount.toFixed(2)}</td>
      </tr>`,
          )
          .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderTransactionTable();
  document
    .getElementById("th-search")
    ?.addEventListener("input", renderTransactionTable);
  document
    .getElementById("th-service")
    ?.addEventListener("change", renderTransactionTable);
  document
    .getElementById("th-college")
    ?.addEventListener("change", renderTransactionTable);
});
