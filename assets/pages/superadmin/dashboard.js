(function () {
  // Wait for storage.js to load
  function init() {
    if (typeof getDB === "undefined") {
      setTimeout(init, 10);
      return;
    }

    const db = getDB();
    const pageContainer = document.getElementById("pageContainer");

    function formatDate(date) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    function sameDay(dateString, compareDate) {
      const date = new Date(dateString);
      return (
        date.getFullYear() === compareDate.getFullYear() &&
        date.getMonth() === compareDate.getMonth() &&
        date.getDate() === compareDate.getDate()
      );
    }

    function statCard(label, value, sublabel, accent, icon) {
      return `
      <div class="stat-card accent-${accent}">
        <div class="stat-card__icon">
          ${icon}
        </div>
        <div class="stat-card__value">${value}</div>
        <div class="stat-card__label">${label}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">${sublabel}</div>
      </div>
    `;
    }

    function iconBox() {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>`;
    }

    function iconDollar() {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M12 18V6"/></svg>`;
    }

    function iconClock() {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    }

    function iconCheck() {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    }

    function iconStatus() {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>`;
    }

    function renderEmptyState() {
      pageContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Monitor orders, income, and transaction activity</p>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <div class="empty-state__title">Academic Year Not Set</div>
        <div class="empty-state__sub">Please set the academic year in System Settings before using the dashboard.</div>
        <a href="settings.html" class="sd-hero__cta" style="margin-top: 16px; display: inline-block;">Go to Settings</a>
      </div>
    `;
    }

    function renderDashboard() {
      if (!db.academicYear) {
        renderEmptyState();
        return;
      }

      const today = new Date();
      const todayTransactions = (db.transactions || []).filter((txn) =>
        sameDay(txn.date, today),
      );
      const completedTransactions = (db.transactions || []).filter(
        (txn) => txn.status === "completed",
      );
      const pendingTransactions = (db.transactions || []).filter(
        (txn) => txn.status === "pending",
      );
      const processingTransactions = (db.transactions || []).filter(
        (txn) => txn.status === "processing",
      );
      const readyTransactions = (db.transactions || []).filter((txn) => {
        const status = (txn.status || "").toLowerCase();
        return ["ready", "for pickup", "ready for pickup"].includes(status);
      });

      const todayIncome = todayTransactions.reduce(
        (sum, txn) => sum + (parseFloat(txn.amount) || 0),
        0,
      );

      pageContainer.innerHTML = `
      <header class="sd-header">
        <h1 class="sd-title">Dashboard</h1>
        <div class="sd-subtitle">Academic Year ${db.academicYear} – ${formatDate(today)}</div>
      </header>

      <section class="sd-metrics" aria-label="System metrics">
        ${statCard("Today's Orders", todayTransactions.length, "Orders placed today", "red", iconBox())}
        ${statCard("Today's Income", `₱${todayIncome.toFixed(2)}`, "From completed orders today", "green", iconDollar())}
        ${statCard("Pending Orders", pendingTransactions.length, "Awaiting processing", "yellow", iconClock())}
        ${statCard("Processing", processingTransactions.length, "Currently in progress", "purple", iconStatus())}
        ${statCard("Ready for Pickup", readyTransactions.length, "Ready to be claimed", "green", iconCheck())}
        ${statCard("Completed", completedTransactions.length, "Successfully completed", "gray", iconCheck())}
      </section>

      <section class="sd-panel" aria-label="Recent transactions">
        <div class="sd-panel__head">
          <div>
            <div class="sd-panel__title">
              <span class="sd-panel__titleIcon" aria-hidden="true">≡</span>
              <span>Recent Transactions</span>
            </div>
            <div class="sd-panel__sub">Latest system activity</div>
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
          <div class="sd-empty__title">No recent transactions</div>
          <div class="sd-empty__sub">Transaction activity will appear here</div>
        </div>
      </section>

      <section class="sd-hero" aria-label="Reports overview">
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
          <div class="sd-hero__title">System Reports</div>
          <div class="sd-hero__sub">
            View detailed reports and analytics for the current academic year
          </div>
        </div>
        <a href="reports.html" class="sd-hero__cta">View Reports</a>
      </section>
    `;
    }

    renderDashboard();
  }

  init();
})();
