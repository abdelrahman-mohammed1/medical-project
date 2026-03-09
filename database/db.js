import * as SQLite from "expo-sqlite";

let db = null;
let initPromise = null;

export const getDatabase = async () => {
  if (db) return db;

  if (!initPromise) {
    initPromise = (async () => {
      const instance = await SQLite.openDatabaseAsync("medications_v2.db");
      await initDatabase(instance);
      db = instance;
      return db;
    })();
  }

  return initPromise;
};

const initDatabase = async (database) => {
  const tableExists = await database.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='medications'`,
  );

  if (tableExists) {
    const columns = await database.getAllAsync(
      `PRAGMA table_info(medications)`,
    );
    const hasBrandName = columns.some((c) => c.name === "brand_name");
    if (!hasBrandName) {
      await database.execAsync(`DROP TABLE medications;`);
    }
  }

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      generic_name TEXT DEFAULT '',
      note TEXT DEFAULT '',
      drug_class TEXT DEFAULT '',
      dose TEXT DEFAULT '',
      form TEXT DEFAULT '',
      image_uri TEXT DEFAULT '',
      reminder_time TEXT DEFAULT NULL,
      notif_id TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await seedDefaultMedications(database);
};

/* ------------------------------------------------------- */
/* ------------------- FORMULARY DATA -------------------- */
/* ------------------------------------------------------- */

const FORMULARY = [
  // Hypertension
  {
    brand: "Norvasc",
    generic: "Amlodipine",
    cls: "Calcium channel blocker",
    dose: "5–10 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
  {
    brand: "Zestril",
    generic: "Lisinopril",
    cls: "ACE inhibitor",
    dose: "10–40 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
  },
  {
    brand: "Vasotec",
    generic: "Enalapril",
    cls: "ACE inhibitor",
    dose: "5–20 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
  },
  {
    brand: "Cozaar",
    generic: "Losartan",
    cls: "ARB",
    dose: "50–100 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=300&fit=crop",
  },
  {
    brand: "Micardis",
    generic: "Telmisartan",
    cls: "ARB",
    dose: "20–80 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
  },
  {
    brand: "Tenormin",
    generic: "Atenolol",
    cls: "Beta blocker",
    dose: "50–100 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=300&fit=crop",
  },
  {
    brand: "Lopressor",
    generic: "Metoprolol",
    cls: "Beta blocker",
    dose: "25–100 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=300&fit=crop",
  },
  {
    brand: "Altace",
    generic: "Ramipril",
    cls: "ACE inhibitor",
    dose: "2.5–10 mg daily",
    form: "Capsule",
    image:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
  },
  {
    brand: "Natrilix",
    generic: "Indapamide",
    cls: "Diuretic",
    dose: "1.5–2.5 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
  },
  {
    brand: "Hygroton",
    generic: "Chlorthalidone",
    cls: "Diuretic",
    dose: "12.5–25 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
  // Diabetes
  {
    brand: "Glucophage",
    generic: "Metformin",
    cls: "Biguanide",
    dose: "500–2000 mg/day",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=300&fit=crop",
  },
  {
    brand: "Amaryl",
    generic: "Glimepiride",
    cls: "Sulfonylurea",
    dose: "1–4 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
  },
  {
    brand: "Diamicron",
    generic: "Gliclazide",
    cls: "Sulfonylurea",
    dose: "30–120 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
  },
  {
    brand: "Januvia",
    generic: "Sitagliptin",
    cls: "DPP-4 inhibitor",
    dose: "100 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
  {
    brand: "Jardiance",
    generic: "Empagliflozin",
    cls: "SGLT2 inhibitor",
    dose: "10–25 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
  },
  {
    brand: "Forxiga",
    generic: "Dapagliflozin",
    cls: "SGLT2 inhibitor",
    dose: "10 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=300&fit=crop",
  },
  {
    brand: "Lantus",
    generic: "Insulin glargine",
    cls: "Long-acting insulin",
    dose: "Individualized",
    form: "Injection",
    image:
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
  },
  {
    brand: "Humalog",
    generic: "Insulin lispro",
    cls: "Rapid insulin",
    dose: "Individualized",
    form: "Injection",
    image:
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
  },
  {
    brand: "Actos",
    generic: "Pioglitazone",
    cls: "TZD",
    dose: "15–45 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=300&fit=crop",
  },
  {
    brand: "Victoza",
    generic: "Liraglutide",
    cls: "GLP-1 agonist",
    dose: "0.6–1.8 mg daily",
    form: "Injection",
    image:
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
  },
  // Cardiovascular
  {
    brand: "Aspirin Protect",
    generic: "Aspirin",
    cls: "Antiplatelet",
    dose: "75–100 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
  {
    brand: "Plavix",
    generic: "Clopidogrel",
    cls: "Antiplatelet",
    dose: "75 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
  },
  {
    brand: "Lipitor",
    generic: "Atorvastatin",
    cls: "Statin",
    dose: "10–80 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
  },
  {
    brand: "Crestor",
    generic: "Rosuvastatin",
    cls: "Statin",
    dose: "5–40 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=300&fit=crop",
  },
  {
    brand: "Nitrostat",
    generic: "Nitroglycerin",
    cls: "Nitrate",
    dose: "0.3–0.6 mg PRN",
    form: "Sublingual",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
  },
  {
    brand: "Imdur",
    generic: "Isosorbide mononitrate",
    cls: "Nitrate",
    dose: "20–60 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=300&fit=crop",
  },
  {
    brand: "Lanoxin",
    generic: "Digoxin",
    cls: "Cardiac glycoside",
    dose: "0.125–0.25 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=300&fit=crop",
  },
  {
    brand: "Coreg",
    generic: "Carvedilol",
    cls: "Beta blocker",
    dose: "3.125–25 mg twice daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
  },
  {
    brand: "Lasix",
    generic: "Furosemide",
    cls: "Loop diuretic",
    dose: "20–80 mg daily",
    form: "Tablet/Injection",
    image:
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
  },
  {
    brand: "Aldactone",
    generic: "Spironolactone",
    cls: "K-sparing diuretic",
    dose: "25–50 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
  // Alzheimer's
  {
    brand: "Aricept",
    generic: "Donepezil",
    cls: "Cholinesterase inhibitor",
    dose: "5–10 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
  },
  {
    brand: "Exelon",
    generic: "Rivastigmine",
    cls: "Cholinesterase inhibitor",
    dose: "3–6 mg twice daily",
    form: "Capsule/Patch",
    image:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
  },
  {
    brand: "Razadyne",
    generic: "Galantamine",
    cls: "Cholinesterase inhibitor",
    dose: "8–24 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
  },
  {
    brand: "Namenda",
    generic: "Memantine",
    cls: "NMDA antagonist",
    dose: "10–20 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=300&fit=crop",
  },
  {
    brand: "Namzaric",
    generic: "Memantine + Donepezil",
    cls: "Combination",
    dose: "As prescribed",
    form: "Capsule",
    image:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
  },
  {
    brand: "Aduhelm",
    generic: "Aducanumab",
    cls: "Monoclonal antibody",
    dose: "Monthly IV",
    form: "Injection",
    image:
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
  },
  {
    brand: "Leqembi",
    generic: "Lecanemab",
    cls: "Monoclonal antibody",
    dose: "IV infusion",
    form: "Injection",
    image:
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
  },
  {
    brand: "Cognex",
    generic: "Tacrine",
    cls: "Cholinesterase inhibitor",
    dose: "10–40 mg daily",
    form: "Capsule",
    image:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
  },
  {
    brand: "Vitamin E",
    generic: "Tocopherol",
    cls: "Antioxidant",
    dose: "400–800 IU",
    form: "Capsule",
    image:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
  },
  {
    brand: "Eldepryl",
    generic: "Selegiline",
    cls: "MAO inhibitor",
    dose: "5–10 mg daily",
    form: "Tablet",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
];

/* ------------------------------------------------------- */
/* -------------------- SEED FUNCTION -------------------- */
/* ------------------------------------------------------- */

const seedDefaultMedications = async (database) => {
  const existing = await database.getFirstAsync(
    `SELECT COUNT(*) as cnt FROM medications WHERE is_default = 1`,
  );
  if (existing.cnt > 0) return;

  const stmt = await database.prepareAsync(
    `INSERT INTO medications (brand_name,generic_name,drug_class,dose,form,image_uri,is_default)
     VALUES ($brand,$generic,$cls,$dose,$form,$image,1)`,
  );

  try {
    for (const med of FORMULARY) {
      await stmt.executeAsync({
        $brand: med.brand,
        $generic: med.generic,
        $cls: med.cls,
        $dose: med.dose,
        $form: med.form,
        $image: med.image,
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
};

/* ------------------------------------------------------- */
/* -------------------- EXPORTED CRUD -------------------- */
/* ------------------------------------------------------- */

export const getAllMedications = async () => {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM medications ORDER BY is_default DESC, created_at DESC`,
  );
};

export const getMedicationsWithReminders = async () => {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM medications 
     WHERE reminder_time IS NOT NULL AND reminder_time != '' 
     ORDER BY reminder_time ASC`,
  );
};

export const insertMedication = async (fields) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO medications (brand_name, generic_name, note, drug_class, dose, form, image_uri, reminder_time, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      fields.brandName,
      fields.genericName || "",
      fields.note || "",
      fields.drugClass || "",
      fields.dose || "",
      fields.form || "",
      fields.imageUri || "",
      fields.reminderTime || null,
    ],
  );
  return result.lastInsertRowId;
};

export const updateMedication = async (id, fields) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE medications 
     SET brand_name=?, generic_name=?, note=?, drug_class=?, dose=?, form=?, image_uri=?, reminder_time=?
     WHERE id=? AND is_default=0`,
    [
      fields.brandName,
      fields.genericName || "",
      fields.note || "",
      fields.drugClass || "",
      fields.dose || "",
      fields.form || "",
      fields.imageUri || "",
      fields.reminderTime || null,
      id,
    ],
  );
  return result.changes;
};

// ── Update image only — works for ALL medications (default + user) ────────────
export const updateMedicationImage = async (id, imageUri) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE medications SET image_uri=? WHERE id=?`,
    [imageUri || "", id],
  );
  return result.changes;
};

export const updateMedicationReminder = async (
  id,
  { reminderTime, notifId },
) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE medications SET reminder_time=?, notif_id=? WHERE id=?`,
    [reminderTime || null, notifId || "", id],
  );
  return result.changes;
};

export const deleteMedication = async (id) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM medications WHERE id=? AND is_default=0`,
    [id],
  );
  return result.changes;
};

export const searchMedications = async (query) => {
  const database = await getDatabase();
  const q = `%${query}%`;
  return database.getAllAsync(
    `SELECT * FROM medications 
     WHERE brand_name LIKE ? OR generic_name LIKE ? OR drug_class LIKE ?
     ORDER BY is_default DESC, created_at DESC`,
    [q, q, q],
  );
};
