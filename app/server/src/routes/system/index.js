const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');

// System routes
router.use('/health', healthRoutes);

// System information
router.get('/', (req, res) => {
  res.json({
    name: process.env.npm_package_name || 'ILYTAT_Designs Server',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;