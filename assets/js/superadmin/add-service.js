"use strict";

/* ==========================================================
   ADD SERVICE PAGE
   ========================================================== */

let optionRowCount = 1;
let editingServiceId = null;

/* ---------- Services Table ---------- */

function formatCategory(cat) {
  return cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderServicesTable() {
  const wrapper = document.getElementById("services-table-wrapper");
  if (!wrapper) return;

  if (!CREATED_SERVICES.length) {
    wrapper.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox" aria-hidden="true"></i>
        <p class="empty-state__title">No services yet</p>
        <p class="empty-state__sub">Use the form below to create your first service.</p>
      </div>`;
    if (typeof lucide !== "undefined") lucide.createIcons();
    return;
  }

  const rows = CREATED_SERVICES.map(
    (s) => `
    <tr>
      <td>${escHtml(s.name)}</td>
      <td>${escHtml(formatCategory(s.category))}</td>
      <td>₱${parseFloat(s.price).toFixed(2)}</td>
      <td>${s.options.length ? s.options.map((o) => escHtml(o.name)).join(", ") : "—"}</td>
      <td>
        <div class="svc-actions">
          <button class="btn-svc-edit" onclick="startEditService(${s.id})" aria-label="Edit ${escHtml(s.name)}">
            <i data-lucide="pencil" aria-hidden="true"></i> Edit
          </button>
          <button class="btn-svc-delete" onclick="deleteService(${s.id})" aria-label="Delete ${escHtml(s.name)}">
            <i data-lucide="trash-2" aria-hidden="true"></i> Delete
          </button>
        </div>
      </td>
    </tr>`,
  ).join("");

  wrapper.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Service Name</th>
          <th>Category</th>
          <th>Base Price</th>
          <th>Options</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function startEditService(id) {
  const svc = CREATED_SERVICES.find((s) => s.id === id);
  if (!svc) return;

  editingServiceId = id;

  const heading = document.getElementById("addSvc-heading");
  const subtitle = document.getElementById("addSvc-subtitle");
  const cardTitle = document.getElementById("form-card-title");
  const cardSub = document.getElementById("form-card-subtitle");
  const btnLabel = document.getElementById("svc-btn-label");

  if (heading) heading.textContent = "Edit Service";
  if (subtitle) subtitle.textContent = "Update the details for this service";
  if (cardTitle) cardTitle.textContent = "Edit Service Information";
  if (cardSub) cardSub.textContent = "Modify the details for this service";
  if (btnLabel) btnLabel.textContent = "Update Service";

  document.getElementById("svc-name").value = svc.name;
  document.getElementById("svc-category").value = svc.category;
  document.getElementById("svc-description").value = svc.desc || "";
  document.getElementById("svc-price").value = svc.price;

  const container = document.getElementById("options-container");
  container.innerHTML = "";
  optionRowCount = 0;

  const opts = svc.options.length ? svc.options : [{ name: "", price: "" }];
  opts.forEach((opt) => {
    const row = document.createElement("div");
    row.className = "option-row";
    row.dataset.index = optionRowCount++;
    row.innerHTML = `
      <input type="text"   class="form-input option-name"  value="${escHtml(opt.name)}" placeholder="Option name (e.g., Size: Small)" aria-label="Option name"/>
      <input type="number" class="form-input option-price" value="${opt.price !== "" ? opt.price : ""}" placeholder="Price" min="0" step="0.01" aria-label="Option price"/>
      <button type="button" class="option-remove${opts.length === 1 ? " hidden" : ""}" aria-label="Remove this option">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>`;
    container.appendChild(row);
    row.querySelector(".option-remove").addEventListener("click", () => {
      row.remove();
      updateOptionRemoveButtons();
    });
  });

  if (typeof lucide !== "undefined") lucide.createIcons();
  document
    .getElementById("service-form-card")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteService(id) {
  const svc = AppData.getServices().find((s) => s.id === id);
  if (!svc) return;
  AppData.deleteService(id);
  if (editingServiceId === id) resetToAddMode();
  renderServicesTable();
  showToast(`Service "${escHtml(svc.name)}" deleted.`);
}

function resetToAddMode() {
  editingServiceId = null;

  const heading = document.getElementById("addSvc-heading");
  const subtitle = document.getElementById("addSvc-subtitle");
  const cardTitle = document.getElementById("form-card-title");
  const cardSub = document.getElementById("form-card-subtitle");
  const btnLabel = document.getElementById("svc-btn-label");

  if (heading) heading.textContent = "Add New Service";
  if (subtitle)
    subtitle.textContent = "Create a new service offering for students";
  if (cardTitle) cardTitle.textContent = "Service Information";
  if (cardSub) cardSub.textContent = "Fill in the details for the new service";
  if (btnLabel) btnLabel.textContent = "Create Service";

  document.getElementById("svc-name").value = "";
  document.getElementById("svc-category").value = "";
  document.getElementById("svc-description").value = "";
  document.getElementById("svc-price").value = "";

  document.getElementById("options-container").innerHTML = `
    <div class="option-row" data-index="0">
      <input type="text"   class="form-input option-name"  placeholder="Option name (e.g., Size: Small)" aria-label="Option name"/>
      <input type="number" class="form-input option-price" placeholder="Price" min="0" step="0.01" aria-label="Option price"/>
      <button type="button" class="option-remove hidden" aria-label="Remove option">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>`;
  optionRowCount = 1;
  if (typeof lucide !== "undefined") lucide.createIcons();
}

/* ---------- Option Row Utilities ---------- */

function addServiceOption() {
  const container = document.getElementById("options-container");
  if (!container) return;

  const index = optionRowCount++;
  const row = document.createElement("div");
  row.className = "option-row";
  row.dataset.index = index;
  row.innerHTML = `
    <input type="text"   class="form-input option-name"  placeholder="Option name (e.g., Size: Small)" aria-label="Option name"/>
    <input type="number" class="form-input option-price" placeholder="Price" min="0" step="0.01" aria-label="Option price"/>
    <button type="button" class="option-remove" aria-label="Remove this option">
      <i data-lucide="x" aria-hidden="true"></i>
    </button>`;

  container.appendChild(row);
  updateOptionRemoveButtons();
  if (typeof lucide !== "undefined") lucide.createIcons();

  row.querySelector(".option-remove").addEventListener("click", () => {
    row.remove();
    updateOptionRemoveButtons();
  });
}

function updateOptionRemoveButtons() {
  const rows = document.querySelectorAll("#options-container .option-row");
  rows.forEach((r) => {
    const btn = r.querySelector(".option-remove");
    if (btn) btn.classList.toggle("hidden", rows.length === 1);
  });
}

/* ---------- Create / Update ---------- */

function handleCreateService() {
  const name = document.getElementById("svc-name")?.value.trim();
  const category = document.getElementById("svc-category")?.value;
  const price = document.getElementById("svc-price")?.value;

  if (!name) {
    alert("Please enter a Service Name.");
    document.getElementById("svc-name").focus();
    return;
  }
  if (!category) {
    alert("Please select a Category.");
    document.getElementById("svc-category").focus();
    return;
  }
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    alert("Please enter a valid Base Price.");
    document.getElementById("svc-price").focus();
    return;
  }

  const options = [];
  document.querySelectorAll("#options-container .option-row").forEach((row) => {
    const oName = row.querySelector(".option-name")?.value.trim();
    const oPrice = row.querySelector(".option-price")?.value;
    if (oName) options.push({ name: oName, price: parseFloat(oPrice) || 0 });
  });

  const desc = document.getElementById("svc-description")?.value.trim();

  if (editingServiceId !== null) {
    AppData.updateService(editingServiceId, {
      name,
      category,
      desc,
      price: parseFloat(price),
      options,
    });
    showToast(`Service "${escHtml(name)}" updated successfully!`);
  } else {
    AppData.addService({
      name,
      category,
      desc,
      price: parseFloat(price),
      options,
    });
    showToast(`Service "${escHtml(name)}" created successfully!`);
  }

  resetToAddMode();
  renderServicesTable();
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderServicesTable();

  document
    .getElementById("add-option-btn")
    ?.addEventListener("click", addServiceOption);

  document
    .querySelector("#options-container .option-remove")
    ?.addEventListener("click", function () {
      this.closest(".option-row")?.remove();
      updateOptionRemoveButtons();
    });

  document
    .getElementById("svc-create-btn")
    ?.addEventListener("click", handleCreateService);
  document
    .getElementById("svc-cancel-btn")
    ?.addEventListener("click", resetToAddMode);
});
