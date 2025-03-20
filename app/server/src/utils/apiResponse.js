const logger = require('./logger');

/**
 * Standard API Response Format
 * @typedef {Object} APIResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {Object|Array|null} data - The response data (if any)
 * @property {string|null} message - User-friendly message
 * @property {string|null} error - Error message for client (if any)
 * @property {string} requestId - Unique identifier for request tracking
 */

class APIResponse {
    /**
     * Creates a success response
     * @param {Object} options
     * @param {Object|Array} [options.data=null] - Response data
     * @param {string} [options.message='Success'] - Success message
     * @param {string} [options.requestId] - Request ID for tracking
     * @returns {APIResponse}
     */
    static success({ data = null, message = 'Success', requestId }) {
        return {
            success: true,
            data,
            message,
            error: null,
            requestId
        };
    }

    /**
     * Creates an error response
     * @param {Object} options
     * @param {Error} options.error - Original error object
     * @param {string} [options.clientMessage] - User-friendly error message
     * @param {string} options.requestId - Request ID for tracking
     * @param {Object} [options.context={}] - Additional context for logging
     * @returns {APIResponse}
     */
    static error({ error, clientMessage, requestId, context = {} }) {
        // Log the full error with context
        logger.error({
            message: 'API Error Response',
            error: error,
            requestId,
            ...context
        });

        return {
            success: false,
            data: context,
            message: error?.message || 'An unexpected error occurred',
            error: clientMessage || 'An unexpected error occurred',
            errorDetails: error.stack?.split('\n'),
            requestId
        };
    }

    /**
     * Creates a validation error response
     * @param {Object} options
     * @param {Object} options.validationErrors - Validation error details
     * @param {string} [options.clientMessage='Validation failed'] - User-friendly message
     * @param {string} options.requestId - Request ID for tracking
     * @returns {APIResponse}
     */
    static validationError({ validationErrors, clientMessage = 'Validation failed', requestId }) {
        logger.warn({
            message: 'Validation Error',
            validationErrors,
            requestId
        });

        return {
            success: false,
            data: { validationErrors },
            message: null,
            error: clientMessage,
            requestId
        };
    }

    /**
     * Creates an unauthorized error response
     * @param {Object} options
     * @param {string} [options.clientMessage='Unauthorized access'] - User-friendly message
     * @param {string} options.requestId - Request ID for tracking
     * @param {Object} [options.context={}] - Additional context for logging
     * @returns {APIResponse}
     */
    static unauthorized({ clientMessage = 'Unauthorized access', requestId, context = {} }) {
        logger.warn({
            message: 'Unauthorized Access Attempt',
            requestId,
            ...context
        });

        return {
            success: false,
            data: null,
            message: null,
            error: clientMessage,
            requestId
        };
    }

    /**
     * Creates a forbidden error response
     * @param {Object} options
     * @param {string} [options.clientMessage='Access forbidden'] - User-friendly message
     * @param {string} options.requestId - Request ID for tracking
     * @param {Object} [options.context={}] - Additional context for logging
     * @returns {APIResponse}
     */
    static forbidden({ clientMessage = 'Access forbidden', requestId, context = {} }) {
        logger.warn({
            message: 'Forbidden Access Attempt',
            requestId,
            ...context
        });

        return {
            success: false,
            data: null,
            message: null,
            error: clientMessage,
            requestId
        };
    }
}

module.exports = APIResponse;
