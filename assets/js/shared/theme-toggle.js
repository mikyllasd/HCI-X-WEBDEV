(function () {
  var STORAGE_KEY = "upress-theme";

  function applyTheme(theme) {
    if (theme !== "dark" && theme !== "light") theme = "light";
    document.documentElement.setAttribute("data-theme", theme);
  }

  function persist(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function updateFabState(button) {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    button.classList.toggle("upress-theme-fab--dark", dark);
  }

  function mountFab() {
    if (document.getElementById("upress-theme-fab")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "upress-theme-fab";
    btn.className = "upress-theme-fab";
    btn.innerHTML =
      '<span class="upress-theme-fab__icon upress-theme-fab__icon--sun" aria-hidden="true">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      "<circle cx=\"12\" cy=\"12\" r=\"4\"/>" +
      "<path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41-1.41M17.66 6.34l-1.41-1.41\"/>" +
      "</svg></span>" +
      '<span class="upress-theme-fab__icon upress-theme-fab__icon--moon" aria-hidden="true">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      "<path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"/>" +
      "</svg></span>";

    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      persist(next);
      updateFabState(btn);
    });

    updateFabState(btn);
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFab);
  } else {
    mountFab();
  }
})();
