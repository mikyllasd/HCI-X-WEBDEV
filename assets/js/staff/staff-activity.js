/**
 * Staff Activity Records (Completed page)
 * Source of truth: `upressease_db.transactions` + walk-in sales (upressWalkInSales).
 */
document.addEventListener("DOMContentLoaded", () => {
  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const money = (n) => "₱" + (Number(n) || 0).toFixed(2);

  function statusBadge(statusRaw) {
    const s = String(statusRaw || "").toLowerCase();
    let cls = "badge badge-complete";
    let label = statusRaw || "—";
    if (s.includes("pending")) cls = "badge badge-pending";
    else if (s.includes("process")) cls = "badge badge-process";
    else if (s.includes("ready")) cls = "badge badge-ready";
    else if (s.includes("complete") || s === "paid") cls = "badge badge-complete";
    if (s === "paid") label = "Paid";
    if (s === "completed") label = "Completed";
    return `<span class="${cls}">${esc(label)}</span>`;
  }

  function toDateLabel(iso) {
    const t = Date.parse(iso || "");
    if (!Number.isFinite(t)) return "—";
    return new Date(t).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
  }

  function startOfWeek(d) {
    const x = new Date(d);
    const day = x.getDay(); // 0..6
    const diff = (day + 6) % 7; // monday=0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - diff);
    return x;
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function semesterRange(d) {
    const m = d.getMonth() + 1;
    if (m <= 6) {
      return { from: new Date(d.getFullYear(), 0, 1), to: new Date(d.getFullYear(), 5, 30) };
    }
    return { from: new Date(d.getFullYear(), 6, 1), to: new Date(d.getFullYear(), 11, 31) };
  }

  function inRange(ts, from, to) {
    if (!from || !to) return true;
    const t = Date.parse(ts || "");
    if (!Number.isFinite(t)) return false;
    return t >= from.getTime() && t <= to.getTime() + 24 * 60 * 60 * 1000 - 1;
  }

  function getDbSafe() {
    try {
      return typeof window.getDB === "function" ? window.getDB() : null;
    } catch {
      return null;
    }
  }

  function buildUserIndex(db) {
    const idx = new Map();
    const users = Array.isArray(db?.users) ? db.users : [];
    users.forEach((u) => {
      const email = String(u?.email || "").toLowerCase();
      if (email) idx.set(email, u);
    });
    return idx;
  }

  function normalizeUserType(tx, user) {
    const orderType = String(tx?.order_type || tx?.orderType || "").toLowerCase();
    if (orderType === "organization" || tx?.order_org || tx?.orderOrg) return "organization";
    const role = String(user?.role || "").toLowerCase();
    if (role === "faculty") return "faculty";
    if (role === "student") return "student";
    return "student";
  }

  function collectRecords() {
    const db = getDbSafe();
    const userIdx = buildUserIndex(db);
    const out = [];

    const txs = Array.isArray(db?.transactions) ? db.transactions : [];
    txs.forEach((tx) => {
      const status = String(tx?.status || "").toLowerCase();
      if (!(status === "completed" || status === "paid")) return;

      // IMPORTANT:
      // Walk-in POS sales are already collected below from `upressWalkInSales`.
      // The app also mirrors some walk-ins into `db.transactions` for reporting consistency,
      // using internal IDs like `txn_pos_SALE-1003`. Do NOT show those internal IDs here,
      // or we’ll get duplicates and confusing prefixes.
      const txId = String(tx?.id || "");
      const isWalkInMirror =
        txId.startsWith("txn_pos_") ||
        String(tx?.serviceId || "") === "svc_walkin" ||
        String(tx?.serviceName || "") === "Walk-in POS";
      if (isWalkInMirror) return;

      const email = String(tx?.email || "").toLowerCase();
      const user = email ? userIdx.get(email) : null;
      const userType = normalizeUserType(tx, user);
      const paymentMethod = tx?.paymentMethod || tx?.payment || tx?.method || "—";
      const reference = tx?.refNumber || tx?.reference || tx?.paymentRef || "—";
      const displayOrderId =
        tx?.orderId ||
        tx?.orderID ||
        tx?.order_id ||
        tx?.orderNo ||
        tx?.orderNumber ||
        tx?.id ||
        tx?.orderId;

      out.push({
        id: String(displayOrderId || ""),
        name: user?.fullName || tx?.customerName || tx?.email || "—",
        userType,
        college: user?.college || "—",
        course: user?.course || "—",
        yearLevel: user?.yearLevel || "—",
        service: tx?.serviceName || tx?.service || "—",
        status: tx?.status || "—",
        date: tx?.date || "",
        channel: "Web / System",
        amount: Number(tx?.amount) || 0,
        paymentMethod,
        reference,
        raw: tx,
      });
    });

    // Walk-in POS completed records
    const walkIns = window.UpressStaffData?.getWalkInSales?.() || [];
    walkIns.forEach((s) => {
      const ts = s.ts || s.date;
      // Walk-ins are already completed sales
      const patron = String(s.patronType || "").toLowerCase();
      const userType =
        patron.includes("faculty") ? "faculty" : patron.includes("organization") ? "organization" : "student";
      out.push({
        id: String(s.saleId || ""),
        name: s.customerName || "Walk-in",
        userType,
        college: "—",
        course: "—",
        yearLevel: "—",
        service: "Walk-in POS",
        status: "completed",
        date: ts,
        channel: "Walk-in POS",
        amount: Number(s.grandTotal) || 0,
        paymentMethod: s.paymentMethod || "—",
        reference: s.gcashRef || "—",
        raw: s,
      });
    });

    out.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    return out;
  }

  function hydrateOptions(records) {
    const collegeSel = document.getElementById("actCollege");
    const courseSel = document.getElementById("actCourse");
    if (!collegeSel || !courseSel) return;

    const colleges = new Set();
    const courses = new Set();
    records.forEach((r) => {
      if (r.college && r.college !== "—") colleges.add(r.college);
      if (r.course && r.course !== "—") courses.add(r.course);
    });

    const curCollege = collegeSel.value || "all";
    const curCourse = courseSel.value || "all";

    collegeSel.innerHTML =
      `<option value="all">All colleges</option>` +
      Array.from(colleges)
        .sort((a, b) => a.localeCompare(b))
        .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
        .join("");
    courseSel.innerHTML =
      `<option value="all">All courses</option>` +
      Array.from(courses)
        .sort((a, b) => a.localeCompare(b))
        .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
        .join("");

    if (curCollege) collegeSel.value = curCollege;
    if (curCourse) courseSel.value = curCourse;
  }

  function applyFilters(records) {
    const period = document.getElementById("actPeriod")?.value || "weekly";
    const userType = document.getElementById("actUserType")?.value || "all";
    const college = document.getElementById("actCollege")?.value || "all";
    const course = document.getElementById("actCourse")?.value || "all";
    const year = document.getElementById("actYearLevel")?.value || "all";
    const q = String(document.getElementById("actSearch")?.value || "").trim().toLowerCase();

    const now = new Date();
    let from = null;
    let to = null;
    if (period === "weekly") {
      from = startOfWeek(now);
      to = new Date(now);
    } else if (period === "monthly") {
      from = startOfMonth(now);
      to = new Date(now);
    } else if (period === "semester") {
      const r = semesterRange(now);
      from = r.from;
      to = r.to;
    }

    return records.filter((r) => {
      if (!inRange(r.date, from, to) && period !== "all") return false;
      if (userType !== "all" && r.userType !== userType) return false;
      if (college !== "all" && r.college !== college) return false;
      if (course !== "all" && r.course !== course) return false;
      if (year !== "all" && r.yearLevel !== year) return false;
      if (q) {
        const hay = [r.id, r.name, r.service, r.channel, r.college, r.course, r.yearLevel, r.userType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render() {
    const tbody = document.querySelector("#completedOrdersTable tbody");
    if (!tbody) return;
    const all = collectRecords();
    hydrateOptions(all);
    const filtered = applyFilters(all);

    const countEl = document.getElementById("coResultCount");
    if (countEl) countEl.textContent = `${filtered.length} records`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="13" style="color:#667085">No records match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((r) => {
        const typeLabel =
          r.userType === "faculty" ? "Faculty" : r.userType === "organization" ? "Organization" : "Student";
        return `
          <tr>
            <td><code>${esc(r.id)}</code></td>
            <td><strong>${esc(r.name)}</strong></td>
            <td>${esc(typeLabel)}</td>
            <td>${esc(r.college)}</td>
            <td>${esc(r.course)}</td>
            <td>${esc(r.yearLevel)}</td>
            <td>${esc(r.service)}</td>
            <td>${statusBadge(r.status)}</td>
            <td>${esc(toDateLabel(r.date))}</td>
            <td>${esc(r.channel)}</td>
            <td>${esc(String(r.paymentMethod || "—"))}</td>
            <td><code>${esc(String(r.reference || "—"))}</code></td>
            <td style="font-weight:800;color:var(--color-header)">${esc(money(r.amount))}</td>
          </tr>
        `;
      })
      .join("");

    window.UpressListTools?.initTableList?.({
      tableId: "completedOrdersTable",
      searchInputId: "actSearch",
      countId: "coResultCount",
      paginationId: "coPagination",
      pageSize: 12,
      emptyLabel: "records",
    });
  }

  document.getElementById("actClear")?.addEventListener("click", () => {
    const ids = ["actPeriod", "actUserType", "actCollege", "actCourse", "actYearLevel", "actSearch"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === "SELECT") el.value = id === "actPeriod" ? "weekly" : "all";
      else el.value = "";
    });
    render();
  });

  ["actPeriod", "actUserType", "actCollege", "actCourse", "actYearLevel"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", render);
  });
  document.getElementById("actSearch")?.addEventListener("input", render);

  document.addEventListener("staff:data-changed", render);
  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db" || e.key === "upressWalkInSales") render();
  });

  render();
});

