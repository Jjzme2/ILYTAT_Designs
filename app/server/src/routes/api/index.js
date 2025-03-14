// routes/api/index.js
/**
 * API Routes Configuration
 * All routes are prefixed with /api
 */
const express = require('express');
const router = express.Router();

// Import all route handlers
const userRoutes = require('./users');
const roleRoutes = require('./roles');
const docRoutes = require('./documentations');
const printifyRoutes = require('./printify');
const authRoutes = require('./auth');
const paymentRoutes = require('./payments');
const debugRoutes = require('./debug');
const contactRoutes = require('./contact');
const configRoutes = require('./config');
const auditRoutes = require('./audit');
const systemRoutes = require('./system');
const featuredProductRoutes = require('./featuredProducts');

/**
 * Route Registration
 * Each route file exports a function that accepts a router
 * This allows each route file to be independent and reusable
 */

// Auth Routes
const authRouter = express.Router();
authRoutes(authRouter);
router.use('/auth', authRouter);

// Core API Routes
const usersRouter = express.Router();
userRoutes(usersRouter);
router.use('/users', usersRouter);

const rolesRouter = express.Router();
roleRoutes(rolesRouter);
router.use('/roles', rolesRouter);

const docsRouter = express.Router();
docRoutes(docsRouter);
router.use('/documents', docsRouter);

const printifyRouter = express.Router();
printifyRoutes(printifyRouter);
router.use('/printify', printifyRouter);

const paymentRouter = express.Router();
paymentRoutes(paymentRouter);
router.use('/payment', paymentRouter);

const contactRouter = express.Router();
contactRoutes(contactRouter);
router.use('/contact', contactRouter);

const configRouter = express.Router();
configRoutes(configRouter);
router.use('/config', configRouter);

// Audit Routes
const auditRouter = express.Router();
auditRoutes(auditRouter);
router.use('/audit', auditRouter);

// System Routes
const systemRouter = express.Router();
systemRoutes(systemRouter);
router.use('/system', systemRouter);

// Featured Products Routes
const featuredProductsRouter = express.Router();
featuredProductRoutes(featuredProductsRouter);
router.use('/featured-products', featuredProductsRouter);

// Debug Routes - Only available in development mode
if (process.env.NODE_ENV !== 'production') {
  const debugRouter = express.Router();
  debugRoutes(debugRouter);
  router.use('/debug', debugRouter);
}

module.exports = router;