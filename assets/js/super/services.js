const serviceData = [
  {
    id: 1,
    name: "Priority Printing",
    description: "Same-day print service for urgent requests.",
    price: "₱120.00",
  },
];

let activeServiceId = null;

function renderServices() {
  const tableBody = document.getElementById("serviceTableBody");
  tableBody.innerHTML = "";

  if (!serviceData.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No services have been added yet.</td>
      </tr>
    `;
    return;
  }

  serviceData.forEach((service) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${service.name}</td>
      <td>${service.description}</td>
      <td>${service.price}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" data-action="edit" data-id="${service.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${service.id}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function openAddServiceModal() {
  activeServiceId = null;
  setModalTitle("Add Service");
  clearServiceForm();
  toggleServiceModal(true);
}

function openEditServiceModal(id) {
  const service = serviceData.find((item) => item.id === Number(id));
  if (!service) return;

  activeServiceId = service.id;
  setModalTitle("Edit Service");
  fillServiceForm(service);
  toggleServiceModal(true);
}

function deleteService(id) {
  const index = serviceData.findIndex((item) => item.id === Number(id));
  if (index === -1) return;

  serviceData.splice(index, 1);
  renderServices();
}

function handleServiceActions(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit") {
    openEditServiceModal(id);
  }

  if (action === "delete") {
    deleteService(id);
  }
}

function setModalTitle(title) {
  const titleElement = document.getElementById("serviceModalTitle");
  if (titleElement) {
    titleElement.textContent = title;
  }
}

function clearServiceForm() {
  const form = document.getElementById("serviceForm");
  if (!form) return;
  form.reset();
}

function fillServiceForm(service) {
  const nameInput = document.getElementById("serviceName");
  const descriptionInput = document.getElementById("serviceDescription");
  const priceInput = document.getElementById("servicePrice");

  if (nameInput) nameInput.value = service.name;
  if (descriptionInput) descriptionInput.value = service.description;
  if (priceInput) priceInput.value = service.price;
}

function toggleServiceModal(show) {
  const modal = document.getElementById("serviceModal");
  if (!modal) return;

  modal.classList.toggle("open", show);
  modal.setAttribute("aria-hidden", show ? "false" : "true");
}

function handleServiceSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("serviceName").value.trim();
  const description = document
    .getElementById("serviceDescription")
    .value.trim();
  const price = document.getElementById("servicePrice").value.trim();

  if (!name || !description || !price) {
    return;
  }

  if (activeServiceId) {
    const service = serviceData.find((item) => item.id === activeServiceId);
    if (service) {
      service.name = name;
      service.description = description;
      service.price = price;
    }
  } else {
    serviceData.push({
      id: Date.now(),
      name,
      description,
      price,
    });
  }

  toggleServiceModal(false);
  renderServices();
}

function setupServiceListeners() {
  document
    .getElementById("addServiceBtn")
    .addEventListener("click", openAddServiceModal);
  document
    .getElementById("closeServiceModal")
    .addEventListener("click", () => toggleServiceModal(false));
  document
    .getElementById("cancelServiceBtn")
    .addEventListener("click", () => toggleServiceModal(false));
  document
    .getElementById("serviceModalBackdrop")
    .addEventListener("click", () => toggleServiceModal(false));
  document
    .getElementById("serviceTableBody")
    .addEventListener("click", handleServiceActions);
  document
    .getElementById("serviceForm")
    .addEventListener("submit", handleServiceSubmit);
}

function initServicesPage() {
  renderServices();
  setupServiceListeners();
}

window.addEventListener("DOMContentLoaded", initServicesPage);
