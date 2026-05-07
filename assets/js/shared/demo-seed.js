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
      studentId: "2025-00123",
      program: "Computer Science",
      yearLevel: "3rd Year",
      email: "maria.santos@wmsu.edu.ph",
      submitted: "2025-05-04T10:00:00",
      status: "pending",
    },
    {
      id: "VR-002",
      name: "Juan Dela Cruz",
      studentId: "2025-00124",
      program: "Information Technology",
      yearLevel: "2nd Year",
      email: "juan.delacruz@wmsu.edu.ph",
      submitted: "2025-05-04T14:20:00",
      status: "pending",
    },
    {
      id: "VR-003",
      name: "Ana Reyes",
      studentId: "2025-00125",
      program: "Business Administration",
      yearLevel: "4th Year",
      email: "ana.reyes@wmsu.edu.ph",
      submitted: "2025-05-03T11:00:00",
      status: "approved",
    },
    {
      id: "VR-004",
      name: "Pedro Garcia",
      studentId: "2025-00126",
      program: "Engineering",
      yearLevel: "1st Year",
      email: "pedro.garcia@wmsu.edu.ph",
      submitted: "2025-05-02T09:30:00",
      status: "rejected",
    },
  ];

  /**
   * Admin dashboard orders (same logical rows as staff web queue + storage transactions).
   * Dates cluster on 2026-01-05 for daily performance charts; Feb rows widen yearly view.
   */
  const DEMO_ORDERS = [
    {
      id: "ORD-2025-101",
      email: "student@wmsu.edu.ph",
      service: "Printing",
      amount: 60,
      status: "pending",
      payment: "Not selected",
      date: "2026-01-05T08:05:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-102",
      email: "student@wmsu.edu.ph",
      service: "Binding",
      amount: 150,
      status: "processing",
      payment: "Online Payment",
      date: "2026-01-05T10:20:00",
      order_type: "individual",
    },
    {
      id: "ORG-2025-103",
      email: "student@wmsu.edu.ph",
      service: "Lanyards",
      amount: 300,
      status: "ready",
      payment: "Pay Onsite",
      date: "2026-01-05T13:10:00",
      order_type: "organization",
      order_org: "Computer Science Club",
    },
    {
      id: "ORD-2025-104",
      email: "student@wmsu.edu.ph",
      service: "Mug Printing",
      amount: 1000,
      status: "completed",
      payment: "Online Payment",
      date: "2026-01-05T15:40:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-110",
      email: "maria.santos@wmsu.edu.ph",
      service: "Printing",
      amount: 120,
      status: "completed",
      payment: "Online Payment",
      date: "2026-01-05T09:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-111",
      email: "juan.delacruz@wmsu.edu.ph",
      service: "Printing",
      amount: 90,
      status: "completed",
      payment: "Pay Onsite",
      date: "2026-01-05T11:30:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-112",
      email: "anna.lopez@wmsu.edu.ph",
      service: "Lanyards",
      amount: 450,
      status: "processing",
      payment: "Online Payment",
      date: "2026-01-05T14:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-113",
      email: "carlo.garcia@wmsu.edu.ph",
      service: "Merchandise",
      amount: 320,
      status: "ready",
      payment: "Pay Onsite",
      date: "2026-01-05T18:45:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-004",
      email: "anna.lopez@wmsu.edu.ph",
      service: "Lanyards",
      amount: 750,
      status: "paid",
      payment: "Online Payment",
      date: "2026-02-19T16:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-003",
      email: "pedro.reyes@wmsu.edu.ph",
      service: "Printing",
      amount: 170,
      status: "pending",
      payment: "Not selected",
      date: "2026-02-19T11:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-002",
      email: "maria.santos@wmsu.edu.ph",
      service: "Mug Printing",
      amount: 400,
      status: "processing",
      payment: "Pay Onsite",
      date: "2026-02-19T13:30:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-001",
      email: "juan.delacruz@wmsu.edu.ph",
      service: "Printing",
      amount: 150,
      status: "ready",
      payment: "Online Payment",
      date: "2026-02-19T10:00:00",
    },
    {
      id: "ORD-2025-005",
      email: "carlo.garcia@wmsu.edu.ph",
      service: "Merchandise",
      amount: 750,
      status: "completed",
      payment: "Pay Onsite",
      date: "2026-02-18T09:00:00",
    },
    {
      id: "ORD-2025-006",
      email: "student@wmsu.edu.ph",
      service: "Printing",
      amount: 180,
      status: "completed",
      payment: "Online Payment",
      date: "2026-03-15T10:00:00",
      order_type: "individual",
    },
    {
      id: "ORD-2025-007",
      email: "anna.lopez@wmsu.edu.ph",
      service: "Lanyards",
      amount: 500,
      status: "completed",
      payment: "Online Payment",
      date: "2026-04-22T14:30:00",
      order_type: "individual",
    },
    {
      id: "ORG-2025-008",
      email: "carlo.garcia@wmsu.edu.ph",
      service: "Mug Printing",
      amount: 650,
      status: "completed",
      payment: "Pay Onsite",
      date: "2026-05-02T16:45:00",
      order_type: "organization",
      order_org: "Engineering Guild",
    },
  ];

  const DEMO_PAYMENT_SUBMISSIONS = [
    {
      id: "PAY-2025-001",
      orderId: "ORD-2025-102",
      email: "student@wmsu.edu.ph",
      amount: 150,
      method: "Online Payment",
      reference: "GCash-78421",
      submitted: "2026-01-05",
      status: "pending",
      proofUrl: null,
    },
    {
      id: "PAY-2025-002",
      orderId: "ORD-2025-104",
      email: "student@wmsu.edu.ph",
      amount: 1000,
      method: "Online Payment",
      reference: "Maya-99132",
      submitted: "2026-01-05",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2025-003",
      orderId: "ORD-2025-004",
      email: "anna.lopez@wmsu.edu.ph",
      amount: 750,
      method: "Online Payment",
      reference: "GCash-55098",
      submitted: "2026-02-19",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2025-004",
      orderId: "ORD-2025-001",
      email: "juan.delacruz@wmsu.edu.ph",
      amount: 150,
      method: "Online Payment",
      reference: "BDO-34412",
      submitted: "2026-02-19",
      status: "pending",
      proofUrl: null,
    },
    {
      id: "PAY-2025-005",
      orderId: "ORD-2025-005",
      email: "carlo.garcia@wmsu.edu.ph",
      amount: 750,
      method: "Pay Onsite",
      reference: "Cash",
      submitted: "2026-02-18",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2025-006",
      orderId: "ORD-2025-002",
      email: "maria.santos@wmsu.edu.ph",
      amount: 400,
      method: "Pay Onsite",
      reference: "Cash",
      submitted: "2026-02-19",
      status: "rejected",
      proofUrl: null,
    },
    {
      id: "PAY-2025-007",
      orderId: "ORD-2025-110",
      email: "maria.santos@wmsu.edu.ph",
      amount: 120,
      method: "Online Payment",
      reference: "GCash-88301",
      submitted: "2026-01-05",
      status: "verified",
      proofUrl: null,
    },
    {
      id: "PAY-2025-008",
      orderId: "ORD-2025-112",
      email: "anna.lopez@wmsu.edu.ph",
      amount: 450,
      method: "Online Payment",
      reference: "GCash-22109",
      submitted: "2026-01-05",
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
      accountType: "student",
      studentId: "2025-00003",
    },
    {
      name: "Maria Santos",
      email: "maria.santos@wmsu.edu.ph",
      registrationDate: "2025-06-15",
      lastCOR: "2025-06-15",
      accountType: "student",
      studentId: "2025-00002",
    },
    {
      name: "Pedro Reyes",
      email: "pedro.reyes@wmsu.edu.ph",
      registrationDate: "2025-09-20",
      lastCOR: "2025-09-20",
      accountType: "student",
      studentId: "2025-00006",
    },
    {
      name: "Anna Lopez",
      email: "anna.lopez@wmsu.edu.ph",
      registrationDate: "2025-01-10",
      lastCOR: "2025-01-10",
      accountType: "faculty",
      facultyId: "FAC-002",
    },
    {
      name: "Carlo Garcia",
      email: "carlo.garcia@wmsu.edu.ph",
      registrationDate: "2025-12-05",
      lastCOR: "2025-12-05",
      accountType: "faculty",
      facultyId: "FAC-003",
    },
  ];

  const DEMO_SERVICES = [
    {
      id: "svc_demo_printing",
      name: "Printing",
      description: "Demo service — printing",
      price: 60,
      category: "printing",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: "2025-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_binding",
      name: "Binding",
      description: "Demo service — binding",
      price: 150,
      category: "printing",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: "2025-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_lanyards",
      name: "Lanyards",
      description: "Demo service — lanyards",
      price: 300,
      category: "merchandise",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: "2025-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_id",
      name: "ID Printing",
      description: "Demo service — ID printing",
      price: 0,
      category: "merchandise",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: "2025-01-10T00:00:00.000Z",
    },
    {
      id: "svc_demo_mug",
      name: "Mug Printing",
      description: "Demo service — mugs",
      price: 500,
      category: "merchandise",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: "2025-01-10T00:00:00.000Z",
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
      studentId: "2025-00001",
      createdAt: "2025-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_test_wmsu",
      fullName: "Test Student WMSU",
      email: "test.student@wmsu.edu.ph",
      username: "teststudentwmsu",
      role: "student",
      suspended: false,
      password: "123123",
      accountType: "student",
      accountStatus: "verified",
      college: "College of Computing Studies",
      course: "Computer Science",
      yearLevel: "2nd Year",
      studentId: "2026-DEMO-01",
      campusId: "2026-DEMO-01",
      createdAt: "2025-01-12T09:00:00.000Z",
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
      studentId: "2025-00002",
      createdAt: "2025-01-12T08:00:00.000Z",
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
      studentId: "2025-00003",
      createdAt: "2025-01-12T08:00:00.000Z",
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
      studentId: "2025-00004",
      createdAt: "2025-01-12T08:00:00.000Z",
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
      studentId: "2025-00005",
      createdAt: "2025-01-12T08:00:00.000Z",
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
      studentId: "2025-00006",
      createdAt: "2025-01-12T08:00:00.000Z",
    },
    {
      id: "user_demo_staff",
      fullName: "Staff Demo",
      email: "staff@upress.demo",
      username: "staffdemo",
      role: "staff",
      suspended: false,
      facultyId: "FAC-001",
      createdAt: "2025-01-12T08:00:00.000Z",
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
      studentId: "2025-00007",
      createdAt: "2025-01-12T08:00:00.000Z",
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
      studentId: "2025-00008",
      createdAt: "2025-01-12T08:00:00.000Z",
    },
  ];

  const AFFILIATE_DROPDOWN_ORGS = [
    ["Computer Science Department", "College of Computing Studies"],
    ["Mathematics Department", "College of Science and Mathematics"],
    ["Physics Department", "College of Science and Mathematics"],
    ["Chemistry Department", "College of Science and Mathematics"],
    ["Biology Department", "College of Science and Mathematics"],
    ["Engineering Department", "College of Engineering"],
    ["Business Administration Department", "College of Business Administration"],
    ["Education Department", "College of Education"],
    ["Arts Department", "College of Arts and Sciences"],
    ["Sports Department", "Office of Student Affairs"],
  ];

  const DEMO_ORGANIZATIONS = [
    {
      id: "ORG-001",
      name: "Computer Science Club",
      college: "College of Computing",
      type: "Student Organization",
      description:
        "Official WMSU computing club recognized for co-curricular activities.",
      proofImage: "",
      approvedBy: "Admin",
      approvedAt: "2025-04-15T09:00:00.000Z",
      recognizedAt: "2025-04-15T09:00:00.000Z",
    },
    {
      id: "ORG-002",
      name: "Business Administration Society",
      college: "College of Business",
      type: "Student Organization",
      description:
        "WMSU business student organization recognized by the College of Business.",
      proofImage: "",
      approvedBy: "Admin",
      approvedAt: "2025-04-20T11:00:00.000Z",
      recognizedAt: "2025-04-20T11:00:00.000Z",
    },
    {
      id: "ORG-003",
      name: "Engineering Guild",
      college: "College of Engineering",
      type: "Student Organization",
      description:
        "Recognized engineering student organization for campus technical programs.",
      proofImage: "",
      approvedBy: "Admin",
      approvedAt: "2025-04-22T13:30:00.000Z",
      recognizedAt: "2025-04-22T13:30:00.000Z",
    },
    ...AFFILIATE_DROPDOWN_ORGS.map(([name, college], i) => ({
      id: `ORG-AFF-${i + 1}`,
      name,
      college,
      type: "Department",
      description: "Listed organization for student and faculty affiliation.",
      proofImage: "",
      approvedBy: "Admin",
      approvedAt: "2025-01-01T00:00:00.000Z",
      recognizedAt: "2025-01-01T00:00:00.000Z",
    })),
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
        orderId: o.id,
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
        order_type: o.order_type || "",
        order_org: o.order_org || "",
      };
    });
  }

  const DEMO_RATINGS = [
    {
      transactionId: "txn_ORD-2025-005",
      serviceRating: 5,
      productRating: 5,
      comment: "Excellent print quality.",
      createdAt: "2026-02-18T20:00:00.000Z",
    },
    {
      transactionId: "txn_ORD-2025-006",
      serviceRating: 4,
      productRating: 4,
      comment: "Fast turnaround.",
      createdAt: "2026-03-15T21:00:00.000Z",
    },
    {
      transactionId: "txn_ORD-2025-008",
      serviceRating: 5,
      productRating: 5,
      comment: "",
      createdAt: "2026-05-02T22:00:00.000Z",
    },
    {
      transactionId: "txn_ORD-2025-007",
      serviceRating: 4,
      productRating: 4,
      comment: "Good service.",
      createdAt: "2026-04-22T23:00:00.000Z",
    },
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Demo org “Other / custom” requests for staff Order Queue (modal review). */
  const DEMO_ORG_CUSTOM_REQUESTS = [
    {
      id: "ocr_demo_pending_banner",
      status: "pending",
      submittedAt: "2026-05-01T10:30:00.000Z",
      updatedAt: "2026-05-01T10:30:00.000Z",
      staffNotes: "",
      staffReviewedAt: "",
      quotedPrice: null,
      adminNotes: "",
      adminAcknowledged: false,
      adminReviewedAt: "",
      oversightNotes: "",
      userId: "user_demo_test_wmsu",
      userName: "Test Student WMSU",
      userEmail: "test.student@wmsu.edu.ph",
      organizationName: "Computer Science Student Council",
      requestTitle: "Demo: Event backdrop + standees",
      requestCategory: "event_collateral",
      quantityOrSpecs: "1 backdrop 8×4 ft, 6 standees 2×5 ft",
      requestDetails:
        "For College Week 2026. Matte laminate preferred. Final artwork after quote approval.\n\n(Open Review & quote in the modal to approve and set ₱.)",
    },
    {
      id: "ocr_demo_approved_shirts",
      status: "doable",
      submittedAt: "2026-04-28T14:00:00.000Z",
      updatedAt: "2026-04-30T09:15:00.000Z",
      staffReviewedAt: "2026-04-30T09:15:00.000Z",
      staffNotes:
        "80 pcs confirmed. Pickup at UPress; ~3 weeks from down payment.",
      quotedPrice: 11850.5,
      adminNotes: "",
      adminAcknowledged: false,
      adminReviewedAt: "",
      oversightNotes: "",
      userId: "user_demo_maria",
      userName: "Maria Santos",
      userEmail: "maria.santos@wmsu.edu.ph",
      organizationName: "Women in Tech WMSU",
      requestTitle: "Demo: Org shirts (already approved)",
      requestCategory: "merchandise",
      quantityOrSpecs: "80 shirts, cotton, 2-color front print",
      requestDetails:
        "Sizes XS–XL. Navy shirt, white + gold ink. (Demo row showing quoted price after staff approval.)",
    },
  ];

  function getDemoDatabase() {
    return {
      academicYear: DEMO_ACADEMIC_YEAR,
      users: clone(DEMO_USERS),
      services: clone(DEMO_SERVICES),
      transactions: buildDemoTransactions(),
      ratings: clone(DEMO_RATINGS),
      archives: {},
      organizations: clone(DEMO_ORGANIZATIONS),
      orgCustomRequests: clone(DEMO_ORG_CUSTOM_REQUESTS),
      systemSettings: {
        maintenanceMode: false,
        policies: {},
      },
    };
  }

  /** Merge demo organizations into an existing DB (one-time per id). */
  function seedOrganizationsDemo() {
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function")
      return;
    try {
      const db = window.getDB();
      if (!Array.isArray(db.organizations)) db.organizations = [];
      const existingIds = new Set(
        db.organizations.map((o) => o && o.id).filter(Boolean),
      );
      let added = false;
      for (const row of DEMO_ORGANIZATIONS) {
        if (existingIds.has(row.id)) continue;
        db.organizations.push(clone(row));
        existingIds.add(row.id);
        added = true;
      }
      if (added) window.saveDB(db);
    } catch (e) {
      console.warn("seedOrganizationsDemo:", e);
    }
  }

  /** Merge demo org custom rows into an existing DB (one-time per id). */
  function seedOrgCustomRequestsDemo() {
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function")
      return;
    try {
      const db = window.getDB();
      if (!Array.isArray(db.orgCustomRequests)) db.orgCustomRequests = [];
      const existingIds = new Set(
        db.orgCustomRequests.map((r) => r && r.id).filter(Boolean),
      );
      let added = false;
      for (const row of DEMO_ORG_CUSTOM_REQUESTS) {
        if (existingIds.has(row.id)) continue;
        db.orgCustomRequests.unshift(clone(row));
        existingIds.add(row.id);
        added = true;
      }
      if (added) window.saveDB(db);
    } catch (e) {
      console.warn("seedOrgCustomRequestsDemo:", e);
    }
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
    "test.student@wmsu.edu.ph": "Test Student WMSU",
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

  function seedStaffWalkInSalesIfEmpty() {
    const LS_WALKIN = "upressWalkInSales";
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem(LS_WALKIN) || "[]");
    } catch {
      existing = [];
    }
    const hasAny = Array.isArray(existing) && existing.length > 0;

    const mk = (d, saleId, total, method, extra = {}) => ({
      saleId,
      ts: d,
      date: d,
      customerName: extra.customerName || "Walk-in",
      customerPhone: extra.customerPhone || "",
      patronType: extra.patronType || "Student",
      paymentMethod: method,
      gcashRef:
        method.toLowerCase() === "gcash"
          ? `GCASH-${Math.floor(100000 + Math.random() * 900000)}`
          : "",
      items: extra.items || [{ service: "Printing", qty: 10, price: 3 }],
      grandTotal: total,
    });

    const rows = [
      mk("2026-01-05T09:18:00", "SALE-1001", 120, "Cash", {
        customerName: "Walk-in Customer",
        items: [{ service: "Printing", qty: 40, price: 3 }],
      }),
      mk("2026-01-05T12:02:00", "SALE-1002", 80, "GCash", {
        customerName: "Walk-in Customer",
        items: [{ service: "Binding", qty: 2, price: 40 }],
      }),
      mk("2026-01-06T15:25:00", "SALE-1003", 200, "Cash", {
        customerName: "Walk-in Customer",
        items: [{ service: "ID Printing", qty: 4, price: 50 }],
      }),
      mk("2026-02-02T10:10:00", "SALE-1004", 150, "Cash", {
        customerName: "Walk-in Customer",
        items: [{ service: "Printing", qty: 50, price: 3 }],
      }),
    ];

    try {
      const merged = hasAny ? existing : [];
      const seen = new Set(merged.map((r) => String(r?.saleId || "")));
      for (const r of rows) {
        if (!seen.has(String(r.saleId))) merged.push(r);
      }
      localStorage.setItem(LS_WALKIN, JSON.stringify(merged));
    } catch (e) {
      console.warn("Staff walk-in demo sales seed skipped:", e);
    }

    // Also mirror as completed transactions so admin/superadmin reports match.
    if (
      typeof window !== "undefined" &&
      typeof window.getDB === "function" &&
      typeof window.saveDB === "function"
    ) {
      try {
        const db = window.getDB();
        db.transactions = Array.isArray(db.transactions) ? db.transactions : [];
        const existingIds = new Set(
          db.transactions.map((t) => String(t?.id || "")),
        );
        const ay = db.academicYear || DEMO_ACADEMIC_YEAR;
        for (const s of rows) {
          const id = `txn_pos_${s.saleId}`;
          if (existingIds.has(id)) continue;
          const method = String(s.paymentMethod || "");
          const m = method.toLowerCase();
          const paymentType =
            m.includes("gcash") || m.includes("online") ? "gcash" : "credit";
          db.transactions.push({
            id,
            serviceId: "svc_walkin",
            serviceName: "Walk-in POS",
            amount: Number(s.grandTotal) || 0,
            category: "Walk-in",
            status: "completed",
            semester: "2nd",
            date: new Date(s.ts || s.date || Date.now()).toISOString(),
            academicYear: ay,
            paymentType,
            paymentMethod: method || "Cash",
            email: "walkin@local.demo",
          });
        }
        window.saveDB(db);
      } catch (e) {
        console.warn("Staff walk-in demo tx mirror skipped:", e);
      }
    }
  }

  function seedOrgLedgersIfEmpty() {
    // Requires storage.js to be loaded (getDB/saveDB available).
    if (typeof window === "undefined") return;
    if (
      typeof window.getDB !== "function" ||
      typeof window.saveDB !== "function"
    )
      return;

    const db = window.getDB();
    db.orgLedgers = Array.isArray(db.orgLedgers) ? db.orgLedgers : [];
    db.orgLedgerArchive = Array.isArray(db.orgLedgerArchive)
      ? db.orgLedgerArchive
      : [];

    const allLedgers = [...db.orgLedgers, ...db.orgLedgerArchive];
    const hasOrg = (name) =>
      allLedgers.some(
        (l) =>
          String(l?.orgName || "")
            .trim()
            .toLowerCase() === String(name).trim().toLowerCase(),
      );

    const base = (
      id,
      orgName,
      total,
      availedAt,
      orderId,
      payments = [],
      archivedAt = "",
    ) => {
      const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const remaining = Math.max(0, +(Number(total || 0) - paid).toFixed(2));
      const status = remaining <= 0 ? "fully_paid" : "open";
      return {
        id,
        orgName,
        orgId: "",
        orderId,
        availedAt,
        totalAmount: +Number(total || 0).toFixed(2),
        payments,
        remainingBalance: remaining,
        status,
        createdAt: availedAt,
        updatedAt: archivedAt || availedAt,
        archivedAt: archivedAt || "",
      };
    };

    const pay = (date, amount, method = "cash", note = "") => ({
      id: `org_pay_${Math.floor(100000 + Math.random() * 900000)}`,
      date,
      amount: +Number(amount || 0).toFixed(2),
      method,
      note,
      createdAt: date,
    });

    const openAdds = [];
    const archiveAdds = [];

    if (!hasOrg("Venom Publication")) {
      openAdds.push(
        base(
          "org_ledger_demo_venom_001",
          "Venom Publication",
          1500,
          "2026-01-18T09:00:00",
          "ORG-2025-131",
          [pay("2026-01-18T10:30:00", 600, "cash", "Initial payment")],
        ),
      );
    }

    if (!hasOrg("Google Developers Group On Campus")) {
      archiveAdds.push(
        base(
          "org_ledger_demo_gdg_001",
          "Google Developers Group On Campus",
          1200,
          "2025-12-02T09:00:00",
          "ORG-2025-099",
          [
            pay("2025-12-02T11:00:00", 400, "gcash", "Installment 1"),
            pay("2025-12-10T14:45:00", 400, "gcash", "Installment 2"),
            pay("2025-12-18T16:15:00", 400, "gcash", "Final payment"),
          ],
          "2025-12-18T16:15:00",
        ),
      );
    }

    // Keep other demo ledgers if they exist; otherwise add a couple extra for variety.
    if (db.orgLedgers.length === 0 && db.orgLedgerArchive.length === 0) {
      openAdds.push(
        base(
          "org_ledger_demo_001",
          "Computer Science Club",
          1200,
          "2026-01-05T08:30:00",
          "ORG-2025-103",
          [
            pay("2026-01-05T10:00:00", 500, "cash", "Downpayment"),
            pay("2026-01-10T14:10:00", 200, "cash", "Installment"),
          ],
        ),
      );
    }

    db.orgLedgers = [...openAdds, ...db.orgLedgers];
    db.orgLedgerArchive = [...archiveAdds, ...db.orgLedgerArchive];
    window.saveDB(db);

    // Mirror org payments into transactions for admin/superadmin reports consistency.
    try {
      const txDb = window.getDB();
      txDb.transactions = Array.isArray(txDb.transactions)
        ? txDb.transactions
        : [];
      const existingIds = new Set(
        txDb.transactions.map((t) => String(t?.id || "")),
      );
      const ay = txDb.academicYear || DEMO_ACADEMIC_YEAR;
      const ledgersForTx = [...openAdds, ...archiveAdds];
      for (const l of ledgersForTx) {
        for (const p of Array.isArray(l.payments) ? l.payments : []) {
          const id = `ORG-PAY-${String(l.orderId || l.id).replaceAll(" ", "_")}-${String(p.id || "").replaceAll(" ", "_")}`;
          if (existingIds.has(id)) continue;
          const method = String(p.method || "");
          const m = method.toLowerCase();
          const paymentType =
            m.includes("gcash") || m.includes("online") ? "gcash" : "credit";
          txDb.transactions.push({
            id,
            serviceId: "svc_org_payment",
            serviceName: "Organization Payment",
            amount: Number(p.amount) || 0,
            category: "Organizations",
            status: "completed",
            semester: "2nd",
            date: new Date(p.date || Date.now()).toISOString(),
            academicYear: ay,
            paymentType,
            paymentMethod: method || "Cash",
            email: "org@local.demo",
            orgName: l.orgName,
            orderId: l.orderId || "",
          });
        }
      }
      window.saveDB(txDb);
    } catch (e) {
      console.warn("Org ledger demo tx mirror skipped:", e);
    }
  }

  function seedStudentsIfEmpty() {
    if (typeof window === "undefined") return;
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") return;
    try {
      const db = window.getDB();
      db.students = Array.isArray(db.students) ? db.students : [];
      if (db.students.length) return;

      const rows = [
        {
          id: "stu_demo_001",
          name: "Maria Santos",
          studentNumber: "2025-00123",
          college: "College of Computing",
          course: "Computer Science",
          yearLevel: "3rd Year",
          contact: "maria.santos@wmsu.edu.ph",
          isFreshman: false,
          createdAt: "2026-01-05T09:05:00.000Z",
          createdBy: "demo",
          source: "seed",
        },
        {
          id: "stu_demo_002",
          name: "Juan Dela Cruz",
          studentNumber: "2025-00124",
          college: "College of Computing",
          course: "Information Technology",
          yearLevel: "2nd Year",
          contact: "juan.delacruz@wmsu.edu.ph",
          isFreshman: false,
          createdAt: "2026-01-05T10:10:00.000Z",
          createdBy: "demo",
          source: "seed",
        },
        {
          id: "stu_demo_003",
          name: "Pedro Garcia",
          studentNumber: "2025-00126",
          college: "College of Engineering",
          course: "Engineering",
          yearLevel: "1st Year",
          contact: "pedro.garcia@wmsu.edu.ph",
          isFreshman: true,
          createdAt: "2026-01-06T14:20:00.000Z",
          createdBy: "demo",
          source: "seed",
        },
      ];

      db.students = rows.concat(db.students);
      window.saveDB(db);
    } catch (e) {
      console.warn("Students demo seed skipped:", e);
    }
  }

  function seedFacultyIfEmpty() {
    if (typeof window === "undefined") return;
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") return;
    try {
      const db = window.getDB();
      db.faculty = Array.isArray(db.faculty) ? db.faculty : [];
      if (db.faculty.length) return;

      const rows = [
        {
          id: "fac_demo_001",
          name: "Anna Lopez",
          employeeNumber: "EMP-001",
          college: "College of Business",
          department: "Marketing Management",
          contact: "anna.lopez@wmsu.edu.ph",
          createdAt: "2026-01-05T08:30:00.000Z",
          createdBy: "demo",
          source: "seed",
        },
        {
          id: "fac_demo_002",
          name: "Carlo Garcia",
          employeeNumber: "EMP-002",
          college: "College of Engineering",
          department: "Civil Engineering",
          contact: "carlo.garcia@wmsu.edu.ph",
          createdAt: "2026-01-05T08:40:00.000Z",
          createdBy: "demo",
          source: "seed",
        },
      ];

      db.faculty = rows.concat(db.faculty);
      window.saveDB(db);
    } catch (e) {
      console.warn("Faculty demo seed skipped:", e);
    }
  }

  function seedActivityRecordsIfEmpty() {
    if (typeof window === "undefined") return;
    if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") return;
    try {
      const db = window.getDB();
      db.transactions = Array.isArray(db.transactions) ? db.transactions : [];

      // Only add if our seed rows don't exist yet (non-destructive).
      const hasSeed = db.transactions.some((t) => String(t?.id || "").startsWith("txn_activity_seed_"));
      if (hasSeed) return;

      const now = Date.now();
      const iso = (msAgo) => new Date(now - msAgo).toISOString();

      const seedTx = [
        // Faculty web/system completed transaction (links to db.users via email)
        {
          id: "ORG-ACT-FAC-001",
          serviceId: "svc_demo_printing",
          serviceName: "Printing",
          amount: 95,
          category: "printing",
          status: "completed",
          semester: "2nd",
          date: iso(2 * 24 * 60 * 60 * 1000),
          academicYear: db.academicYear || DEMO_ACADEMIC_YEAR,
          paymentType: "credit",
          paymentMethod: "Pay Onsite",
          email: "anna.lopez@wmsu.edu.ph",
        },
        // Organization web/system completed transaction
        {
          id: "ORG-ACT-ORG-001",
          serviceId: "svc_demo_lanyards",
          serviceName: "Lanyards",
          amount: 680,
          category: "merchandise",
          status: "completed",
          semester: "2nd",
          date: iso(3 * 24 * 60 * 60 * 1000),
          academicYear: db.academicYear || DEMO_ACADEMIC_YEAR,
          paymentType: "gcash",
          paymentMethod: "Online Payment",
          email: "org@local.demo",
          order_type: "organization",
          order_org: "Venom Publication",
          orgName: "Venom Publication",
          refNumber: "GCash-123456",
        },
      ];

      db.transactions = seedTx.concat(db.transactions);
      window.saveDB(db);
    } catch (e) {
      console.warn("Activity Records demo seed skipped:", e);
    }

    // Also seed a couple walk-in activity rows (non-destructive) so filters show variety.
    try {
      const LS_WALKIN = "upressWalkInSales";
      let existing = [];
      try {
        existing = JSON.parse(localStorage.getItem(LS_WALKIN) || "[]");
      } catch {
        existing = [];
      }
      existing = Array.isArray(existing) ? existing : [];
      const seen = new Set(existing.map((r) => String(r?.saleId || "")));

      const now = Date.now();
      const mk = (msAgo, saleId, total, method, patronType) => ({
        saleId,
        ts: new Date(now - msAgo).toISOString(),
        date: new Date(now - msAgo).toISOString(),
        customerName: patronType === "Organization" ? "Venom Publication" : "Walk-in Customer",
        customerPhone: "",
        patronType,
        paymentMethod: method,
        gcashRef: method.toLowerCase() === "gcash" ? `GCASH-${Math.floor(100000 + Math.random() * 900000)}` : "",
        items: [{ service: "Printing", qty: 10, price: 3 }],
        grandTotal: total,
      });

      const rows = [
        mk(1 * 24 * 60 * 60 * 1000, "SALE-ACT-ORG-01", 250, "Cash", "Organization"),
        mk(4 * 24 * 60 * 60 * 1000, "SALE-ACT-FAC-01", 180, "GCash", "Faculty"),
      ];

      let changed = false;
      for (const r of rows) {
        if (seen.has(String(r.saleId))) continue;
        existing.unshift(r);
        changed = true;
      }
      if (changed) localStorage.setItem(LS_WALKIN, JSON.stringify(existing));
    } catch (e) {
      console.warn("Activity Records walk-in seed skipped:", e);
    }
  }

  global.UpressDemoSeed = {
    DEMO_ACADEMIC_YEAR,
    getDemoDatabase,
    getAdminPortalSampleData,
    seedStaffWebOrdersIfEmpty,
    seedStaffWalkInSalesIfEmpty,
    seedOrgLedgersIfEmpty,
    seedStudentsIfEmpty,
    seedFacultyIfEmpty,
    seedActivityRecordsIfEmpty,
    seedOrgCustomRequestsDemo,
    seedOrganizationsDemo,
  };
})(typeof window !== "undefined" ? window : globalThis);
