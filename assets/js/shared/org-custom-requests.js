/**
 * Organization custom / “Other” service requests (beyond catalog services).
 * Stored in `upressease_db.orgCustomRequests`.
 */
(function () {
  function ensure(db) {
    if (!Array.isArray(db.orgCustomRequests)) db.orgCustomRequests = [];
    return db.orgCustomRequests;
  }

  function notifyUser(userId, message, type) {
    if (!userId || typeof getDB !== "function" || typeof saveDB !== "function")
      return;
    const db = getDB();
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      userId: String(userId),
      message,
      type: type || "info",
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveDB(db);
  }

  window.UpressOrgCustomRequests = {
    list() {
      if (typeof getDB !== "function") return [];
      const db = getDB();
      return ensure(db)
        .slice()
        .sort((a, b) =>
          String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")),
        );
    },

    add(payload) {
      if (typeof getDB !== "function" || typeof saveDB !== "function")
        return null;
      const db = getDB();
      const arr = ensure(db);
      const row = {
        id:
          "ocr_" +
          Date.now() +
          "_" +
          Math.random().toString(36).slice(2, 10),
        status: "pending",
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        staffNotes: "",
        staffReviewedAt: "",
        adminNotes: "",
        adminAcknowledged: false,
        adminReviewedAt: "",
        oversightNotes: "",
        ...payload,
      };
      arr.unshift(row);
      saveDB(db);
      return row;
    },

    update(id, patch) {
      if (typeof getDB !== "function" || typeof saveDB !== "function")
        return null;
      const db = getDB();
      const arr = ensure(db);
      const i = arr.findIndex((r) => r.id === id);
      if (i === -1) return null;
      arr[i] = {
        ...arr[i],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      saveDB(db);
      return arr[i];
    },

    notifyUser,
  };
})();
