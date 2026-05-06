(function () {
  // Wait for storage.js to load
  function init() {
    if (typeof getDB === "undefined") {
      setTimeout(init, 10);
      return;
    }

    const db = getDB();
    const pageContainer = document.getElementById("pageContainer");
    const serviceModal = document.getElementById("serviceModal");
    const historyModal = document.getElementById("historyModal");
    const serviceForm = document.getElementById("serviceForm");
    const modalTitle = document.getElementById("modalTitle");
    const modalSub = document.getElementById("modalSub");
    const modalSaveBtn = document.getElementById("modalSaveBtn");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalCancelBtn = document.getElementById("modalCancelBtn");
    const historyCloseBtn = document.getElementById("historyCloseBtn");

    let editingServiceId = null;
    let serviceSearchQuery = "";
    let servicePage = 1;
    const SERVICES_PAGE_SIZE = 6;
    let pricingState =
      window.UPressPricing &&
      typeof UPressPricing.readPricingFromSession === "function"
        ? UPressPricing.readPricingFromSession()
        : null;

    function generateServiceId() {
      return "service_" + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    function addServiceHistory(serviceId, action, details = "") {
      if (!db.archives) {
        db.archives = {};
      }
      if (!db.archives.serviceHistory) {
        db.archives.serviceHistory = [];
      }

      db.archives.serviceHistory.push({
        serviceId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    }

    function syncAddServiceButton() {
      const btn = document.getElementById("addServiceBtn");
      if (!btn) return;
      const ok = !!db.academicYear;
      btn.disabled = !ok;
      btn.setAttribute("aria-disabled", ok ? "false" : "true");
      btn.title = ok
        ? ""
        : "Set the academic year in System Settings before adding services.";
    }

    function renderServices() {
      const servicesSection = document.getElementById("servicesSection");
      if (!servicesSection) return;

      syncAddServiceButton();

      if (!db.academicYear) {
        servicesSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div class="empty-state__title">Academic Year Not Set</div>
          <div class="empty-state__sub">Please set the academic year in System Settings before adding services.</div>
          <a href="settings.html" class="sd-hero__cta" style="margin-top: 16px; display: inline-block;">Go to Settings</a>
        </div>
      `;
        return;
      }

      const filteredServices = db.services.filter((service) => {
        const query = serviceSearchQuery.trim().toLowerCase();
        if (!query) return true;
        return [
          service.name,
          service.description,
          service.category,
          service.price,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

      const totalPages = Math.max(
        1,
        Math.ceil(filteredServices.length / SERVICES_PAGE_SIZE),
      );
      servicePage = Math.min(Math.max(servicePage, 1), totalPages);
      const start = (servicePage - 1) * SERVICES_PAGE_SIZE;
      const visibleServices = filteredServices.slice(
        start,
        start + SERVICES_PAGE_SIZE,
      );

      const countEl = document.getElementById("servicesResultCount");
      if (countEl) {
        countEl.textContent = `${filteredServices.length} of ${db.services.length} services`;
      }

      if (db.services.length === 0) {
        servicesSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 7v5M9 12h6"/>
            </svg>
          </div>
          <div class="empty-state__title">No services yet</div>
          <div class="empty-state__sub">Add a service to get started</div>
        </div>
      `;
        return;
      }

      if (filteredServices.length === 0) {
        servicesSection.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No services found</div>
          <div class="empty-state__sub">Try a different service name, category, description, or price.</div>
        </div>
      `;
        return;
      }

      const categories = {
        printing: [],
        merchandise: [],
        special: [],
      };

      visibleServices.forEach((service) => {
        if (categories[service.category]) {
          categories[service.category].push(service);
        }
      });

      let html = "";

      function getServicePriceLabel(service) {
        const key = getServicePricingKey(service?.name);
        if (
          key === "printing" ||
          key === "binding" ||
          key === "lanyards" ||
          key === "idAccessories" ||
          key === "mugs"
        ) {
          return `<span class="service-price service-price--detail">Detailed pricing</span>`;
        }
        const n = Number(service?.price || 0);
        return `<span class="service-price">₱${n.toFixed(2)}</span>`;
      }

      Object.entries(categories).forEach(([category, services]) => {
        if (services.length > 0) {
          const categoryLabels = {
            printing: "Printing Services",
            merchandise: "Merchandise",
            special: "Special Services",
          };

          html += `
          <div class="services-section">
            <h3 class="services-section-title">
              <span class="services-section-title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
              </span>
              ${categoryLabels[category]}
            </h3>
            <div class="services-grid">
              ${services
                .map((service) => {
                  const rating = getServiceRating(service.id);
                  return `
                  <div class="service-card">
                    <div class="service-header">
                      <span class="service-category ${service.category}">${service.category}</span>
                    </div>
                    <h3 class="service-name">${service.name}</h3>
                    ${service.description ? `<p class="service-description">${service.description}</p>` : ""}
                    ${getServicePriceLabel(service)}
                    ${
                      rating.average > 0
                        ? `
                      <div class="service-rating">
                        <div class="service-rating-stars">
                          ${[...Array(5)]
                            .map(
                              (_, i) => `
                            <span class="star">${i < Math.round(rating.average) ? "★" : "☆"}</span>
                          `,
                            )
                            .join("")}
                        </div>
                        <span>${rating.average.toFixed(1)} (${rating.count} reviews)</span>
                      </div>
                    `
                        : ""
                    }
                    <div class="service-meta">
                      <div class="service-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                        <span>${formatDate(service.createdAt)}</span>
                      </div>
                    </div>
                    <div class="service-card-actions">
                      <button class="service-action-btn edit-btn" data-id="${service.id}" title="Edit service">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button class="service-action-btn history" data-id="${service.id}" title="View history">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        History
                      </button>
                      <button class="service-action-btn danger delete-btn" data-id="${service.id}" title="Delete service">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>
        `;
        }
      });

      servicesSection.innerHTML = `
      ${html}
      <div class="list-pagination" aria-label="Services pagination">
        <span class="list-pagination__summary">Page ${servicePage} of ${totalPages}</span>
        <div class="list-pagination__actions">
          <button type="button" class="btn btn-ghost btn-sm" id="servicesPrevPage" ${servicePage === 1 ? "disabled" : ""}>Previous</button>
          <button type="button" class="btn btn-ghost btn-sm" id="servicesNextPage" ${servicePage === totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
    `;

      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => openEditModal(btn.dataset.id));
      });

      document.querySelectorAll(".history").forEach((btn) => {
        btn.addEventListener("click", () => showServiceHistory(btn.dataset.id));
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteService(btn.dataset.id));
      });

      document
        .getElementById("servicesPrevPage")
        ?.addEventListener("click", () => {
          servicePage -= 1;
          renderServices();
        });

      document
        .getElementById("servicesNextPage")
        ?.addEventListener("click", () => {
          servicePage += 1;
          renderServices();
        });
    }

    function getServiceRating(serviceId) {
      if (!db.ratings || !Array.isArray(db.ratings)) {
        return { average: 0, count: 0 };
      }

      const serviceRatings = db.ratings.filter(
        (r) => r.serviceId === serviceId,
      );
      if (serviceRatings.length === 0) {
        return { average: 0, count: 0 };
      }

      const average =
        serviceRatings.reduce((sum, r) => sum + r.rating, 0) /
        serviceRatings.length;
      return { average, count: serviceRatings.length };
    }

    function openAddModal() {
      if (!db.academicYear) {
        showToast(
          "Set the academic year in System Settings before adding services.",
        );
        return;
      }
      editingServiceId = null;
      modalTitle.textContent = "Add Service";
      modalSub.textContent = "Create a new service";
      modalSaveBtn.textContent = "Save Service";
      serviceForm.reset();
      renderServicePricingFields("");
      serviceModal.classList.add("open");
    }

    function openEditModal(serviceId) {
      const service = db.services.find((s) => s.id === serviceId);
      if (!service) return;

      editingServiceId = serviceId;
      modalTitle.textContent = "Edit Service";
      modalSub.textContent = "Update service information";
      modalSaveBtn.textContent = "Update Service";

      document.getElementById("formName").value = service.name;
      document.getElementById("formDescription").value =
        service.description || "";
      document.getElementById("formCategory").value = service.category;

      renderServicePricingFields(service.name);
      serviceModal.classList.add("open");
    }

    function closeModal() {
      serviceModal.classList.remove("open");
      editingServiceId = null;
      serviceForm.reset();
      const pricingFields = document.getElementById("servicePricingFields");
      if (pricingFields) pricingFields.innerHTML = "";
    }

    function saveService() {
      const name = document.getElementById("formName").value.trim();
      const description = document
        .getElementById("formDescription")
        .value.trim();
      const category = document.getElementById("formCategory").value;

      if (!name || !category) {
        showToast("Please fill in all required fields");
        return;
      }

      if (editingServiceId) {
        applyPricingEditsFromModal();
        const serviceIndex = db.services.findIndex(
          (s) => s.id === editingServiceId,
        );
        if (serviceIndex !== -1) {
          const oldService = db.services[serviceIndex];
          db.services[serviceIndex] = {
            ...oldService,
            name,
            description,
            price: Number(oldService.price || 0),
            category,
            updatedAt: new Date().toISOString(),
          };
          addServiceHistory(editingServiceId, "edited", `Changed: ${name}`);
        }
        showToast("Service updated successfully");
      } else {
        const newService = {
          id: generateServiceId(),
          name,
          description,
          price: 0,
          category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.services.push(newService);
        addServiceHistory(newService.id, "added", `Created: ${name}`);
        showToast("Service added successfully");
      }

      saveDB(db);
      closeModal();
      renderServices();
    }

    function deleteService(serviceId) {
      const service = db.services.find((s) => s.id === serviceId);
      if (!service) return;

      if (confirm(`Delete "${service.name}"? This action cannot be undone.`)) {
        db.services = db.services.filter((s) => s.id !== serviceId);
        addServiceHistory(serviceId, "deleted", `Removed: ${service.name}`);
        saveDB(db);
        showToast("Service deleted successfully");
        renderServices();
      }
    }

    function showServiceHistory(serviceId) {
      const service = db.services.find((s) => s.id === serviceId);
      const historyList = document.getElementById("historyList");

      if (!db.archives || !db.archives.serviceHistory) {
        historyList.innerHTML =
          '<div class="empty-history">No history recorded for this service</div>';
        historyModal.classList.add("open");
        return;
      }

      const serviceHistory = db.archives.serviceHistory.filter(
        (h) => h.serviceId === serviceId,
      );

      if (serviceHistory.length === 0) {
        historyList.innerHTML =
          '<div class="empty-history">No history recorded for this service</div>';
      } else {
        historyList.innerHTML = `
        <div class="history-list">
          ${serviceHistory
            .map(
              (item) => `
            <div class="history-item ${item.action}">
              <div class="history-item-action">${item.action.toUpperCase()}</div>
              <div class="history-item-time">${formatDate(item.timestamp)}</div>
              ${item.details ? `<div class="history-item-details">${item.details}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      `;
      }

      historyModal.classList.add("open");
    }

    function showToast(message) {
      const toast = document.getElementById("toast");
      const toastMsg = document.getElementById("toastMsg");
      toastMsg.textContent = message;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }

    function persistPricing() {
      if (!window.UPressPricing || !pricingState) return;
      UPressPricing.mirrorPublicPricing(pricingState);
    }

    function getServicePricingKey(serviceName) {
      const name = String(serviceName || "")
        .trim()
        .toLowerCase();
      if (name === "printing") return "printing";
      if (name === "binding") return "binding";
      if (name === "lanyards" || name === "lanyard") return "lanyards";
      if (name.startsWith("mug printing")) return "mugs";
      if (name.startsWith("id printing")) return "idAccessories";
      return null;
    }

    function collectPricingFromMiniForm(root) {
      if (!window.UPressPricing || !root) return null;
      const out = UPressPricing.getDefaultPricing();
      root.querySelectorAll("[data-pricing-path]").forEach((inp) => {
        const pathStr = inp.getAttribute("data-pricing-path");
        if (!pathStr) return;
        const parts = pathStr.split(".");
        let cur = out;
        for (let i = 0; i < parts.length - 1; i++) {
          const k = parts[i];
          if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
          cur = cur[k];
        }
        cur[parts[parts.length - 1]] = parseFloat(inp.value) || 0;
      });
      return out;
    }

    function renderServicePricingFields(serviceName) {
      const container = document.getElementById("servicePricingFields");
      if (!container) return;
      container.innerHTML = "";

      if (!window.UPressPricing) return;
      pricingState = UPressPricing.normalizePricing(pricingState);
      const key = getServicePricingKey(serviceName);
      if (!key) return;

      const p = pricingState;
      const get = (path) => UPressPricing.getByPath(p, path);

      if (key === "printing") {
        const rows = [
          [
            "Short",
            "printing.shortBw",
            "printing.shortColor",
            ["printing", "shortBw"],
            ["printing", "shortColor"],
          ],
          [
            "A4",
            "printing.a4Bw",
            "printing.a4Color",
            ["printing", "a4Bw"],
            ["printing", "a4Color"],
          ],
          [
            "A3",
            "printing.a3Bw",
            "printing.a3Color",
            ["printing", "a3Bw"],
            ["printing", "a3Color"],
          ],
          [
            "Long",
            "printing.longBw",
            "printing.longColor",
            ["printing", "longBw"],
            ["printing", "longColor"],
          ],
          [
            "Legal",
            "printing.legalBw",
            "printing.legalColor",
            ["printing", "legalBw"],
            ["printing", "legalColor"],
          ],
          [
            "Custom",
            "printing.customBw",
            "printing.customColor",
            ["printing", "customBw"],
            ["printing", "customColor"],
          ],
        ];

        container.innerHTML = `
        <div class="service-pricing-block">
          <div class="service-pricing-title">Printing details</div>
          <div class="service-pricing-sub">Per-page BW/Color prices and image surcharge.</div>
          <div class="pricing-print-table" role="group" aria-label="Printing per page">
            <div class="pricing-print-row pricing-print-row--head">
              <span>Size</span><span>B&amp;W</span><span>Color</span>
            </div>
            ${rows
              .map(
                ([label, bwPathStr, cPathStr, bwPath, cPath]) => `
              <div class="pricing-print-row">
                <span class="pricing-print-size">${label}</span>
                <div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="${bwPathStr}" value="${Number(get(bwPath) || 0).toFixed(2)}" step="0.5" min="0" /></div>
                <div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="${cPathStr}" value="${Number(get(cPath) || 0).toFixed(2)}" step="0.5" min="0" /></div>
              </div>
            `,
              )
              .join("")}
          </div>
          <div class="pricing-surcharge-row">
            <span class="pricing-surcharge-label">Image surcharge</span>
            <div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="printing.surcharge" value="${Number(get(["printing", "surcharge"]) || 0).toFixed(2)}" step="0.5" min="0" /></div>
          </div>
        </div>
      `;
        return;
      }

      if (key === "binding") {
        container.innerHTML = `
        <div class="service-pricing-block">
          <div class="service-pricing-title">Binding details</div>
          <div class="service-pricing-sub">Flat fee per binding type.</div>
          <div class="pricing-mini-grid">
            <div class="pricing-mini-field"><span class="pricing-mini-label">Soft</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="binding.softBind" value="${Number(get(["binding", "softBind"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Hard</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="binding.hardBind" value="${Number(get(["binding", "hardBind"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Ring</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="binding.ringBind" value="${Number(get(["binding", "ringBind"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Spiral</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="binding.spiralBind" value="${Number(get(["binding", "spiralBind"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
          </div>
        </div>
      `;
        return;
      }

      if (key === "lanyards") {
        container.innerHTML = `
        <div class="service-pricing-block">
          <div class="service-pricing-title">Lanyard details</div>
          <div class="service-pricing-sub">Per-piece pricing.</div>
          <div class="pricing-mini-grid pricing-mini-grid--3">
            <div class="pricing-mini-field"><span class="pricing-mini-label">Official</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="lanyards.official" value="${Number(get(["lanyards", "official"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Department</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="lanyards.department" value="${Number(get(["lanyards", "department"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Custom</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="lanyards.custom" value="${Number(get(["lanyards", "custom"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
          </div>
        </div>
      `;
        return;
      }

      if (key === "idAccessories") {
        container.innerHTML = `
        <div class="service-pricing-block">
          <div class="service-pricing-title">ID printing details</div>
          <div class="service-pricing-sub">Per-request pricing (New, Lost, Damaged, Renewal).</div>
          <div class="pricing-mini-grid pricing-mini-grid--2">
            <div class="pricing-mini-field"><span class="pricing-mini-label">New</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="idAccessories.newId" value="${Number(get(["idAccessories", "newId"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Lost</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="idAccessories.lostId" value="${Number(get(["idAccessories", "lostId"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Damaged</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="idAccessories.damagedId" value="${Number(get(["idAccessories", "damagedId"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Renewal</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="idAccessories.renewalId" value="${Number(get(["idAccessories", "renewalId"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
          </div>
        </div>
      `;
        return;
      }

      if (key === "mugs") {
        container.innerHTML = `
        <div class="service-pricing-block">
          <div class="service-pricing-title">Mug printing details</div>
          <div class="service-pricing-sub">WMSU standard and customization options.</div>
          <div class="pricing-mini-grid">
            <div class="pricing-mini-field"><span class="pricing-mini-label">WMSU standard</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="mugs.wmsuLogo" value="${Number(get(["mugs", "wmsuLogo"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Department</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="mugs.department" value="${Number(get(["mugs", "department"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">Customization</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="mugs.photo" value="${Number(get(["mugs", "photo"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
            <div class="pricing-mini-field"><span class="pricing-mini-label">15oz add-on</span><div class="price-input-wrap pricing-inp-compact"><span class="price-currency">₱</span><input type="number" class="form-input" data-pricing-path="mugs.largeSizeAddon" value="${Number(get(["mugs", "largeSizeAddon"]) || 0).toFixed(2)}" step="0.5" min="0" /></div></div>
          </div>
        </div>
      `;
        return;
      }
    }

    function applyPricingEditsFromModal() {
      const root = document.getElementById("servicePricingFields");
      if (!root || !window.UPressPricing) return;
      const patch = collectPricingFromMiniForm(root);
      if (!patch) return;
      pricingState = UPressPricing.normalizePricing(patch);
      persistPricing();
    }

    pageContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Services Management</h1>
        <p class="page-sub">Manage all system services and track ratings</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="addServiceBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Service
        </button>
      </div>
    </div>
    <div class="list-toolbar">
      <label class="list-search" for="servicesSearchInput">
        <span>Search services</span>
        <input type="search" id="servicesSearchInput" class="list-search__input" placeholder="Search name, category, description, or price" />
      </label>
      <div class="list-toolbar__count" id="servicesResultCount">0 services</div>
    </div>
    <div id="servicesSection"></div>
  `;

    document
      .getElementById("addServiceBtn")
      .addEventListener("click", openAddModal);
    document
      .getElementById("servicesSearchInput")
      .addEventListener("input", (event) => {
        serviceSearchQuery = event.target.value;
        servicePage = 1;
        renderServices();
      });
    modalCloseBtn.addEventListener("click", closeModal);
    modalCancelBtn.addEventListener("click", closeModal);
    modalSaveBtn.addEventListener("click", saveService);
    historyCloseBtn.addEventListener("click", () => {
      historyModal.classList.remove("open");
    });
    serviceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveService();
    });

    serviceModal.addEventListener("click", (e) => {
      if (e.target === serviceModal) {
        closeModal();
      }
    });

    historyModal.addEventListener("click", (e) => {
      if (e.target === historyModal) {
        historyModal.classList.remove("open");
      }
    });

    renderServices();
  }

  init();
})();
