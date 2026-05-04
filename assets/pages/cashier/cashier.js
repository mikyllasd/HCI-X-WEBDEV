// Cashier Module JavaScript

document.addEventListener("DOMContentLoaded", function () {
  initializeCashier();
});

function initializeCashier() {
  // Navigation handling
  const navLinks = document.querySelectorAll(".nav-link");
  const pageContainer = document.getElementById("pageContainer");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");

      // Update active state
      navLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");

      // Load page content
      loadPage(page);
    });
  });

  // Load initial dashboard
  loadPage("dashboard");

  // Sidebar toggle
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  hamburger?.addEventListener("click", () => {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("open");
  });

  sidebarClose?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("open");
  });

  sidebarOverlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("open");
  });
}

function loadPage(page) {
  const pageContainer = document.getElementById("pageContainer");

  // Load HTML content
  fetch(`${page}.html`)
    .then((response) => response.text())
    .then((html) => {
      pageContainer.innerHTML = html;

      // Load page-specific JavaScript
      loadPageScript(page);

      // Re-initialize Lucide icons
      if (window.lucide) {
        lucide.createIcons();
      }
    })
    .catch((error) => {
      console.error("Error loading page:", error);
      pageContainer.innerHTML = "<p>Error loading page content.</p>";
    });
}

function loadPageScript(page) {
  // Remove existing page script if any
  const existingScript = document.querySelector(`script[data-page="${page}"]`);
  if (existingScript) {
    existingScript.remove();
  }

  // Load new page script
  const script = document.createElement("script");
  script.src = `${page}.js`;
  script.setAttribute("data-page", page);
  document.body.appendChild(script);
}

// Toast notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");

  toastMsg.textContent = message;
  toast.className = `toast ${type}`;

  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// Storage utilities
function saveToStorage(key, data) {
  localStorage.setItem(`cashier_${key}`, JSON.stringify(data));
}

function getFromStorage(key) {
  const data = localStorage.getItem(`cashier_${key}`);
  return data ? JSON.parse(data) : null;
}

function removeFromStorage(key) {
  localStorage.removeItem(`cashier_${key}`);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
