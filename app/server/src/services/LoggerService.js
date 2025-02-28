const winston = require('winston');
const path = require('path');

/**
 * LoggerService - A centralized logging service using Winston
 * Implements different log levels and formats for various environments
 * Supports file and console transport with rotation
 */
class LoggerService {
    constructor() {
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            debug: 4
        };

        this.colors = {
            error: 'red',
            warn: 'yellow',
            info: 'green',
            http: 'magenta',
            debug: 'white'
        };

        winston.addColors(this.colors);

        const logFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.metadata({ fillWith: ['timestamp', 'service'] }),
            winston.format.printf(info => {
                return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
            })
        );

        this.logger = winston.createLogger({
            levels: this.logLevels,
            format: logFormat,
            transports: [
                // Write all logs to console
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize({ all: true })
                    )
                }),
                // Write all logs with level 'info' and below to combined.log
                new winston.transports.File({
                    filename: path.join(__dirname, '../../logs/combined.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                // Write all errors to error.log
                new winston.transports.File({
                    filename: path.join(__dirname, '../../logs/error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                })
            ]
        });
    }

    /**
     * Log an error message
     * @param {string} message - Error message
     * @param {Object} [metadata] - Additional metadata
     */
    error(message, metadata = {}) {
        this.logger.error(message, { metadata });
    }

    /**
     * Log a warning message
     * @param {string} message - Warning message
     * @param {Object} [metadata] - Additional metadata
     */
    warn(message, metadata = {}) {
        this.logger.warn(message, { metadata });
    }

    /**
     * Log an info message
     * @param {string} message - Info message
     * @param {Object} [metadata] - Additional metadata
     */
    info(message, metadata = {}) {
        this.logger.info(message, { metadata });
    }

    /**
     * Log an HTTP request
     * @param {string} message - HTTP request details
     * @param {Object} [metadata] - Additional metadata
     */
    http(message, metadata = {}) {
        this.logger.http(message, { metadata });
    }

    /**
     * Log a debug message
     * @param {string} message - Debug message
     * @param {Object} [metadata] - Additional metadata
     */
    debug(message, metadata = {}) {
        this.logger.debug(message, { metadata });
    }
}

// Export a singleton instance
module.exports = new LoggerService();
