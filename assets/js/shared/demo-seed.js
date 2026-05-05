/**
 * Central demo dataset for UPRESSease — shared by:
 * - Superadmin / admin pages using getDB() (storage.js)
 * - Admin SPA (admin-dashboard.js): orders, verification, payments, accounts
 * - Staff portal (upressOrders via seedStaffWebOrdersIfEmpty)
 *
 * Keep order IDs, payment IDs, and emails consistent across sections.
 */
(function (global) {
  "use strict";

  const DEMO_ACADEMIC_YEAR = "2025-2026";

  const DEMO_VERIFICATION_REQUESTS = [
    {
      id: "VR-001",
      name: "Maria Santos",
      studentId: "2024-00123",
      program: "Computer Science",
      yearLevel: "3rd Year",
      email: "maria.santos@wmsu.edu.ph",
      submitted: "2026-05-04T10:00:00",
      status: "pending",
    },
    {
      id: "VR-002",
      name: "Juan Dela Cruz",
      studentId: "2024-00124",
      program: "Information Technology",
      yearLevel: "2nd Year",
      email: "juan.delacruz@wmsu.edu.ph",
      submitted: "2026-05-04T14:20:00",
      status: "pending",
    },
    {
      id: "VR-003",
      name: "Ana Reyes",
      studentId: "2024-00125",
      program: "Business Administration",
      yearLevel: "4th Year",
      email: "ana.reyes@wmsu.edu.ph",
      submitted: "2026-05-03T11:00:00",
      status: "approved",
    },
    {
      id: "VR-004",
      name: "Pedro Garcia",
      studentId: "2024-00126",
      program: "Engineering",
      yearLevel: "1st Year",
      email: "pedro.garcia@wmsu.edu.ph",
      submitted: "2026-05-02T09:30:00",
      status: "rejected",
    },
  ];

  /**
   * Admin dashboard orders (same logical rows as staff web queue + storage transactions).
   * Dates cluster on 2026-05-05 for daily performance charts; Feb rows widen yearly view.
   */
  const DEMO_ORDERS = [
    {
      id: "ORD-2026-101",
      email: "student@wmsu.edu.ph",
      service: "Printing",
      amount: 60,
      status: "pending",
      payment: "Not selected",
      date: "2026-05-05T08:05:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-102",
      email: "student@wmsu.edu.ph",
      service: "Binding",
      amount: 150,
      status: "processing",
      payment: "Online Payment",
      date: "2026-05-05T10:20:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-103",
      email: "student@wmsu.edu.ph",
      service: "Lanyards",
      amount: 300,
      status: "ready",
      payment: "Pay Onsite",
      date: "2026-05-05T13:10:00",
      order_type: "organization",
      order_org: "Computer Science Club",
    },
    {
      id: "ORD-2026-104",
      email: "student@wmsu.edu.ph",
      service: "Mug Printing",
      amount: 1000,
      status: "completed",
      payment: "Online Payment",
      date: "2026-05-05T15:40:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-110",
      email: "maria.santos@wmsu.edu.ph",
      service: "Printing",
      amount: 120,
      status: "completed",
      payment: "Online Payment",
      date: "2026-05-05T09:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-111",
      email: "juan.delacruz@wmsu.edu.ph",
      service: "Printing",
      amount: 90,
      status: "completed",
      payment: "Pay Onsite",
      date: "2026-05-05T11:30:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-112",
      email: "anna.lopez@wmsu.edu.ph",
      service: "Lanyards",
      amount: 450,
      status: "processing",
      payment: "Online Payment",
      date: "2026-05-05T14:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-113",
      email: "carlo.garcia@wmsu.edu.ph",
      service: "Merchandise",
      amount: 320,
      status: "ready",
      payment: "Pay Onsite",
      date: "2026-05-05T18:45:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-004",
      email: "anna.lopez@wmsu.edu.ph",
      service: "Lanyards",
      amount: 750,
      status: "paid",
      payment: "Online Payment",
      date: "2026-02-19T16:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-003",
      email: "pedro.reyes@wmsu.edu.ph",
      service: "Printing",
      amount: 170,
      status: "pending",
      payment: "Not selected",
      date: "2026-02-19T11:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-002",
      email: "maria.santos@wmsu.edu.ph",
      service: "Mug Printing",
      amount: 400,
      status: "processing",
      payment: "Pay Onsite",
      date: "2026-02-19T13:30:00",
      order_type: "individual",
    },
    {
      id: "ORD-2026-001",
      email: "juan.delacruz@wmsu.edu.ph",
      service: "Printing",
      amount: 150,
      status: "ready",
      payment: "Online Payment",
      date: "2026-02-19T10:00:00",
    },
    {
      id: "ORD-2026-005",
      email: "carlo.garcia@wmsu.edu.ph",
      service: "Merchandise",
      amount: 750,
      status: "completed",
      payment: "Pay Onsite",
      date: "2026-02-18T09:00:00",
    },
  ];

  const DEMO_PAYMENT_SUBMISSIONS = [
    {
      id: "PAY-2026-001",
      orderId: "ORD-2026-102",
      email: "student@wmsu.edu.ph",
      amount: 150,
      method: "Online Payment",
      reference: "GCash-78421",
      submitted: "2026-05-05",
      status: "pending",
      proofUrl: null,
    },
    {
      id: "PAY-2026-002",
      orderId: "ORD-2026-104",
      email: "student@wmsu.edu.ph",
      amount: 1000,
      method: "Online Payment",
      reference: "Maya-99132",
      submitted: "2026-05-05",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2026-003",
      orderId: "ORD-2026-004",
      email: "anna.lopez@wmsu.edu.ph",
      amount: 750,
      method: "Online Payment",
      reference: "GCash-55098",
      submitted: "2026-02-19",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2026-004",
      orderId: "ORD-2026-001",
      email: "juan.delacruz@wmsu.edu.ph",
      amount: 150,
      method: "Online Payment",
      reference: "BDO-34412",
      submitted: "2026-02-19",
      status: "pending",
      proofUrl: null,
    },
    {
      id: "PAY-2026-005",
      orderId: "ORD-2026-005",
      email: "carlo.garcia@wmsu.edu.ph",
      amount: 750,
      method: "Pay Onsite",
      reference: "Cash",
      submitted: "2026-02-18",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2026-006",
      orderId: "ORD-2026-002",
      email: "maria.santos@wmsu.edu.ph",
      amount: 400,
      method: "Pay Onsite",
      reference: "Cash",
      submitted: "2026-02-19",
      status: "rejected",
      proofUrl: null,
    },
    {
      id: "PAY-2026-007",
      orderId: "ORD-2026-110",
      email: "maria.santos@wmsu.edu.ph",
      amount: 120,
      method: "Online Payment",
      reference: "GCash-88301",
      submitted: "2026-05-05",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2026-008",
      orderId: "ORD-2026-112",
      email: "anna.lopez@wmsu.edu.ph",
      amount: 450,
      method: "Online Payment",
      reference: "GCash-22109",
      submitted: "2026-05-05",
      status: "pending",
      proofUrl: null,
    },
  ];

  const DEMO_ACCOUNTS = [
    {
      name: "Juan Dela Cruz",
      email: "juan.delacruz@wmsu.edu.ph",
      registrationDate: "2025-03-01",
      lastCOR: "2025-03-01",
    },
    {
      name: "Maria Santos",
      email: "maria.santos@wmsu.edu.ph",
      registrationDate: "2025-06-15",
      lastCOR: "2025-06-15",
    },
    {
      name: "Pedro Reyes",
      email: "pedro.reyes@wmsu.edu.ph",
      registrationDate: "2025-09-20",
      lastCOR: "2025-09-20",
    },
    {
      name: "Anna Lopez",
      email: "anna.lopez@wmsu.edu.ph",
      registrationDate: "2025-01-10",
      lastCOR: "2025-01-10",
    },
    {
      name: "Carlo Garcia",
      email: "carlo.garcia@wmsu.edu.ph",
      registrationDate: "2024-12-05",
      lastCOR: "2024-12-05",
    },
  ];

  const DEMO_SERVICES = [
    {
      id: "svc_demo_printing",
      name: "Printing",
      description: "Demo service — printing",
      price: 60,
      category: "printing",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_binding",
      name: "Binding",
      description: "Demo service — binding",
      price: 150,
      category: "printing",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_lanyards",
      name: "Lanyards",
      description: "Demo service — lanyards",
      price: 300,
      category: "merchandise",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_id",
      name: "ID Printing",
      description: "Demo service — ID printing",
      price: 0,
      category: "merchandise",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_mug",
      name: "Mug Printing",
      description: "Demo service — mugs",
      price: 500,
      category: "merchandise",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
  ];

  const DEMO_USERS = [
    {
      id: "user_demo_student",
      fullName: "Demo Student",
      email: "student@wmsu.edu.ph",
      username: "demostudent",
      role: "student",
      suspended: false,
      college: "College of Computing",
      course: "Information Technology",
      yearLevel: "2nd Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_maria",
      fullName: "Maria Santos",
      email: "maria.santos@wmsu.edu.ph",
      username: "msantos",
      role: "student",
      suspended: false,
      college: "College of Computing",
      course: "Computer Science",
      yearLevel: "3rd Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_juan",
      fullName: "Juan Dela Cruz",
      email: "juan.delacruz@wmsu.edu.ph",
      username: "juandc",
      role: "student",
      suspended: false,
      college: "College of Computing",
      course: "Information Technology",
      yearLevel: "2nd Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_anna",
      fullName: "Anna Lopez",
      email: "anna.lopez@wmsu.edu.ph",
      username: "alopez",
      role: "student",
      suspended: false,
      college: "College of Business",
      course: "Marketing Management",
      yearLevel: "4th Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_carlo",
      fullName: "Carlo Garcia",
      email: "carlo.garcia@wmsu.edu.ph",
      username: "cgarcia",
      role: "student",
      suspended: false,
      college: "College of Engineering",
      course: "Civil Engineering",
      yearLevel: "1st Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_pedro",
      fullName: "Pedro Reyes",
      email: "pedro.reyes@wmsu.edu.ph",
      username: "preyes",
      role: "student",
      suspended: false,
      college: "College of Computing",
      course: "Computer Science",
      yearLevel: "1st Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_staff",
      fullName: "Staff Demo",
      email: "staff@upress.demo",
      username: "staffdemo",
      role: "staff",
      suspended: false,
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_ana_reyes",
      fullName: "Ana Reyes",
      email: "ana.reyes@wmsu.edu.ph",
      username: "areyes",
      role: "student",
      suspended: false,
      college: "College of Business",
      course: "Business Administration",
      yearLevel: "4th Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_pedro_garcia",
      fullName: "Pedro Garcia",
      email: "pedro.garcia@wmsu.edu.ph",
      username: "pgarcia",
      role: "student",
      suspended: false,
      college: "College of Engineering",
      course: "Mechanical Engineering",
      yearLevel: "1st Year",
      createdAt: "2026-01-12T08:00:00.000Z",
    },
  ];

  const SERVICE_BY_NAME = Object.fromEntries(
    DEMO_SERVICES.map((s) => [s.name, s]),
  );

  function paymentTypeFromOrder(o) {
    const p = String(o.payment || "").toLowerCase();
    if (p.includes("online") || p.includes("gcash")) return "gcash";
    if (p.includes("onsite") || p.includes("cash") || p.includes("credit"))
      return "credit";
    return "other";
  }

  function toIsoDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  }

  function buildDemoTransactions() {
    return DEMO_ORDERS.map((o) => {
      const svc = SERVICE_BY_NAME[o.service] || DEMO_SERVICES[0];
      const sem = "2nd";
      return {
        id: `txn_${o.id}`,
        serviceId: svc.id,
        serviceName: o.service,
        amount: o.amount,
        category: svc.category,
        status: o.status,
        semester: sem,
        date: toIsoDate(o.date),
        academicYear: DEMO_ACADEMIC_YEAR,
        paymentType: paymentTypeFromOrder(o),
        paymentMethod: o.payment,
        email: o.email,
      };
    });
  }

  const DEMO_RATINGS = [
    {
      transactionId: "txn_ORD-2026-104",
      rating: 5,
      comment: "Excellent print quality.",
      createdAt: "2026-05-05T20:00:00.000Z",
    },
    {
      transactionId: "txn_ORD-2026-110",
      rating: 4,
      comment: "Fast turnaround.",
      createdAt: "2026-05-05T21:00:00.000Z",
    },
    {
      transactionId: "txn_ORD-2026-005",
      rating: 5,
      comment: "",
      createdAt: "2026-02-18T12:00:00.000Z",
    },
    {
      transactionId: "txn_ORD-2026-004",
      rating: 4,
      comment: "Good service.",
      createdAt: "2026-02-20T10:00:00.000Z",
    },
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getDemoDatabase() {
    return {
      academicYear: DEMO_ACADEMIC_YEAR,
      users: clone(DEMO_USERS),
      services: clone(DEMO_SERVICES),
      transactions: buildDemoTransactions(),
      ratings: clone(DEMO_RATINGS),
      archives: {},
      systemSettings: {
        maintenanceMode: false,
        policies: {},
      },
    };
  }

  function getAdminPortalSampleData() {
    return {
      verificationRequests: clone(DEMO_VERIFICATION_REQUESTS),
      orders: clone(DEMO_ORDERS),
      paymentSubmissions: clone(DEMO_PAYMENT_SUBMISSIONS),
      accounts: clone(DEMO_ACCOUNTS),
    };
  }

  const DISPLAY_NAMES = {
    "student@wmsu.edu.ph": "Demo Student",
    "maria.santos@wmsu.edu.ph": "Maria Santos",
    "juan.delacruz@wmsu.edu.ph": "Juan Dela Cruz",
    "anna.lopez@wmsu.edu.ph": "Anna Lopez",
    "carlo.garcia@wmsu.edu.ph": "Carlo Garcia",
    "pedro.reyes@wmsu.edu.ph": "Pedro Reyes",
    "ana.reyes@wmsu.edu.ph": "Ana Reyes",
    "pedro.garcia@wmsu.edu.ph": "Pedro Garcia",
  };

  function staffStatusFromAdmin(o) {
    const s = String(o.status || "").toLowerCase();
    if (s === "paid" || s === "completed") return "Completed";
    if (s === "ready") return "Ready";
    if (s === "processing") return "Processing";
    return "Pending";
  }

  function staffOrderFromDemoOrder(o) {
    const pay = DEMO_PAYMENT_SUBMISSIONS.find((p) => p.orderId === o.id);
    const isOnline = String(o.payment || "")
      .toLowerCase()
      .includes("online");
    const verified = pay && pay.status === "verified";
    const pendingPay = pay && pay.status === "pending";
    return {
      orderId: o.id,
      order_type: o.order_type || "individual",
      order_org: o.order_org || "",
      customer: {
        name: DISPLAY_NAMES[o.email] || o.email.split("@")[0],
      },
      service: o.service,
      total: o.amount,
      status: staffStatusFromAdmin(o),
      paymentMethod: o.payment,
      dateOrdered: o.date,
      refNumber: pay ? pay.reference : "—",
      desc: `${o.service} (demo)`,
      paymentVerified:
        verified ||
        (!isOnline && (o.status === "completed" || o.status === "paid")),
      paymentStatus: pay ? pay.status : "",
    };
  }

  function seedStaffWebOrdersIfEmpty() {
    const LS_ORDERS = "upressOrders";
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
    } catch {
      existing = [];
    }
    if (Array.isArray(existing) && existing.length > 0) return;
    const rows = DEMO_ORDERS.map(staffOrderFromDemoOrder);
    try {
      localStorage.setItem(LS_ORDERS, JSON.stringify(rows));
    } catch (e) {
      console.warn("Staff demo orders seed skipped:", e);
    }
  }

  global.UpressDemoSeed = {
    DEMO_ACADEMIC_YEAR,
    getDemoDatabase,
    getAdminPortalSampleData,
    seedStaffWebOrdersIfEmpty,
  };
})(typeof window !== "undefined" ? window : globalThis);
