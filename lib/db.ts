import { createClient, type Client } from "@libsql/client";
import type { TimeShortcut, FavoritePlate, SessionLog } from "./types";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    const dbPath = process.env.DATABASE_PATH || "./data/parkeerhulp.db";
    client = createClient({
      url: `file:${dbPath}`,
    });
  }
  return client;
}

export async function initDb(): Promise<void> {
  const db = getClient();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS shortcuts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      label      TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorite_plates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      plate       TEXT NOT NULL UNIQUE,
      description TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      plate      TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL,
      zone       TEXT,
      cost       REAL,
      egis_id    TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default shortcuts if table is empty
  const count = await db.execute("SELECT COUNT(*) as cnt FROM shortcuts");
  if (Number(count.rows[0].cnt) === 0) {
    await db.executeMultiple(`
      INSERT INTO shortcuts (label, start_time, end_time, sort_order) VALUES ('Hele dag', '09:00', '19:00', 1);
      INSERT INTO shortcuts (label, start_time, end_time, sort_order) VALUES ('Vanaf nu', 'now', '19:00', 2);
      INSERT INTO shortcuts (label, start_time, end_time, sort_order) VALUES ('Ochtend', 'now', '10:00', 3);
    `);
  }
}

// ============================================
// Shortcuts CRUD
// ============================================

export async function getShortcuts(): Promise<TimeShortcut[]> {
  await initDb();
  const db = getClient();
  const result = await db.execute(
    "SELECT * FROM shortcuts ORDER BY sort_order ASC"
  );
  return result.rows as unknown as TimeShortcut[];
}

export async function createShortcut(
  shortcut: Omit<TimeShortcut, "id" | "created_at">
): Promise<TimeShortcut> {
  await initDb();
  const db = getClient();
  const result = await db.execute({
    sql: "INSERT INTO shortcuts (label, start_time, end_time, sort_order) VALUES (?, ?, ?, ?) RETURNING *",
    args: [
      shortcut.label,
      shortcut.start_time,
      shortcut.end_time,
      shortcut.sort_order,
    ],
  });
  return result.rows[0] as unknown as TimeShortcut;
}

export async function updateShortcut(
  id: number,
  shortcut: Partial<Omit<TimeShortcut, "id" | "created_at">>
): Promise<TimeShortcut | null> {
  await initDb();
  const db = getClient();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (shortcut.label !== undefined) {
    fields.push("label = ?");
    values.push(shortcut.label);
  }
  if (shortcut.start_time !== undefined) {
    fields.push("start_time = ?");
    values.push(shortcut.start_time);
  }
  if (shortcut.end_time !== undefined) {
    fields.push("end_time = ?");
    values.push(shortcut.end_time);
  }
  if (shortcut.sort_order !== undefined) {
    fields.push("sort_order = ?");
    values.push(shortcut.sort_order);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await db.execute({
    sql: `UPDATE shortcuts SET ${fields.join(", ")} WHERE id = ? RETURNING *`,
    args: values,
  });

  return result.rows.length > 0
    ? (result.rows[0] as unknown as TimeShortcut)
    : null;
}

export async function deleteShortcut(id: number): Promise<boolean> {
  await initDb();
  const db = getClient();
  const result = await db.execute({
    sql: "DELETE FROM shortcuts WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

// ============================================
// Favorite Plates CRUD
// ============================================

export async function getFavoritePlates(): Promise<FavoritePlate[]> {
  await initDb();
  const db = getClient();
  const result = await db.execute(
    "SELECT * FROM favorite_plates ORDER BY sort_order ASC"
  );
  return result.rows as unknown as FavoritePlate[];
}

export async function createFavoritePlate(
  plate: Omit<FavoritePlate, "id" | "created_at">
): Promise<FavoritePlate> {
  await initDb();
  const db = getClient();
  const result = await db.execute({
    sql: "INSERT INTO favorite_plates (plate, description, sort_order) VALUES (?, ?, ?) RETURNING *",
    args: [plate.plate, plate.description || null, plate.sort_order],
  });
  return result.rows[0] as unknown as FavoritePlate;
}

export async function deleteFavoritePlate(id: number): Promise<boolean> {
  await initDb();
  const db = getClient();
  const result = await db.execute({
    sql: "DELETE FROM favorite_plates WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

// ============================================
// Session Log
// ============================================

export async function logSession(
  session: Omit<SessionLog, "id" | "created_at">
): Promise<void> {
  await initDb();
  const db = getClient();
  await db.execute({
    sql: "INSERT INTO session_log (plate, start_time, end_time, zone, cost, egis_id) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      session.plate,
      session.start_time,
      session.end_time,
      session.zone || null,
      session.cost || null,
      session.egis_id || null,
    ],
  });
}

export async function getSessionLogs(limit = 20): Promise<SessionLog[]> {
  await initDb();
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM session_log ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows as unknown as SessionLog[];
}
