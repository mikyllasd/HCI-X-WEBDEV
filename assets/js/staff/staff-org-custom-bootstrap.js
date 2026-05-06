document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("staffOrgCustomList");
  if (!el || !window.UpressOrgCustomRequestsUI) return;

  function render() {
    window.UpressOrgCustomRequestsUI.mount(el, { role: "staff" });
  }

  render();
  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db") render();
  });
  setInterval(render, 8000);
});
