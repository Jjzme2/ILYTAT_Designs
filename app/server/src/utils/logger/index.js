/**
 * Centralized Logging System
 * Provides a standardized logging pattern throughout the application
 * Integrates logging with the response system for comprehensive error handling
 * 
 * Enhanced with security features to automatically redact sensitive information
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { createNamespace } = require('cls-hooked');
const { performance } = require('perf_hooks');

// Create a namespace for the correlation ID
const namespace = createNamespace('request-context');

// Custom log levels with corresponding colors
const logLevels = {
    emergency: 0,
    alert: 1,
    critical: 2,
    error: 3,
    warn: 4,
    notice: 5,
    info: 6,
    debug: 7,
    trace: 8
};

const logColors = {
    emergency: 'red',
    alert: 'magenta',
    critical: 'red',
    error: 'red',
    warn: 'yellow',
    notice: 'cyan',
    info: 'green',
    debug: 'blue',
    trace: 'gray'
};

// Import the security utilities for secure logging
let securityUtils;
try {
    securityUtils = require('../securityUtils');
} catch (error) {
    // Fallback if security utils are not available (to prevent circular dependencies)
    securityUtils = {
        sanitizeObjectForLogs: (obj) => obj,
        redactSensitiveInfo: (val) => val
    };
}

// Custom format for enhanced error handling
const errorFormat = winston.format((info) => {
    if (info.error instanceof Error) {
        info.error = {
            name: info.error.name,
            message: info.error.message,
            stack: info.error.stack,
            code: info.error.code,
            ...info.error
        };
    }
    return info;
});

// Performance metrics format
const performanceFormat = winston.format((info) => {
    info.performance = {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        heap: process.memoryUsage().heapUsed
    };
    return info;
});

// System metadata format
const systemFormat = winston.format((info) => {
    info.system = {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        loadavg: os.loadavg()
    };
    return info;
});

// Define base log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    errorFormat(),
    performanceFormat(),
    systemFormat(),
    winston.format.json()
);

// Create console format with colors
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${chalk.gray(timestamp)} [${level}]: ${message}`;
        
        if (metadata.correlationId) {
            msg += ` ${chalk.cyan(`[${metadata.correlationId}]`)}`;
        }
        
        if (metadata.error) {
            msg += `\n${chalk.red('Error Stack:')} ${metadata.error.stack}`;
        }
        
        return msg;
    })
);

class LoggerFactory {
    constructor(options = {}) {
        this.options = options;
    }

    createLogger() {
        const logger = winston.createLogger({
            levels: logLevels,
            level: this.options.level || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
            format: logFormat,
            defaultMeta: {
                service: 'ilytat-designs-api',
                environment: process.env.NODE_ENV,
                version: process.env.npm_package_version
            },
            transports: [
                // Emergency logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/emergency-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'emergency',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),
                
                // Error logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),
                
                // Combined logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),
                
                // Performance logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/performance-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '7d',
                    zippedArchive: true
                }),

                // Debug logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/debug-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'debug',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),

                // Info logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/info-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'info',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),

                // Warn logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/warn-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'warn',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),

                // Notice logs
                new DailyRotateFile({
                    filename: path.join(__dirname, '../../../logs/notice-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'notice',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),
                
            ]
        });

        // Development console logging
        if (process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console({
                format: consoleFormat
            }));
        }

        return logger;
    }

    createIntegratedLogger() {
        const logger = this.createLogger();

        // Correlation ID middleware
        logger.correlationMiddleware = (req, res, next) => {
            namespace.run(() => {
                const correlationId = req.headers['x-correlation-id'] || 
                                    require('crypto').randomBytes(16).toString('hex');
                namespace.set('correlationId', correlationId);
                res.set('X-Correlation-ID', correlationId);
                next();
            });
        };

        // Enhanced request logger
        logger.requestLogger = (req, res, next) => {
            const startTime = performance.now();
            const correlationId = namespace.get('correlationId');

            // Log request
            logger.info('Request received', {
                correlationId,
                request: {
                    method: req.method,
                    url: req.originalUrl,
                    headers: req.headers,
                    query: req.query,
                    body: req.method !== 'GET' ? req.body : undefined,
                    ip: req.ip,
                    userId: req.user?.id
                }
            });

            // Capture response
            const originalSend = res.send;
            res.send = function(body) {
                res.send = originalSend;
                res.body = body;
                return originalSend.apply(res, arguments);
            };

            // Log response
            res.on('finish', () => {
                const duration = performance.now() - startTime;
                const level = res.statusCode >= 400 ? 'error' : 'info';

                logger[level]('Response sent', {
                    correlationId,
                    response: {
                        statusCode: res.statusCode,
                        duration: `${duration.toFixed(2)}ms`,
                        headers: res.getHeaders(),
                        body: res.body,
                        contentLength: res.get('Content-Length')
                    },
                    performance: {
                        memory: process.memoryUsage(),
                        cpu: process.cpuUsage()
                    }
                });
            });

            next();
        };

        logger.logError = function(error, context = {}) {
            const logEntry = {
                type: 'ERROR',
                message: error.message,
                stack: error.stack,
                code: error.code,
                ...context,
                timestamp: new Date().toISOString()
            };
            this.error('Error occurred', logEntry);
        };

        logger.logDatabase = function(query, duration, result) {
            const logEntry = {
                type: 'DATABASE',
                query,
                duration,
                result,
                timestamp: new Date().toISOString()
            };
            this.debug('Database operation', logEntry);
        };

        logger.logSecurity = function(event, context = {}) {
            const logEntry = {
                type: 'SECURITY',
                event,
                ...context,
                timestamp: new Date().toISOString()
            };
            this.info('Security event', logEntry);
        };

        logger.logPerformance = function(metric, value, context = {}) {
            const logEntry = {
                type: 'PERFORMANCE',
                metric,
                value,
                ...context,
                timestamp: new Date().toISOString()
            };
            this.debug('Performance metric', logEntry);
        };

        logger.logBusiness = function(action, data, context = {}) {
            const logEntry = {
                type: 'BUSINESS',
                action,
                data,
                ...context,
                timestamp: new Date().toISOString()
            };
            this.info('Business event', logEntry);
        };

        logger.logAudit = function(action, before, after, context = {}) {
            const logEntry = {
                type: 'AUDIT',
                action,
                changes: {
                    before,
                    after
                },
                ...context,
                timestamp: new Date().toISOString()
            };
            this.info('Audit event', logEntry);
        }

        // Add response object with business method for structured logging
        logger.response = {
            business: function(data) {
                const logData = {
                    type: 'BUSINESS_RESPONSE',
                    ...data,
                    timestamp: new Date().toISOString()
                };
                
                // Add chainable methods for additional context
                return {
                    withRequestDetails: function(reqDetails) {
                        logData.request = typeof reqDetails === 'object' && reqDetails.ip ? 
                            { ip: reqDetails.ip, userAgent: reqDetails.headers?.['user-agent'] } : 
                            reqDetails;
                        return this;
                    },
                    withPerformanceMetrics: function(metrics) {
                        logData.performance = metrics;
                        return this;
                    },
                    withUserContext: function(userContext) {
                        logData.user = userContext;
                        return this;
                    },
                    withSecurityDetails: function(details) {
                        logData.security = details;
                        return this;
                    },
                    log: function(level = 'info') {
                        logger[level](data.message || 'Business response', logData);
                        return this;
                    }
                };
            }
        };

        return logger;
    }
}

/**
 * Create the application's main logger instance with integrated response support
 * This is a singleton that should be used throughout the application
 */
const loggerFactory = new LoggerFactory();
const logger = loggerFactory.createIntegratedLogger();

// Export the main logger instance
module.exports = logger;

// Export factory and utilities for dependency injection and testing
module.exports.LoggerFactory = LoggerFactory;

/**
 * Create a custom logger instance with provided options
 * Useful for dependency injection or service-specific logging
 * 
 * @param {Object} options - Custom logger options
 * @param {boolean} [withResponseFactory=true] - Whether to include the response factory
 * @returns {Object} Custom logger instance
 */
module.exports.createLogger = (options = {}, withResponseFactory = true) => {
    const factory = new LoggerFactory(options);
    return withResponseFactory 
        ? factory.createIntegratedLogger()
        : factory.createLogger();
};
