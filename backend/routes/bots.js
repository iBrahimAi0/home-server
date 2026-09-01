const express = require('express');
const router = express.Router();

module.exports = function createBotsRouter(botManager) {
  /**
   * GET /api/bots
   * Returns all configured bots with current runtime metrics.
   */
  router.get('/', (req, res) => {
    try {
      const bots = botManager.getAllBots();
      res.json({
        success: true,
        data: bots
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/bots/:id
   * Returns detailed information for a single bot.
   */
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    const bot = botManager.getBotData(id);
    if (!bot) {
      return res.status(404).json({ success: false, error: `Bot "${id}" not found.` });
    }
    res.json({
      success: true,
      data: bot
    });
  });

  /**
   * GET /api/bots/:id/logs
   * Returns recent logs stored in memory for this bot.
   */
  router.get('/:id/logs', (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 300;
    const bot = botManager.getBotData(id);
    if (!bot) {
      return res.status(404).json({ success: false, error: `Bot "${id}" not found.` });
    }

    const logs = botManager.getBotLogs(id, limit);
    res.json({
      success: true,
      data: logs
    });
  });

  /**
   * POST /api/bots/:id/start
   */
  router.post('/:id/start', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await botManager.startBot(id);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(id)
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * POST /api/bots/:id/stop
   */
  router.post('/:id/stop', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await botManager.stopBot(id);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(id)
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * POST /api/bots/:id/restart
   */
  router.post('/:id/restart', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await botManager.restartBot(id);
      res.json({
        success: true,
        message: result.message,
        data: botManager.getBotData(id)
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });

  return router;
};
