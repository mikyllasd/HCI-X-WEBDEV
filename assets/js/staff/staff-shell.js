/**
 * Staff shell: auth guard, sidebar behavior, active nav highlighting.
 * Shared by all staff pages.
 */
(function () {
  function staffAuthGuard() {
    let u = null;
    try {
      u = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (_) {
      u = null;
    }
    const role = u && String(u.role || u.username || "").toLowerCase();
    if (!u || role !== "staff") {
      window.location.href = "../auth/portal.html";
    }
  }

  function initLucide() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function initSidebar() {
    const staffSidebar = document.getElementById("sidebar");
    const staffSidebarOverlay = document.getElementById("sidebarOverlay");
    const staffHamburger = document.getElementById("hamburger");
    const staffSidebarClose = document.getElementById("sidebarClose");

    function closeStaffSidebar() {
      if (staffSidebar) staffSidebar.classList.remove("open");
      if (staffSidebarOverlay) staffSidebarOverlay.classList.remove("open");
    }

    function toggleStaffSidebar() {
      if (!staffSidebar) return;
      const open = staffSidebar.classList.toggle("open");
      if (staffSidebarOverlay) staffSidebarOverlay.classList.toggle("open", open);
    }

    staffHamburger?.addEventListener("click", toggleStaffSidebar);
    staffSidebarClose?.addEventListener("click", closeStaffSidebar);
    staffSidebarOverlay?.addEventListener("click", closeStaffSidebar);
  }

  function setActiveNavFromBody() {
    const key = String(document.body?.dataset?.page || "").trim();
    if (!key) return;

    document.querySelectorAll(".nav-link[data-page]").forEach((l) => {
      l.classList.toggle("active", l.getAttribute("data-page") === key);
      if (l.getAttribute("data-page") === key) l.setAttribute("aria-current", "page");
      else l.removeAttribute("aria-current");
    });
  }

  function initLogout() {
    const logout = document.getElementById("logout-btn");
    if (!logout) return;
    logout.addEventListener("click", () => {
      try {
        localStorage.removeItem("currentUser");
      } catch (_) {}
    });
  }

  staffAuthGuard();
  document.addEventListener("DOMContentLoaded", () => {
    initLucide();
    initSidebar();
    setActiveNavFromBody();
    initLogout();
  });
})();

