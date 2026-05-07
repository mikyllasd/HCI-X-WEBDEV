document.addEventListener("DOMContentLoaded", function () {
  if (window.UPressPricing && typeof window.UPressPricing.applyLandingPricing === "function") {
    window.UPressPricing.applyLandingPricing();
  }
  syncServicesFromDb();
  applyContactDetailsFromDb();
  initMobileMenu();
  initHeaderScroll();
  initSmoothScroll();
  initContactForm();
});

function safeReadDbServices() {
  try {
    const raw = localStorage.getItem("upressease_db");
    if (!raw) return [];
    const db = JSON.parse(raw);
    return Array.isArray(db?.services) ? db.services : [];
  } catch (_) {
    return [];
  }
}

function syncServicesFromDb() {
  const grid = document.querySelector("#services .services-grid");
  if (!grid) return;

  const base = new Set(["printing", "binding", "lanyards", "mug printing", "id processing", "id printing"]);
  const dbServices = safeReadDbServices()
    .map((s) => ({
      name: String(s?.name || s?.serviceName || "").trim(),
      description: String(s?.description || "").trim(),
      category: String(s?.category || "").trim(),
    }))
    .filter((s) => s.name);

  const extra = [];
  const seen = new Set();
  for (const s of dbServices) {
    const k = s.name.toLowerCase();
    if (base.has(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    extra.push(s);
  }
  if (!extra.length) return;

  const esc = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const html = extra
    .slice(0, 6)
    .map(
      (s) => `
    <div class="service-card">
      <div class="service-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      </div>
      <h3 class="service-title">${esc(s.name)}</h3>
      <p class="service-description">${esc(s.description || "Service available at UPress.")}</p>
      ${s.category ? `<ul class="service-features"><li>Category: ${esc(s.category)}</li></ul>` : ""}
    </div>`,
    )
    .join("");

  // Insert before the CTA card if present; otherwise append.
  const cta = grid.querySelector(".service-card-cta");
  if (cta) cta.insertAdjacentHTML("beforebegin", html);
  else grid.insertAdjacentHTML("beforeend", html);
}

function applyContactDetailsFromDb() {
  let db = null;
  try {
    const raw = localStorage.getItem("upressease_db");
    db = raw ? JSON.parse(raw) : null;
  } catch (_) {
    db = null;
  }
  const c = db && db.systemSettings && db.systemSettings.contact ? db.systemSettings.contact : null;
  if (!c) return;

  const locEl = document.getElementById("landingContactLocation");
  const phoneEl = document.getElementById("landingContactPhone");
  const emailEl = document.getElementById("landingContactEmail");
  const hoursEl = document.getElementById("landingContactHours");

  function toHtmlLines(v) {
    return String(v || "")
      .split(/\r?\n/)
      .map((line) =>
        line
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;"),
      )
      .join("<br>");
  }

  if (locEl && typeof c.location === "string" && c.location.trim()) {
    locEl.innerHTML = toHtmlLines(c.location);
  }
  if (phoneEl && typeof c.phone === "string" && c.phone.trim()) {
    phoneEl.textContent = c.phone;
  }
  if (emailEl && typeof c.email === "string" && c.email.trim()) {
    emailEl.textContent = c.email;
  }
  if (hoursEl && typeof c.hours === "string" && c.hours.trim()) {
    hoursEl.innerHTML = toHtmlLines(c.hours);
  }
}

function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");
  if (!menuBtn || !mobileMenu) return;
  menuBtn.addEventListener("click", function () {
    this.classList.toggle("active");
    mobileMenu.classList.toggle("active");
    document.body.style.overflow = mobileMenu.classList.contains("active") ? "hidden" : "";
  });
  mobileLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      menuBtn.classList.remove("active");
      mobileMenu.classList.remove("active");
      document.body.style.overflow = "";
    });
  });
}

function initHeaderScroll() {
  const header = document.getElementById("header");
  if (!header) return;
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 100) {
      header.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
    } else {
      header.style.boxShadow = "none";
    }
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerHeight = document.getElementById("header") ? document.getElementById("header").offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    });
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;
    setTimeout(function () {
      window.alert("Thank you for your message! We will get back to you soon.");
      form.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1000);
  });
}
