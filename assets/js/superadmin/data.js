"use strict";

/* ==================================================
   CENTRALIZED DATA MODULE — AppData
   Single source of truth for the entire app.
   localStorage keys: "users", "services", "orders", "currentUser"
   ================================================== */

const AppData = {
  /* ─── Users ──────────────────────────────────────── */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem("users") || "[]");
    } catch {
      return [];
    }
  },
  saveUsers(u) {
    localStorage.setItem("users", JSON.stringify(u));
  },

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  findUserByEmail(email) {
    return this.getUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  },

  updateUser(id, patch) {
    const users = this.getUsers();
    const i = users.findIndex((u) => u.id === id || u.email === id);
    if (i !== -1) {
      users[i] = { ...users[i], ...patch };
      this.saveUsers(users);
      return true;
    }
    return false;
  },

  /* ─── Auth ───────────────────────────────────────── */
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  },
  setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  },
  clearCurrentUser() {
    localStorage.removeItem("currentUser");
  },

  /* ─── Orders ─────────────────────────────────────── */
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem("orders") || "[]");
    } catch {
      return [];
    }
  },
  saveOrders(o) {
    localStorage.setItem("orders", JSON.stringify(o));
  },

  addOrder(orderData) {
    const orders = this.getOrders();
    const orderId = "ORD-" + Date.now();
    const dateStr = new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const amount = parseFloat(orderData.total || orderData.amount || 0);
    const order = {
      orderId,
      id: orderId,
      email: orderData.email || this.getCurrentUser()?.email || "",
      service: orderData.service || "",
      desc: orderData.desc || "",
      amount,
      total: amount.toFixed(2),
      payment: orderData.paymentMethod || orderData.payment || "Not selected",
      paymentMethod:
        orderData.paymentMethod || orderData.payment || "Not selected",
      status: "pending",
      date: dateStr,
      dateOrdered: dateStr,
      customer: orderData.customer || {},
      addons: orderData.addons || [],
      refNumber: orderData.refNumber || null,
    };
    orders.unshift(order);
    this.saveOrders(orders);
    return orderId;
  },

  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const i = orders.findIndex(
      (o) => o.orderId === orderId || o.id === orderId,
    );
    if (i !== -1) {
      orders[i].status = status.toLowerCase();
      this.saveOrders(orders);
    }
  },

  /* ─── Services ───────────────────────────────────── */
  getServices() {
    try {
      return JSON.parse(localStorage.getItem("services") || "[]");
    } catch {
      return [];
    }
  },
  saveServices(s) {
    localStorage.setItem("services", JSON.stringify(s));
  },

  nextServiceId() {
    const svcs = this.getServices();
    return svcs.length ? Math.max(...svcs.map((s) => s.id)) + 1 : 1;
  },

  addService(svc) {
    const svcs = this.getServices();
    svc = { ...svc, id: this.nextServiceId() };
    svcs.push(svc);
    this.saveServices(svcs);
    return svc;
  },

  updateService(id, patch) {
    const svcs = this.getServices();
    const i = svcs.findIndex((s) => s.id === id);
    if (i !== -1) {
      svcs[i] = { ...svcs[i], ...patch };
      this.saveServices(svcs);
    }
  },

  deleteService(id) {
    this.saveServices(this.getServices().filter((s) => s.id !== id));
  },

  /* ─── Seed ───────────────────────────────────────── */
  seedIfEmpty() {
    if (!this.getServices().length) {
      this.saveServices([
        {
          id: 1,
          name: "Printing",
          category: "printing",
          desc: "Standard document and photo printing services.",
          price: 5,
          options: [
            { name: "Short (per page)", price: 5 },
            { name: "Long (per page)", price: 7 },
          ],
        },
        {
          id: 2,
          name: "Binding",
          category: "binding",
          desc: "Spiral and hard cover binding for reports.",
          price: 80,
          options: [
            { name: "Spiral", price: 80 },
            { name: "Hard Cover", price: 150 },
          ],
        },
        {
          id: 3,
          name: "Mug Printing",
          category: "mug-printing",
          desc: "Custom printed ceramic mugs.",
          price: 350,
          options: [
            { name: "White Mug", price: 350 },
            { name: "Color Mug", price: 450 },
          ],
        },
      ]);
    }
    if (!this.getUsers().length) {
      this.saveUsers([
        {
          id: "USR-001",
          name: "Juan Dela Cruz",
          email: "juan.delacruz@wmsu.edu.ph",
          password: "student123",
          phone: "09171234567",
          college: "College of Engineering",
          course: "BS Computer Engineering",
          year: "3rd Year",
          role: "student",
          registrationDate: "2025-03-01",
          lastCOR: "2025-03-01",
          verificationStatus: "approved",
          studentId: "2024-00124",
        },
        {
          id: "USR-002",
          name: "Maria Santos",
          email: "maria.santos@wmsu.edu.ph",
          password: "student123",
          phone: "09182345678",
          college: "College of Arts and Sciences",
          course: "BA Psychology",
          year: "3rd Year",
          role: "student",
          registrationDate: "2025-06-15",
          lastCOR: "2025-06-15",
          verificationStatus: "pending",
          studentId: "2024-00123",
        },
        {
          id: "USR-003",
          name: "Pedro Reyes",
          email: "pedro.reyes@wmsu.edu.ph",
          password: "student123",
          phone: "09193456789",
          college: "College of Education",
          course: "BSEd Math",
          year: "2nd Year",
          role: "student",
          registrationDate: "2025-09-20",
          lastCOR: "2025-09-20",
          verificationStatus: "approved",
          studentId: "2024-00125",
        },
        {
          id: "USR-004",
          name: "Anna Lopez",
          email: "anna.lopez@wmsu.edu.ph",
          password: "student123",
          phone: "09204567890",
          college: "College of Business Administration",
          course: "BS Accountancy",
          year: "4th Year",
          role: "student",
          registrationDate: "2025-01-10",
          lastCOR: "2025-01-10",
          verificationStatus: "approved",
          studentId: "2024-00126",
        },
        {
          id: "USR-005",
          name: "Carlo Garcia",
          email: "carlo.garcia@wmsu.edu.ph",
          password: "student123",
          phone: "09215678901",
          college: "College of Engineering",
          course: "BS Civil Engineering",
          year: "1st Year",
          role: "student",
          registrationDate: "2024-12-05",
          lastCOR: "2024-12-05",
          verificationStatus: "rejected",
          studentId: "2024-00127",
        },
      ]);
    }
    if (!this.getOrders().length) {
      const fmt = (d) =>
        new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      const today = fmt(new Date());
      this.saveOrders([
        {
          orderId: "ORD-2026-101",
          id: "ORD-2026-101",
          email: "juan.delacruz@wmsu.edu.ph",
          service: "Printing",
          desc: "1 copy — Short (B&W) × 12 pages",
          amount: 60,
          total: "60.00",
          payment: "Not selected",
          paymentMethod: "Not selected",
          status: "pending",
          date: today,
          dateOrdered: today,
          customer: {},
          addons: [],
        },
        {
          orderId: "ORD-2026-102",
          id: "ORD-2026-102",
          email: "juan.delacruz@wmsu.edu.ph",
          service: "Binding",
          desc: "1 × Spiral",
          amount: 150,
          total: "150.00",
          payment: "Online Payment",
          paymentMethod: "Online Payment",
          status: "processing",
          date: "Apr 4, 2026",
          dateOrdered: "Apr 4, 2026",
          customer: {},
          addons: [],
        },
        {
          orderId: "ORD-2026-103",
          id: "ORD-2026-103",
          email: "anna.lopez@wmsu.edu.ph",
          service: "Lanyards",
          desc: "2 × WMSU Official",
          amount: 300,
          total: "300.00",
          payment: "Pay Onsite",
          paymentMethod: "Pay Onsite",
          status: "ready",
          date: "Apr 3, 2026",
          dateOrdered: "Apr 3, 2026",
          customer: {},
          addons: [],
        },
        {
          orderId: "ORD-2026-104",
          id: "ORD-2026-104",
          email: "carlo.garcia@wmsu.edu.ph",
          service: "Mug Printing",
          desc: "5 × WMSU Logo Mug (Standard)",
          amount: 1000,
          total: "1000.00",
          payment: "Online Payment",
          paymentMethod: "Online Payment",
          status: "completed",
          date: "Apr 1, 2026",
          dateOrdered: "Apr 1, 2026",
          customer: {},
          addons: [],
        },
        {
          orderId: "ORD-2026-005",
          id: "ORD-2026-005",
          email: "carlo.garcia@wmsu.edu.ph",
          service: "Merchandise",
          desc: "3 × WMSU T-Shirt (Large)",
          amount: 750,
          total: "750.00",
          payment: "Pay Onsite",
          paymentMethod: "Pay Onsite",
          status: "completed",
          date: "Feb 18, 2026",
          dateOrdered: "Feb 18, 2026",
          customer: {},
          addons: [],
        },
      ]);
    }
  },
};

AppData.seedIfEmpty();
window.AppData = AppData;

/* ─── Backward-compatible aliases ──────────────────────────────────
   Existing superadmin page scripts reference ORDERS, ACCOUNTS, etc.
   These getters pull live data from localStorage on every access.
   ────────────────────────────────────────────────────────────────── */
Object.defineProperties(window, {
  ORDERS: {
    get() {
      return AppData.getOrders();
    },
    configurable: true,
  },
  ACCOUNTS: {
    get() {
      return AppData.getUsers().filter((u) => !u.role || u.role === "student");
    },
    configurable: true,
  },
  VERIFICATION_REQUESTS: {
    get() {
      return AppData.getUsers()
        .filter((u) => !u.role || u.role === "student")
        .map((u) => ({
          id: u.id,
          name: u.name,
          studentId: u.studentId || u.email,
          program: u.course || "—",
          yearLevel: u.year || "—",
          email: u.email,
          submitted: u.registrationDate
            ? new Date(u.registrationDate).toLocaleString("en-US")
            : "—",
          status: u.verificationStatus || "pending",
        }));
    },
    configurable: true,
  },
  CREATED_SERVICES: {
    get() {
      return AppData.getServices();
    },
    configurable: true,
  },
});
