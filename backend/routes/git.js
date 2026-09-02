const express = require('express');
const fs = require('fs');
const { validateBotId } = require('../utils/pathSecurity');
const GitService = require('../services/GitService');

module.exports = function createGitRouter(botManager) {
  const router = express.Router({ mergeParams: true });

  /**
   * Helper to look up a bot and retrieve its root path (mirrors files.js).
   */
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
    return botRoot;
  }

  /**
   * GET /api/bots/:id/git/status
   */
  router.get('/status', async (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const status = await GitService.getStatus(botRoot);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/git/check
   * Body: { branch }
   */
  router.post('/check', async (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const branch = (req.body && req.body.branch) || 'main';
      const result = await GitService.checkUpdates(botRoot, branch);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/git/pull
   * Body: { branch }
   */
  router.post('/pull', async (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const branch = (req.body && req.body.branch) || 'main';
      const result = await GitService.pull(botRoot, branch);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/git/config
   * Body: { repoUrl, branch }
   */
  router.post('/config', async (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const { repoUrl, branch } = req.body || {};
      if (!repoUrl) {
        const err = new Error('repoUrl is required.');
        err.status = 400;
        throw err;
      }
      const result = await GitService.configureRepo(botRoot, repoUrl, branch || 'main');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
