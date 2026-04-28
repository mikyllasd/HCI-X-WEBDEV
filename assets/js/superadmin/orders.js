"use strict";

/* ==========================================================
   ORDERS PAGE
   ========================================================== */

let ordersFilter = "all";

function renderOrdersTable() {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;
  const query = (
    document.getElementById("orders-search")?.value || ""
  ).toLowerCase();

  const filtered = ORDERS.filter((o) => {
    const matchStatus = ordersFilter === "all" || o.status === ordersFilter;
    const matchQuery =
      !query ||
      o.id.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query) ||
      o.service.toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  /* Update tab labels with counts */
  document.querySelectorAll(".tab-btn[data-status]").forEach((btn) => {
    const s = btn.dataset.status;
    const count =
      s === "all" ? ORDERS.length : ORDERS.filter((o) => o.status === s).length;
    btn.textContent =
      capitalise(s === "all" ? "All Orders" : s) + ` (${count})`;
    if (s === btn.dataset.status && btn.classList.contains("active")) {
      btn.textContent =
        (s === "all" ? "All Orders" : capitalise(s)) + ` (${count})`;
    }
  });

  tbody.innerHTML =
    filtered.length === 0
      ? `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">No orders found</td></tr>`
      : filtered
          .map(
            (o) => `
      <tr>
        <td><strong>${escHtml(o.id)}</strong></td>
        <td>${escHtml(o.email)}</td>
        <td>${escHtml(o.service)}</td>
        <td style="color:var(--clr-primary);font-weight:600">₱${o.amount.toFixed(2)}</td>
        <td>${statusBadgeHTML(o.status)}</td>
        <td>${escHtml(o.payment)}</td>
        <td>${escHtml(o.date)}</td>
        <td>
          <button class="btn--view" data-order-id="${escHtml(o.id)}" aria-label="View order ${escHtml(o.id)}">
            ${eyeIconSVG(14)} View
          </button>
        </td>
      </tr>`,
          )
          .join("");

  tbody.querySelectorAll(".btn--view").forEach((btn) => {
    btn.addEventListener("click", () => openOrderModal(btn.dataset.orderId));
  });
}

function openOrderModal(orderId) {
  const o = ORDERS.find((o) => o.id === orderId);
  if (!o) return;

  document.getElementById("order-modal-body").innerHTML = `
    <dl>
      <div class="detail-row"><dt>Order ID</dt>      <dd><strong>${escHtml(o.id)}</strong></dd></div>
      <div class="detail-row"><dt>Student Email</dt> <dd>${escHtml(o.email)}</dd></div>
      <div class="detail-row"><dt>Service</dt>       <dd>${escHtml(o.service)}</dd></div>
      <div class="detail-row"><dt>Amount</dt>
        <dd style="color:var(--clr-primary);font-weight:700">₱${o.amount.toFixed(2)}</dd>
      </div>
      <div class="detail-row"><dt>Status</dt>        <dd>${statusBadgeHTML(o.status)}</dd></div>
      <div class="detail-row"><dt>Payment</dt>       <dd>${escHtml(o.payment)}</dd></div>
      <div class="detail-row"><dt>Date</dt>          <dd>${escHtml(o.date)}</dd></div>
    </dl>`;

  document.getElementById("order-modal-overlay").classList.remove("hidden");
}

function closeOrderModal() {
  document.getElementById("order-modal-overlay").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  renderOrdersTable();

  document
    .getElementById("orders-search")
    ?.addEventListener("input", renderOrdersTable);

  document.querySelectorAll(".tab-btn[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ordersFilter = btn.dataset.status;
      document.querySelectorAll(".tab-btn[data-status]").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      renderOrdersTable();
    });
  });

  document
    .getElementById("order-modal-close")
    ?.addEventListener("click", closeOrderModal);
  document
    .getElementById("order-modal-overlay")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeOrderModal();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOrderModal();
  });
});
