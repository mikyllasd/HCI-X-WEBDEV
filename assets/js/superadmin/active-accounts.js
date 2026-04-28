"use strict";

/* ==========================================================
   ACTIVE ACCOUNTS PAGE
   ========================================================== */

let aaFilter = "all";

function daysUntilExpiry(lastCOR) {
  const expiry = new Date(lastCOR);
  expiry.setDate(expiry.getDate() + 365);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

function accountStatus(days) {
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

function expirationText(days) {
  if (days < 0)
    return `<span class="exp-expired">Expired ${Math.abs(days)} days ago</span>`;
  if (days <= 30) return `<span class="exp-expiring">${days} days</span>`;
  return `<span class="exp-active">${days} days</span>`;
}

function renderAccountsTable() {
  const tbody = document.getElementById("aa-table-body");
  if (!tbody) return;
  const query = (
    document.getElementById("aa-search")?.value || ""
  ).toLowerCase();

  const filtered = ACCOUNTS.filter((acc) => {
    const days = daysUntilExpiry(acc.lastCOR);
    const status = accountStatus(days);
    const matchFilter = aaFilter === "all" || status === aaFilter;
    const matchQuery =
      !query ||
      acc.name.toLowerCase().includes(query) ||
      acc.email.toLowerCase().includes(query);
    return matchFilter && matchQuery;
  });

  tbody.innerHTML =
    filtered.length === 0
      ? `<tr><td colspan="6" class="text-center text-muted" style="padding:32px">No accounts found</td></tr>`
      : filtered
          .map((acc) => {
            const days = daysUntilExpiry(acc.lastCOR);
            const status = accountStatus(days);
            return `
          <tr>
            <td><strong>${escHtml(acc.name)}</strong></td>
            <td><span class="email-cell">${mailIconSVG()} ${escHtml(acc.email)}</span></td>
            <td><span class="date-cell">${calIconSVG()} ${formatDate(acc.registrationDate)}</span></td>
            <td>${formatDate(acc.lastCOR)}</td>
            <td>${expirationText(days)}</td>
            <td>${accountBadgeHTML(status)}</td>
          </tr>`;
          })
          .join("");

  refreshAccountCounters();
}

function refreshAccountCounters() {
  let active = 0,
    expiring = 0,
    expired = 0;
  ACCOUNTS.forEach((acc) => {
    const s = accountStatus(daysUntilExpiry(acc.lastCOR));
    if (s === "active") active++;
    if (s === "expiring") expiring++;
    if (s === "expired") expired++;
  });
  setText("aa-total", ACCOUNTS.length);
  setText("aa-active", active);
  setText("aa-expiring", expiring);
  setText("aa-expired", expired);
}

document.addEventListener("DOMContentLoaded", () => {
  renderAccountsTable();

  document
    .getElementById("aa-search")
    ?.addEventListener("input", renderAccountsTable);

  document.querySelectorAll(".filter-tab[data-aa-filter]").forEach((tab) => {
    tab.addEventListener("click", () => {
      aaFilter = tab.dataset.aaFilter;
      document.querySelectorAll(".filter-tab[data-aa-filter]").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      renderAccountsTable();
    });
  });
});
