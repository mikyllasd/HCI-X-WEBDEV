const orders = [
  {
    id: "ORD-001",
    student: "Juan Dela Cruz",
    service: "Printing",
    total: 120,
    payment: "GCash",
    reference: "100123456789",
    status: "Pending"
  },
  {
    id: "ORD-002",
    student: "Maria Santos",
    service: "Mug Printing",
    total: 250,
    payment: "Cash",
    reference: "N/A",
    status: "Processing"
  },
  {
    id: "ORD-003",
    student: "Carlo Reyes",
    service: "Binding",
    total: 150,
    payment: "GCash",
    reference: "100987654321",
    status: "Ready"
  },
  {
    id: "ORD-004",
    student: "Ana Cruz",
    service: "Lanyard",
    total: 230,
    payment: "GCash",
    reference: "100555888999",
    status: "Completed"
  }
];

const accounts = [
  {
    name: "Juan Dela Cruz",
    email: "juan@wmsu.edu.ph",
    college: "College of Engineering",
    status: "Verified"
  },
  {
    name: "Maria Santos",
    email: "maria@wmsu.edu.ph",
    college: "College of Education",
    status: "Verified"
  },
  {
    name: "Carlo Reyes",
    email: "carlo@wmsu.edu.ph",
    college: "College of Arts and Sciences",
    status: "Pending"
  }
];

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email === "" || password === "") {
    alert("Please enter email and password.");
    return;
  }

  document.getElementById("login-page").style.display = "none";
  document.getElementById("admin-page").style.display = "flex";

  updateDashboard();
  renderOrders();
  renderPayments();
  renderAccounts();
  renderReports();
}

function logout() {
  document.getElementById("login-page").style.display = "flex";
  document.getElementById("admin-page").style.display = "none";
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".sidebar button").forEach(button => {
    button.classList.remove("active");
  });

  event.target.classList.add("active");
}

function updateDashboard() {
  const completedOrders = orders.filter(order => order.status === "Completed");
  const totalIncome = completedOrders.reduce((sum, order) => sum + order.total, 0);

  document.getElementById("total-orders").textContent = orders.length;
  document.getElementById("total-income").textContent = `₱${totalIncome.toFixed(2)}`;
  document.getElementById("today-orders").textContent = orders.length;
  document.getElementById("today-income").textContent = `₱${totalIncome.toFixed(2)}`;

  document.getElementById("pending-count").textContent =
    orders.filter(order => order.status === "Pending").length;

  document.getElementById("processing-count").textContent =
    orders.filter(order => order.status === "Processing").length;

  document.getElementById("ready-count").textContent =
    orders.filter(order => order.status === "Ready").length;

  document.getElementById("completed-count").textContent =
    orders.filter(order => order.status === "Completed").length;
}

function renderOrders() {
  const table = document.getElementById("orders-table");

  table.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.student}</td>
      <td>${order.service}</td>
      <td>₱${order.total.toFixed(2)}</td>
      <td>${order.payment}</td>
      <td><span class="status ${order.status}">${order.status}</span></td>
      <td>
        <select onchange="changeStatus('${order.id}', this.value)">
          <option ${order.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${order.status === "Processing" ? "selected" : ""}>Processing</option>
          <option ${order.status === "Ready" ? "selected" : ""}>Ready</option>
          <option ${order.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
    </tr>
  `).join("");
}

function changeStatus(orderId, newStatus) {
  const order = orders.find(item => item.id === orderId);

  if (order) {
    order.status = newStatus;
    updateDashboard();
    renderOrders();
    renderPayments();
    renderReports();
  }
}

function renderPayments() {
  const table = document.getElementById("payments-table");

  table.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.student}</td>
      <td>₱${order.total.toFixed(2)}</td>
      <td>${order.reference}</td>
      <td><span class="status ${order.status}">${order.status}</span></td>
    </tr>
  `).join("");
}

function renderAccounts() {
  const table = document.getElementById("accounts-table");

  table.innerHTML = accounts.map(account => `
    <tr>
      <td>${account.name}</td>
      <td>${account.email}</td>
      <td>${account.college}</td>
      <td>${account.status}</td>
    </tr>
  `).join("");
}

function renderReports() {
  const completedOrders = orders.filter(order => order.status === "Completed");
  const totalIncome = completedOrders.reduce((sum, order) => sum + order.total, 0);

  document.getElementById("report-income").textContent = `₱${totalIncome.toFixed(2)}`;
  document.getElementById("report-completed").textContent = completedOrders.length;
}




const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("staff-username").value.trim();
    const password = document.getElementById("staff-password").value;

    if (!username || !password) {
      alert("Please fill in all fields.");
      return;
    }

    // SAMPLE LOGIN LOGIC (replace with backend)
    if (username === "staff" && password === "staff123") {
      alert("Login successful!");
      window.location.href = "staff-dashboard.html";
    } else {
      alert("Invalid credentials.");
    }
  });
}

// ===================== STAFF DASHBOARD =====================

const navLinks = document.querySelectorAll('.nav-link[data-page]');
const pages    = document.querySelectorAll('.staff-page');

navLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.dataset.page;

    // Update active nav link
    navLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');

    // Show the matching page, hide others
    pages.forEach(page => {
      page.classList.toggle('active', page.id === 'page-' + target);
    });
  });
});