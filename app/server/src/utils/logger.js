const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Custom format for better error handling
const errorFormat = winston.format((info) => {
    if (info.error instanceof Error) {
        info.error = {
            message: info.error.message,
            stack: info.error.stack,
            ...info.error
        };
    }
    return info;
});

// Define log formats
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    errorFormat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0 && metadata.service === undefined) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    defaultMeta: { 
        service: 'ilytat-designs-api',
        environment: process.env.NODE_ENV
    },
    transports: [
        // Rotating error logs
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat
        }),
        // Rotating combined logs
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat
        })
    ]
});

// Add request context logging
logger.requestLogger = (req, res, next) => {
    req.requestId = require('crypto').randomBytes(16).toString('hex');
    req.startTime = Date.now();

    // Log request
    logger.info('Request received', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.info('Response sent', {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            userId: req.user?.id
        });
    });

    next();
};

// Development console logging with minimal output
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        level: 'debug',
        format: consoleFormat,
        silent: process.env.SUPPRESS_CONSOLE === 'true'
    }));
}

// Helper methods for structured logging
const logError = (error, context = {}) => {
    logger.error({
        message: error.message,
        error: error,
        ...context
    });
};

const logAPIError = (error, req) => {
    logError(error, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        params: req.params,
        query: req.query,
        body: process.env.NODE_ENV === 'development' ? req.body : undefined
    });
};

logger.logError = logError;
logger.logAPIError = logAPIError;

module.exports = logger;
