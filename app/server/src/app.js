const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const passport = require('../config/passport');
const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger/baseLogger');
const routes = require('./routes');
const securityConfig = require('./config/security');
const { MetricFactory } = require('./utils/logger/factories');
const {
    requestLogger,
    errorLogger,
    performanceLogger,
    securityLogger
} = require('./middleware/loggingMiddleware');
const debugMiddleware = require('./middleware/debugMiddleware');

// Initialize express app
const app = express();

// Start system metrics collection
MetricFactory.startSystemMetrics();

// Custom metrics for database connections
let sequelizeInstance;
try {
    sequelizeInstance = require('./models').sequelize;
} catch (error) {
    logger.warn('Could not load Sequelize instance for metrics', { error });
}

if (sequelizeInstance) {
    MetricFactory.startCustomMetric('database.connections', async () => {
        return sequelizeInstance.connectionManager.size;
    });
}

// Debug middleware (before CORS to catch all requests)
if (process.env.NODE_ENV !== 'production') {
    app.use(debugMiddleware);
}

// Logging middleware (before other middleware to catch all requests)
app.use(requestLogger);
app.use(securityLogger);
app.use(performanceLogger(1000)); // Log requests slower than 1 second

// CORS configuration
app.use(cors(securityConfig.cors));

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
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error logging middleware
app.use(errorLogger);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal');
    
    // Stop metric collection
    MetricFactory.stopAllMetricCollection();
    
    // Log final metrics
    const finalMetrics = MetricFactory.getAllMetrics();
    logger.info('Final metrics before shutdown', { metrics: finalMetrics });
    
    try {
        // Close database connection
        if (sequelizeInstance) {
            await sequelizeInstance.close();
            logger.info('Database connections closed');
        }
        
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;