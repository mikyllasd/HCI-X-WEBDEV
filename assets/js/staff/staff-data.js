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
    const fromLs = safeJsonParse(localStorage.getItem(LS_ORDERS), []);
    const fromDb =
      typeof window.getDB === "function" ? window.getDB()?.transactions : null;

    // Prefer canonical DB transactions when available (superadmin source of truth),
    // but keep `upressOrders` for compatibility with older pages/demo flows.
    const txRows = Array.isArray(fromDb) ? fromDb : [];
    const lsRows = Array.isArray(fromLs) ? fromLs : [];

    function normalizeStatus(s) {
      const v = String(s || "").toLowerCase();
      if (v === "paid" || v === "completed") return "Completed";
      if (v === "ready" || v.includes("for pickup")) return "Ready";
      if (v === "processing") return "Processing";
      return "Pending";
    }

    function txToWebOrder(tx) {
      const id = tx?.id || tx?.orderId || "";
      return {
        orderId: String(id || ""),
        // Keep the same surface fields staff UI expects.
        customer: {
          name:
            tx?.customerName ||
            tx?.customer?.name ||
            tx?.email ||
            tx?.username ||
            "—",
        },
        service: tx?.serviceName || tx?.service || "—",
        total: tx?.amount ?? tx?.total ?? 0,
        status: normalizeStatus(tx?.status),
        paymentMethod: tx?.paymentMethod || tx?.payment || "—",
        dateOrdered: tx?.date || tx?.dateOrdered || "—",
        refNumber: tx?.refNumber || "—",
        desc: tx?.desc || "",
        paymentVerified: !!tx?.paymentVerified,
        paymentStatus: tx?.paymentStatus || "",
        // Carry through if present (set by student checkout flow)
        order_type: tx?.order_type || "individual",
        order_org: tx?.order_org || "",
        __source: "db",
      };
    }

    function lsToWebOrder(o) {
      return {
        ...o,
        orderId: String(o?.orderId || ""),
        order_type: o?.order_type || "individual",
        order_org: o?.order_org || "",
        __source: "ls",
      };
    }

    const merged = [];
    const seen = new Set();

    // DB first so it wins on conflicts.
    txRows.forEach((tx) => {
      const row = txToWebOrder(tx);
      if (!row.orderId) return;
      if (seen.has(row.orderId)) return;
      seen.add(row.orderId);
      merged.push(row);
    });

    lsRows.forEach((o) => {
      const row = lsToWebOrder(o);
      if (!row.orderId) return;
      if (seen.has(row.orderId)) return;
      seen.add(row.orderId);
      merged.push(row);
    });

    // Sort newest first when dates are parseable; otherwise keep insertion order.
    merged.sort((a, b) => (Date.parse(b.dateOrdered) || 0) - (Date.parse(a.dateOrdered) || 0));
    return merged;
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
    const orderTypeKey = String(o.order_type || "").toLowerCase();
    const isOrg = orderTypeKey === "organization" || orderTypeKey === "org";
    const orderTypeLabel = isOrg ? "Organization" : "Individual";
    const orderOrg = isOrg ? String(o.order_org || "") : "";
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
      orderType: orderTypeLabel,
      orderOrg,
      raw: o,
    };
  }

  function verifyWebPayment(orderId) {
    let updated = false;

    // Update LS copy (compat / demo).
    const lsList = safeJsonParse(localStorage.getItem(LS_ORDERS), []);
    if (Array.isArray(lsList)) {
      const i = lsList.findIndex((x) => x?.orderId === orderId);
      if (i !== -1) {
        lsList[i].paymentVerified = true;
        lsList[i].paymentStatus = "verified";
        if (lsList[i].status === "Pending") lsList[i].status = "Processing";
        saveWebOrders(lsList);
        updated = true;
      }
    }

    // Update canonical DB transaction if available.
    if (typeof window.updateTransaction === "function") {
      try {
        window.updateTransaction(orderId, {
          paymentVerified: true,
          paymentStatus: "verified",
          status: "processing",
        });
        updated = true;
      } catch {
        // ignore if missing in DB
      }
    }

    return updated;
  }

  function setOrderReviewStatus(orderId, { status, notes } = {}) {
    const oid = String(orderId || "").trim();
    const next = String(status || "").trim().toLowerCase();
    if (!oid) return false;
    if (!["pending_review", "approved", "rejected"].includes(next)) {
      throw new Error("Invalid review status.");
    }

    const stamp = new Date().toISOString();
    const reviewNotes = String(notes || "").trim();

    // Update LS order (compat / demo).
    const lsList = safeJsonParse(localStorage.getItem(LS_ORDERS), []);
    if (Array.isArray(lsList)) {
      const i = lsList.findIndex((x) => x?.orderId === oid);
      if (i !== -1) {
        lsList[i].staffReviewStatus = next;
        lsList[i].staffReviewNotes = reviewNotes;
        lsList[i].staffReviewedAt = stamp;
        saveWebOrders(lsList);
      }
    }

    // Update canonical DB transaction if available.
    if (typeof window.updateTransaction === "function") {
      try {
        window.updateTransaction(oid, {
          staffReviewStatus: next,
          staffReviewNotes: reviewNotes,
          staffReviewedAt: stamp,
        });
      } catch {
        // ignore if missing in DB
      }
    }

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

    // Update LS copy (compat / demo).
    const lsList = safeJsonParse(localStorage.getItem(LS_ORDERS), []);
    if (Array.isArray(lsList)) {
      const i = lsList.findIndex((x) => x?.orderId === orderId);
      if (i !== -1) {
        lsList[i].status = next;
        saveWebOrders(lsList);
      }
    }

    // Update canonical DB transaction if available.
    if (typeof window.updateTransaction === "function") {
      try {
        // Superadmin expects lowercase-ish statuses; keep it consistent.
        const nextDb =
          next === "Completed"
            ? "completed"
            : next === "Ready"
              ? "ready"
              : next === "Processing"
                ? "processing"
                : "pending";
        window.updateTransaction(orderId, { status: nextDb });
      } catch {
        // ignore if missing in DB
      }
    }
  }

  function modalPayload(p) {
    const badge = statusLabel(p.status);
    const base = {
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
      staffReviewStatus: p.staffReviewStatus || "pending_review",
      staffReviewNotes: p.staffReviewNotes || "",
      staffReviewedAt: p.staffReviewedAt || "",
      orderType: p.orderType || "Individual",
      orderOrg: p.orderOrg || "",
    };
    if (p.isOrgCustom) {
      base.isOrgCustom = true;
      base.ocrId = p.ocrId || "";
      base.ocrStatus = p.ocrStatus || "";
    }
    return base;
  }

  function getOrgCustomQueuePayloads() {
    if (
      typeof window.UpressOrgCustomRequests === "undefined" ||
      typeof window.UpressOrgCustomRequests.list !== "function"
    ) {
      return [];
    }
    return window
      .UpressOrgCustomRequests.list()
      .filter((r) => r && String(r.status || "") !== "not_doable")
      .map(orgCustomToStaffPayload);
  }

  function orgCustomToStaffPayload(r) {
    const t = r.submittedAt ? new Date(r.submittedAt).getTime() : 0;
    const st = String(r.status || "pending");
    let uiStatus = "Pending";
    if (st === "doable") uiStatus = "Processing";
    if (st === "needs_info") uiStatus = "Pending";
    const submitted = r.submittedAt
      ? new Date(r.submittedAt).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";
    const amt =
      r.quotedPrice != null && Number.isFinite(Number(r.quotedPrice))
        ? "₱" + Number(r.quotedPrice).toFixed(2)
        : "—";
    return {
      orderId: r.id,
      student: r.userName || "—",
      service: r.requestTitle || "Organization custom request",
      organizationName: r.organizationName || "",
      date: submitted,
      status: uiStatus,
      payment: "—",
      amount: amt,
      reference: "—",
      file: "—",
      pages: "—",
      size: r.quantityOrSpecs || "—",
      rush: "No",
      notes: r.requestDetails || "—",
      paymentVerified: false,
      paymentStatus: "",
      orderType: "Organization",
      orderOrg: r.organizationName || "",
      isOrgCustom: true,
      ocrId: r.id,
      ocrStatus: st,
      __sort: Number.isFinite(t) ? t : 0,
    };
  }

  function buildOrgCustomQueueRowHtml(p) {
    const badge = statusLabel(p.status);
    const bcls = statusToBadgeClass(p.status);
    const enc = encAttr(modalPayload(p));
    const orgLine = p.organizationName
      ? `<div class="sd-muted" style="margin-top:2px;font-size:12px;">${escapeHtmlStaff(p.organizationName)}</div>`
      : "";
    const subSvc = `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Organization custom request</div>`;
    const reviewOrView =
      p.ocrStatus === "pending" || p.ocrStatus === "needs_info"
        ? `<button type="button" class="btn-action">Review</button>`
        : `<button type="button" class="btn-action">View</button>`;
    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}${subSvc}${orgLine}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td><span class="badge ${bcls}">${escapeHtmlStaff(badge)}</span></td>
        ${queueActionsCell(
          `<span class="badge badge-process" style="font-size:10px">Org custom</span>${reviewOrView}`,
        )}
      </tr>`;
  }

  function encAttr(obj) {
    return encodeURIComponent(JSON.stringify(obj));
  }

  function buildQueueRowHtml(p) {
    if (p.isOrgCustom) return buildOrgCustomQueueRowHtml(p);
    const badge = statusLabel(p.status);
    const bcls = statusToBadgeClass(p.status);
    const payTag = p.paymentVerified
      ? '<span class="badge badge-complete" style="font-size:10px">Paid</span>'
      : (String(p.payment || "").includes("GCash")
        ? '<span class="badge badge-pending" style="font-size:10px">Pay review</span>'
        : '<span class="badge badge-process" style="font-size:10px">Due at pickup</span>');

    const enc = encAttr(modalPayload(p));
    const typeLine =
      String(p.orderType || "").toLowerCase() === "organization"
        ? `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Organization${p.orderOrg ? ": " + escapeHtmlStaff(p.orderOrg) : ""}</div>`
        : `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Individual</div>`;

    const verifyBtn =
      !p.paymentVerified && String(p.payment || "").includes("GCash")
        ? `<button type="button" class="btn-action btn-verify-pay" data-verify-order="${escapeHtmlStaff(p.orderId)}">Verify pay</button>`
        : "";

    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}${typeLine}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td><span class="badge ${bcls}">${escapeHtmlStaff(badge)}</span></td>
        ${queueActionsCell(`${payTag} ${verifyBtn} <button class="btn-action">View</button>`)}
      </tr>`;
  }

  function buildReadyRowHtml(p) {
    const badge = statusLabel(p.status);
    const bcls = statusToBadgeClass(p.status);
    const enc = encAttr(modalPayload(p));
    const typeLine =
      String(p.orderType || "").toLowerCase() === "organization"
        ? `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Organization${p.orderOrg ? ": " + escapeHtmlStaff(p.orderOrg) : ""}</div>`
        : `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Individual</div>`;
    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}${typeLine}</td>
        <td>${escapeHtmlStaff(p.date)}</td>
        <td><span class="badge ${bcls}">${escapeHtmlStaff(badge)}</span></td>
        ${queueActionsCell(`<button class="btn-action release">Release</button>`)}
      </tr>`;
  }

  function buildCompletedRowHtml(p) {
    const enc = encAttr(modalPayload(p));
    const typeLine =
      String(p.orderType || "").toLowerCase() === "organization"
        ? `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Organization${p.orderOrg ? ": " + escapeHtmlStaff(p.orderOrg) : ""}</div>`
        : `<div class="sd-muted" style="margin-top:2px;font-size:12px;">Individual</div>`;
    return `
      <tr data-order-full="${enc}">
        <td>${escapeHtmlStaff(p.orderId)}</td>
        <td>${escapeHtmlStaff(p.student)}</td>
        <td>${escapeHtmlStaff(p.service)}${typeLine}</td>
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

  /** Keeps badges + buttons on one row (long labels truncate; buttons stay aligned). */
  function queueActionsCell(innerHtml) {
    return `<td class="data-table__col-actions"><div class="data-table__actions">${innerHtml}</div></td>`;
  }

  function hydrateTablesFromStorage() {
    const orders = getWebOrders().map(orderToStaffPayload);
    const webQueue = orders.filter((o) => o.status === "Pending" || o.status === "Processing");
    const orgQueue = getOrgCustomQueuePayloads();
    const queueMerged = [
      ...orgQueue.map((p) => ({ p, sk: p.__sort || 0 })),
      ...webQueue.map((p) => {
        const raw = p.raw;
        const d = raw && (raw.dateOrdered || raw.createdAt);
        const sk = d ? new Date(d).getTime() : NaN;
        return { p, sk: Number.isFinite(sk) ? sk : 0 };
      }),
    ]
      .sort((a, b) => b.sk - a.sk)
      .map((x) => x.p);
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

    fill(
      "orderQueueTable",
      queueMerged,
      "No items in queue. Web orders and organization custom requests appear here.",
      buildQueueRowHtml,
    );
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
    setOrderReviewStatus,
    persistWebOrderStatus,
    hydrateTablesFromStorage,
    orderToStaffPayload,
    todayWalkInTotal,
    statusToBadgeClass,
    statusLabel,
  };

  if (
    window.UpressDemoSeed &&
    typeof window.UpressDemoSeed.seedStaffWebOrdersIfEmpty === "function"
  ) {
    window.UpressDemoSeed.seedStaffWebOrdersIfEmpty();
  }
})();
