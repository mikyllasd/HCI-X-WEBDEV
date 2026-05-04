(function () {
  "use strict";

  const yearSelect = document.getElementById("archiveYearSelect");
  const currentYearEl = document.getElementById("archiveCurrentYear");
  const archivedAtEl = document.getElementById("archiveArchivedAt");
  const emptyState = document.getElementById("archiveEmptyState");
  const contentRoot = document.getElementById("archiveContent");

  const statUsers = document.getElementById("archiveStatUsers");
  const statTx = document.getElementById("archiveStatTransactions");
  const statSvc = document.getElementById("archiveStatServices");
  const statRat = document.getElementById("archiveStatRatings");

  const tbodyUsers = document.getElementById("archiveUsersBody");
  const tbodyTx = document.getElementById("archiveTxBody");
  const tbodySvc = document.getElementById("archiveServicesBody");
  const tbodyRat = document.getElementById("archiveRatingsBody");

  const searchTx = document.getElementById("archiveSearchTransactions");
  const searchUsers = document.getElementById("archiveSearchUsers");
  const searchServices = document.getElementById("archiveSearchServices");
  const searchRatings = document.getElementById("archiveSearchRatings");

  let activeTab = "transactions";

  /** @type {{ users: object[], transactions: object[], services: object[], ratings: object[] } | null} */
  let archiveCache = null;

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatMoney(n) {
    const v = parseFloat(n);
    if (!Number.isFinite(v)) return "—";
    return `₱${v.toFixed(2)}`;
  }

  function formatWhen(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString() : esc(iso);
  }

  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-archive-tab]").forEach((btn) => {
      const on = btn.dataset.archiveTab === tab;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll("[data-archive-panel]").forEach((panel) => {
      panel.classList.toggle(
        "is-active",
        panel.dataset.archivePanel === tab,
      );
    });
  }

  function renderEmpty(message) {
    archiveCache = null;
    if (emptyState) {
      emptyState.textContent = message;
      emptyState.classList.remove("hidden");
    }
    if (contentRoot) contentRoot.classList.add("hidden");
  }

  function rowHtmlUser(u) {
    return `
        <tr>
          <td>${esc(u.fullName || u.name || "—")}</td>
          <td>${esc(u.email || "—")}</td>
          <td>${esc(u.role || "—")}</td>
        </tr>`;
  }

  function rowHtmlTx(t) {
    return `
        <tr>
          <td>${esc(t.id || "—")}</td>
          <td>${esc(t.serviceName || t.service || "—")}</td>
          <td>${formatMoney(t.amount)}</td>
          <td>${esc(t.status || "—")}</td>
          <td>${esc(t.email || "—")}</td>
          <td>${formatWhen(t.date)}</td>
        </tr>`;
  }

  function rowHtmlService(s) {
    return `
        <tr>
          <td>${esc(s.name || "—")}</td>
          <td>${esc(s.category || "—")}</td>
          <td>${formatMoney(s.price)}</td>
        </tr>`;
  }

  function rowHtmlRating(r) {
    return `
        <tr>
          <td>${esc(r.transactionId || "—")}</td>
          <td>${esc(String(r.rating ?? "—"))}</td>
          <td>${esc(r.comment || "—")}</td>
          <td>${formatWhen(r.createdAt)}</td>
        </tr>`;
  }

  function haystackUser(u) {
    return [u.fullName, u.name, u.email, u.role].filter(Boolean).join(" ");
  }

  function haystackTx(t) {
    return [
      t.id,
      t.serviceName,
      t.service,
      t.status,
      t.email,
      t.academicYear,
      formatWhen(t.date),
      formatMoney(t.amount),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function haystackService(s) {
    return [s.name, s.category, s.id, formatMoney(s.price)].filter(Boolean).join(" ");
  }

  function haystackRating(r) {
    return [
      r.transactionId,
      r.rating,
      r.comment,
      formatWhen(r.createdAt),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function filterByQuery(items, query, haystackFn) {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      haystackFn(item).toLowerCase().includes(q),
    );
  }

  function clearSearchInputs() {
    [searchTx, searchUsers, searchServices, searchRatings].forEach((el) => {
      if (el) el.value = "";
    });
  }

  function refreshArchiveTables() {
    if (!archiveCache) return;

    const u = archiveCache.users;
    const tx = archiveCache.transactions;
    const sv = archiveCache.services;
    const rt = archiveCache.ratings;

    const fu = filterByQuery(u, searchUsers?.value || "", haystackUser);
    const ftx = filterByQuery(tx, searchTx?.value || "", haystackTx);
    const fsv = filterByQuery(sv, searchServices?.value || "", haystackService);
    const frt = filterByQuery(rt, searchRatings?.value || "", haystackRating);

    if (tbodyUsers) {
      if (!u.length) {
        tbodyUsers.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No users in this archive.</td></tr>`;
      } else if (!fu.length) {
        tbodyUsers.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No users match your search.</td></tr>`;
      } else {
        tbodyUsers.innerHTML = fu.map(rowHtmlUser).join("");
      }
    }

    if (tbodyTx) {
      if (!tx.length) {
        tbodyTx.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No transactions in this archive.</td></tr>`;
      } else if (!ftx.length) {
        tbodyTx.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No transactions match your search.</td></tr>`;
      } else {
        tbodyTx.innerHTML = ftx.map(rowHtmlTx).join("");
      }
    }

    if (tbodySvc) {
      if (!sv.length) {
        tbodySvc.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No services in this archive.</td></tr>`;
      } else if (!fsv.length) {
        tbodySvc.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No services match your search.</td></tr>`;
      } else {
        tbodySvc.innerHTML = fsv.map(rowHtmlService).join("");
      }
    }

    if (tbodyRat) {
      if (!rt.length) {
        tbodyRat.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No ratings in this archive.</td></tr>`;
      } else if (!frt.length) {
        tbodyRat.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No ratings match your search.</td></tr>`;
      } else {
        tbodyRat.innerHTML = frt.map(rowHtmlRating).join("");
      }
    }
  }

  function renderSnapshot(snap) {
    if (emptyState) emptyState.classList.add("hidden");
    if (contentRoot) contentRoot.classList.remove("hidden");

    if (archivedAtEl) {
      archivedAtEl.textContent = snap.archivedAt
        ? `Snapshot saved: ${formatWhen(snap.archivedAt)}`
        : "";
    }

    const users = snap.users || [];
    const tx = snap.transactions || [];
    const svcs = snap.services || [];
    const rats = snap.ratings || [];

    if (statUsers) statUsers.textContent = String(users.length);
    if (statTx) statTx.textContent = String(tx.length);
    if (statSvc) statSvc.textContent = String(svcs.length);
    if (statRat) statRat.textContent = String(rats.length);

    archiveCache = {
      users,
      transactions: tx,
      services: svcs,
      ratings: rats,
    };
    clearSearchInputs();
    refreshArchiveTables();
    setTab(activeTab);

    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  function loadYear(year) {
    if (!year) {
      renderEmpty("Choose a school year to load its archived records.");
      return;
    }
    const snap =
      typeof getArchivedYear === "function" ? getArchivedYear(year) : null;
    if (!snap) {
      renderEmpty(`No archive found for “${year}”.`);
      return;
    }
    renderSnapshot(snap);
  }

  function onListSearchInput() {
    refreshArchiveTables();
  }

  function init() {
    const db = typeof getDB === "function" ? getDB() : {};
    if (currentYearEl) {
      currentYearEl.textContent = db.academicYear
        ? `Active school year: ${db.academicYear}`
        : "Active school year: not set";
    }

    const years =
      typeof getArchivedYears === "function" ? getArchivedYears() : [];
    if (yearSelect) {
      yearSelect.innerHTML =
        `<option value="">— Select school year —</option>` +
        years.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join(
          "",
        );
    }

    if (!years.length) {
      renderEmpty(
        "No archived school years yet. Archives are created when you switch the academic year in System Settings (previous year’s data is saved automatically).",
      );
    } else {
      renderEmpty("Choose a school year to load its archived records.");
    }

    yearSelect?.addEventListener("change", () => {
      loadYear(yearSelect.value);
    });

    document.querySelectorAll("[data-archive-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTab(btn.dataset.archiveTab || "transactions");
      });
    });

    [searchTx, searchUsers, searchServices, searchRatings].forEach((el) => {
      el?.addEventListener("input", onListSearchInput);
      el?.addEventListener("search", onListSearchInput);
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
