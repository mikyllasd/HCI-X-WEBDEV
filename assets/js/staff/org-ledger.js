/**
 * Organization ledger (credits/payables) for staff.
 *
 * Persists into `upressease_db` as:
 * - db.orgLedgers: active/open ledgers
 * - db.orgLedgerArchive: fully paid / archived ledgers
 *
 * A ledger is tied to an org name (and optional orgId) and optionally an orderId.
 */
(function () {
  const getDbSafe = () => (typeof window.getDB === "function" ? window.getDB() : null);
  const saveDbSafe = (db) => {
    if (typeof window.saveDB === "function") window.saveDB(db);
  };

  function normOrgName(name) {
    return String(name || "").trim();
  }

  function moneyNum(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function ensureArrays(db) {
    db.orgLedgers = Array.isArray(db.orgLedgers) ? db.orgLedgers : [];
    db.orgLedgerArchive = Array.isArray(db.orgLedgerArchive) ? db.orgLedgerArchive : [];
  }

  function computeRemaining(totalAmount, payments) {
    const total = moneyNum(totalAmount);
    const paid = (Array.isArray(payments) ? payments : []).reduce(
      (s, p) => s + moneyNum(p?.amount),
      0,
    );
    return Math.max(0, +(total - paid).toFixed(2));
  }

  function buildLedger({ orgName, orgId, orderId, availedAt, totalAmount }) {
    const name = normOrgName(orgName);
    if (!name) throw new Error("Organization name is required.");
    const total = +moneyNum(totalAmount).toFixed(2);
    return {
      id: `org_ledger_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      orgName: name,
      orgId: orgId || "",
      orderId: orderId || "",
      availedAt: availedAt || nowIso(),
      totalAmount: total,
      payments: [],
      remainingBalance: total,
      status: total === 0 ? "fully_paid" : "open", // open | fully_paid
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  function listAll() {
    const db = getDbSafe();
    if (!db) return { open: [], archived: [] };
    ensureArrays(db);
    return {
      open: db.orgLedgers.slice(),
      archived: db.orgLedgerArchive.slice(),
    };
  }

  function findById(id) {
    const db = getDbSafe();
    if (!db) return null;
    ensureArrays(db);
    return (
      db.orgLedgers.find((l) => l.id === id) ||
      db.orgLedgerArchive.find((l) => l.id === id) ||
      null
    );
  }

  function findOpenByOrderId(orderId) {
    const oid = String(orderId || "").trim();
    if (!oid) return null;
    const db = getDbSafe();
    if (!db) return null;
    ensureArrays(db);
    return db.orgLedgers.find((l) => String(l.orderId || "") === oid) || null;
  }

  function ensureLedgerForOrgOrder({ orgName, orderId, availedAt, totalAmount }) {
    const db = getDbSafe();
    if (!db) return null;
    ensureArrays(db);

    const name = normOrgName(orgName);
    if (!name || !orderId) return null;

    const existing =
      db.orgLedgers.find((l) => l.orderId === orderId) ||
      db.orgLedgerArchive.find((l) => l.orderId === orderId);
    if (existing) return existing;

    const ledger = buildLedger({
      orgName: name,
      orderId,
      availedAt,
      totalAmount,
    });
    db.orgLedgers.unshift(ledger);
    saveDbSafe(db);
    return ledger;
  }

  function addLedger(input) {
    const db = getDbSafe();
    if (!db) return null;
    ensureArrays(db);
    const ledger = buildLedger(input || {});
    db.orgLedgers.unshift(ledger);
    saveDbSafe(db);
    return ledger;
  }

  function addPayment(ledgerId, { date, amount, note, method }) {
    const db = getDbSafe();
    if (!db) return null;
    ensureArrays(db);

    const i = db.orgLedgers.findIndex((l) => l.id === ledgerId);
    if (i === -1) throw new Error("Ledger not found (or already archived).");

    const payment = {
      id: `org_pay_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      date: date || nowIso(),
      amount: +moneyNum(amount).toFixed(2),
      method: String(method || "cash"),
      note: String(note || ""),
      createdAt: nowIso(),
    };

    db.orgLedgers[i].payments = Array.isArray(db.orgLedgers[i].payments)
      ? db.orgLedgers[i].payments
      : [];
    db.orgLedgers[i].payments.push(payment);

    const remaining = computeRemaining(db.orgLedgers[i].totalAmount, db.orgLedgers[i].payments);
    db.orgLedgers[i].remainingBalance = remaining;
    db.orgLedgers[i].status = remaining <= 0 ? "fully_paid" : "open";
    db.orgLedgers[i].updatedAt = nowIso();

    if (db.orgLedgers[i].status === "fully_paid") {
      const [done] = db.orgLedgers.splice(i, 1);
      done.archivedAt = nowIso();
      db.orgLedgerArchive.unshift(done);
    }

    saveDbSafe(db);
    return payment;
  }

  function getOrgSummary(orgName) {
    const name = normOrgName(orgName);
    const { open, archived } = listAll();
    const openRows = open.filter((l) => l.orgName === name);
    const archivedRows = archived.filter((l) => l.orgName === name);
    const openBalance = openRows.reduce((s, l) => s + moneyNum(l.remainingBalance), 0);
    return {
      orgName: name,
      openCount: openRows.length,
      archivedCount: archivedRows.length,
      openBalance: +openBalance.toFixed(2),
    };
  }

  window.UpressOrgLedger = {
    listAll,
    findById,
    findOpenByOrderId,
    ensureLedgerForOrgOrder,
    addLedger,
    addPayment,
    getOrgSummary,
  };
})();

