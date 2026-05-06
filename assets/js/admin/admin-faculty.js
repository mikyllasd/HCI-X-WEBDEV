document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.getDB !== "function") return;

  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const fmtDate = (iso) => {
    const t = Date.parse(iso || "");
    if (!Number.isFinite(t)) return "—";
    return new Date(t).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
  };

  function getFaculty() {
    const db = window.getDB();
    return Array.isArray(db.faculty) ? db.faculty.slice() : [];
  }

  function applyFilters(list) {
    const q = String(document.getElementById("adminFacultySearch")?.value || "").trim().toLowerCase();
    const college = String(document.getElementById("adminFacultyCollege")?.value || "").trim().toLowerCase();
    const dept = String(document.getElementById("adminFacultyDept")?.value || "").trim().toLowerCase();

    return list.filter((f) => {
      const hay = [f.employeeNumber, f.name, f.college, f.department, f.contact]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (college && !String(f.college || "").toLowerCase().includes(college)) return false;
      if (dept && !String(f.department || "").toLowerCase().includes(dept)) return false;
      return true;
    });
  }

  function render() {
    const tbody = document.querySelector("#adminFacultyTable tbody");
    if (!tbody) return;

    const filtered = applyFilters(getFaculty());
    const countEl = document.getElementById("adminFacultyCount");
    if (countEl) countEl.textContent = `${filtered.length} faculty`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:#667085">No faculty found.</td></tr>`;
    } else {
      tbody.innerHTML = filtered
        .map((f) => {
          return `
            <tr>
              <td><code>${esc(f.employeeNumber || "—")}</code></td>
              <td><strong>${esc(f.name || "—")}</strong></td>
              <td>${esc(f.college || "—")}</td>
              <td>${esc(f.department || "—")}</td>
              <td>${esc(f.contact || "—")}</td>
              <td>${esc(fmtDate(f.createdAt))}</td>
            </tr>
          `;
        })
        .join("");
    }

    window.UpressListTools?.initTableList?.({
      tableId: "adminFacultyTable",
      searchInputId: "adminFacultySearch",
      countId: "adminFacultyCount",
      paginationId: "adminFacultyPagination",
      pageSize: 10,
      emptyLabel: "faculty",
    });
  }

  ["adminFacultySearch", "adminFacultyCollege", "adminFacultyDept"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db") render();
  });

  render();
});

