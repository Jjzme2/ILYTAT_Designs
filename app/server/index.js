// index.js
require('dotenv').config();
const app = require('./src/app');
const database = require('./src/services/database');
const logger = require('./src/utils/logger');

const port = process.env.PORT || 3000;
let server;

async function startServer() {
    try {
        await database.connect();
        logger.info('Database connected successfully');

        server = app.listen(port, () => {
            logger.info(`Server listening on port ${port}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', {
                promise,
                reason
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown();
        });

    } catch (error) {
        logger.error('Error starting server:', error);
        process.exit(1);
    }
}

// Implement graceful shutdown
async function gracefulShutdown(signal) {
    logger.info(`Received signal to terminate: ${signal}`);

    try {
        // Close server first
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
            logger.info('Server closed');
        }

        // Then close database connection
        await database.disconnect();
        logger.info('Database connection closed');

        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();