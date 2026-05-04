document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const hamburger = document.getElementById("hamburger");
  const sidebarClose = document.getElementById("sidebarClose");
  const logoutBtn = document.getElementById("logoutBtn");

  function openSidebar() {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("open");
  }

  function closeSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("open");
  }

  hamburger?.addEventListener("click", openSidebar);
  sidebarClose?.addEventListener("click", closeSidebar);
  sidebarOverlay?.addEventListener("click", closeSidebar);

  logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    try {
      localStorage.removeItem("currentUser");
    } catch (_error) {}
    window.location.href = "../../../index.html";
  });
});
