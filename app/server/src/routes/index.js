const express = require('express');
const router = express.Router();

// Mount API routes
const apiRoutes = require('./api');
router.use('/api', apiRoutes);

// Mount system 
const systemRoutes = require('./system');
router.use('/system', systemRoutes);

// Root route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ILYTAT_Designs Server',
    documentation: '/api/docs',
    health: '/system/health',
    api: '/api'
  });
});

module.exports = router;
