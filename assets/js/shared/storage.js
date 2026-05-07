const STORAGE_KEY = "upressease_db";

const defaultDB = {
  academicYear: "",
  users: [],
  authUsers: [],
  services: [],
  transactions: [],
  ratings: [],
  archives: {},
  affiliationRequests: [],
  organizations: [],
  students: [],
  faculty: [],
  orgLedgers: [],
  orgLedgerArchive: [],
  /** Organization “Other / custom” print or merch requests (manual staff review). */
  orgCustomRequests: [],
  /** In-app notifications (e.g. staff org-custom approval); keyed by user id. */
  notifications: [],
  systemSettings: {
    maintenanceMode: false,
    policies: {},
  },
};

/**
 * Load demo data if available
 */
function loadDemoData() {
  if (typeof UpressDemoSeed !== "undefined" && UpressDemoSeed.getDemoDatabase) {
    const demoDB = UpressDemoSeed.getDemoDatabase();
    saveDB(demoDB);
    return demoDB;
  }
  return { ...defaultDB };
}

/**
 * Get the current database
 * @returns {Object} Current database object
 */
function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      const merged = mergeWithDefaults(db);
      // If database is empty, load demo data
      if (merged.users.length === 0) {
        return mergeLegacyUpressDbAffiliations(loadDemoData());
      }
      return mergeLegacyUpressDbAffiliations(merged);
    }
  } catch (error) {
    console.error("Error loading DB:", error);
  }
  // No data found, load demo data
  return mergeLegacyUpressDbAffiliations(loadDemoData());
}

/**
 * Save database to localStorage
 * @param {Object} db - Database object to save
 */
function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Error saving DB:", error);
  }
}

/**
 * After admin approves a portal signup, mirror the user into staff/admin directory
 * tables (`students` / `faculty`) so those lists stay in sync with `db.users`.
 * @param {Object|null|undefined} user
 */
function syncStaffDirectoryFromApprovedUser(user) {
  if (!user || !user.id) return;
  const db = getDB();
  const role = String(user.role || user.accountType || "").toLowerCase();

  if (role === "student") {
    db.students = Array.isArray(db.students) ? db.students : [];
    const studentNumber = String(user.studentId || user.campusId || "").trim();
    if (!studentNumber) return;
    const name = String(user.fullName || user.name || "").trim();
    const portalId = String(user.id);
    const idx = db.students.findIndex(
      (s) =>
        String(s.portalUserId || "") === portalId ||
        String(s.studentNumber || "").toLowerCase() ===
          studentNumber.toLowerCase(),
    );
    const row = {
      id:
        idx >= 0
          ? db.students[idx].id
          : `stu_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      studentNumber,
      college: String(user.college || "").trim(),
      course: String(user.course || "").trim(),
      yearLevel: String(user.yearLevel || "").trim(),
      contact: String(user.phone || "").trim(),
      isFreshman: idx >= 0 ? !!db.students[idx].isFreshman : false,
      createdAt:
        idx >= 0
          ? db.students[idx].createdAt
          : user.createdAt || new Date().toISOString(),
      portalUserId: portalId,
      source: idx >= 0 ? db.students[idx].source || "signup" : "signup",
    };
    if (idx >= 0) db.students[idx] = { ...db.students[idx], ...row };
    else db.students.unshift(row);
    saveDB(db);
    return;
  }

  if (role === "faculty") {
    db.faculty = Array.isArray(db.faculty) ? db.faculty : [];
    const employeeNumber = String(
      user.facultyId || user.campusId || "",
    ).trim();
    if (!employeeNumber) return;
    const name = String(user.fullName || user.name || "").trim();
    const portalId = String(user.id);
    const department =
      String(user.department || user.course || user.college || "").trim() ||
      "—";
    const idx = db.faculty.findIndex(
      (f) =>
        String(f.portalUserId || "") === portalId ||
        String(f.employeeNumber || "").toLowerCase() ===
          employeeNumber.toLowerCase(),
    );
    const row = {
      id:
        idx >= 0
          ? db.faculty[idx].id
          : `fac_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      employeeNumber,
      college: String(user.college || "").trim(),
      department,
      contact: String(user.phone || "").trim(),
      createdAt:
        idx >= 0
          ? db.faculty[idx].createdAt
          : user.createdAt || new Date().toISOString(),
      portalUserId: portalId,
      source: idx >= 0 ? db.faculty[idx].source || "signup" : "signup",
    };
    if (idx >= 0) db.faculty[idx] = { ...db.faculty[idx], ...row };
    else db.faculty.unshift(row);
    saveDB(db);
  }
}

/**
 * Older student pages wrote to `upressDB` while the canonical app DB is `upressease_db`.
 * Merge affiliation requests from legacy storage so admin can see them.
 * @param {Object} db
 * @returns {Object}
 */
function mergeLegacyUpressDbAffiliations(db) {
  try {
    const raw = localStorage.getItem("upressDB");
    if (!raw) return db;
    const legacy = JSON.parse(raw);
    const legacyReq = legacy.affiliationRequests;
    if (!Array.isArray(legacyReq) || legacyReq.length === 0) return db;
    db.affiliationRequests = Array.isArray(db.affiliationRequests)
      ? db.affiliationRequests
      : [];
    const seen = new Set(
      db.affiliationRequests.map((r) => r && r.id).filter(Boolean),
    );
    let added = false;
    for (const r of legacyReq) {
      if (r && r.id && !seen.has(r.id)) {
        db.affiliationRequests.push(r);
        seen.add(r.id);
        added = true;
      }
    }
    if (added) saveDB(db);
    delete legacy.affiliationRequests;
    const legacyKeys = legacy && typeof legacy === "object" ? Object.keys(legacy) : [];
    if (legacyKeys.length === 0) {
      localStorage.removeItem("upressDB");
    } else {
      localStorage.setItem("upressDB", JSON.stringify(legacy));
    }
  } catch (e) {
    console.error("mergeLegacyUpressDbAffiliations:", e);
  }
  return db;
}

/**
 * Merge loaded data with defaults to ensure structure integrity
 * @param {Object} db - Loaded database object
 * @returns {Object} Merged database object
 */
function mergeWithDefaults(db) {
  return {
    academicYear: db.academicYear || "",
    users: Array.isArray(db.users) ? db.users : [],
    authUsers: Array.isArray(db.authUsers) ? db.authUsers : [],
    services: Array.isArray(db.services) ? db.services : [],
    transactions: Array.isArray(db.transactions) ? db.transactions : [],
    ratings: Array.isArray(db.ratings) ? db.ratings : [],
    archives: typeof db.archives === "object" ? db.archives : {},
    affiliationRequests: Array.isArray(db.affiliationRequests)
      ? db.affiliationRequests
      : [],
    organizations: Array.isArray(db.organizations) ? db.organizations : [],
    students: Array.isArray(db.students) ? db.students : [],
    faculty: Array.isArray(db.faculty) ? db.faculty : [],
    orgLedgers: Array.isArray(db.orgLedgers) ? db.orgLedgers : [],
    orgLedgerArchive: Array.isArray(db.orgLedgerArchive)
      ? db.orgLedgerArchive
      : [],
    orgCustomRequests: Array.isArray(db.orgCustomRequests)
      ? db.orgCustomRequests
      : [],
    notifications: Array.isArray(db.notifications) ? db.notifications : [],
    systemSettings: {
      maintenanceMode: db.systemSettings?.maintenanceMode || false,
      policies: db.systemSettings?.policies || {},
    },
  };
}

/**
 * Helper function to generate unique IDs
 * @param {string} prefix - ID prefix
 * @returns {string} Generated ID
 */
function generateStorageId(prefix) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Archive current year data before switching to new year
 */
function archiveCurrentYear() {
  const db = getDB();

  if (!db.academicYear) return;

  // Create archive entry for current year
  db.archives = db.archives || {};
  db.archives[db.academicYear] = {
    users: [...db.users],
    transactions: [...db.transactions],
    ratings: [...db.ratings],
    services: [...db.services], // Archive services too for historical reference
    archivedAt: new Date().toISOString(),
  };

  saveDB(db);
}

/**
 * Set academic year and handle data archiving
 * If switching years, archives current data and creates fresh dataset
 * @param {string} year - Academic year in format "YYYY-YYYY"
 */
function setAcademicYear(year) {
  const db = getDB();

  // If switching from one year to another, archive current data
  if (db.academicYear && db.academicYear !== year) {
    archiveCurrentYear();
    const freshDB = getDB(); // Reload after archiving
    freshDB.academicYear = year;

    // Reset working data for new year
    freshDB.users = [];
    freshDB.transactions = [];
    freshDB.ratings = [];
    // Services persist - they can be reused from previous year

    saveDB(freshDB);
  } else if (!db.academicYear) {
    // Setting year for first time
    db.academicYear = year;
    saveDB(db);
  }
}

/**
 * Archive current year's data before switching to a new year
 * Archives are read-only snapshots
 */
function archiveCurrentYear() {
  const db = getDB();

  if (!db.academicYear) {
    return; // No year set to archive
  }

  // Store current year's data in archives (read-only)
  db.archives[db.academicYear] = {
    users: db.users.map((u) => ({ ...u })), // Deep copy
    transactions: db.transactions.map((t) => ({ ...t })), // Deep copy
    ratings: db.ratings.map((r) => ({ ...r })), // Deep copy
    services: db.services.map((s) => ({ ...s })), // Deep copy
    archivedAt: new Date().toISOString(),
  };

  saveDB(db);
}

/**
 * Add authenticated user to database
 * @param {Object} user - User object with email, password, etc.
 * @returns {Object} Added user with ID
 */
function addAuthUser(user) {
  const db = getDB();

  const newUser = {
    id: user.id || generateStorageId("auth"),
    email: user.email,
    password: user.password,
    fullName: user.fullName,
    phone: user.phone || "",
    accountType: user.accountType || "student",
    accountStatus: user.accountStatus || "pending",
    createdAt: user.createdAt || new Date().toISOString(),
  };

  db.authUsers.push(newUser);
  saveDB(db);
  return newUser;
}

/**
 * Get authenticated user by email
 * @param {string} email - User email
 * @returns {Object|null} User object or null if not found
 */
function getAuthUser(email) {
  const db = getDB();
  return (
    db.authUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    ) || null
  );
}

/**
 * Update authenticated user
 * @param {string} email - User email
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated user or null if not found
 */
function updateAuthUser(email, updates) {
  const db = getDB();
  const userIndex = db.authUsers.findIndex(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );

  if (userIndex === -1) return null;

  db.authUsers[userIndex] = {
    ...db.authUsers[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveDB(db);
  return db.authUsers[userIndex];
}

/**
 * Authenticate user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object|null} User object if authenticated, null otherwise
 */
function authenticateUser(email, password) {
  const normalizedEmail = String(email || "").toLowerCase();
  const db = getDB();

  const profile = (db.users || []).find(
    (item) => String(item.email || "").toLowerCase() === normalizedEmail,
  );

  let user = getAuthUser(normalizedEmail);

  if (profile && profile.password && user && user.password !== profile.password) {
    updateAuthUser(normalizedEmail, {
      password: profile.password,
      accountStatus:
        profile.accountStatus ||
        profile.status ||
        user.accountStatus,
      fullName:
        profile.fullName ||
        `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
        user.fullName,
    });
    user = getAuthUser(normalizedEmail);
  }

  if (!user && profile) {
    const authUser = {
      id: profile.id || generateStorageId("auth"),
      email: profile.email,
      password: profile.password || "",
      fullName:
        profile.fullName ||
        `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
      phone: profile.phone || "",
      accountType: profile.accountType || "student",
      accountStatus:
        profile.accountStatus || profile.status || "pending",
      createdAt: profile.createdAt || new Date().toISOString(),
    };

    db.authUsers = Array.isArray(db.authUsers) ? db.authUsers : [];
    db.authUsers.push(authUser);
    saveDB(db);
    user = authUser;
  }

  if (!user) return null;
  if (user.password !== password) return null;

  const status = user.accountStatus || user.status;
  if (status === "suspended" || status === "deactivated") return null;

  return user;
}

/**
 * Add service to current database
 * @param {Object} service - Service object
 * @returns {Object} Added service with ID
 * @throws {Error} If academic year not set
 */
function addService(service) {
  const db = getDB();

  if (!db.academicYear) {
    throw new Error(
      "Academic year not set. Please set academic year in settings.",
    );
  }

  const newService = {
    id: service.id || generateStorageId("service"),
    name: service.name,
    description: service.description || "",
    price: parseFloat(service.price),
    category: service.category,
    createdAt: service.createdAt || new Date().toISOString(),
    updatedAt: service.updatedAt || new Date().toISOString(),
  };

  db.services.push(newService);
  saveDB(db);
  return newService;
}

/**
 * Add transaction to current database
 * @param {Object} tx - Transaction object
 * @returns {Object} Added transaction with ID
 * @throws {Error} If academic year not set
 */
function addTransaction(tx) {
  const db = getDB();

  if (!db.academicYear) {
    throw new Error(
      "Academic year not set. Please set academic year in settings.",
    );
  }

  const newTx = {
    id: tx.id || generateStorageId("txn"),
    serviceId: tx.serviceId,
    serviceName: tx.serviceName,
    amount: parseFloat(tx.amount),
    category: tx.category,
    status: tx.status || "pending",
    semester: tx.semester || "",
    date: tx.date || new Date().toISOString(),
    academicYear: db.academicYear,
  };

  db.transactions.push(newTx);
  saveDB(db);
  return newTx;
}

/**
 * Update transaction in current database
 * @param {string} id - Transaction ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated transaction
 * @throws {Error} If transaction not found
 */
function updateTransaction(id, updates) {
  const db = getDB();

  const txIndex = db.transactions.findIndex((t) => t.id === id);
  if (txIndex === -1) {
    throw new Error(`Transaction ${id} not found in current database`);
  }

  db.transactions[txIndex] = {
    ...db.transactions[txIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveDB(db);
  return db.transactions[txIndex];
}

/**
 * Get archived data for a specific year (read-only)
 * @param {string} year - Academic year
 * @returns {Object|null} Archived data or null if not found
 */
function getArchivedYear(year) {
  const db = getDB();
  const snap = db.archives[year];
  if (!snap) return null;
  const users = Array.isArray(snap.users) ? snap.users : [];
  const services = Array.isArray(snap.services) ? snap.services : [];
  const transactions = Array.isArray(snap.transactions)
    ? snap.transactions
    : [];
  const ratings = Array.isArray(snap.ratings) ? snap.ratings : [];
  return {
    ...snap,
    users: users.map((u) => ({ ...u })),
    services: services.map((s) => ({ ...s })),
    transactions: transactions.map((t) => ({ ...t })),
    ratings: ratings.map((r) => ({ ...r })),
  };
}

window.addEventListener("beforeunload", () => {
  const db = getDB();
  if (db.academicYear) {
    archiveCurrentYear();
  }
});

/**
 * Get all archived academic years
 * @returns {Array} Array of archived year strings
 */
function getArchivedYears() {
  const db = getDB();
  return Object.keys(db.archives).sort().reverse();
}

/**
 * Get reusable services from archives (for current year setup)
 * @param {string} fromYear - Academic year to retrieve services from
 * @returns {Array} Services from archived year
 */
function getArchivedServices(fromYear) {
  const archived = getArchivedYear(fromYear);
  return archived ? archived.services : [];
}

/**
 * Persist shared demo dataset (see demo-seed.js) into `upressease_db` so
 * superadmin pages match admin SPA + staff demo data.
 *
 * - Missing key: write full demo DB.
 * - Key exists but users, services, and transactions are all empty: merge demo
 *   rows in (keeps archives / systemSettings); sets academic year from demo if
 *   unset; re-tags transaction `academicYear` to the active year so filters work.
 */
(function ensureUpressDemoStorage() {
  if (
    typeof window === "undefined" ||
    !window.UpressDemoSeed ||
    typeof window.UpressDemoSeed.getDemoDatabase !== "function"
  ) {
    return;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(window.UpressDemoSeed.getDemoDatabase()),
      );
      return;
    }

    const db = mergeWithDefaults(JSON.parse(raw));
    const hasUsers = db.users.length > 0;
    const hasServices = db.services.length > 0;
    const hasTransactions = db.transactions.length > 0;
    const demo = window.UpressDemoSeed.getDemoDatabase();

    // If the DB already has data, we still want to merge in any NEW demo services
    // introduced in newer versions (e.g., ID Printing variants) so users don't
    // need to manually clear localStorage.
    if (hasServices && Array.isArray(demo.services) && demo.services.length) {
      // Clean up legacy demo services that were previously split into variants.
      // We now keep a single card per service type (details live in the pricing editor).
      const deprecatedDemoServiceIds = new Set([
        "svc_demo_id_new",
        "svc_demo_id_lost",
        "svc_demo_id_damaged",
        "svc_demo_id_renewal",
        "svc_demo_mug_wmsu",
        "svc_demo_mug_custom",
      ]);
      const beforeLen = db.services.length;
      db.services = db.services.filter(
        (s) => !deprecatedDemoServiceIds.has(String(s?.id || "")),
      );

      const byId = new Set(db.services.map((s) => String(s.id || "")));
      const toAdd = demo.services.filter((s) => !byId.has(String(s.id || "")));
      if (toAdd.length) {
        db.services = db.services.concat(JSON.parse(JSON.stringify(toAdd)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } else if (db.services.length !== beforeLen) {
        // Persist removal even if we didn't add anything new.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      }
      // Continue: a DB may already have services but still be missing demo transactions.
    }

    if (
      (!Array.isArray(db.transactions) || db.transactions.length === 0) &&
      Array.isArray(demo.transactions) &&
      demo.transactions.length
    ) {
      const year = db.academicYear || demo.academicYear;
      db.academicYear = year;
      const byId = new Set(db.transactions.map((t) => String(t?.id || t?.orderId || "")));
      const toAdd = demo.transactions
        .filter((t) => {
          const id = String(t?.id || t?.orderId || "");
          return id && !byId.has(id);
        })
        .map((tx) => ({ ...JSON.parse(JSON.stringify(tx)), academicYear: year }));
      if (toAdd.length) {
        db.transactions = db.transactions.concat(toAdd);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      }
      return;
    }

    if (hasUsers || hasServices || hasTransactions) {
      return;
    }

    const year = db.academicYear || demo.academicYear;
    db.academicYear = year;
    db.users = JSON.parse(JSON.stringify(demo.users));
    db.services = JSON.parse(JSON.stringify(demo.services));
    db.transactions = JSON.parse(JSON.stringify(demo.transactions)).map(
      (tx) => ({
        ...tx,
        academicYear: year,
      }),
    );
    db.ratings = JSON.parse(JSON.stringify(demo.ratings));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("UPRESS demo storage ensure skipped:", e);
  }
})();

// Staff-specific demo seeds (safe no-ops if already populated)
(function ensureStaffDemoSeeds() {
  if (typeof window === "undefined" || !window.UpressDemoSeed) return;
  try {
    if (typeof window.UpressDemoSeed.seedStaffWalkInSalesIfEmpty === "function") {
      window.UpressDemoSeed.seedStaffWalkInSalesIfEmpty();
    }
  } catch {}
  try {
    if (typeof window.UpressDemoSeed.seedOrgLedgersIfEmpty === "function") {
      window.UpressDemoSeed.seedOrgLedgersIfEmpty();
    }
  } catch {}
  try {
    if (typeof window.UpressDemoSeed.seedStudentsIfEmpty === "function") {
      window.UpressDemoSeed.seedStudentsIfEmpty();
    }
  } catch {}
  try {
    if (typeof window.UpressDemoSeed.seedFacultyIfEmpty === "function") {
      window.UpressDemoSeed.seedFacultyIfEmpty();
    }
  } catch {}
  try {
    if (typeof window.UpressDemoSeed.seedActivityRecordsIfEmpty === "function") {
      window.UpressDemoSeed.seedActivityRecordsIfEmpty();
    }
  } catch {}
})();

/**
 * Keep demo user roles aligned with seeded faculty/students.
 * (Existing localStorage may have older demo rows where some faculty were tagged as students.)
 */
(function normalizeDemoUserRoles() {
  if (typeof window === "undefined") return;
  if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") return;
  try {
    const db = window.getDB();
    const users = Array.isArray(db.users) ? db.users : [];
    if (!users.length) return;

    const emailToRole = new Map([
      ["anna.lopez@wmsu.edu.ph", "faculty"],
      ["carlo.garcia@wmsu.edu.ph", "faculty"],
    ]);

    let changed = false;
    for (const u of users) {
      const email = String(u?.email || "").toLowerCase();
      const desired = emailToRole.get(email);
      if (!desired) continue;
      if (String(u.role || "").toLowerCase() !== desired) {
        u.role = desired;
        changed = true;
      }
    }
    if (changed) window.saveDB(db);
  } catch {}
})();

/**
 * Merge demo `db.users` rows that ship with a preset `password` (e.g. test
 * accounts) into an existing local DB so email login works without a full reset.
 */
(function ensureSeededLoginUsersFromDemo() {
  if (typeof window === "undefined" || !window.UpressDemoSeed?.getDemoDatabase)
    return;
  if (typeof window.getDB !== "function" || typeof window.saveDB !== "function")
    return;
  try {
    if (localStorage.getItem(SKIP_DEMO_KEY) === "1") return;
    const db = window.getDB();
    const demoUsers = window.UpressDemoSeed.getDemoDatabase().users || [];
    const withPassword = demoUsers.filter((u) => u && u.password);
    if (!withPassword.length) return;
    db.users = Array.isArray(db.users) ? db.users : [];
    let changed = false;
    for (const row of withPassword) {
      const email = String(row.email || "").toLowerCase();
      if (!email) continue;
      const exists = db.users.some(
        (u) => String(u.email || "").toLowerCase() === email,
      );
      if (exists) continue;
      db.users.push(JSON.parse(JSON.stringify(row)));
      changed = true;
    }
    if (changed) window.saveDB(db);
  } catch (e) {
    console.warn("ensureSeededLoginUsersFromDemo:", e);
  }
})();

/**
 * Migrate older demo-seeded transaction IDs to ORG-* formats.
 * Safe to run multiple times; only affects known demo prefixes.
 */
(function normalizeDemoSeedTransactionIds() {
  if (typeof window === "undefined") return;
  if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") return;
  try {
    const db = window.getDB();
    const txs = Array.isArray(db.transactions) ? db.transactions : [];
    if (!txs.length) return;

    const exists = new Set(txs.map((t) => String(t?.id || "")));
    const out = [];
    let changed = false;

    for (const t of txs) {
      const id = String(t?.id || "");
      let newId = "";

      // Old org payment mirror IDs: txn_orgpay_<ledgerId>_<payId>
      if (id.startsWith("txn_orgpay_")) {
        const rest = id.slice("txn_orgpay_".length);
        const parts = rest.split("_org_pay_");
        if (parts.length === 2) {
          const ledgerId = parts[0];
          const paySuffix = parts[1];
          const orderKey = String(t?.orderId || ledgerId).replaceAll(" ", "_");
          newId = `ORG-PAY-${orderKey}-org_pay_${paySuffix}`;
        } else {
          // Fallback if unexpected shape
          newId = `ORG-PAY-${rest.replaceAll(" ", "_")}`;
        }
      }

      // Old activity seed IDs
      if (id === "txn_activity_seed_faculty_001") newId = "ORG-ACT-FAC-001";
      if (id === "txn_activity_seed_org_001") newId = "ORG-ACT-ORG-001";

      if (newId && newId !== id) {
        if (!exists.has(newId)) {
          out.push({ ...t, id: newId });
          exists.add(newId);
        }
        changed = true;
        continue; // drop old row
      }

      out.push(t);
    }

    if (changed) {
      db.transactions = out;
      window.saveDB(db);
    }
  } catch {}
})();

/**
 * Ensure transactions have a stable `orderId` for display consistency.
 * - Demo transactions are shaped like: id: "txn_<ORD|ORG>-...."
 * - UI should show the real order ID, not the internal txn id.
 */
(function normalizeTransactionOrderIds() {
  if (typeof window === "undefined") return;
  if (typeof window.getDB !== "function" || typeof window.saveDB !== "function") return;
  try {
    const db = window.getDB();
    const txs = Array.isArray(db.transactions) ? db.transactions : [];
    if (!txs.length) return;

    let changed = false;
    for (const t of txs) {
      if (!t || t.orderId) continue;
      const id = String(t.id || "");
      if (id.startsWith("txn_")) {
        const maybeOrder = id.slice(4);
        if (maybeOrder.startsWith("ORD-") || maybeOrder.startsWith("ORG-")) {
          t.orderId = maybeOrder;
          changed = true;
        }
      }
    }
    if (changed) window.saveDB(db);
  } catch {}
})();
