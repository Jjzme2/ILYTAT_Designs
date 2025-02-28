const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const roleRoutes = require('./roles');
const docRoutes = require('./documentations');
const printifyRoutes = require('./printify');
const authRoutes = require('./auth');

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

module.exports = router;