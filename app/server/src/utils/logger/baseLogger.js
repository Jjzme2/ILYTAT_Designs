const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('./config');

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

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    errorFormat(),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { 
        service: 'ilytat-designs-api',
        environment: process.env.NODE_ENV
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
        })
    ]
});

// Development console logging
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
