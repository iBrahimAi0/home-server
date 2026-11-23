const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { resolveSecurePath, validateEntityName } = require("../utils/pathSecurity");

/**
 * Service managing SQLite databases for bots.
 * Zero-dependency, powered by Node.js built-in node:sqlite.
 */
class DatabaseService {
  /**
   * Scans bot directory for existing SQLite database files (.sqlite, .db, .sqlite3).
   */
  static listDatabases(botDir) {
    if (!fs.existsSync(botDir)) return [];

    const found = [];
    const scanDir = (currentDir, depth = 0) => {
      if (depth > 2) return;
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === "node_modules" || entry.name === ".git") continue;
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if ([".sqlite", ".sqlite3", ".db"].includes(ext)) {
              const rel = path.relative(botDir, fullPath).replace(/\\/g, "/");
              try {
                const stat = fs.statSync(fullPath);
                found.push({
                  name: entry.name,
                  relativePath: rel,
                  sizeBytes: stat.size,
                  sizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
                  modifiedAt: stat.mtime.toISOString(),
                });
              } catch {
                // ignore
              }
            }
          }
        }
      } catch {
        // ignore
      }
    };

    scanDir(botDir);
    return found;
  }

  /**
   * Resolves safe path to a database file inside the bot root.
   */
  static resolveDbPath(botDir, dbRelative = "database.sqlite") {
    const cleanRel = (dbRelative || "database.sqlite").trim().replace(/\\/g, "/");
    return resolveSecurePath(botDir, cleanRel);
  }

  /**
   * Creates a new SQLite database file if it doesn't already exist.
   */
  static createDatabase(botDir, dbName = "database.sqlite") {
    const cleanName = validateEntityName(dbName.endsWith(".sqlite") || dbName.endsWith(".db") ? dbName : `${dbName}.sqlite`);
    const dbPath = resolveSecurePath(botDir, cleanName);

    if (fs.existsSync(dbPath)) {
      const err = new Error(`Database file "${cleanName}" already exists.`);
      err.status = 400;
      throw err;
    }

    const parentDir = path.dirname(dbPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Initialize blank SQLite database
    const db = new DatabaseSync(dbPath);
    try {
      db.exec("VACUUM;");
    } finally {
      db.close();
    }

    const stat = fs.statSync(dbPath);
    return {
      name: cleanName,
      relativePath: cleanName,
      sizeBytes: stat.size,
      sizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
      modifiedAt: stat.mtime.toISOString(),
    };
  }

  /**
   * Inspects tables and schemas in a database.
   */
  static getTables(botDir, dbRelative = "database.sqlite") {
    const dbPath = this.resolveDbPath(botDir, dbRelative);
    if (!fs.existsSync(dbPath)) {
      const err = new Error(`Database file "${dbRelative}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const db = new DatabaseSync(dbPath);
    try {
      // Find all user tables
      const tablesRaw = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
        )
        .all();

      const tables = [];
      for (const t of tablesRaw) {
        const tableName = t.name;
        // Columns schema
        const colsRaw = db.prepare(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`).all();
        const columns = colsRaw.map((c) => ({
          cid: c.cid,
          name: c.name,
          type: c.type || "ANY",
          notnull: Boolean(c.notnull),
          defaultValue: c.dflt_value,
          pk: Boolean(c.pk),
        }));

        // Row count
        let count = 0;
        try {
          const countRes = db
            .prepare(`SELECT count(*) as count FROM "${tableName.replace(/"/g, '""')}"`)
            .get();
          count = countRes ? countRes.count : 0;
        } catch {
          count = 0;
        }

        tables.push({
          name: tableName,
          columns,
          rowCount: count,
        });
      }

      return tables;
    } finally {
      db.close();
    }
  }

  /**
   * Fetches paginated rows for a given table.
   */
  static getTableData(botDir, dbRelative = "database.sqlite", tableName, limit = 50, offset = 0) {
    const dbPath = this.resolveDbPath(botDir, dbRelative);
    if (!fs.existsSync(dbPath)) {
      const err = new Error(`Database file "${dbRelative}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const cleanLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const cleanOffset = Math.max(0, parseInt(offset, 10) || 0);

    const db = new DatabaseSync(dbPath);
    try {
      // Verify table exists
      const exists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(tableName);
      if (!exists) {
        const err = new Error(`Table "${tableName}" not found in database.`);
        err.status = 404;
        throw err;
      }

      const escapedTable = tableName.replace(/"/g, '""');
      const colsRaw = db.prepare(`PRAGMA table_info("${escapedTable}")`).all();
      const columns = colsRaw.map((c) => c.name);

      const countRes = db.prepare(`SELECT count(*) as count FROM "${escapedTable}"`).get();
      const totalRows = countRes ? countRes.count : 0;

      const rows = db
        .prepare(`SELECT * FROM "${escapedTable}" LIMIT ? OFFSET ?`)
        .all(cleanLimit, cleanOffset);

      return {
        table: tableName,
        columns,
        rows: rows.map((r) => ({ ...r })),
        totalRows,
        limit: cleanLimit,
        offset: cleanOffset,
      };
    } finally {
      db.close();
    }
  }

  /**
   * Executes arbitrary SQL query against the bot's database.
   */
  static executeQuery(botDir, dbRelative = "database.sqlite", sqlString) {
    const dbPath = this.resolveDbPath(botDir, dbRelative);
    if (!fs.existsSync(dbPath)) {
      const err = new Error(`Database file "${dbRelative}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const trimmed = (sqlString || "").trim();
    if (!trimmed) {
      const err = new Error("Query cannot be empty.");
      err.status = 400;
      throw err;
    }

    const startTime = Date.now();
    const db = new DatabaseSync(dbPath);
    try {
      const isSelect = /^(SELECT|PRAGMA|EXPLAIN)\b/i.test(trimmed);

      if (isSelect) {
        const stmt = db.prepare(trimmed);
        const rows = stmt.all();
        const durationMs = Date.now() - startTime;
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        return {
          type: "select",
          columns,
          rows: rows.map((r) => ({ ...r })),
          count: rows.length,
          durationMs,
        };
      } else {
        // Multi-statement or mutation query
        db.exec(trimmed);
        const durationMs = Date.now() - startTime;

        return {
          type: "mutation",
          message: "Query executed successfully.",
          durationMs,
        };
      }
    } finally {
      db.close();
    }
  }

  /**
   * Seeds starter schema and sample tables into database.
   */
  static seedStarterSchema(botDir, dbRelative = "database.sqlite", template = "general") {
    const dbPath = this.resolveDbPath(botDir, dbRelative);
    if (!fs.existsSync(dbPath)) {
      this.createDatabase(botDir, dbRelative);
    }

    let sql = "";
    switch (template) {
      case "economy":
        sql = `
          CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT,
            balance INTEGER DEFAULT 100,
            bank INTEGER DEFAULT 0,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        break;
      case "moderation":
        sql = `
          CREATE TABLE IF NOT EXISTS warnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS mod_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            user_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        break;
      case "reaction_roles":
        sql = `
          CREATE TABLE IF NOT EXISTS reaction_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            emoji TEXT NOT NULL,
            role_id TEXT NOT NULL,
            guild_id TEXT NOT NULL
          );
        `;
        break;
      case "general":
      default:
        sql = `
          CREATE TABLE IF NOT EXISTS bot_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS command_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command TEXT NOT NULL,
            user_id TEXT NOT NULL,
            guild_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          INSERT OR IGNORE INTO bot_settings (key, value) VALUES 
            ('prefix', '!'),
            ('maintenance_mode', 'false'),
            ('default_volume', '100');
        `;
        break;
    }

    const db = new DatabaseSync(dbPath);
    try {
      db.exec(sql);
      return {
        success: true,
        template,
        message: `Schema for "${template}" template applied successfully.`,
      };
    } finally {
      db.close();
    }
  }
}

module.exports = DatabaseService;
