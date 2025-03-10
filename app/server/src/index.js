require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { requestMiddleware, errorHandler } = require('./middleware/requestHandler');
const routes = require('./routes');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./database');
const http = require('http');
const communicationMiddleware = require('./middleware/communicationMiddleware');

const app = express();

// Apply security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable CORS with specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // In production, we'll handle CORS through reverse proxy
    : 'http://localhost:5173', // Vite dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Apply request handling middleware
app.use(requestMiddleware);

// Serve static files from the client's dist folder
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API routes
app.use('/api', routes);

// Handle SPA routing - send all non-API requests to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database
        await initializeDatabase();
        logger.info('Database initialized successfully');

        // Setup communication middleware
        communicationMiddleware.setup(app, server);

        // Start server
        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            
            if (process.env.NODE_ENV !== 'production') {
                logger.info(`Vue.js app available at: http://localhost:${PORT}`);
                logger.info(`API available at: http://localhost:${PORT}/api`);
            }
        });

        server.on('error', (error) => {
            logger.error('Server error:', error);
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});

// Start the server
startServer();

module.exports = app;
