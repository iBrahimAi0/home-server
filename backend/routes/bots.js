const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const createFilesRouter = require("./files");
const createGitRouter = require("./git");
const { validateBotId } = require("../utils/pathSecurity");
const { scaffoldTemplate } = require("../utils/botTemplates");
const {
  extractZipSafely,
  createZipArchive,
  inspectProjectContents,
} = require("../utils/archiveSecurity");

const tempUploadDir = path.join(__dirname, "../uploads_temp");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const upload = multer({
  dest: tempUploadDir,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80MB max project archive upload
  },
});

module.exports = function createBotsRouter(botManager) {
  const router = express.Router();

  // Mount secure bot file management sub-router
  router.use("/:id/files", createFilesRouter(botManager));

  // Mount restricted bot Git management sub-router
  router.use("/:id/git", createGitRouter(botManager));

  /**
   * GET /api/bots
   * Returns all configured bots with current runtime metrics.
   */
  router.get("/", (req, res, next) => {
    try {
      const bots = botManager.getAllBots();
      res.json({
        success: true,
        data: bots,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots
   * Creates a new bot entry. Supports direct JSON payload or multipart form data
   * containing an uploaded project ZIP archive or a starter template selection.
   */
  router.post("/", upload.single("projectArchive"), async (req, res, next) => {
    const uploadedFile = req.file;
    try {
      let {
        id,
        name,
        description,
        path: botPath,
        command,
        args,
        autoStart,
        env,
        template,
        installDependencies,
      } = req.body || {};

      // Derive the ID from the display name if it wasn't supplied — the
      // Bot ID is just a URL-safe slug and shouldn't block bot creation.
      if ((!id || !String(id).trim()) && name && String(name).trim()) {
        id = String(name)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      const cleanId = validateBotId(id);

      // Parse JSON fields if coming from FormData
      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch {
          args = args.split(/\s+/).filter(Boolean);
        }
      }
      if (typeof env === "string") {
        try {
          env = JSON.parse(env);
        } catch {
          env = {};
        }
      }
      if (typeof autoStart === "string") {
        autoStart = autoStart === "true";
      }
      if (typeof installDependencies === "string") {
        installDependencies = installDependencies === "true";
      }

      // Default command/args if not set
      let chosenCommand = command || "npm";
      let chosenArgs =
        Array.isArray(args) && args.length > 0 ? args : ["start"];

      // 1. Create the bot in BotManager
      const created = botManager.addBot({
        id: cleanId,
        name,
        description,
        path: botPath,
        command: chosenCommand,
        args: chosenArgs,
        autoStart: autoStart,
        env: env || {},
      });

      const targetDir = created.path;

      // 2. If a starter template was chosen, scaffold it
      if (template && template.trim()) {
        try {
          const tplResult = scaffoldTemplate(
            targetDir,
            template.trim(),
            env || {},
          );
          // If user didn't customize command/args, adopt template defaults
          if (!command || command === "npm") {
            chosenCommand = tplResult.command;
            chosenArgs = tplResult.args;
            botManager.updateBot(cleanId, {
              command: chosenCommand,
              args: chosenArgs,
            });
          }
          botManager.appendLog(
            cleanId,
            "SYSTEM",
            `Scaffolded starter template: ${tplResult.name}`,
          );
        } catch (tplErr) {
          console.warn(
            `[BotRouter] Failed to scaffold template ${template}:`,
            tplErr.message,
          );
        }
      }

      // 3. If an archive was uploaded, extract it safely
      if (uploadedFile) {
        try {
          await extractZipSafely(uploadedFile.path, targetDir);
          botManager.appendLog(
            cleanId,
            "SYSTEM",
            `Project ZIP archive extracted into ${targetDir}.`,
          );

          // Inspect extracted project to auto-detect command and args if not specified
          const detected = inspectProjectContents(targetDir);
          if (!command || command.trim() === "npm") {
            if (detected.command && detected.command !== chosenCommand) {
              chosenCommand = detected.command;
              chosenArgs = detected.args;
              botManager.updateBot(cleanId, {
                command: chosenCommand,
                args: chosenArgs,
              });
              botManager.appendLog(
                cleanId,
                "SYSTEM",
                `Detected runtime: ${chosenCommand} ${chosenArgs.join(" ")}`,
              );
            }
          }
        } finally {
          if (fs.existsSync(uploadedFile.path)) {
            try {
              fs.unlinkSync(uploadedFile.path);
            } catch {
              // ignore
            }
          }
        }
      }

      // 4. Save any initial environment variables to .env
      if (env && Object.keys(env).length > 0) {
        botManager.setBotEnv(cleanId, env);
      }

      // 5. If installDependencies requested, trigger in background
      if (installDependencies) {
        botManager.installDependencies(cleanId).catch((err) => {
          console.warn(
            `[BotRouter] Post-create dependency install error for ${cleanId}:`,
            err.message,
          );
        });
      }

      res.status(201).json({
        success: true,
        message: `Bot "${created.name}" created successfully.`,
        data: botManager.getBotData(cleanId),
      });
    } catch (err) {
      if (uploadedFile && fs.existsSync(uploadedFile.path)) {
        try {
          fs.unlinkSync(uploadedFile.path);
        } catch {
          // ignore
        }
      }
      next(err);
    }
  });

  /**
   * GET /api/bots/:id
   * Returns detailed information for a single bot.
   */
  router.get("/:id", (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const bot = botManager.getBotData(cleanId);
      if (!bot) {
        const err = new Error(`Bot "${cleanId}" not found in configuration.`);
        err.status = 404;
        throw err;
      }
      res.json({
        success: true,
        data: bot,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /api/bots/:id
   * Updates an existing bot's configuration.
   */
  router.put("/:id", (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const {
        name,
        description,
        path: botPath,
        command,
        args,
        autoStart,
        env,
      } = req.body || {};

      const updated = botManager.updateBot(cleanId, {
        name,
        description,
        path: botPath,
        command,
        args,
        autoStart,
        env,
      });

      res.json({
        success: true,
        message: `Bot "${updated.name}" updated successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /api/bots/:id
   * Permanently removes a bot from configuration (stops it first if running).
   */
  router.delete("/:id", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.removeBot(cleanId);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/logs
   * Returns recent logs stored in memory for this bot.
   */
  router.get("/:id/logs", (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const limit = Math.min(
        1000,
        Math.max(1, parseInt(req.query.limit, 10) || 300),
      );
      const bot = botManager.getBotData(cleanId);
      if (!bot) {
        const err = new Error(`Bot "${cleanId}" not found in configuration.`);
        err.status = 404;
        throw err;
      }

      const logs = botManager.getBotLogs(cleanId, limit);
      res.json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/upload-project
   * Uploads and unpacks a .zip project archive directly into the bot root directory.
   */
  router.post(
    "/:id/upload-project",
    upload.single("archive"),
    async (req, res, next) => {
      const uploadedFile = req.file;
      try {
        const cleanId = validateBotId(req.params.id);
        const bot = botManager.getBotData(cleanId);
        if (!bot) {
          const err = new Error(`Bot "${cleanId}" not found in configuration.`);
          err.status = 404;
          throw err;
        }

        if (!uploadedFile) {
          const err = new Error("No project archive (.zip) provided.");
          err.status = 400;
          throw err;
        }

        const botDir = bot.path;
        const extractResult = await extractZipSafely(uploadedFile.path, botDir);
        botManager.appendLog(
          cleanId,
          "SYSTEM",
          `Uploaded project archive extracted (${extractResult.extractedCount} files).`,
        );

        const runInstall =
          req.body.runInstall === "true" || req.body.runInstall === true;
        const restart =
          req.body.restart === "true" || req.body.restart === true;

        // Inspect extracted project to update command/entrypoint if helpful
        const detected = inspectProjectContents(botDir);
        if (detected.detectedEntry && (!bot.command || bot.command === "npm")) {
          botManager.updateBot(cleanId, {
            command: detected.command,
            args: detected.args,
          });
        }

        if (runInstall) {
          botManager
            .installDependencies(cleanId)
            .then(() => {
              if (restart && bot.status === "online") {
                botManager.restartBot(cleanId).catch(console.error);
              }
            })
            .catch((e) => {
              botManager.appendLog(
                cleanId,
                "ERROR",
                `Install after project upload failed: ${e.message}`,
              );
            });
        } else if (restart && bot.status === "online") {
          await botManager.restartBot(cleanId);
        }

        res.json({
          success: true,
          message: `Project uploaded and deployed successfully (${extractResult.extractedCount} files extracted).`,
          data: {
            extractedCount: extractResult.extractedCount,
            bot: botManager.getBotData(cleanId),
          },
        });
      } catch (err) {
        next(err);
      } finally {
        if (uploadedFile && fs.existsSync(uploadedFile.path)) {
          try {
            fs.unlinkSync(uploadedFile.path);
          } catch {
            // ignore
          }
        }
      }
    },
  );

  /**
   * POST /api/bots/:id/install
   * Triggers npm install or pip install for the bot project.
   */
  router.post("/:id/install", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.installDependencies(cleanId);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/export
   * Generates and downloads a .zip archive of the bot project.
   */
  router.get("/:id/export", (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const bot = botManager.getBotData(cleanId);
      if (!bot) {
        const err = new Error(`Bot "${cleanId}" not found in configuration.`);
        err.status = 404;
        throw err;
      }

      const zipBuffer = createZipArchive(bot.path);
      const filename = `${cleanId}-project-${new Date().toISOString().slice(0, 10)}.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", zipBuffer.length);
      res.send(zipBuffer);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/env
   * Retrieves secret environment variables for the bot.
   */
  router.get("/:id/env", (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const env = botManager.getBotEnv(cleanId);
      res.json({
        success: true,
        data: env,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /api/bots/:id/env
   * Updates secret environment variables for the bot.
   */
  router.put("/:id/env", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const { env, restart } = req.body || {};
      const result = botManager.setBotEnv(cleanId, env || {});

      const bot = botManager.getBotData(cleanId);
      if (restart && bot && bot.status === "online") {
        await botManager.restartBot(cleanId);
      }

      res.json({
        success: true,
        message: result.message,
        data: result.env,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/start
   */
  router.post("/:id/start", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.startBot(cleanId);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(cleanId),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/stop
   */
  router.post("/:id/stop", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.stopBot(cleanId);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(cleanId),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/restart
   */
  router.post("/:id/restart", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.restartBot(cleanId);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(cleanId),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/stdin
   * Sends input text directly to a running bot process's standard input.
   */
  router.post("/:id/stdin", (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const { input } = req.body;
      if (typeof input !== "string") {
        const err = new Error(
          'Field "input" is required and must be a string.',
        );
        err.status = 400;
        throw err;
      }
      const result = botManager.sendStdin(cleanId, input);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/exec
   * Executes a shell command inside the bot's working directory.
   */
  router.post("/:id/exec", async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const { command } = req.body;
      if (!command || typeof command !== "string" || !command.trim()) {
        const err = new Error(
          'Field "command" is required and must be a non-empty string.',
        );
        err.status = 400;
        throw err;
      }
      const result = await botManager.executeCommand(cleanId, command);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
