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

// Create logger instance
const baseLogger = winston.createLogger({
    levels: logLevels,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
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
        })
    ]
});

// Development console logging
if (process.env.NODE_ENV !== 'production') {
    baseLogger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

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

// Enhanced request logger
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

const logger = Object.assign(baseLogger, {
    logError: function(error, context = {}) {
        const logEntry = {
            type: 'ERROR',
            message: error.message,
            stack: error.stack,
            code: error.code,
            ...context,
            timestamp: new Date().toISOString()
        };
        this.error('Error occurred', logEntry);
    },

    logDatabase: function(query, duration, result) {
        const logEntry = {
            type: 'DATABASE',
            query,
            duration,
            result,
            timestamp: new Date().toISOString()
        };
        this.debug('Database operation', logEntry);
    },

    logSecurity: function(event, context = {}) {
        const logEntry = {
            type: 'SECURITY',
            event,
            ...context,
            timestamp: new Date().toISOString()
        };
        this.info('Security event', logEntry);
    },

    logPerformance: function(metric, value, context = {}) {
        const logEntry = {
            type: 'PERFORMANCE',
            metric,
            value,
            ...context,
            timestamp: new Date().toISOString()
        };
        this.debug('Performance metric', logEntry);
    },

    logBusiness: function(action, data, context = {}) {
        const logEntry = {
            type: 'BUSINESS',
            action,
            data,
            ...context,
            timestamp: new Date().toISOString()
        };
        this.info('Business event', logEntry);
    },

    logAudit: function(action, before, after, context = {}) {
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
});

module.exports = logger;
