/**
 * Shared discounts helper (db.discounts)
 * Used by Student checkout, Staff POS, and reporting.
 */
(function (global) {
  function safeDb() {
    try {
      if (typeof global.getDB === "function") return global.getDB();
    } catch (_) {}
    try {
      const raw = localStorage.getItem("upressease_db");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {}
    return null;
  }

  function normalizeCode(code) {
    return String(code || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function isWithinWindow(d, nowTs) {
    if (!d) return true;
    const t = Date.parse(d);
    if (!Number.isFinite(t)) return true;
    return t <= nowTs;
  }

  function isAfterWindow(d, nowTs) {
    if (!d) return true;
    const t = Date.parse(d);
    if (!Number.isFinite(t)) return true;
    return t >= nowTs;
  }

  /**
   * @param {string} codeRaw
   * @param {number} grossAmount
   * @returns {{ ok: boolean, reason?: string, discount?: object, discountAmount: number, netAmount: number, code: string }}
   */
  function applyDiscountCode(codeRaw, grossAmount) {
    const code = normalizeCode(codeRaw);
    const gross = Math.max(0, Number(grossAmount) || 0);
    if (!code) return { ok: false, reason: "empty", discountAmount: 0, netAmount: gross, code };

    const db = safeDb();
    const discounts = Array.isArray(db?.discounts) ? db.discounts : [];
    const d = discounts.find((x) => normalizeCode(x?.code) === code) || null;
    if (!d) return { ok: false, reason: "not_found", discountAmount: 0, netAmount: gross, code };
    if (d.active === false) return { ok: false, reason: "inactive", discountAmount: 0, netAmount: gross, code };

    const nowTs = Date.now();
    if (!isWithinWindow(d.startsAt, nowTs)) return { ok: false, reason: "not_started", discountAmount: 0, netAmount: gross, code };
    if (!isAfterWindow(d.endsAt, nowTs)) return { ok: false, reason: "expired", discountAmount: 0, netAmount: gross, code };

    const min = Math.max(0, Number(d.minAmount) || 0);
    if (gross < min) return { ok: false, reason: "min_not_met", discountAmount: 0, netAmount: gross, code };

    const type = String(d.type || "percent").toLowerCase();
    const val = Number(d.value) || 0;
    let disc = 0;
    if (type === "fixed") disc = val;
    else disc = gross * (Math.max(0, Math.min(100, val)) / 100);

    const maxDisc = Math.max(0, Number(d.maxDiscount) || 0);
    if (maxDisc > 0) disc = Math.min(disc, maxDisc);
    disc = Math.min(disc, gross);
    disc = Math.round(disc * 100) / 100;

    const net = Math.max(0, Math.round((gross - disc) * 100) / 100);
    return { ok: true, discount: d, discountAmount: disc, netAmount: net, code };
  }

  global.UpressDiscounts = {
    normalizeCode,
    applyDiscountCode,
  };
})(window);

