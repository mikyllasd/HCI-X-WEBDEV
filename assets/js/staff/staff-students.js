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

  function getRows() {
    const db = window.getDB();
    const list = Array.isArray(db.students) ? db.students : [];
    return list.slice();
  }

  function applyFilters(rows) {
    const q = String(document.getElementById("stuSearch")?.value || "").trim().toLowerCase();
    const college = String(document.getElementById("stuCollegeFilter")?.value || "").trim().toLowerCase();
    const course = String(document.getElementById("stuCourseFilter")?.value || "").trim().toLowerCase();

    return rows.filter((s) => {
      const hay = [
        s.studentNumber,
        s.name,
        s.college,
        s.course,
        s.yearLevel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (college && !String(s.college || "").toLowerCase().includes(college)) return false;
      if (course && !String(s.course || "").toLowerCase().includes(course)) return false;
      return true;
    });
  }

  function render() {
    const tbody = document.querySelector("#studentsTable tbody");
    if (!tbody) return;

    const filtered = applyFilters(getRows());
    const countEl = document.getElementById("stuCount");
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
      tableId: "studentsTable",
      searchInputId: "stuSearch", // reuse (table search)
      countId: "stuCount",
      paginationId: "stuPagination",
      pageSize: 10,
      emptyLabel: "students",
    });
  }

  // Reuse the student modal (same IDs as Walk-in POS)
  function openStudentModal() {
    const modal = document.getElementById("studentModal");
    if (!modal) return;
    const err = document.getElementById("stuErr");
    if (err) {
      err.style.display = "none";
      err.textContent = "";
    }
    document.getElementById("studentModalTitle").textContent = "Add Student";
    modal.setAttribute("aria-hidden", "false");
  }

  function closeStudentModal() {
    document.getElementById("studentModal")?.setAttribute("aria-hidden", "true");
  }

  function saveStudent() {
    if (typeof window.saveDB !== "function") return;

    const name = document.getElementById("stuName")?.value.trim() || "";
    const studentNumber = document.getElementById("stuNumber")?.value.trim() || "";
    const college = document.getElementById("stuCollege")?.value.trim() || "";
    const course = document.getElementById("stuCourse")?.value.trim() || "";
    const yearLevel = document.getElementById("stuYearLevel")?.value || "1st Year";
    const contact = document.getElementById("stuContact")?.value.trim() || "";
    const isFreshman = !!document.getElementById("stuIsFreshman")?.checked;

    const err = document.getElementById("stuErr");
    const setErr = (msg) => {
      if (!err) return;
      err.style.display = msg ? "" : "none";
      err.textContent = msg || "";
    };

    if (!name) return setErr("Name is required.");
    if (!studentNumber) return setErr("Student Number is required.");
    if (!course) return setErr("Course is required.");

    const db = window.getDB();
    db.students = Array.isArray(db.students) ? db.students : [];
    const exists = db.students.some(
      (s) => String(s.studentNumber || "").toLowerCase() === studentNumber.toLowerCase(),
    );
    if (exists) return setErr("Student Number already exists.");

    db.students.unshift({
      id: `stu_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      studentNumber,
      college,
      course,
      yearLevel,
      contact,
      isFreshman,
      createdAt: new Date().toISOString(),
      createdBy: "staff",
      source: "students-page",
    });

    window.saveDB(db);
    closeStudentModal();
    document.dispatchEvent(new CustomEvent("staff:data-changed"));
    render();
  }

  document.getElementById("stuClearFilters")?.addEventListener("click", () => {
    const ids = ["stuSearch", "stuCollegeFilter", "stuCourseFilter"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    render();
  });

  ["stuSearch", "stuCollegeFilter", "stuCourseFilter"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
  });

  document.getElementById("btnAddStudentStudents")?.addEventListener("click", openStudentModal);
  document.getElementById("stuSaveBtn")?.addEventListener("click", saveStudent);
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) closeStudentModal();
  });

  document.addEventListener("staff:data-changed", render);
  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db") render();
  });

  render();
});

