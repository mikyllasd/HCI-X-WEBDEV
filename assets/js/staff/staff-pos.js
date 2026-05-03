/**
 * Walk-in POS — ticket, sales list, receipt print (per sale, inline).
 */
(function () {
  let ticketLines = [];

  function money(n) {
    return "₱" + (Number(n) || 0).toFixed(2);
  }

  function escapePos(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function subtotal() {
    return ticketLines.reduce((s, L) => s + L.lineTotal, 0);
  }

  function renderTicket() {
    const host = document.getElementById("posTicketLines");
    const subEl = document.getElementById("posSubtotal");
    if (!host) return;

    if (!ticketLines.length) {
      host.classList.add("pos-empty");
      host.textContent = "No lines yet. Add services above.";
      if (subEl) subEl.textContent = money(0);
      return;
    }

    host.classList.remove("pos-empty");
    host.innerHTML = ticketLines
      .map(
        (L) => `
      <div class="pos-line" data-line-id="${L.id}">
        <div>
          <strong>${escapePos(L.service)}</strong> × ${L.qty} @ ${money(L.unit)}<br/>
          <span style="color:#666;font-size:0.78rem">${escapePos(L.notes || "—")}</span>
        </div>
        <div style="text-align:right">
          <div>${money(L.lineTotal)}</div>
          <button type="button" class="pos-line-remove" data-remove="${L.id}">Remove</button>
        </div>
      </div>`,
      )
      .join("");

    if (subEl) subEl.textContent = money(subtotal());
  }

  function addLine() {
    const service = document.getElementById("posLineService")?.value || "Other";
    const qty = Math.max(1, parseInt(document.getElementById("posLineQty")?.value, 10) || 1);
    const unit = Math.max(0, parseFloat(document.getElementById("posLineUnit")?.value) || 0);
    const notes = document.getElementById("posLineNotes")?.value.trim() || "";

    ticketLines.push({
      id: "L-" + Date.now(),
      service,
      qty,
      unit,
      notes,
      lineTotal: qty * unit,
    });
    renderTicket();
  }

  function clearTicket() {
    ticketLines = [];
    renderTicket();
  }

  function receiptHtmlInner(sale) {
    const rows =
      sale.items && sale.items.length
        ? sale.items
            .map(
              (it) =>
                `<tr><td>${escapePos(it.service)} ×${it.qty}</td><td style="text-align:right">${money(
                  it.lineTotal,
                )}</td></tr>`,
            )
            .join("")
        : "<tr><td colspan='2'>—</td></tr>";

    return `
      <div style="font-weight:800;text-align:center;margin-bottom:10px">UPRESSease — UPress POS</div>
      <div style="font-size:12px;line-height:1.45;margin-bottom:10px">
        <div><b>Sale ID:</b> ${escapePos(sale.saleId)}</div>
        <div><b>Date:</b> ${escapePos(sale.date)}</div>
        <div><b>Customer:</b> ${escapePos(sale.customerName || "Walk-in")}</div>
        <div><b>Patron:</b> ${escapePos(sale.patronType || "—")}</div>
        <div><b>Payment:</b> ${escapePos(sale.paymentMethod)}${
          sale.gcashRef ? " · Ref " + escapePos(sale.gcashRef) : ""
        }</div>
      </div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">${rows}</table>
      <div style="margin-top:10px;font-weight:800;text-align:right">Total ${money(sale.grandTotal)}</div>
      <div style="margin-top:14px;text-align:center;font-size:10px;color:#666">Thank you for supporting WMSU UPress.</div>
    `;
  }

  function openReceiptPrintWindow(sale) {
    if (!sale) return;
    const w = window.open("", "_blank", "width=400,height=640");
    if (!w) {
      alert("Pop-up blocked. Allow pop-ups to print the receipt.");
      return;
    }
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Receipt " +
        escapePos(sale.saleId) +
        "</title><style>body{font-family:system-ui,sans-serif;padding:16px;}</style></head><body>",
    );
    w.document.write(receiptHtmlInner(sale));
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  function completeSale() {
    if (!ticketLines.length) {
      alert("Add at least one line item.");
      return;
    }

    const pay = document.getElementById("posPaymentMethod")?.value || "Cash";
    const ref = document.getElementById("posGcashRef")?.value.trim() || "";
    if (pay === "GCash" && !ref) {
      alert("Enter GCash reference for walk-in GCash payment.");
      return;
    }

    const sale = {
      saleId: "POS-" + Date.now(),
      ts: new Date().toISOString(),
      date: new Date().toLocaleString("en-PH"),
      customerName: document.getElementById("posCustomerName")?.value.trim() || "Walk-in",
      customerPhone: document.getElementById("posCustomerPhone")?.value.trim() || "",
      patronType: document.getElementById("posPatronType")?.value || "walk-in",
      paymentMethod: pay,
      gcashRef: pay === "GCash" ? ref : "",
      items: ticketLines.map((L) => ({
        service: L.service,
        qty: L.qty,
        unit: L.unit,
        notes: L.notes,
        lineTotal: L.lineTotal,
      })),
      grandTotal: subtotal(),
      source: "walk-in-pos",
    };

    if (window.UpressStaffData) {
      UpressStaffData.addWalkInSale(sale);
    }

    clearTicket();
    const refIn = document.getElementById("posGcashRef");
    if (refIn) refIn.value = "";
    document.dispatchEvent(new CustomEvent("staff:data-changed"));
    alert("Sale recorded. Use Print on the sale row (today’s list or Completed orders).");
  }

  window.renderWalkInPosHistory = function () {
    const host = document.getElementById("posWalkInHistory");
    const tot = document.getElementById("posWalkInTodayTotal");
    if (!window.UpressStaffData || !host) return;

    const all = UpressStaffData.getWalkInSales();
    const d0 = new Date().toDateString();
    const today = all.filter((s) => new Date(s.ts || s.date).toDateString() === d0);

    if (tot) tot.textContent = money(UpressStaffData.todayWalkInTotal());

    if (!today.length) {
      host.innerHTML = '<p class="pos-empty" style="padding:0.5rem">No walk-in sales today yet.</p>';
      return;
    }

    host.innerHTML = today
      .slice(0, 40)
      .map((s) => {
        const sid = escapePos(s.saleId);
        const cust = (s.customerName && String(s.customerName).trim()) || "Walk-in";
        return `
      <div class="pos-sale-card">
        <div class="pos-sale-card__row">
          <div class="pos-sale-card__main">
            <time>${escapePos(s.date)}</time>
            <div><strong>${sid}</strong> · ${escapePos(cust)} · ${escapePos(s.patronType)}</div>
            <div>${money(s.grandTotal)} · ${escapePos(s.paymentMethod)}</div>
          </div>
          <button type="button" class="btn-pos-print-receipt pos-sale-print" data-sale-id="${String(
            s.saleId,
          ).replace(/"/g, "&quot;")}">Print</button>
        </div>
      </div>`;
      })
      .join("");
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-pos-print-receipt");
    if (!btn) return;
    const id = btn.getAttribute("data-sale-id");
    if (!id || !window.UpressStaffData) return;
    const sale = UpressStaffData.getWalkInSaleById(id);
    if (sale) openReceiptPrintWindow(sale);
    else alert("Sale not found.");
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("posAddLineBtn")?.addEventListener("click", addLine);
    document.getElementById("posClearTicketBtn")?.addEventListener("click", clearTicket);
    document.getElementById("posCompleteSaleBtn")?.addEventListener("click", completeSale);

    document.getElementById("posTicketLines")?.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-remove]");
      if (!rm) return;
      const id = rm.getAttribute("data-remove");
      ticketLines = ticketLines.filter((L) => L.id !== id);
      renderTicket();
    });

    renderTicket();
    window.renderWalkInPosHistory();
  });
})();
