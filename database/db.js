// database/db.js
import * as SQLite from "expo-sqlite";

let db = null;
let initPromise = null;

// ─── Connection ───────────────────────────────────────────────────────────────

export const getDatabase = async () => {
  if (db) return db;
  if (!initPromise) {
    initPromise = (async () => {
      const instance = await SQLite.openDatabaseAsync("medications.db");
      await initDatabase(instance);
      db = instance;
      return db;
    })();
  }
  return initPromise;
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const initDatabase = async (database) => {
  // ── Migration: check if new schema is in place ──────────────────────────
  // If the table exists but doesn't have 'brand_name', it's the old schema.
  // Drop and recreate so the seed runs fresh on both new and upgraded installs.
  const tableExists = await database.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='medications'`
  );
  if (tableExists) {
    const columns = await database.getAllAsync(`PRAGMA table_info(medications)`);
    const hasBrandName = columns.some((c) => c.name === "brand_name");
    if (!hasBrandName) {
      // Old schema — drop so we start fresh with new schema + seed
      await database.execAsync(`DROP TABLE medications;`);
      console.log("🔄 Old schema detected — migrating to new schema");
    }
  }

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medications (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name    TEXT    NOT NULL,
      generic_name  TEXT    DEFAULT '',
      note          TEXT    DEFAULT '',
      drug_class    TEXT    DEFAULT '',
      dose          TEXT    DEFAULT '',
      form          TEXT    DEFAULT '',
      image_uri     TEXT    DEFAULT '',
      reminder_time TEXT    DEFAULT NULL,
      notif_id      TEXT    DEFAULT '',
      is_default    INTEGER DEFAULT 0,
      created_at    TEXT    DEFAULT (datetime('now'))
    );
  `);

  // Seed formulary only once
  await seedDefaultMedications(database);
  console.log("✅ Database initialised");
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

const FORMULARY = [
  // Hypertension
  { brand: "Norvasc",   generic: "Amlodipine",    cls: "Calcium channel blocker", dose: "5–10 mg daily",    form: "Tablet" },
  { brand: "Zestril",   generic: "Lisinopril",    cls: "ACE inhibitor",           dose: "10–40 mg daily",   form: "Tablet" },
  { brand: "Vasotec",   generic: "Enalapril",     cls: "ACE inhibitor",           dose: "5–20 mg daily",    form: "Tablet" },
  { brand: "Cozaar",    generic: "Losartan",      cls: "ARB",                     dose: "50–100 mg daily",  form: "Tablet" },
  { brand: "Micardis",  generic: "Telmisartan",   cls: "ARB",                     dose: "20–80 mg daily",   form: "Tablet" },
  { brand: "Tenormin",  generic: "Atenolol",      cls: "Beta blocker",            dose: "50–100 mg daily",  form: "Tablet" },
  { brand: "Lopressor", generic: "Metoprolol",    cls: "Beta blocker",            dose: "25–100 mg daily",  form: "Tablet" },
  { brand: "Altace",    generic: "Ramipril",      cls: "ACE inhibitor",           dose: "2.5–10 mg daily",  form: "Capsule" },
  { brand: "Natrilix",  generic: "Indapamide",    cls: "Diuretic",                dose: "1.5–2.5 mg daily", form: "Tablet" },
  { brand: "Hygroton",  generic: "Chlorthalidone",cls: "Diuretic",                dose: "12.5–25 mg daily", form: "Tablet" },
  // Diabetes
  { brand: "Glucophage",generic: "Metformin",     cls: "Biguanide",               dose: "500–2000 mg/day",  form: "Tablet" },
  { brand: "Amaryl",    generic: "Glimepiride",   cls: "Sulfonylurea",            dose: "1–4 mg daily",     form: "Tablet" },
  { brand: "Diamicron", generic: "Gliclazide",    cls: "Sulfonylurea",            dose: "30–120 mg daily",  form: "Tablet" },
  { brand: "Januvia",   generic: "Sitagliptin",   cls: "DPP-4 inhibitor",         dose: "100 mg daily",     form: "Tablet" },
  { brand: "Jardiance", generic: "Empagliflozin", cls: "SGLT2 inhibitor",         dose: "10–25 mg daily",   form: "Tablet" },
  { brand: "Forxiga",   generic: "Dapagliflozin", cls: "SGLT2 inhibitor",         dose: "10 mg daily",      form: "Tablet" },
  // Cardiovascular
  { brand: "Aspirin Protect", generic: "Aspirin",     cls: "Antiplatelet", dose: "75–100 mg daily", form: "Tablet" },
  { brand: "Plavix",    generic: "Clopidogrel",   cls: "Antiplatelet",            dose: "75 mg daily",      form: "Tablet" },
  { brand: "Lipitor",   generic: "Atorvastatin",  cls: "Statin",                  dose: "10–80 mg daily",   form: "Tablet" },
  { brand: "Crestor",   generic: "Rosuvastatin",  cls: "Statin",                  dose: "5–40 mg daily",    form: "Tablet" },
];

const seedDefaultMedications = async (database) => {
  const existing = await database.getFirstAsync(
    `SELECT COUNT(*) as cnt FROM medications WHERE is_default = 1`
  );
  if (existing.cnt > 0) return; // already seeded

  const stmt = await database.prepareAsync(
    `INSERT INTO medications (brand_name, generic_name, drug_class, dose, form, is_default)
     VALUES ($brand, $generic, $cls, $dose, $form, 1)`
  );
  try {
    for (const med of FORMULARY) {
      await stmt.executeAsync({
        $brand:   med.brand,
        $generic: med.generic,
        $cls:     med.cls,
        $dose:    med.dose,
        $form:    med.form,
      });
    }
    console.log(`🌱 Seeded ${FORMULARY.length} formulary medications`);
  } finally {
    await stmt.finalizeAsync();
  }
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** Insert a user-created medication (is_default = 0). */
export const insertMedication = async ({
  brandName,
  genericName = "",
  note = "",
  drugClass = "",
  dose = "",
  form = "",
  imageUri = "",
  reminderTime = null,
  notifId = "",
}) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO medications
       (brand_name, generic_name, note, drug_class, dose, form, image_uri, reminder_time, notif_id, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [brandName, genericName, note, drugClass, dose, form, imageUri, reminderTime, notifId]
  );
  return result.lastInsertRowId;
};

/** Fetch all medications — formulary first, then newest user meds. */
export const getAllMedications = async () => {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM medications ORDER BY is_default DESC, created_at DESC`
  );
};

/** Search by brand_name or generic_name (case-insensitive). */
export const searchMedications = async (query) => {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM medications
     WHERE brand_name LIKE ? OR generic_name LIKE ?
     ORDER BY is_default DESC, created_at DESC`,
    [`%${query}%`, `%${query}%`]
  );
};

/** Update a user medication. Silently ignores default medications. */
export const updateMedication = async (id, {
  brandName,
  genericName = "",
  note = "",
  drugClass = "",
  dose = "",
  form = "",
  imageUri = "",
}) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE medications
     SET brand_name=?, generic_name=?, note=?, drug_class=?, dose=?, form=?, image_uri=?
     WHERE id=? AND is_default=0`,
    [brandName, genericName, note, drugClass, dose, form, imageUri, id]
  );
  return result.changes;
};

/** Update the reminder for ANY medication (user or default). */
export const updateMedicationReminder = async (id, { reminderTime, notifId }) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE medications SET reminder_time=?, notif_id=? WHERE id=?`,
    [reminderTime ?? null, notifId ?? "", id]
  );
  return result.changes;
};

/** Delete a user medication. Silently ignores default medications. */
export const deleteMedication = async (id) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM medications WHERE id=? AND is_default=0`,
    [id]
  );
  return result.changes;
};
