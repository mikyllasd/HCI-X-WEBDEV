/**
 * Lightweight search + pagination for staff data tables.
 * Works with tables that are rendered/rehydrated dynamically.
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }

  function initTableList({
    tableId,
    searchInputId,
    countId,
    paginationId,
    pageSize = 8,
    emptyLabel = "rows",
  }) {
    const table = $(tableId);
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const searchInput = $(searchInputId);
    const countEl = $(countId);
    const pager = $(paginationId);

    let query = "";
    let page = 1;

    function allRows() {
      return Array.from(tbody.querySelectorAll("tr"));
    }

    function rowText(tr) {
      return norm(tr?.textContent || "");
    }

    function getFiltered(rows) {
      const q = norm(query);
      if (!q) return rows;
      return rows.filter((tr) => rowText(tr).includes(q));
    }

    function setCount(filteredCount, totalCount) {
      if (!countEl) return;
      countEl.textContent =
        filteredCount === totalCount
          ? `${totalCount} ${emptyLabel}`
          : `${filteredCount} of ${totalCount} ${emptyLabel}`;
    }

    function renderPagination(totalPages) {
      if (!pager) return;
      if (totalPages <= 1) {
        pager.innerHTML = "";
        return;
      }
      pager.innerHTML = `
        <span class="list-pagination__summary">Page ${page} of ${totalPages}</span>
        <div class="list-pagination__actions">
          <button type="button" class="btn btn-ghost btn-sm" data-page-action="prev" ${page === 1 ? "disabled" : ""}>Previous</button>
          <button type="button" class="btn btn-ghost btn-sm" data-page-action="next" ${page === totalPages ? "disabled" : ""}>Next</button>
        </div>
      `;
    }

    function apply() {
      const rows = allRows();
      const filtered = getFiltered(rows);
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = clamp(page, 1, totalPages);

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageRows = new Set(filtered.slice(start, end));

      for (const tr of rows) {
        tr.style.display = pageRows.has(tr) ? "" : "none";
      }

      setCount(filtered.length, rows.length);
      renderPagination(totalPages);
    }

    // Listeners
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        query = e.target.value || "";
        page = 1;
        apply();
      });
    }

    if (pager) {
      pager.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-page-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-page-action");
        if (action === "prev") page -= 1;
        if (action === "next") page += 1;
        apply();
      });
    }

    // Re-apply when rows are re-rendered.
    const obs = new MutationObserver(() => {
      // keep page if still valid
      apply();
    });
    obs.observe(tbody, { childList: true, subtree: false });

    apply();

    return {
      refresh: apply,
    };
  }

  window.UpressListTools = {
    initTableList,
  };
})();

