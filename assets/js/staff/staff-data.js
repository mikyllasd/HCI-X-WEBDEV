/**
 * Shared UPress data for the staff / POS hub (localStorage, demo-grade).
 * Web orders: upressOrders. Walk-in sales: upressWalkInSales.
 */
(function () {
  const LS_ORDERS = "upressOrders";
  const LS_WALKIN = "upressWalkInSales";

  function safeJsonParse(s, fallback) {
    try {
      return JSON.parse(s || "");
    } catch {
      return fallback;
    }
  }

  function getWebOrders() {
    return safeJsonParse(localStorage.getItem(LS_ORDERS), []);
  }

  function saveWebOrders(list) {
    localStorage.setItem(LS_ORDERS, JSON.stringify(list));
  }

  function getWalkInSales() {
    return safeJsonParse(localStorage.getItem(LS_WALKIN), []);
  }

  function addWalkInSale(record) {
    const list = getWalkInSales();
    list.unshift(record);
    localStorage.setItem(LS_WALKIN, JSON.stringify(list));
    return record;
  }

  function statusToBadgeClass(status) {
    const s = String(status || "").toLowerCase();
    if (s.includes("process")) return "badge-process";
    if (s.includes("ready")) return "badge-ready";
    if (s.includes("complete")) return "badge-complete";
    return "badge-pending";
  }

  function statusLabel(status) {
    const s = String(status || "");
    if (/ready/i.test(s)) return "Ready for Pickup";
    if (/process/i.test(s)) return "Processing";
    if (/complete/i.test(s)) return "Completed";
    return "Pending";
  }

  function orderToStaffPayload(o) {
    const c = o.customer || {};
    const name = c.name || "—";
    const pay = o.paymentMethod || "—";
    const ref = o.refNumber || "—";
    const amt = "₱" + parseFloat(o.total || 0).toFixed(2);
    const file = o.desc ? String(o.desc).slice(0, 48) : "—";
    return {
      orderId: o.orderId,
      student: name,
      service: o.service || "—",
      date: o.dateOrdered || "—",
      status: o.status || "Pending",
      payment: pay,
      amount: amt,
      reference: ref,
      file,
      pages: "—",
      size: o.desc || "—",
      rush: "No",
      notes: "—",
      paymentVerified: !!o.paymentVerified,
      paymentStatus: o.paymentStatus || "",
      raw: o,
    };
  }

  function verifyWebPayment(orderId) {
    const list = getWebOrders();
    const i = list.findIndex((x) => x.orderId === orderId);
    if (i === -1) return false;
    list[i].paymentVerified = true;
    list[i].paymentStatus = "verified";
    if (list[i].status === "Pending") list[i].status = "Processing";
    saveWebOrders(list);
    return true;
  }

  function persistWebOrderStatus(orderId, staffNextKey) {
    const map = {
      processing: "Processing",
      ready: "Ready",
      completed: "Completed",
      pending: "Pending",
    };
    const next = map[staffNextKey];
    if (!next) return;
    const list = getWebOrders();
    const i = list.findIndex((x) => x.orderId === orderId);
    if (i === -1) return;
    list[i].status = next;
    saveWebOrders(list);
  }

  function modalPayload(p) {
    const badge = statusLabel(p.status);
    return {
      orderId: p.orderId,
      student: p.student,
      service: p.service,
      date: p.date,
      status: badge,
      payment: p.payment,
      amount: p.amount,
      reference: p.reference,
      file: p.file,
      pages: p.pages,
      size: p.size,
      rush: p.rush,
      notes: p.notes,
      paymentVerified: p.paymentVerified,
    };
  }

  function encAttr(obj) {
    return encodeURIComponent(JSON.stringify(obj));
  }

  function buildQueueRowHtml(p) {
    const badge = statusLabel(p.status);
    const bcls = statusToBadgeClass(p.status);
    const payTag = p.paymentVerified
      ? '<span class="badge badge-complete" style="font-size:10px">Paid</span>'
      : (String(p.payment || "").includes("GCash")
        ? '<span class="badge badge-pending" style="font-size:10px">Pay review</span>'
        : '<span class="badge badge-process" style="font-size:10px">Due at pickup</span>');

    const enc = encAttr(modalPayload(p));

    const verifyBtn =
      !p.paymentVerified && String(p.payment || "").includes("GCash")
        ? `<button type="button" class="btn-action btn-verify-pay" data-verify-order="${escapeHtmlStaff(p.orderId)}">Verify pay</button>`
        : "";

    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td><span class="badge ${bcls}">${escapeHtmlStaff(badge)}</span></td>
        <td>${payTag} ${verifyBtn} <button class="btn-action">View</button></td>
      </tr>`;
  }

  function buildReadyRowHtml(p) {
    const badge = statusLabel(p.status);
    const bcls = statusToBadgeClass(p.status);
    const enc = encAttr(modalPayload(p));
    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td><span class="badge ${bcls}">${escapeHtmlStaff(badge)}</span></td>
        <td><button class="btn-action release">Release</button></td>
      </tr>`;
  }

  function buildCompletedRowHtml(p) {
    const enc = encAttr(modalPayload(p));
    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td>Web / Staff</td>
        <td><span class="badge badge-complete">${escapeHtmlStaff(statusLabel(p.status))}</span></td>
        <td>—</td>
      </tr>`;
  }

  function walkInSaleToStaffPayload(sale) {
    const serviceLine =
      (sale.items && sale.items.map((i) => `${i.service} ×${i.qty}`).join("; ")) || "Walk-in POS";
    const notes = [sale.customerPhone ? `Phone: ${sale.customerPhone}` : "", sale.patronType ? `Patron: ${sale.patronType}` : ""]
      .filter(Boolean)
      .join(" · ") || "—";
    return {
      orderId: sale.saleId,
      student: sale.customerName || "Walk-in",
      service: serviceLine,
      date: sale.date || "—",
      status: "Completed",
      payment: sale.paymentMethod || "—",
      amount: "₱" + parseFloat(sale.grandTotal || 0).toFixed(2),
      reference: sale.gcashRef || "—",
      file: "—",
      pages: "—",
      size: "—",
      rush: "No",
      notes,
      paymentVerified: true,
    };
  }

  function buildPosCompletedRowHtml(sale) {
    const p = walkInSaleToStaffPayload(sale);
    const enc = encAttr(modalPayload(p));
    const sid = escapeHtmlStaff(sale.saleId);
    return `
      <tr data-order-full="${enc}">
        <td>${sid}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td>Walk-in POS</td>
        <td><span class="badge badge-complete">Completed</span></td>
        <td><button type="button" class="btn-pos-print-receipt" data-sale-id="${String(sale.saleId).replace(
          /"/g,
          "&quot;",
        )}">Print</button></td>
      </tr>`;
  }

  function escapeHtmlStaff(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hydrateTablesFromStorage() {
    const orders = getWebOrders().map(orderToStaffPayload);
    const queue = orders.filter((o) => o.status === "Pending" || o.status === "Processing");
    const ready = orders.filter((o) => o.status === "Ready");
    const done = orders.filter((o) => o.status === "Completed");

    const fill = (tableId, rows, emptyMsg, rowHtmlFn) => {
      const table = document.getElementById(tableId);
      const tbody = table && table.querySelector("tbody");
      if (!tbody) return;
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="sd-muted">${escapeHtmlStaff(emptyMsg)}</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(rowHtmlFn).join("");
    };

    fill("orderQueueTable", queue, "No web orders in queue. Walk-in customers can use Walk-in POS.", buildQueueRowHtml);
    fill("readyReleaseTable", ready, "No orders ready for pickup.", buildReadyRowHtml);

    const walkIns = getWalkInSales().slice().sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
    const doneWeb = done
      .map(orderToStaffPayload)
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    const completedTable = document.getElementById("completedOrdersTable");
    const cBody = completedTable && completedTable.querySelector("tbody");
    if (cBody) {
      const posRows = walkIns.map(buildPosCompletedRowHtml).join("");
      const webRows = doneWeb.map(buildCompletedRowHtml).join("");
      if (!posRows && !webRows) {
        cBody.innerHTML = `<tr><td colspan="7" class="sd-muted">${escapeHtmlStaff(
          "No completed orders yet. Finished web orders and walk-in POS sales appear here.",
        )}</td></tr>`;
      } else {
        cBody.innerHTML = posRows + webRows;
      }
    }
  }

  function getWalkInSaleById(saleId) {
    return getWalkInSales().find((s) => s.saleId === saleId) || null;
  }

  function todayWalkInTotal() {
    const d0 = new Date().toDateString();
    return getWalkInSales()
      .filter((s) => new Date(s.ts || s.date).toDateString() === d0)
      .reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);
  }

  window.UpressStaffData = {
    getWebOrders,
    saveWebOrders,
    getWalkInSales,
    getWalkInSaleById,
    addWalkInSale,
    verifyWebPayment,
    persistWebOrderStatus,
    hydrateTablesFromStorage,
    orderToStaffPayload,
    todayWalkInTotal,
    statusToBadgeClass,
    statusLabel,
  };
})();
