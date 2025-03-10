/**
 * ErrorResponse - Represents a failed operation
 * Handles error details and provides appropriate user messages
 */
const ResponseBase = require('./ResponseBase');

class ErrorResponse extends ResponseBase {
    /**
     * Create an error response
     * 
     * @param {Object} options - Response options
     * @param {Error|string} options.error - The error object or message
     * @param {string} [options.message] - Developer message (defaults to error.message)
     * @param {string} [options.userMessage='An error occurred'] - User-friendly message
     * @param {Object} [options.metadata={}] - Additional metadata
     * @param {number} [options.statusCode=500] - HTTP status code
     */
    constructor({
        error,
        message,
        userMessage = 'An error occurred',
        metadata = {},
        statusCode = 500
    }) {
        // Convert string errors to Error objects
        if (typeof error === 'string') {
            error = new Error(error);
        }

        // Use error.message as default message if not provided
        const devMessage = message || error.message || 'Unknown error';
        
        // Create the response
        super(false, devMessage, userMessage, null, metadata);
        
        // Store error details in devContext to avoid sending to client
        this.withDevContext({
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code || error.statusCode || statusCode
            },
            originalError: error
        });
        
        // Store status code for HTTP responses
        this.statusCode = statusCode;
    }

    /**
     * Add validation errors to the response
     * 
     * @param {Object} validationErrors - Validation errors by field
     * @returns {ErrorResponse} This response for chaining
     */
    withValidationErrors(validationErrors) {
        // Make validation errors available to clients
        this.data = {
            validationErrors
        };
        return this;
    }

    /**
     * Add retry information to the response
     * 
     * @param {Object} retryInfo - Retry information
     * @param {boolean} retryInfo.canRetry - Whether the operation can be retried
     * @param {number} [retryInfo.retryAfter] - Time in seconds to wait before retry
     * @returns {ErrorResponse} This response for chaining
     */
    withRetryInfo({ canRetry, retryAfter }) {
        this.metadata.retry = { canRetry, retryAfter };
        return this;
    }
    
    /**
     * Override toClientFormat to include validation errors in client response
     * 
     * @returns {Object} Client-safe response object
     */
    toClientFormat() {
        const base = super.toClientFormat();
        
        // Include status code in client response
        base.statusCode = this.statusCode;
        
        // Include retry info if available
        if (this.metadata.retry) {
            base.retry = this.metadata.retry;
        }
        
        return base;
    }

    /**
     * Get HTTP status code for this error
     * 
     * @returns {number} HTTP status code
     */
    getStatusCode() {
        return this.statusCode;
    }
}

module.exports = ErrorResponse;
