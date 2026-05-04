(function () {
  const pageContainer = document.getElementById("pageContainer");

  pageContainer.innerHTML = `
    <header class="sd-header">
      <h1 class="sd-title">Dashboard</h1>
      <div class="sd-subtitle">Today's Overview – ${formatDate(new Date())}</div>
    </header>

    <section class="sd-metrics" aria-label="Dashboard metrics">
      ${statCard("Today's Orders", "0", "Total orders today", "red", "accent-red", iconBox())}
      ${statCard("Today's Income", "₱0.00", "From completed orders", "green", "accent-green", iconDollar())}
      ${statCard("Pending/Paid", "0", "Awaiting processing", "yellow", "accent-yellow", iconClock())}
      ${statCard("Processing", "0", "Currently being processed", "purple", "accent-purple", iconBox2())}
      ${statCard("Ready for Pickup", "0", "Ready to be claimed", "green", "accent-green", iconCheck())}
      ${statCard("Completed", "0", "Successfully completed", "gray", "accent-gray", iconCheck2())}
    </section>

    <section class="sd-panel" aria-label="Today's transactions">
      <div class="sd-panel__head">
        <div>
          <div class="sd-panel__title">
            <span class="sd-panel__titleIcon" aria-hidden="true">≡</span>
            <span>Today's Transactions</span>
          </div>
          <div class="sd-panel__sub">All orders placed today</div>
        </div>
        <a href="reports.html" class="sd-panel__cta">
          <span class="sd-panel__ctaIcon" aria-hidden="true">≡</span>
          <span>View All</span>
        </a>
      </div>
      <div class="sd-empty">
        <div class="sd-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path
              d="M3.27 6.96 12 12l8.73-5.04M12 22V12"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="sd-empty__title">No transactions today</div>
        <div class="sd-empty__sub">Orders placed today will appear here</div>
      </div>
    </section>

    <section class="sd-hero" aria-label="Performance analytics">
      <div class="sd-hero__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16l5-6 4 3 7-9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
      <div class="sd-hero__text">
        <div class="sd-hero__title">Performance Analytics</div>
        <div class="sd-hero__sub">
          View detailed daily, monthly, and yearly performance reports
        </div>
      </div>
      <a href="reports.html" class="sd-hero__cta">View Analytics</a>
    </section>
  `;
})();
