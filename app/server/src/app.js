const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const passport = require('../config/passport');
const { errorHandler } = require('./utils/errorHandler');
// Use enhanced logger with integrated response system
const logger = require('./utils/logger');
const routes = require('./routes');
const securityConfig = require('./config/security');
// Custom middleware to ensure Printify domains are allowed in CSP
const printifyCSPMiddleware = require('./middleware/printifyCSPMiddleware');
// Add request timing middleware to track performance metrics
const requestTimingMiddleware = require('./middleware/requestTimingMiddleware');
// Use enhanced middleware that integrates with our response system
const {
    correlationMiddleware,
    requestLogger,
    errorLogger,
    performanceLogger,
    securityLogger
} = require('./middleware/loggingMiddleware');
const debugMiddleware = require('./middleware/debugMiddleware');

// Initialize express app
const app = express();

// Apply correlation ID middleware (must be first to capture all requests)
app.use(correlationMiddleware);

// Apply request timing middleware (early in chain to capture full request timing)
app.use(requestTimingMiddleware);

// Debug middleware for non-production environments
if (process.env.NODE_ENV !== 'production') {
    app.use(debugMiddleware);
}

// Apply response factory middleware to add response helper methods
app.use(logger.response.middleware);

// Logging middleware (before other middleware to catch all requests)
app.use(requestLogger);
app.use(securityLogger);
app.use(performanceLogger(1000)); // Log requests slower than 1 second

// CORS configuration
app.use(cors(securityConfig.cors));

// Apply custom Printify CSP middleware BEFORE Helmet
app.use(printifyCSPMiddleware);

// Security middleware
app.use(helmet(securityConfig.helmet));

// Request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// Authentication
app.use(passport.initialize());

// Serve static files from the Vue.js build directory
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API routes
app.use('/api', routes);

// Handle SPA routing - send all other requests to index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.sendNotFound('Endpoint', req.path, 'API endpoint not found');
    }
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.sendSuccess({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error logging middleware
app.use(errorLogger);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal');
    
    // Log final application state
    try {
        // Close database connection if available
        const models = require('./models');
        if (models && models.sequelize) {
            await models.sequelize.close();
            logger.info('Database connections closed successfully');
        }
        
        process.exit(0);
    } catch (error) {
        logger.error(logger.response.error({
            error,
            message: 'Error during application shutdown',
            userMessage: 'Server shutdown encountered issues'
        }));
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;