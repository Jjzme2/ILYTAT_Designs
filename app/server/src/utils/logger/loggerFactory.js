/**
 * Logger Factory
 * Creates standardized logger instances with consistent formatting and behavior
 * Supports dependency injection for testing and flexibility
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { createNamespace } = require('cls-hooked');
const { performance } = require('perf_hooks');

// Import security utilities for sensitive data redaction
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

// Create a namespace for the correlation ID
const namespace = createNamespace('request-context');

// Custom log levels with corresponding colors
const LOG_LEVELS = {
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

const LOG_COLORS = {
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

/**
 * LoggerFactory Class
 * Responsible for creating and configuring logger instances
 */
class LoggerFactory {
    constructor(options = {}) {
        this.options = {
            appName: 'ilytat-designs-api',
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            logsDir: path.join(__dirname, '../../../logs'),
            ...options
        };

        // Initialize formatters
        this.initializeFormatters();
    }

    /**
     * Initialize common formatters used across different loggers
     */
    initializeFormatters() {
        // Custom format for enhanced error handling
        this.errorFormat = winston.format((info) => {
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

        // Security format to redact sensitive information
        this.securityFormat = winston.format((info) => {
            try {
                // Use the securityUtils to sanitize the entire log object
                return securityUtils.sanitizeObjectForLogs(info);
            } catch (error) {
                // If sanitization fails, return original but log an internal warning
                console.warn('Failed to sanitize log data:', error);
                return info;
            }
        });

        // Performance metrics format
        this.performanceFormat = winston.format((info) => {
            info.performance = {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime(),
                heap: process.memoryUsage().heapUsed
            };
            return info;
        });

        // System metadata format
        this.systemFormat = winston.format((info) => {
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
        this.logFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.errors({ stack: true }),
            this.errorFormat(),
            this.securityFormat(),
            this.performanceFormat(),
            this.systemFormat(),
            winston.format.json()
        );

        // Create console format with colors
        this.consoleFormat = winston.format.combine(
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
    }

    /**
     * Create a transport for a specific log level
     */
    createLevelTransport(level) {
        return new DailyRotateFile({
            filename: path.join(this.options.logsDir, `${level}-%DATE%.log`),
            datePattern: 'YYYY-MM-DD',
            level: level,
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        });
    }

    /**
     * Create a standard set of transports for the logger
     */
    createTransports() {
        const transports = [
            // Combined logs
            new DailyRotateFile({
                filename: path.join(this.options.logsDir, 'combined-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                zippedArchive: true
            }),
            
            // Performance logs
            new DailyRotateFile({
                filename: path.join(this.options.logsDir, 'performance-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '7d',
                zippedArchive: true
            })
        ];

        // Create a transport for each log level
        Object.keys(LOG_LEVELS).forEach(level => {
            transports.push(this.createLevelTransport(level));
        });

        // Add console transport in non-production environments
        if (this.options.environment !== 'production') {
            transports.push(new winston.transports.Console({
                format: this.consoleFormat
            }));
        }

        return transports;
    }

    /**
     * Creates a new logger instance with standard configurations
     */
    createLogger() {
        const baseLogger = winston.createLogger({
            levels: LOG_LEVELS,
            level: this.options.environment === 'production' ? 'info' : 'debug',
            format: this.logFormat,
            defaultMeta: {
                service: this.options.appName,
                environment: this.options.environment,
                version: this.options.version
            },
            transports: this.createTransports()
        });

        // Correlation ID middleware
        baseLogger.correlationMiddleware = (req, res, next) => {
            namespace.run(() => {
                const correlationId = req.headers['x-correlation-id'] || 
                                    require('crypto').randomBytes(16).toString('hex');
                namespace.set('correlationId', correlationId);
                res.set('X-Correlation-ID', correlationId);
                next();
            });
        };

        // Enhanced request logger middleware
        baseLogger.requestLogger = (req, res, next) => {
            const startTime = performance.now();
            const correlationId = namespace.get('correlationId');

            // Log request
            baseLogger.info('Request received', {
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

                baseLogger[level]('Response sent', {
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

        // Enhance the logger with response integration
        this.enhanceLoggerWithResponseSupport(baseLogger);

        return baseLogger;
    }

    /**
     * Enhance a logger with response system integration
     * 
     * @param {Object} logger - Base logger instance
     * @returns {Object} Enhanced logger
     */
    enhanceLoggerWithResponseSupport(logger) {
        try {
            // Lazy-load response adapter to avoid circular dependencies
            const LoggerResponseAdapter = require('./loggerResponseAdapter');
            const adapter = new LoggerResponseAdapter(logger);
            return adapter.enhanceLogger();
        } catch (error) {
            console.warn('Failed to enhance logger with response support:', error.message);
            return logger;
        }
    }

    /**
     * Creates a logger with attached response factory
     * Provides an integrated logging and response system
     * 
     * @returns {Object} Integrated logger with response factory
     */
    createIntegratedLogger() {
        const logger = this.createLogger();
        
        try {
            // Import response factory (lazy loaded to avoid circular dependencies)
            const responseModule = require('../response');
            const responseFactory = responseModule.createFactory(logger);
            
            // Attach the response factory to the logger
            logger.response = responseFactory;
            
            // Create shorthand methods
            logger.successResponse = responseFactory.success;
            logger.errorResponse = responseFactory.error;
            logger.validationResponse = responseFactory.validation;
            logger.networkResponse = responseFactory.network;
            logger.authResponse = responseFactory.auth;
            logger.businessResponse = responseFactory.business;
            
            // Create middleware factory method
            logger.createResponseMiddleware = responseFactory.createMiddleware.bind(responseFactory);
            
            return logger;
        } catch (error) {
            console.warn('Failed to create integrated logger with response factory:', error.message);
            return logger;
        }
    }
}

module.exports = LoggerFactory;
