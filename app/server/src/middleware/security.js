const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });

    next();
};

/**
 * Creates a rate limiter middleware with customizable configuration
 * 
 * @param {Object} options - Configuration options for the rate limiter
 * @param {number} [options.windowMs=15*60*1000] - Time window in milliseconds
 * @param {number} [options.max=100] - Maximum number of requests per window
 * @param {string} [options.message='Too many requests, please try again later'] - Error message
 * @param {boolean} [options.enableLogging=true] - Whether to log rate limit events
 * @param {string} [options.keyGenerator] - Custom function to generate keys (e.g., by IP, user ID)
 * @returns {Function} Express middleware function
 */
const applyRateLimiter = (options = {}) => {
    const config = {
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || 100, // 100 requests per window default
        message: options.message || 'Too many requests, please try again later.',
        standardHeaders: options.standardHeaders !== false, // Set rate limit info to headers by default
        legacyHeaders: options.legacyHeaders !== false, // X-RateLimit-* headers
        keyGenerator: options.keyGenerator || ((req) => req.ip), // Default is by IP
        handler: (req, res) => {
            if (options.enableLogging !== false) {
                logger.warn('Rate limit exceeded:', {
                    ip: req.ip,
                    path: req.path,
                    method: req.method,
                    userAgent: req.get('user-agent'),
                    windowMs: config.windowMs,
                    limit: config.max
                });
            }
            
            res.status(429).json({
                success: false,
                error: config.message
            });
        }
    };

    return rateLimit(config);
};

// Predefined rate limiters
const apiLimiter = applyRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }); // Default API limiter
const authLimiter = applyRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }); // Stricter limiter for auth routes

module.exports = {
    security: [
        helmet(), // Adds various HTTP headers for security
        apiLimiter // Default rate limiter for all routes
    ],
    requestLogger,
    applyRateLimiter,
    authLimiter
};
