const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health-check endpoint returning system & database status
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbState,
    },
  });
});

module.exports = router;
