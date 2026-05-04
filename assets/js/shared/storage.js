const STORAGE_KEY = "upressease_db";

const defaultDB = {
  academicYear: "",
  users: [],
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
 * Get the current database
 * @returns {Object} Current database object
 */
function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      return mergeWithDefaults(db);
    }
  } catch (error) {
    console.error("Error loading DB:", error);
  }
  return { ...defaultDB };
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
    services: db.services.map((s) => ({ ...s })),
    transactions: db.transactions.map((t) => ({ ...t })),
    ratings: db.ratings.map((r) => ({ ...r })),
    archivedAt: new Date().toISOString(),
  };

  saveDB(db);
}

/**
 * Add user to current database
 * @param {Object} user - User object
 * @returns {Object} Added user with ID
 * @throws {Error} If academic year not set
 */
function addUser(user) {
  const db = getDB();

  if (!db.academicYear) {
    throw new Error(
      "Academic year not set. Please set academic year in settings.",
    );
  }

  const newUser = {
    id: user.id || generateStorageId("user"),
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    role: user.role,
    suspended: user.suspended || false,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB(db);
  return newUser;
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
  if (db.archives[year]) {
    return {
      ...db.archives[year],
      // Make copies to prevent accidental modification
      users: db.archives[year].users.map((u) => ({ ...u })),
      services: db.archives[year].services.map((s) => ({ ...s })),
      transactions: db.archives[year].transactions.map((t) => ({ ...t })),
      ratings: db.archives[year].ratings.map((r) => ({ ...r })),
    };
  }
  return null;
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
