/**
 * Response System Utilities
 * Helper functions for working with response objects
 */
const ResponseBase = require('./ResponseBase');

/**
 * Check if an object is a response
 * 
 * @param {any} obj - Object to check
 * @returns {boolean} True if object is a response
 */
function isResponse(obj) {
    return obj !== null && 
           typeof obj === 'object' && 
           (obj instanceof ResponseBase || 
            (typeof obj.toLogFormat === 'function' && 
             typeof obj.toClientFormat === 'function' &&
             'success' in obj &&
             'message' in obj));
}

/**
 * Safely extract client-safe data from a response
 * 
 * @param {Object|any} responseOrData - Response object or raw data
 * @returns {Object} Client-safe data
 */
function extractClientData(responseOrData) {
    if (isResponse(responseOrData)) {
        return responseOrData.toClientFormat();
    }
    return responseOrData;
}

/**
 * Convert an error to an ErrorResponse
 * 
 * @param {Error} error - Error object
 * @param {string} [userMessage] - Optional user-friendly message
 * @param {Object} [context] - Additional context
 * @returns {ErrorResponse} Error response
 */
function errorToResponse(error, userMessage, context = {}) {
    // Import the ErrorResponse class lazily to avoid circular dependencies
    const { ErrorResponse } = require('./index');
    
    return new ErrorResponse({
        error,
        userMessage: userMessage || 'An error occurred',
        ...context
    });
}

/**
 * Apply response handling to an Express router
 * 
 * @param {Object} router - Express router
 * @param {Object} responseFactory - Response factory instance
 */
function applyResponseHandling(router, responseFactory) {
    // Add middleware for response handling
    router.use(responseFactory.createMiddleware());
}

module.exports = {
    isResponse,
    extractClientData,
    errorToResponse,
    applyResponseHandling
};
