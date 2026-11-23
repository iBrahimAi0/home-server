const express = require("express");
const fs = require("fs");
const path = require("path");
const DatabaseService = require("../services/DatabaseService");
const { validateBotId, resolveSecurePath } = require("../utils/pathSecurity");

module.exports = function createDatabaseRouter(botManager) {
  const router = express.Router({ mergeParams: true });

  function getBotRoot(botId) {
    const cleanId = validateBotId(botId);
    const bot = botManager.bots.get(cleanId);
    if (!bot) {
      const err = new Error(`Bot "${cleanId}" does not exist in configuration.`);
      err.status = 404;
      throw err;
    }
    const botRoot = bot.config.path;
    if (!fs.existsSync(botRoot)) {
      fs.mkdirSync(botRoot, { recursive: true });
    }
    return { cleanId, botRoot, bot };
  }

  /**
   * GET /api/bots/:id/db
   * Lists all detected SQLite database files in the bot directory.
   */
  router.get("/", (req, res, next) => {
    try {
      const { botRoot } = getBotRoot(req.params.id);
      const databases = DatabaseService.listDatabases(botRoot);
      const defaultDb = databases.length > 0 ? databases[0] : null;

      res.json({
        success: true,
        data: {
          databases,
          defaultDb: defaultDb ? defaultDb.relativePath : "database.sqlite",
          hasDatabases: databases.length > 0,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/db/create
   * Creates a new SQLite database file and optionally registers it in .env.
   */
  router.post("/create", (req, res, next) => {
    try {
      const { cleanId, botRoot } = getBotRoot(req.params.id);
      const { name = "database.sqlite", updateEnv = true } = req.body || {};

      const created = DatabaseService.createDatabase(botRoot, name);

      // Auto-configure DATABASE_URL in bot's environment variables
      if (updateEnv) {
        const env = botManager.getBotEnv(cleanId);
        env["DATABASE_URL"] = `sqlite:///${created.relativePath}`;
        env["DB_PATH"] = created.relativePath;
        botManager.setBotEnv(cleanId, env);
      }

      botManager.appendLog(
        cleanId,
        "SYSTEM",
        `SQLite database "${created.name}" created and configured.`,
      );

      res.status(201).json({
        success: true,
        message: `Database "${created.name}" created successfully.`,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/db/tables
   * Retrieves list of tables, schemas, and row counts for a database.
   */
  router.get("/tables", (req, res, next) => {
    try {
      const { botRoot } = getBotRoot(req.params.id);
      const dbFile = (req.query.db || "database.sqlite").toString();
      const tables = DatabaseService.getTables(botRoot, dbFile);

      res.json({
        success: true,
        data: {
          database: dbFile,
          tables,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/db/table-data
   * Retrieves paginated row data for a table.
   */
  router.get("/table-data", (req, res, next) => {
    try {
      const { botRoot } = getBotRoot(req.params.id);
      const dbFile = (req.query.db || "database.sqlite").toString();
      const tableName = (req.query.table || "").toString();
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;

      if (!tableName) {
        const err = new Error("Query parameter 'table' is required.");
        err.status = 400;
        throw err;
      }

      const result = DatabaseService.getTableData(
        botRoot,
        dbFile,
        tableName,
        limit,
        offset,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/db/query
   * Executes a SQL query against the bot's database.
   */
  router.post("/query", (req, res, next) => {
    try {
      const { cleanId, botRoot } = getBotRoot(req.params.id);
      const { query, db: dbFile = "database.sqlite" } = req.body || {};

      if (!query || typeof query !== "string" || !query.trim()) {
        const err = new Error("SQL query string is required.");
        err.status = 400;
        throw err;
      }

      const result = DatabaseService.executeQuery(botRoot, dbFile, query);

      // Log non-SELECT mutations to bot system log for auditability
      if (result.type === "mutation") {
        const shortSql = query.trim().slice(0, 80).replace(/\s+/g, " ");
        botManager.appendLog(cleanId, "SYSTEM", `SQL Executed: ${shortSql}`);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/db/seed
   * Seeds template schema into the database.
   */
  router.post("/seed", (req, res, next) => {
    try {
      const { cleanId, botRoot } = getBotRoot(req.params.id);
      const { template = "general", db: dbFile = "database.sqlite" } = req.body || {};

      const result = DatabaseService.seedStarterSchema(botRoot, dbFile, template);
      botManager.appendLog(
        cleanId,
        "SYSTEM",
        `Seeded SQLite schema template "${template}" into ${dbFile}.`,
      );

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/db/download
   * Downloads the SQLite database file directly.
   */
  router.get("/download", (req, res, next) => {
    try {
      const { cleanId, botRoot } = getBotRoot(req.params.id);
      const dbFile = (req.query.db || "database.sqlite").toString();
      const dbPath = DatabaseService.resolveDbPath(botRoot, dbFile);

      if (!fs.existsSync(dbPath)) {
        const err = new Error(`Database file "${dbFile}" does not exist.`);
        err.status = 404;
        throw err;
      }

      const filename = path.basename(dbPath);
      res.download(dbPath, `${cleanId}-${filename}`);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
