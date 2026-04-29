/* ============================================================
   UPRESSease Admin Portal – Dashboard Page
   ============================================================ */

(function () {
  const pageContainer = document.getElementById("pageContainer");

  pageContainer.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">Today's Overview – ${formatDate(new Date())}</p>
    </div>

    <div class="stats-grid">
      ${statCard("Today's Orders", "0", "Total orders today", "red", "accent-red", iconBox())}
      ${statCard("Today's Income", "₱0.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Pending/Paid", "0", "Awaiting processing", "yellow", "accent-yellow", iconClock())}
      ${statCard("Processing", "0", "Currently being processed", "purple", "accent-purple", iconBox2())}
      ${statCard("Ready for Pickup", "0", "Ready to be claimed", "green", "accent-green", iconCheck())}
      ${statCard("Completed", "0", "Successfully completed", "gray", "accent-gray", iconCheck2())}
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <div>
          <div class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Today's Transactions
          </div>
          <div class="card-sub">All orders placed today</div>
        </div>
        <a href="reports.html" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
          View All Orders
        </a>
      </div>
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <div class="empty-title">No transactions today</div>
        <div class="empty-desc">Orders placed today will appear here</div>
      </div>
    </div>

    <div class="promo-banner">
      <div class="promo-left">
        <div class="promo-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div>
          <div class="promo-title">Performance Analytics</div>
          <div class="promo-desc">View detailed daily, monthly, and yearly performance reports</div>
        </div>
      </div>
      <a href="reports.html" class="btn btn-promo">View Analytics</a>
    </div>
  `;
})();
