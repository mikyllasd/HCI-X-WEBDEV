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

  function getStudents() {
    const db = window.getDB();
    return Array.isArray(db.students) ? db.students.slice() : [];
  }

  function applyFilters(list) {
    const q = String(document.getElementById("adminStudentSearch")?.value || "").trim().toLowerCase();
    const college = String(document.getElementById("adminStudentCollege")?.value || "").trim().toLowerCase();
    const course = String(document.getElementById("adminStudentCourse")?.value || "").trim().toLowerCase();

    return list.filter((s) => {
      const hay = [s.studentNumber, s.name, s.college, s.course, s.yearLevel].filter(Boolean).join(" ").toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (college && !String(s.college || "").toLowerCase().includes(college)) return false;
      if (course && !String(s.course || "").toLowerCase().includes(course)) return false;
      return true;
    });
  }

  function render() {
    const tbody = document.querySelector("#adminStudentsTable tbody");
    if (!tbody) return;

    const filtered = applyFilters(getStudents());
    const countEl = document.getElementById("adminStudentCount");
    if (countEl) countEl.textContent = `${filtered.length} students`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:#667085">No students found.</td></tr>`;
    } else {
      tbody.innerHTML = filtered
        .map((s) => {
          const tag = s.isFreshman ? '<span class="badge badge-ready">Freshman</span>' : "—";
          return `
            <tr>
              <td><code>${esc(s.studentNumber || "—")}</code></td>
              <td><strong>${esc(s.name || "—")}</strong></td>
              <td>${esc(s.college || "—")}</td>
              <td>${esc(s.course || "—")}</td>
              <td>${esc(s.yearLevel || "—")}</td>
              <td>${tag}</td>
              <td>${esc(fmtDate(s.createdAt))}</td>
            </tr>
          `;
        })
        .join("");
    }

    window.UpressListTools?.initTableList?.({
      tableId: "adminStudentsTable",
      searchInputId: "adminStudentSearch",
      countId: "adminStudentCount",
      paginationId: "adminStudentsPagination",
      pageSize: 10,
      emptyLabel: "students",
    });
  }

  ["adminStudentSearch", "adminStudentCollege", "adminStudentCourse"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db") render();
  });

  render();
});

