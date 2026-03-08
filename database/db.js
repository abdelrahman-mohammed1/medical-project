// src/database/db.js - SQLite database setup and queries
import * as SQLite from "expo-sqlite";

let db;

/**
 * Opens (or creates) the SQLite database.
 * expo-sqlite v13+ uses openDatabaseAsync (async API).
 */
export const getDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("medications.db");
    await initDatabase(db);
  }
  return db;
};

/**
 * Creates the medications table if it doesn't exist.
 * Schema:
 *   id          INTEGER PRIMARY KEY AUTOINCREMENT
 *   name        TEXT    NOT NULL
 *   description TEXT
 *   image_uri   TEXT                    (local file path from ImagePicker)
 *   notify_time TEXT    NOT NULL        (stored as "HH:MM" 24-hour string)
 *   notif_id    TEXT                    (expo-notifications identifier for cancellation)
 *   created_at  TEXT    DEFAULT (datetime('now'))
 */
const initDatabase = async (database) => {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT    DEFAULT '',
      image_uri   TEXT    DEFAULT '',
      notify_time TEXT    NOT NULL,
      notif_id    TEXT    DEFAULT '',
      created_at  TEXT    DEFAULT (datetime('now'))
    );
  `);
  console.log("✅ Database initialised");
};

// ─── CRUD helpers ────────────────────────────────────────────────────────────

/**
 * Insert a new medication record.
 * Returns the inserted row's id.
 */
export const insertMedication = async ({
  name,
  description,
  imageUri,
  notifyTime,
  notifId,
}) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO medications (name, description, image_uri, notify_time, notif_id)
     VALUES (?, ?, ?, ?, ?)`,
    [name, description || "", imageUri || "", notifyTime, notifId || ""],
  );
  return result.lastInsertRowId;
};

/**
 * Fetch all medications ordered by newest first.
 */
export const getAllMedications = async () => {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    `SELECT * FROM medications ORDER BY created_at DESC`,
  );
  return rows;
};

/**
 * Search medications by name (case-insensitive, partial match).
 */
export const searchMedications = async (query) => {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    `SELECT * FROM medications
     WHERE name LIKE ?
     ORDER BY created_at DESC`,
    [`%${query}%`],
  );
  return rows;
};

/**
 * Delete a medication by id.
 * Returns the number of rows affected.
 */
export const deleteMedication = async (id) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM medications WHERE id = ?`,
    [id],
  );
  return result.changes;
};

/**
 * Update the notification id stored against a medication.
 * Useful if you reschedule after editing.
 */
export const updateNotifId = async (id, notifId) => {
  const database = await getDatabase();
  await database.runAsync(`UPDATE medications SET notif_id = ? WHERE id = ?`, [
    notifId,
    id,
  ]);
};
