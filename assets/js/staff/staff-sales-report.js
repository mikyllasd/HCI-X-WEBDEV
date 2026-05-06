document.addEventListener("DOMContentLoaded", () => {
  const money = (n) => "₱" + (Number(n) || 0).toFixed(2);
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function dateToYmd(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function parseYmd(ymd) {
    const s = String(ymd || "");
    const t = Date.parse(s + "T00:00:00");
    return Number.isFinite(t) ? new Date(t) : null;
  }

  function clampRange(mode) {
    const now = new Date();
    let from = new Date(now);
    let to = new Date(now);

    if (mode === "daily") {
      // today
    } else if (mode === "weekly") {
      const day = now.getDay(); // 0..6
      const diff = (day + 6) % 7; // monday=0
      from = new Date(now);
      from.setDate(now.getDate() - diff);
    } else if (mode === "monthly") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (mode === "semester") {
      const m = now.getMonth() + 1;
      if (m <= 6) {
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 5, 30);
      } else {
        from = new Date(now.getFullYear(), 6, 1);
        to = new Date(now.getFullYear(), 11, 31);
      }
    }
    return { from, to };
  }

  function isWithin(ts, from, to) {
    const t = Date.parse(ts || "");
    if (!Number.isFinite(t)) return false;
    return t >= from.getTime() && t <= to.getTime() + 24 * 60 * 60 * 1000 - 1;
  }

  function collectPayments(from, to) {
    const rows = [];

    // Walk-in POS (physical cash-ish depending on method)
    const walkIns = window.UpressStaffData?.getWalkInSales?.() || [];
    walkIns.forEach((s) => {
      const ts = s.ts || s.date;
      if (!isWithin(ts, from, to)) return;
      rows.push({
        date: ts,
        channel: "Walk-in POS",
        org: "—",
        ref: s.saleId || "—",
        method: s.paymentMethod || "cash",
        amount: Number(s.grandTotal) || 0,
        isCash: String(s.paymentMethod || "").toLowerCase() === "cash",
      });
    });

    // Organization ledger payments (cash received; supports installments)
    const { open, archived } = window.UpressOrgLedger?.listAll?.() || { open: [], archived: [] };
    [...open, ...archived].forEach((l) => {
      (Array.isArray(l.payments) ? l.payments : []).forEach((p) => {
        if (!isWithin(p.date, from, to)) return;
        rows.push({
          date: p.date,
          channel: "Org Ledger",
          org: l.orgName || "—",
          ref: l.orderId || l.id,
          method: p.method || "cash",
          amount: Number(p.amount) || 0,
          isCash: String(p.method || "").toLowerCase() === "cash",
        });
      });
    });

    return rows.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  }

  function computeCreditOutstanding(from, to) {
    // Credit Sales = remaining balances on open ledgers created (availed) within range
    // (keeps it simple; balances persist across years via db.orgLedgers)
    const { open } = window.UpressOrgLedger?.listAll?.() || { open: [] };
    return open
      .filter((l) => isWithin(l.availedAt, from, to))
      .reduce((s, l) => s + (Number(l.remainingBalance) || 0), 0);
  }

  function render(from, to) {
    const payments = collectPayments(from, to);
    const totalRevenue = payments.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const physicalCash = payments.filter((r) => r.isCash).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const creditSales = computeCreditOutstanding(from, to);

    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    setText("srTotalRevenue", money(totalRevenue));
    setText("srPhysicalCash", money(physicalCash));
    setText("srCreditSales", money(creditSales));
    setText("srTxCount", String(payments.length));

    const tbody = document.querySelector("#srTable tbody");
    if (!tbody) return;
    if (!payments.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:#667085">No payments found in this range.</td></tr>`;
      return;
    }

    tbody.innerHTML = payments
      .map((r) => {
        const d = new Date(Date.parse(r.date));
        const label = Number.isFinite(d.getTime())
          ? d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" })
          : "—";
        return `
          <tr>
            <td>${esc(label)}</td>
            <td>${esc(r.channel)}</td>
            <td>${esc(r.org)}</td>
            <td><code>${esc(r.ref)}</code></td>
            <td>${esc(r.method)}</td>
            <td style="font-weight:800;color:var(--color-header)">${esc(money(r.amount))}</td>
          </tr>
        `;
      })
      .join("");

    window.UpressListTools?.initTableList?.({
      tableId: "srTable",
      searchInputId: "srSearchInput",
      countId: "srResultCount",
      paginationId: "srPagination",
      pageSize: 10,
      emptyLabel: "records",
    });
  }

  function applyFromUi() {
    const mode = document.getElementById("srMode")?.value || "daily";
    let { from, to } = clampRange(mode);

    if (mode === "custom") {
      const fromD = parseYmd(document.getElementById("srFrom")?.value);
      const toD = parseYmd(document.getElementById("srTo")?.value);
      if (fromD) from = fromD;
      if (toD) to = toD;
    }

    const fromEl = document.getElementById("srFrom");
    const toEl = document.getElementById("srTo");
    if (fromEl && !fromEl.value) fromEl.value = dateToYmd(from);
    if (toEl && !toEl.value) toEl.value = dateToYmd(to);

    render(from, to);
  }

  document.getElementById("srApplyBtn")?.addEventListener("click", applyFromUi);
  document.getElementById("srMode")?.addEventListener("change", () => {
    const mode = document.getElementById("srMode")?.value || "daily";
    const { from, to } = clampRange(mode);
    const fromEl = document.getElementById("srFrom");
    const toEl = document.getElementById("srTo");
    if (fromEl) fromEl.value = dateToYmd(from);
    if (toEl) toEl.value = dateToYmd(to);
    applyFromUi();
  });

  // init defaults
  const { from, to } = clampRange("daily");
  document.getElementById("srFrom")?.setAttribute("value", dateToYmd(from));
  document.getElementById("srTo")?.setAttribute("value", dateToYmd(to));
  applyFromUi();
});

