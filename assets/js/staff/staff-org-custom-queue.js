/**
 * Mount org custom / “Other” requests on the staff Order Queue page.
 */
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("queueOrgCustomList");
  if (!el || !window.UpressOrgCustomRequestsUI) return;

  function render() {
    window.UpressOrgCustomRequestsUI.mount(el, {
      role: "staff",
      sortPendingFirst: true,
    });
  }

  render();
  window.addEventListener("storage", (e) => {
    if (e.key === "upressease_db") render();
  });
  setInterval(render, 8000);
});
