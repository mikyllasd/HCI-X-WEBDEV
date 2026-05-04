(function () {
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

  function renderServices() {
    const servicesSection = document.getElementById("servicesSection");
    if (!servicesSection) return;

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

    // Group services by category
    const categories = {
      printing: [],
      merchandise: [],
      special: [],
    };

    db.services.forEach((service) => {
      if (categories[service.category]) {
        categories[service.category].push(service);
      }
    });

    let html = "";

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
                    <div class="service-price">₱${parseFloat(service.price).toFixed(2)}</div>
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

    servicesSection.innerHTML = html;

    // Attach event listeners
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll(".history").forEach((btn) => {
      btn.addEventListener("click", () => showServiceHistory(btn.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteService(btn.dataset.id));
    });
  }

  function getServiceRating(serviceId) {
    if (!db.ratings || !Array.isArray(db.ratings)) {
      return { average: 0, count: 0 };
    }

    const serviceRatings = db.ratings.filter((r) => r.serviceId === serviceId);
    if (serviceRatings.length === 0) {
      return { average: 0, count: 0 };
    }

    const average =
      serviceRatings.reduce((sum, r) => sum + r.rating, 0) /
      serviceRatings.length;
    return { average, count: serviceRatings.length };
  }

  function openAddModal() {
    editingServiceId = null;
    modalTitle.textContent = "Add Service";
    modalSub.textContent = "Create a new service";
    modalSaveBtn.textContent = "Save Service";
    serviceForm.reset();
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
    document.getElementById("formPrice").value = service.price;
    document.getElementById("formCategory").value = service.category;

    serviceModal.classList.add("open");
  }

  function closeModal() {
    serviceModal.classList.remove("open");
    editingServiceId = null;
    serviceForm.reset();
  }

  function saveService() {
    const name = document.getElementById("formName").value.trim();
    const description = document.getElementById("formDescription").value.trim();
    const price = document.getElementById("formPrice").value;
    const category = document.getElementById("formCategory").value;

    if (!name || !price || !category) {
      showToast("Please fill in all required fields");
      return;
    }

    if (editingServiceId) {
      // Update existing service
      const serviceIndex = db.services.findIndex(
        (s) => s.id === editingServiceId,
      );
      if (serviceIndex !== -1) {
        const oldService = db.services[serviceIndex];
        db.services[serviceIndex] = {
          ...oldService,
          name,
          description,
          price: parseFloat(price),
          category,
          updatedAt: new Date().toISOString(),
        };
        addServiceHistory(editingServiceId, "edited", `Changed: ${name}`);
      }
      showToast("Service updated successfully");
    } else {
      // Create new service
      const newService = {
        id: generateServiceId(),
        name,
        description,
        price: parseFloat(price),
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

  // Render initial page
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
    <div id="servicesSection"></div>
  `;

  document
    .getElementById("addServiceBtn")
    .addEventListener("click", openAddModal);
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

  // Close modal when clicking outside
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
})();
