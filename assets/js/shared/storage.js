const STORAGE_KEY = "upressease_db";

const defaultDB = {
  academicYear: "",
  users: [],
  authUsers: [],
  services: [],
  transactions: [],
  ratings: [],
  archives: {},
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
        return loadDemoData();
      }
      return merged;
    }
  } catch (error) {
    console.error("Error loading DB:", error);
  }
  // No data found, load demo data
  return loadDemoData();
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
  let user = getAuthUser(normalizedEmail);
  const db = getDB();

  if (!user) {
    user = (db.users || []).find(
      (item) =>
        String(item.email || "").toLowerCase() === normalizedEmail,
    );

    if (user) {
      const authUser = {
        id: user.id || generateStorageId("auth"),
        email: user.email,
        password: user.password || "",
        fullName:
          user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        phone: user.phone || "",
        accountType: user.accountType || "student",
        accountStatus: user.accountStatus || user.status || "pending",
        createdAt: user.createdAt || new Date().toISOString(),
      };

      db.authUsers = Array.isArray(db.authUsers) ? db.authUsers : [];
      db.authUsers.push(authUser);
      saveDB(db);
      user = authUser;
    }
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
