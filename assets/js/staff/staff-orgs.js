document.addEventListener("DOMContentLoaded", () => {
  const money = (n) => "₱" + (Number(n) || 0).toFixed(2);

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function openModal() {
    const modal = document.getElementById("staffOrgModal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const modal = document.getElementById("staffOrgModal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
  }

  function setErr(msg) {
    const el = document.getElementById("orgLedgerErr");
    if (!el) return;
    if (!msg) {
      el.style.display = "none";
      el.textContent = "";
      return;
    }
    el.style.display = "";
    el.textContent = msg;
  }

  function listOrgNamesFromLedgers() {
    const { open, archived } = window.UpressOrgLedger?.listAll?.() || { open: [], archived: [] };
    const names = new Set();
    [...open, ...archived].forEach((l) => {
      const n = String(l?.orgName || "").trim();
      if (n) names.add(n);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  function computeSummary() {
    const { open, archived } = window.UpressOrgLedger?.listAll?.() || { open: [], archived: [] };
    const orgs = listOrgNamesFromLedgers();
    const openBalanceTotal = open.reduce((s, l) => s + (Number(l?.remainingBalance) || 0), 0);
    return {
      orgCount: orgs.length,
      openLedgerCount: open.length,
      archivedLedgerCount: archived.length,
      openBalanceTotal,
      orgs,
    };
  }

  function render() {
    const sum = computeSummary();
    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    setText("orgCount", String(sum.orgCount));
    setText("openLedgerCount", String(sum.openLedgerCount));
    setText("archivedLedgerCount", String(sum.archivedLedgerCount));
    setText("openBalanceTotal", money(sum.openBalanceTotal));

    const tbody = document.querySelector("#orgTable tbody");
    if (!tbody) return;
    if (!sum.orgs.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:#667085">No organization ledgers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = sum.orgs
      .map((name) => {
        const s = window.UpressOrgLedger?.getOrgSummary?.(name) || {
          openCount: 0,
          archivedCount: 0,
          openBalance: 0,
        };
        return `
          <tr>
            <td><strong>${escapeHtml(name)}</strong></td>
            <td>${escapeHtml(String(s.openCount))}</td>
            <td style="font-weight:800;color:var(--color-header)">${escapeHtml(money(s.openBalance))}</td>
            <td>${escapeHtml(String(s.archivedCount))}</td>
            <td><a class="sd-panel__cta" href="organizations-ledger.html?org=${encodeURIComponent(name)}">View</a></td>
          </tr>
        `;
      })
      .join("");

    window.UpressListTools?.initTableList?.({
      tableId: "orgTable",
      searchInputId: "orgSearchInput",
      countId: "orgResultCount",
      paginationId: "orgPagination",
      pageSize: 6,
      emptyLabel: "organizations",
    });
  }

  document.addEventListener("click", (e) => {
    const closeEl = e.target.closest("[data-modal-close]");
    if (closeEl) {
      closeModal();
      return;
    }
  });

  document.getElementById("addOrgLedgerBtn")?.addEventListener("click", () => {
    setErr("");
    openModal();
  });

  document.getElementById("orgLedgerSaveBtn")?.addEventListener("click", () => {
    const name = document.getElementById("orgLedgerName")?.value || "";
    const total = document.getElementById("orgLedgerTotal")?.value || "";
    const date = document.getElementById("orgLedgerDate")?.value || "";

    const orgName = String(name).trim();
    if (!orgName) return setErr("Organization name is required.");
    const totalAmount = Number(total);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) return setErr("Enter a valid total amount.");

    const availedAt = date ? new Date(date + "T00:00:00").toISOString() : new Date().toISOString();
    try {
      window.UpressOrgLedger?.addLedger?.({ orgName, totalAmount, availedAt });
      closeModal();
      render();
    } catch (err) {
      setErr(String(err?.message || "Failed to save ledger."));
    }
  });

  render();
});

