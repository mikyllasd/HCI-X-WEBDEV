(function () {
  const db = getDB();
  const servicesBody = document.getElementById("pricingServicesBody");
  const serviceCountEl = document.getElementById("pricingServiceCount");
  const categoryCountEl = document.getElementById("pricingCategoryCount");
  const savedCountEl = document.getElementById("pricingSavedCount");
  const emptyState = document.getElementById("pricingEmptyState");

  let savedCount = 0;

  function getServices() {
    return (db.services || []).map((service) => ({
      ...service,
      name: String(service.name || service.serviceName || "Untitled"),
      category: String(service.category || "General"),
      price: Number(service.price || 0),
    }));
  }

  function updateSummary() {
    const services = getServices();
    const categories = Array.from(
      new Set(services.map((service) => service.category)),
    ).filter(Boolean);
    if (serviceCountEl) serviceCountEl.textContent = services.length;
    if (categoryCountEl) categoryCountEl.textContent = categories.length;
    if (savedCountEl) savedCountEl.textContent = savedCount;
  }

  function renderServices() {
    const services = getServices();
    if (!servicesBody) return;
    if (services.length === 0) {
      servicesBody.innerHTML = "";
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");
    servicesBody.innerHTML = services
      .map(
        (service) => `
        <tr data-service-id="${service.id}">
          <td>${service.name}</td>
          <td>${service.category}</td>
          <td><span class="pricing-price-display">₱${service.price.toFixed(2)}</span><input class="form-input pricing-edit-input hidden" type="number" min="0" step="0.01" value="${service.price.toFixed(2)}" aria-label="Price for ${service.name}" /></td>
          <td>
            <div class="pricing-action-group">
              <button type="button" class="btn btn--outline btn--sm" data-action="edit" data-id="${service.id}">Edit</button>
              <button type="button" class="btn btn--success btn--sm hidden" data-action="save" data-id="${service.id}">Save</button>
              <button type="button" class="btn btn--danger btn--sm hidden" data-action="cancel" data-id="${service.id}">Cancel</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("");
  }

  function saveServicePrice(id, value) {
    const price = Number(value);
    if (Number.isNaN(price) || price < 0) return false;
    const index = (db.services || []).findIndex((service) => service.id === id);
    if (index === -1) return false;
    db.services[index] = {
      ...db.services[index],
      price,
      updatedAt: new Date().toISOString(),
    };
    saveDB(db);
    savedCount += 1;
    return true;
  }

  function handleAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    const row = button.closest("tr");
    if (!row) return;

    const priceDisplay = row.querySelector(".pricing-price-display");
    const priceInput = row.querySelector(".pricing-edit-input");
    const editBtn = row.querySelector("button[data-action='edit']");
    const saveBtn = row.querySelector("button[data-action='save']");
    const cancelBtn = row.querySelector("button[data-action='cancel']");

    if (action === "edit") {
      if (priceDisplay) priceDisplay.classList.add("hidden");
      if (priceInput) priceInput.classList.remove("hidden");
      if (editBtn) editBtn.classList.add("hidden");
      if (saveBtn) saveBtn.classList.remove("hidden");
      if (cancelBtn) cancelBtn.classList.remove("hidden");
    }

    if (action === "save") {
      const value = priceInput?.value;
      if (value && saveServicePrice(id, value)) {
        renderServices();
        updateSummary();
      }
    }

    if (action === "cancel") {
      if (priceDisplay) priceDisplay.classList.remove("hidden");
      if (priceInput) priceInput.classList.add("hidden");
      if (editBtn) editBtn.classList.remove("hidden");
      if (saveBtn) saveBtn.classList.add("hidden");
      if (cancelBtn) cancelBtn.classList.add("hidden");
    }
  }

  function init() {
    renderServices();
    updateSummary();
    servicesBody?.addEventListener("click", handleAction);
  }

  window.addEventListener("DOMContentLoaded", init);
})();
