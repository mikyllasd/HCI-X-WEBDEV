(function () {
  const ordersContainer = document.getElementById("ordersManagementList");
  const emptyState = document.getElementById("ordersEmpty");
  const totalEl = document.getElementById("ordersTotal");
  const pendingEl = document.getElementById("ordersPending");
  const processingEl = document.getElementById("ordersProcessing");
  const readyEl = document.getElementById("ordersReady");
  const completedEl = document.getElementById("ordersCompleted");
  const searchInput = document.getElementById("ordersSearch");
  const statusSelect = document.getElementById("ordersStatus");
  const typeSelect = document.getElementById("ordersType");

  let filterState = { search: "", status: "all", type: "all" };

  function getDB() {
    if (typeof window.getDB === "function") return window.getDB();
    try { return JSON.parse(localStorage.getItem("upressease_db") || "{}"); } catch { return {}; }
  }

  function saveDB(db) {
    if (typeof window.saveDB === "function") return window.saveDB(db);
    try { localStorage.setItem("upressease_db", JSON.stringify(db)); } catch (e) { console.error(e); }
  }

  function notifyUser(userId, message, type) {
    const db = getDB();
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      userId,
      message,
      type: type || "info",
      read: false,
      createdAt: new Date().toISOString()
    });
    saveDB(db);
  }

  function getAllOrders() {
    const db = getDB();
    return Array.isArray(db.orders) ? db.orders : [];
  }

  function normalizeStatus(order) {
    const status = String(order.status || "").toLowerCase();
    if (["pending", "processing", "ready", "completed", "cancelled"].includes(status)) {
      return status;
    }
    return "pending";
  }

  function updateStats(orders) {
    if (totalEl) totalEl.textContent = orders.length;
    if (pendingEl) pendingEl.textContent = orders.filter(o => normalizeStatus(o) === "pending").length;
    if (processingEl) processingEl.textContent = orders.filter(o => normalizeStatus(o) === "processing").length;
    if (readyEl) readyEl.textContent = orders.filter(o => normalizeStatus(o) === "ready").length;
    if (completedEl) completedEl.textContent = orders.filter(o => normalizeStatus(o) === "completed").length;
  }

  function formatField(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "string" && value.includes("T") && value.includes("-")) {
      try {
        return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      } catch { return value; }
    }
    return String(value);
  }

  function buildStatusBadge(status) {
    const map = {
      pending: "order-status-pending",
      processing: "order-status-processing",
      ready: "order-status-ready",
      completed: "order-status-completed",
      cancelled: "order-status-cancelled"
    };
    return `<span class="order-status-badge ${map[status] || "order-status-pending"}">${status.toUpperCase()}</span>`;
  }

  function renderOrderCard(order) {
    const status = normalizeStatus(order);
    const orderType = order.order_type === "organization" ? "Organization" : "Individual";
    const items = Array.isArray(order.items) ? order.items : [order];
    const itemsDisplay = items.slice(0, 2).map(i => i.service || i.name || "Unknown").join(", ") + (items.length > 2 ? `... +${items.length - 2}` : "");

    return `
      <article class="order-card" data-order-id="${order.orderId}">
        <div class="order-card__header">
          <div>
            <h3 class="order-title">${formatField(order.orderId)}</h3>
            <p class="order-subtitle">${formatField(order.userName)} · ${formatField(order.userEmail)}</p>
          </div>
          ${buildStatusBadge(status)}
        </div>
        <div class="order-card__meta">
          <div class="order-card__item">
            <span class="order-card__label">Type</span>
            <span class="order-card__value">${orderType}</span>
          </div>
          <div class="order-card__item">
            <span class="order-card__label">Items</span>
            <span class="order-card__value">${itemsDisplay}</span>
          </div>
          <div class="order-card__item">
            <span class="order-card__label">Total</span>
            <span class="order-card__value">₱${parseFloat(order.total || 0).toFixed(2)}</span>
          </div>
          <div class="order-card__item">
            <span class="order-card__label">Payment</span>
            <span class="order-card__value">${formatField(order.paymentMethod || order.paymentStatus)}</span>
          </div>
          <div class="order-card__item">
            <span class="order-card__label">Expected Pickup</span>
            <span class="order-card__value">${formatField(order.expectedPickupDate)}</span>
          </div>
          ${order.preferredPickupDate ? `<div class="order-card__item">
            <span class="order-card__label">Preferred Pickup</span>
            <span class="order-card__value">${formatField(order.preferredPickupDate)}</span>
          </div>` : ""}
          <div class="order-card__item">
            <span class="order-card__label">Submitted</span>
            <span class="order-card__value">${formatField(order.createdAt || order.dateOrdered)}</span>
          </div>
        </div>
        <div class="order-card__actions">
          ${status !== "completed" ? `
            ${status !== "processing" ? `<button class="btn btn--outline btn--sm" type="button" data-action="process" data-order="${order.orderId}">Start Processing</button>` : ""}
            ${status !== "ready" ? `<button class="btn btn--outline btn--sm" type="button" data-action="ready" data-order="${order.orderId}">Mark Ready</button>` : ""}
            ${status !== "completed" ? `<button class="btn btn--success btn--sm" type="button" data-action="complete" data-order="${order.orderId}">Mark Complete</button>` : `<button class="btn btn--outline btn--sm" type="button" disabled>Completed</button>`}
          ` : `<button class="btn btn--outline btn--sm" type="button" disabled>Completed</button>`}
          ${status !== "cancelled" ? `<button class="btn btn--danger btn--sm" type="button" data-action="cancel" data-order="${order.orderId}">Cancel</button>` : ""}
        </div>
      </article>`;
  }

  function getFiltered(all) {
    return all.filter(order => {
      const status = normalizeStatus(order);
      const type = order.order_type || "individual";
      const search = filterState.search.toLowerCase().trim();
      
      const matchesSearch = !search ||
        String(order.orderId || "").toLowerCase().includes(search) ||
        String(order.userName || "").toLowerCase().includes(search) ||
        String(order.userEmail || "").toLowerCase().includes(search);
      
      const matchesStatus = filterState.status === "all" || filterState.status === status;
      const matchesType = filterState.type === "all" || filterState.type === type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  function renderOrders() {
    const all = getAllOrders();
    const filtered = getFiltered(all);
    updateStats(all);
    
    if (!ordersContainer) return;
    if (filtered.length === 0) {
      ordersContainer.innerHTML = "";
      emptyState?.classList.add("active");
      return;
    }
    emptyState?.classList.remove("active");
    ordersContainer.innerHTML = filtered.map(renderOrderCard).join("");
  }

  function updateOrderStatus(orderId, newStatus) {
    const db = getDB();
    db.orders = Array.isArray(db.orders) ? db.orders : [];
    
    const orderIndex = db.orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return;
    
    const order = db.orders[orderIndex];
    const oldStatus = normalizeStatus(order);
    
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    
    saveDB(db);
    
    // Notify the user
    const statusMessages = {
      processing: `Your order ${orderId} is now being processed.`,
      ready: `Your order ${orderId} is ready for pickup!`,
      completed: `Your order ${orderId} has been completed and is ready for pickup.`,
      cancelled: `Your order ${orderId} has been cancelled.`
    };
    
    if (order.userId && statusMessages[newStatus]) {
      notifyUser(order.userId, statusMessages[newStatus], newStatus === "cancelled" ? "error" : "success");
    }
    
    renderOrders();
  }

  function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    
    const action = button.dataset.action;
    const orderId = button.dataset.order;
    if (!orderId) return;
    
    if (action === "process") updateOrderStatus(orderId, "processing");
    else if (action === "ready") updateOrderStatus(orderId, "ready");
    else if (action === "complete") updateOrderStatus(orderId, "completed");
    else if (action === "cancel") {
      if (confirm("Are you sure you want to cancel this order?")) {
        updateOrderStatus(orderId, "cancelled");
      }
    }
  }

  function initFilters() {
    searchInput?.addEventListener("input", e => {
      filterState.search = e.target.value || "";
      renderOrders();
    });
    statusSelect?.addEventListener("change", e => {
      filterState.status = e.target.value;
      renderOrders();
    });
    typeSelect?.addEventListener("change", e => {
      filterState.type = e.target.value;
      renderOrders();
    });
  }

  function init() {
    renderOrders();
    ordersContainer?.addEventListener("click", handleListClick);
    initFilters();
    window.addEventListener("storage", e => { if (e.key === "upressease_db") renderOrders(); });
    setInterval(renderOrders, 2000);
  }

  window.addEventListener("DOMContentLoaded", init);
})();