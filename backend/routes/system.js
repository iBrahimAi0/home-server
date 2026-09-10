const express = require('express');
const router = express.Router();
const { getSystemStatus } = require('../utils/systemMonitor');

/**
 * GET /api/status
 * Returns system statistics: CPU, RAM, Storage, Uptime, Hostname, etc.
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getSystemStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status: ' + error.message
    });
  }
});

module.exports = router;
