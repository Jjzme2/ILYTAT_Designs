const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const roleRoutes = require('./roles');
const docRoutes = require('./documentations');
const printifyRoutes = require('./printify');
const authRoutes = require('./auth');
const paymentRoutes = require('./payments');
const debugRoutes = require('./debug');
const contactRoutes = require('./contact');

/**
 * API Routes Configuration
 * All routes are prefixed with /api
 */

// Auth Routes
router.use('/auth', authRoutes);

// Core API Routes
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/documents', docRoutes);
router.use('/printifyApi', printifyRoutes);
router.use('/payment', paymentRoutes);
router.use('/contact', contactRoutes);

// Debug Routes - Only available in development mode
if (process.env.NODE_ENV !== 'production') {
  router.use('/debug', debugRoutes);
}

module.exports = router;