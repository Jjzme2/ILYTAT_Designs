/**
 * Logger Response Adapter
 * Connects the logging system with the response system
 * Handles automatic logging of responses with appropriate levels and contexts
 */
const { isResponse } = require('../response/utils');

/**
 * LoggerResponseAdapter - Connects logger to response system
 * Enhances a logger with response-specific logging methods
 */
class LoggerResponseAdapter {
    /**
     * Create a new adapter
     * @param {Object} logger - Base logger instance
     */
    constructor(logger) {
        this.logger = logger;
        
        // Ensure we have the original logger methods
        this.originalLogger = {
            error: logger.error?.bind(logger),
            warn: logger.warn?.bind(logger),
            info: logger.info?.bind(logger),
            debug: logger.debug?.bind(logger),
            trace: logger.trace?.bind(logger)
        };
        
        // Bind methods to preserve context
        this.logResponse = this.logResponse.bind(this);
        this.getLogLevelForResponse = this.getLogLevelForResponse.bind(this);
        this.enhanceLogger = this.enhanceLogger.bind(this);
    }

    /**
     * Get appropriate log level for a response
     * 
     * @param {Object} response - Response object
     * @returns {string} Log level to use
     */
    getLogLevelForResponse(response) {
        // Default level based on response success
        let level = response.success ? 'info' : 'error';
        
        // Special cases based on response type
        const responseType = response.constructor.name;
        
        switch (responseType) {
            case 'ErrorResponse':
                // Error responses use error level
                level = 'error';
                break;
            case 'ValidationResponse':
            case 'AuthResponse':
                // Failed auth or validation uses warn level
                if (!response.success) {
                    level = 'warn';
                }
                break;
            case 'NetworkResponse':
                // Network response level depends on status code
                if (response.statusCode >= 500) {
                    level = 'error';
                } else if (response.statusCode >= 400) {
                    level = 'warn';
                }
                break;
            case 'BusinessResponse':
                // Business responses use info even for non-success if it's a normal business rule
                if (!response.success && response.metadata?.critical) {
                    level = 'error';
                } else if (!response.success) {
                    level = 'warn';
                }
                break;
        }
        
        return level;
    }

    /**
     * Log a response object with appropriate level and context
     * 
     * @param {Object} response - Response object
     * @param {string} [message] - Optional override message
     * @param {string} [level] - Optional override log level
     * @param {Object} [context] - Additional context for the log
     */
    logResponse(response, message, level, context = {}) {
        if (!this.logger) return;
        
        try {
            // Determine log level
            const logLevel = level || this.getLogLevelForResponse(response);
            
            // Get the log message
            const logMessage = message || 
                `${response.constructor.name}: ${response.message}`;
            
            // Get the log data from the response
            const logData = response.toLogFormat();
            
            // Create the final log entry
            const logEntry = {
                responseType: response.constructor.name,
                responseData: logData,
                // Add any additional context
                ...context
            };
            
            // Log with the appropriate level
            if (this.originalLogger[logLevel]) {
                this.originalLogger[logLevel](logMessage, logEntry);
            } else {
                // Fallback to info if level not available
                this.originalLogger.info(logMessage, logEntry);
            }
            
        } catch (error) {
            // Ensure logging errors don't break the application
            console.error('Error logging response:', error);
            this.originalLogger.error('Failed to log response', { 
                error,
                responseType: response?.constructor?.name 
            });
        }
        
        return response; // Return response for chaining
    }

    /**
     * Enhance a logger with response-specific methods
     * 
     * @returns {Object} Enhanced logger
     */
    enhanceLogger() {
        const adapter = this;
        
        // Add response logging method to the logger
        this.logger.logResponse = this.logResponse;
        
        // Override regular logging methods to handle responses
        const enhancedMethods = ['error', 'warn', 'info', 'debug', 'trace'];
        
        enhancedMethods.forEach(method => {
            const originalMethod = this.originalLogger[method];
            
            if (originalMethod) {
                this.logger[method] = function(messageOrResponse, dataOrContext = {}) {
                    // Check if first argument is a response object
                    if (isResponse(messageOrResponse)) {
                        return adapter.logResponse(messageOrResponse, null, method, dataOrContext);
                    }
                    
                    // Otherwise use original logger method
                    return originalMethod(messageOrResponse, dataOrContext);
                };
            }
        });
        
        return this.logger;
    }
}

module.exports = LoggerResponseAdapter;
