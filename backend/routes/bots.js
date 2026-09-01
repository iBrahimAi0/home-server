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
