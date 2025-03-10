/**
 * ResponseBase - Base class for all response objects
 * Provides common functionality and structure for all response types
 */
class ResponseBase {
    /**
     * Create a base response object
     * 
     * @param {boolean} success - Whether the operation was successful
     * @param {string} message - Developer-oriented message describing the response
     * @param {string} userMessage - User-friendly message appropriate for client display
     * @param {Object} data - Response data payload
     * @param {Object} metadata - Additional metadata for the response
     */
    constructor(success, message, userMessage, data = null, metadata = {}) {
        this.success = success;
        this.message = message;
        this.userMessage = userMessage;
        this.data = data;
        this.metadata = {
            timestamp: new Date().toISOString(),
            requestId: this._getRequestIdFromContext(),
            ...metadata
        };
    }

    /**
     * Get the current request ID from the CLS namespace if available
     * @private
     * @returns {string|null} The correlation ID or null if not available
     */
    _getRequestIdFromContext() {
        try {
            return require('cls-hooked')
                .getNamespace('request-context')
                ?.get('correlationId') || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Add additional metadata to the response
     * 
     * @param {Object} metadata - Additional metadata to add
     * @returns {ResponseBase} This response object for chaining
     */
    withMetadata(metadata) {
        this.metadata = {
            ...this.metadata,
            ...metadata
        };
        return this;
    }

    /**
     * Add developer context information that won't be sent to the client
     * 
     * @param {Object} context - Developer context information
     * @returns {ResponseBase} This response object for chaining
     */
    withDevContext(context) {
        this._devContext = {
            ...this._devContext || {},
            ...context
        };
        return this;
    }

    /**
     * Convert response to a format suitable for logging
     * Includes all developer context but not meant for client consumption
     * 
     * @returns {Object} Full log-friendly object with all context
     */
    toLogFormat() {
        return {
            success: this.success,
            message: this.message,
            userMessage: this.userMessage,
            data: this.data,
            metadata: this.metadata,
            devContext: this._devContext || {}
        };
    }

    /**
     * Convert response to a format suitable for sending to clients
     * Excludes internal developer information
     * 
     * @returns {Object} Client-safe response object
     */
    toClientFormat() {
        return {
            success: this.success,
            message: this.userMessage, // Only show user-friendly message
            data: this.data,
            requestId: this.metadata.requestId
        };
    }

    /**
     * Convert response to JSON string suitable for logging or transmission
     * 
     * @param {boolean} forClient - Whether to format for client consumption
     * @returns {string} JSON string representation
     */
    toJSON(forClient = false) {
        return JSON.stringify(
            forClient ? this.toClientFormat() : this.toLogFormat()
        );
    }

    /**
     * Helper to check if response indicates success
     * 
     * @returns {boolean} Whether response indicates success
     */
    isSuccess() {
        return this.success;
    }

    /**
     * Helper to check if response indicates failure
     * 
     * @returns {boolean} Whether response indicates failure
     */
    isFailure() {
        return !this.success;
    }

    /**
     * Add performance metrics to the response
     * Captures timing, memory usage, and other performance-related data
     * 
     * @param {Object} metrics - Performance metrics
     * @param {number} [metrics.duration] - Duration in milliseconds
     * @param {Object} [metrics.memory] - Memory usage metrics
     * @param {Object} [metrics.cpu] - CPU usage metrics
     * @param {Object} [metrics.database] - Database query metrics
     * @returns {ResponseBase} This response object for chaining
     */
    withPerformanceMetrics(metrics) {
        return this.withDevContext({
            performance: {
                ...metrics,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Add security details to the response
     * Captures security-related information for audit and monitoring
     * 
     * @param {Object} details - Security details
     * @param {string} [details.ip] - IP address
     * @param {string} [details.event] - Security event type (e.g., 'login', 'password-reset')
     * @param {boolean} [details.success] - Whether the security operation was successful
     * @param {Object} [details.user] - User information (e.g., id, role)
     * @param {string} [details.action] - Action being performed
     * @returns {ResponseBase} This response object for chaining
     */
    withSecurityDetails(details) {
        return this.withDevContext({
            security: {
                ...details,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Add request details to the response
     * Captures HTTP request information for context and debugging
     * 
     * @param {Object} details - Request details
     * @param {string} [details.ip] - IP address
     * @param {string} [details.userAgent] - User agent string
     * @param {string} [details.method] - HTTP method
     * @param {string} [details.url] - Request URL
     * @param {Object} [details.headers] - Request headers
     * @param {Object} [details.query] - Query parameters
     * @returns {ResponseBase} This response object for chaining
     */
    withRequestDetails(details) {
        return this.withDevContext({
            request: {
                ...details,
                timestamp: new Date().toISOString()
            }
        });
    }
}

module.exports = ResponseBase;
