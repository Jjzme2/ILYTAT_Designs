const logger = require('../utils/logger/baseLogger');
const { LogFactory, MetricFactory } = require('../utils/logger/factories');

// Request logging middleware
const requestLogger = (req, res, next) => {
    req.startTime = Date.now();
    
    // Log the incoming request
    const requestLog = LogFactory.createApiLog(req);
    logger.info('Incoming request', requestLog);

    // Increment request metrics
    MetricFactory.incrementMetric('http.requests.total');
    MetricFactory.incrementMetric(`http.requests.${req.method.toLowerCase()}`);
    MetricFactory.incrementMetric(`http.requests.route.${req.route?.path || 'unknown'}`);

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
        res.send = originalSend;
        res.responseData = data;
        return originalSend.apply(res, arguments);
    };

    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        
        // Create response log
        const responseLog = LogFactory.createApiLog(req, {
            response: {
                statusCode: res.statusCode,
                duration,
                headers: res.getHeaders(),
                body: res.responseData
            }
        });

        // Log based on status code
        if (res.statusCode >= 500) {
            logger.error('Server error response', responseLog);
            MetricFactory.incrementMetric('http.errors.server');
        } else if (res.statusCode >= 400) {
            logger.warn('Client error response', responseLog);
            MetricFactory.incrementMetric('http.errors.client');
        } else {
            logger.info('Success response', responseLog);
            MetricFactory.incrementMetric('http.success');
        }

        // Track response time
        MetricFactory.setMetric('http.response_time.last', duration);
        MetricFactory.incrementMetric('http.response_time.total', duration);
    });

    next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
    const errorLog = LogFactory.createApiLog(req, {
        error: {
            message: error.message,
            stack: error.stack,
            type: error.type || 'UnknownError',
            code: error.statusCode || 500
        }
    });

    logger.error('Request error', errorLog);
    MetricFactory.incrementMetric('errors.total');
    MetricFactory.incrementMetric(`errors.type.${error.type || 'unknown'}`);

    next(error);
};

// Performance monitoring middleware
const performanceLogger = (threshold = 1000) => (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = (seconds * 1000) + (nanoseconds / 1000000);

        if (duration > threshold) {
            const perfLog = LogFactory.createPerformanceLog('slow_request', duration, {
                threshold,
                route: req.route?.path,
                method: req.method
            });
            logger.warn('Slow request detected', perfLog);
            MetricFactory.incrementMetric('performance.slow_requests');
        }
    });

    next();
};

// Security monitoring middleware
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

    // Log security events
    for (const event of securityEvents) {
        const securityLog = LogFactory.createSecurityLog(event, {
            ip: req.ip,
            userId: req.user?.id
        });
        logger[event.severity](event.type, securityLog);
        MetricFactory.incrementMetric(`security.events.${event.type}`);
    }

    next();
};

module.exports = {
    requestLogger,
    errorLogger,
    performanceLogger,
    securityLogger
};
