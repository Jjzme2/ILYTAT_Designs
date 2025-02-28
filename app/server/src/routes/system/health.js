const express = require('express');
const router = express.Router();
const HealthService = require('../../services/health/HealthService');
const { authenticateToken } = require('../../middleware/auth');

// Basic health check - public
router.get('/', async (req, res) => {
  try {
    const health = await HealthService.getHealthMetrics();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking system health',
      error: error.message
    });
  }
});

// Detailed health check - requires authentication
router.get('/detailed', authenticateToken, async (req, res) => {
  try {
    const health = await HealthService.getHealthMetrics();
    const detailedHealth = {
      ...health,
      environment: process.env.NODE_ENV,
      versions: {
        node: process.version,
        v8: process.versions.v8
      },
      processInfo: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(detailedHealth.status === 'healthy' ? 200 : 503).json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking detailed system health',
      error: error.message
    });
  }
});

module.exports = router;