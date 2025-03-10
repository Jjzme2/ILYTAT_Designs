/**
 * Enhanced Logging Middleware
 * Integrates with our comprehensive logging and response system
 */
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');

/**
 * Create sanitized log object from request data
 * 
 * @param {Object} req - Express request object
 * @param {Object} [additionalData={}] - Additional data to include
 * @returns {Object} Sanitized log object
 */
const createRequestLog = (req, additionalData = {}) => {
    // Create base log object
    const log = {
        request: {
            method: req.method,
            url: req.originalUrl,
            route: req.route?.path || 'unknown',
            params: req.params,
            query: req.query,
            // Only include body for non-GET requests
            ...(req.method !== 'GET' && { body: req.body }),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer']
        },
        user: req.user ? {
            id: req.user.id,
            role: req.user.role
        } : undefined,
        ...additionalData
    };

    // Sanitize sensitive data
    if (log.request.body) {
        // Mask sensitive fields like passwords
        const sensitiveFields = ['password', 'token', 'key', 'secret', 'credit_card', 'card_number'];
        for (const field of sensitiveFields) {
            if (log.request.body[field]) {
                log.request.body[field] = '********';
            }
        }
    }

    return log;
};

/**
 * Request correlation middleware
 * Adds correlation ID to track requests across services
 */
const correlationMiddleware = logger.correlationMiddleware;

/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */
const requestLogger = (req, res, next) => {
    // Generate a unique request ID for tracking if not already set by correlation middleware
    req.requestId = req.requestId || uuidv4();
    
    // Record start time for performance tracking
    req.startTime = performance.now();
    
    // Create and log the request
    const requestLog = createRequestLog(req);
    requestLog.requestId = req.requestId;
    
    // Use our enhanced logger to log the request
    logger.info('Request received', requestLog);

    // Set the requestId as a response header
    res.setHeader('X-Request-ID', req.requestId);

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
        res.send = originalSend;
        res.responseData = data;
        return originalSend.apply(res, arguments);
    };

    // Log response on finish
    res.on('finish', () => {
        const duration = performance.now() - req.startTime;
        
        // Create network response using our enhanced response system
        const responseData = {
            statusCode: res.statusCode,
            duration: `${duration.toFixed(2)}ms`,
            headers: res.getHeaders(),
            // Don't include potentially large response bodies in logs
            size: res.get('Content-Length')
        };
        
        // Create a response log
        const responseLog = {
            requestId: req.requestId,
            response: responseData,
            duration
        };

        // Create an appropriate response based on status code
        if (res.statusCode >= 500) {
            // Create and log server error response
            const errorResponse = logger.response.error({
                error: new Error(`Server error: ${res.statusCode}`),
                message: 'Server error response',
                userMessage: 'An unexpected error occurred on the server',
                statusCode: res.statusCode
            }).withRequestDetails(req);
            
            logger.error(errorResponse);
        } else if (res.statusCode >= 400) {
            // Create and log client error response
            const errorResponse = logger.response.error({
                error: new Error(`Client error: ${res.statusCode}`),
                message: 'Client error response',
                userMessage: 'The request could not be completed',
                statusCode: res.statusCode
            }).withRequestDetails(req);
            
            logger.warn(errorResponse);
        } else {
            // Create and log network response for success
            const networkResponse = logger.response.network({
                success: true,
                message: 'Request successful',
                statusCode: res.statusCode
            }).withLatency({
                requestDuration: duration
            }).withRequestDetails({
                method: req.method,
                url: req.originalUrl,
                route: req.route?.path
            });
            
            logger.info(networkResponse);
        }
    });

    next();
};

/**
 * Error logging middleware
 * Enhanced error logging with our response system
 */
const errorLogger = (error, req, res, next) => {
    // Create error response with our enhanced response system
    const errorResponse = logger.response.error({
        error,
        message: `Request error: ${error.message}`,
        userMessage: 'An error occurred processing your request',
        statusCode: error.statusCode || 500
    }).withRequestDetails({
        method: req.method,
        url: req.originalUrl,
        route: req.route?.path,
        requestId: req.requestId,
        userId: req.user?.id
    });
    
    // Log the error with our enhanced logger
    logger.error(errorResponse);
    
    next(error);
};

/**
 * Performance monitoring middleware
 * Tracks request performance and logs slow requests
 */
const performanceLogger = (threshold = 1000) => (req, res, next) => {
    const start = performance.now();

    res.on('finish', () => {
        const duration = performance.now() - start;

        if (duration > threshold) {
            // Create business response for performance monitoring
            const perfResponse = logger.response.business({
                success: false,
                message: 'Slow request detected',
                userMessage: 'The operation took longer than expected',
                data: {
                    duration: `${duration.toFixed(2)}ms`,
                    threshold: `${threshold}ms`
                }
            }).withRequestDetails({
                method: req.method,
                url: req.originalUrl,
                route: req.route?.path,
                requestId: req.requestId
            }).withPerformanceMetrics({
                requestDuration: duration,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            });
            
            logger.warn(perfResponse);
        }
    });

    next();
};

/**
 * Security monitoring middleware
 * Detects and logs security events
 */
const securityLogger = (req, res, next) => {
    const securityEvents = [];

    // Check for suspicious patterns
    if (req.headers['user-agent']?.toLowerCase().includes('bot')) {
        securityEvents.push({
            type: 'bot_detected',
            severity: 'info',
            details: { userAgent: req.headers['user-agent'] }
        });
    }

    if (req.ip && req.rateLimit?.remaining === 0) {
        securityEvents.push({
            type: 'rate_limit_exceeded',
            severity: 'warn',
            details: { ip: req.ip, limit: req.rateLimit }
        });
    }

    // Log security events using our enhanced response system
    for (const event of securityEvents) {
        // Create security-specific response
        const securityResponse = logger.response.business({
            success: true,
            message: `Security event: ${event.type}`,
            data: {
                eventType: event.type,
                details: event.details
            }
        }).withSecurityDetails({
            ip: req.ip,
            userId: req.user?.id,
            severity: event.severity,
            eventType: event.type
        });
        
        // Log with appropriate level
        logger[event.severity](securityResponse);
    }

    next();
};

// Export all middleware
module.exports = {
    correlationMiddleware,
    requestLogger,
    errorLogger,
    performanceLogger,
    securityLogger,
    createRequestLog
};
