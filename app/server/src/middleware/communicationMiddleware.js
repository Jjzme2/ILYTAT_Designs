const logger = require('../services/LoggerService');
const eventService = require('../services/EventService');
const wsService = require('../services/WebSocketService');

/**
 * Middleware to integrate communication services with Express
 * Provides request logging, event emission, and WebSocket integration
 */
const communicationMiddleware = {
    /**
     * Setup communication middleware
     * @param {Object} app - Express app instance
     * @param {Object} server - HTTP/HTTPS server instance
     */
    setup(app, server) {
        // Initialize WebSocket service
        wsService.initialize(server);

        // Request logging middleware
        app.use((req, res, next) => {
            const start = Date.now();
            
            // Log request
            logger.http(`${req.method} ${req.url}`, {
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            // Log response
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.http(`${req.method} ${req.url} ${res.statusCode}`, {
                    duration,
                    contentLength: res.get('content-length')
                });

                // Emit request completion event
                eventService.emit('request.complete', {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration
                });
            });

            next();
        });

        // Error logging middleware
        app.use((err, req, res, next) => {
            logger.error('Express error:', { 
                error: err.message,
                stack: err.stack,
                url: req.url
            });

            // Emit error event
            eventService.emit('error.express', {
                error: err.message,
                url: req.url
            });

            next(err);
        });

        // Setup WebSocket message handlers
        wsService.registerHandler('ping', (clientId, message) => {
            wsService.sendToClient(clientId, {
                type: 'pong',
                timestamp: Date.now()
            });
        });

        // Example of system events handling
        eventService.on('user.login', (data) => {
            wsService.broadcastToRoom('admins', {
                type: 'system',
                action: 'userLogin',
                data
            });
        });

        logger.info('Communication middleware setup complete');
    }
};

module.exports = communicationMiddleware;
