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

  function openModal() {
    document.getElementById("facultyModal")?.setAttribute("aria-hidden", "false");
    const err = document.getElementById("facErr");
    if (err) {
      err.style.display = "none";
      err.textContent = "";
    }
  }

  function closeModal() {
    document.getElementById("facultyModal")?.setAttribute("aria-hidden", "true");
  }

  function setErr(msg) {
    const el = document.getElementById("facErr");
    if (!el) return;
    el.style.display = msg ? "" : "none";
    el.textContent = msg || "";
  }

  function getFaculty() {
    const db = window.getDB();
    return Array.isArray(db.faculty) ? db.faculty.slice() : [];
  }

  function applyFilters(list) {
    const q = String(document.getElementById("facSearch")?.value || "").trim().toLowerCase();
    const college = String(document.getElementById("facCollege")?.value || "").trim().toLowerCase();
    const dept = String(document.getElementById("facDept")?.value || "").trim().toLowerCase();

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
    const tbody = document.querySelector("#facultyTable tbody");
    if (!tbody) return;
    const filtered = applyFilters(getFaculty());
    const countEl = document.getElementById("facCount");
    if (countEl) countEl.textContent = `${filtered.length} faculty`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:#667085">No faculty records yet.</td></tr>`;
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
      tableId: "facultyTable",
      searchInputId: "facSearch",
      countId: "facCount",
      paginationId: "facPagination",
      pageSize: 10,
      emptyLabel: "faculty",
    });
  }

  function saveFaculty() {
    if (typeof window.saveDB !== "function") return;
    const name = document.getElementById("facName")?.value.trim() || "";
    const employeeNumber = document.getElementById("facEmp")?.value.trim() || "";
    const college = document.getElementById("facCollegeIn")?.value.trim() || "";
    const department = document.getElementById("facDeptIn")?.value.trim() || "";
    const contact = document.getElementById("facContact")?.value.trim() || "";

    if (!name) return setErr("Name is required.");
    if (!employeeNumber) return setErr("Employee Number is required.");
    if (!department) return setErr("Department is required.");

    const db = window.getDB();
    db.faculty = Array.isArray(db.faculty) ? db.faculty : [];
    const exists = db.faculty.some(
      (f) => String(f.employeeNumber || "").toLowerCase() === employeeNumber.toLowerCase(),
    );
    if (exists) return setErr("Employee Number already exists.");

    db.faculty.unshift({
      id: `fac_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      employeeNumber,
      college,
      department,
      contact,
      createdAt: new Date().toISOString(),
      createdBy: "staff",
      source: "faculty-page",
    });
    window.saveDB(db);
    closeModal();
    document.dispatchEvent(new CustomEvent("staff:data-changed"));
    render();
  }

  document.getElementById("btnAddFaculty")?.addEventListener("click", openModal);
  document.getElementById("facSaveBtn")?.addEventListener("click", saveFaculty);
  document.getElementById("facClear")?.addEventListener("click", () => {
    ["facSearch", "facCollege", "facDept"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    render();
  });

  ["facSearch", "facCollege", "facDept"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) closeModal();
  });
  document.addEventListener("staff:data-changed", render);
  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db") render();
  });

  render();
});

