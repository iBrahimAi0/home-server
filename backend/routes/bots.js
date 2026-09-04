const express = require('express');
const createFilesRouter = require('./files');
const createGitRouter = require('./git');
const { validateBotId } = require('../utils/pathSecurity');
const router = express.Router();

module.exports = function createBotsRouter(botManager) {
  // Mount secure bot file management sub-router
  router.use('/:id/files', createFilesRouter(botManager));

  // Mount restricted bot Git management sub-router
  router.use('/:id/git', createGitRouter(botManager));

  /**
   * GET /api/bots
   * Returns all configured bots with current runtime metrics.
   */
  router.get('/', (req, res, next) => {
    try {
      const bots = botManager.getAllBots();
      res.json({
        success: true,
        data: bots
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots
   * Creates a new bot entry from the web dashboard and persists it to bots.json.
   */
  router.post('/', (req, res, next) => {
    try {
      const { id, name, description, path: botPath, command, args, autoStart, env } = req.body || {};
      const cleanId = validateBotId(id);

      const created = botManager.addBot({
        id: cleanId,
        name,
        description,
        path: botPath,
        command,
        args,
        autoStart,
        env
      });

      res.status(201).json({
        success: true,
        message: `Bot "${created.name}" created successfully.`,
        data: created
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id
   * Returns detailed information for a single bot.
   */
  router.get('/:id', (req, res, next) => {
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
        data: bot
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /api/bots/:id
   * Updates an existing bot's configuration.
   */
  router.put('/:id', (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const { name, description, path: botPath, command, args, autoStart, env } = req.body || {};

      const updated = botManager.updateBot(cleanId, {
        name,
        description,
        path: botPath,
        command,
        args,
        autoStart,
        env
      });

      res.json({
        success: true,
        message: `Bot "${updated.name}" updated successfully.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /api/bots/:id
   * Permanently removes a bot from configuration (stops it first if running).
   */
  router.delete('/:id', async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.removeBot(cleanId);
      res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/logs
   * Returns recent logs stored in memory for this bot.
   */
  router.get('/:id/logs', (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 300));
      const bot = botManager.getBotData(cleanId);
      if (!bot) {
        const err = new Error(`Bot "${cleanId}" not found in configuration.`);
        err.status = 404;
        throw err;
      }

      const logs = botManager.getBotLogs(cleanId, limit);
      res.json({
        success: true,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/start
   */
  router.post('/:id/start', async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.startBot(cleanId);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(cleanId)
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/stop
   */
  router.post('/:id/stop', async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.stopBot(cleanId);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(cleanId)
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/restart
   */
  router.post('/:id/restart', async (req, res, next) => {
    try {
      const cleanId = validateBotId(req.params.id);
      const result = await botManager.restartBot(cleanId);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(cleanId)
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
