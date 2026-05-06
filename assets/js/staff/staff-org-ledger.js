document.addEventListener("DOMContentLoaded", () => {
  const qs = new URLSearchParams(window.location.search);
  const orgName = String(qs.get("org") || "").trim();

  const money = (n) => "₱" + (Number(n) || 0).toFixed(2);
  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const title = document.getElementById("orgLedgerTitle");
  const sub = document.getElementById("orgLedgerSub");
  if (title) title.textContent = orgName ? `${orgName} — Ledger` : "Organization Ledger";
  if (sub && orgName) sub.textContent = `Payment tracking for ${orgName}.`;

  function openModal() {
    document.getElementById("payModal")?.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    document.getElementById("payModal")?.setAttribute("aria-hidden", "true");
  }
  function setErr(msg) {
    const el = document.getElementById("payErr");
    if (!el) return;
    el.style.display = msg ? "" : "none";
    el.textContent = msg || "";
  }

  function getLedgers() {
    const { open, archived } = window.UpressOrgLedger?.listAll?.() || { open: [], archived: [] };
    const f = (l) => (orgName ? String(l?.orgName || "") === orgName : true);
    return {
      open: open.filter(f),
      archived: archived.filter(f),
    };
  }

  function paidAmount(ledger) {
    const pays = Array.isArray(ledger?.payments) ? ledger.payments : [];
    return pays.reduce((s, p) => s + (Number(p?.amount) || 0), 0);
  }

  function formatDate(d) {
    const t = Date.parse(d);
    if (!Number.isFinite(t)) return "—";
    return new Date(t).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
  }

  function renderTables() {
    const { open, archived } = getLedgers();

    const openBody = document.querySelector("#openLedgersTable tbody");
    const archBody = document.querySelector("#archLedgersTable tbody");

    if (openBody) {
      if (!open.length) {
        openBody.innerHTML = `<tr><td colspan="6" style="color:#667085">No open ledger records.</td></tr>`;
      } else {
        openBody.innerHTML = open
          .map((l) => {
            const paid = paidAmount(l);
            return `
              <tr>
                <td>${escapeHtml(formatDate(l.availedAt))}</td>
                <td><code>${escapeHtml(l.orderId || "—")}</code></td>
                <td>${escapeHtml(money(l.totalAmount))}</td>
                <td>${escapeHtml(money(paid))}</td>
                <td style="font-weight:800;color:var(--color-header)">${escapeHtml(money(l.remainingBalance))}</td>
                <td><span class="badge badge-pending">Open</span></td>
              </tr>
            `;
          })
          .join("");
      }
    }

    if (archBody) {
      if (!archived.length) {
        archBody.innerHTML = `<tr><td colspan="6" style="color:#667085">No archived ledger records.</td></tr>`;
      } else {
        archBody.innerHTML = archived
          .map((l) => {
            const paid = paidAmount(l);
            return `
              <tr>
                <td>${escapeHtml(formatDate(l.availedAt))}</td>
                <td><code>${escapeHtml(l.orderId || "—")}</code></td>
                <td>${escapeHtml(money(l.totalAmount))}</td>
                <td>${escapeHtml(money(paid))}</td>
                <td>${escapeHtml(formatDate(l.archivedAt))}</td>
                <td><span class="badge badge-complete">Fully Paid</span></td>
              </tr>
            `;
          })
          .join("");
      }
    }

    const sel = document.getElementById("payLedgerSelect");
    if (sel) {
      sel.innerHTML = open
        .map((l) => {
          const label = `${formatDate(l.availedAt)} · ${l.orderId || "No order"} · remaining ${money(l.remainingBalance)}`;
          return `<option value="${escapeHtml(l.id)}">${escapeHtml(label)}</option>`;
        })
        .join("");
    }
  }

  document.getElementById("addPaymentBtn")?.addEventListener("click", () => {
    setErr("");
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const payDate = document.getElementById("payDate");
    if (payDate) payDate.value = `${yyyy}-${mm}-${dd}`;
    openModal();
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) closeModal();
  });

  document.getElementById("paySaveBtn")?.addEventListener("click", () => {
    const ledgerId = document.getElementById("payLedgerSelect")?.value || "";
    const date = document.getElementById("payDate")?.value || "";
    const amountRaw = document.getElementById("payAmount")?.value || "";
    const note = document.getElementById("payNote")?.value || "";

    if (!ledgerId) return setErr("Select a ledger record.");
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) return setErr("Enter a valid payment amount.");

    const iso = date ? new Date(date + "T00:00:00").toISOString() : new Date().toISOString();
    try {
      window.UpressOrgLedger?.addPayment?.(ledgerId, { date: iso, amount, note, method: "cash" });
      closeModal();
      renderTables();
    } catch (err) {
      setErr(String(err?.message || "Failed to save payment."));
    }
  });

  renderTables();
});

