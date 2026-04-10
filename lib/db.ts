import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "educurric.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  // Add city column to existing DBs that predate this field
  try { db.exec("ALTER TABLE institutions ADD COLUMN city TEXT NOT NULL DEFAULT ''"); } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      state     TEXT NOT NULL,
      inst_type TEXT NOT NULL CHECK(inst_type IN ('2yr','4yr')),
      city      TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS ipeds_completions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      year             INTEGER NOT NULL,
      state            TEXT NOT NULL,
      inst_type        TEXT NOT NULL CHECK(inst_type IN ('2yr','4yr')),
      institution_id   TEXT REFERENCES institutions(id),
      institution_name TEXT,
      cip_code         TEXT NOT NULL,
      cip_title        TEXT NOT NULL,
      completions      INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_completions_year    ON ipeds_completions(year);
    CREATE INDEX IF NOT EXISTS idx_completions_state   ON ipeds_completions(state);
    CREATE INDEX IF NOT EXISTS idx_completions_cip     ON ipeds_completions(cip_code);
    CREATE INDEX IF NOT EXISTS idx_completions_inst    ON ipeds_completions(institution_id);

    CREATE TABLE IF NOT EXISTS bls_employment (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      year        INTEGER NOT NULL,
      state       TEXT NOT NULL,
      soc_code    TEXT NOT NULL,
      soc_title   TEXT NOT NULL,
      employment  INTEGER NOT NULL,
      mean_wage   REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_employment_year  ON bls_employment(year);
    CREATE INDEX IF NOT EXISTS idx_employment_state ON bls_employment(state);
    CREATE INDEX IF NOT EXISTS idx_employment_soc   ON bls_employment(soc_code);

    CREATE TABLE IF NOT EXISTS cip_soc_crosswalk (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      cip_code  TEXT NOT NULL,
      cip_title TEXT NOT NULL,
      soc_code  TEXT NOT NULL,
      soc_title TEXT NOT NULL,
      UNIQUE(cip_code, soc_code)
    );
  `);
}
