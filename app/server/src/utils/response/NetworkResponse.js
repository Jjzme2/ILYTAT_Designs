/**
 * NetworkResponse - Specialized response for network operations
 * Includes network-specific details such as request/response information
 */
const ResponseBase = require('./ResponseBase');

class NetworkResponse extends ResponseBase {
    /**
     * Create a network response
     * 
     * @param {Object} options - Response options
     * @param {boolean} options.success - Whether the network operation was successful
     * @param {string} options.message - Developer message
     * @param {string} options.userMessage - User-friendly message
     * @param {any} [options.data=null] - Response payload
     * @param {Object} [options.metadata={}] - Additional metadata
     * @param {Object} [options.request={}] - Request details
     * @param {Object} [options.response={}] - Response details
     * @param {number} [options.statusCode=200] - HTTP status code
     */
    constructor({
        success,
        message,
        userMessage,
        data = null,
        metadata = {},
        request = {},
        response = {},
        statusCode = 200
    }) {
        super(success, message, userMessage, data, metadata);
        
        // Add network-specific details to devContext (not exposed to client)
        this.withDevContext({
            network: {
                request: this._sanitizeRequest(request),
                response: this._sanitizeResponse(response),
                statusCode
            }
        });
        
        this.statusCode = statusCode;
    }

    /**
     * Sanitize request object to remove sensitive information
     * 
     * @private
     * @param {Object} request - Original request object
     * @returns {Object} Sanitized request object
     */
    _sanitizeRequest(request) {
        // Create a sanitized copy of the request to avoid modifying the original
        const sanitized = { ...request };
        
        // Sanitize sensitive headers
        if (sanitized.headers) {
            const sanitizedHeaders = { ...sanitized.headers };
            const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
            
            for (const header of sensitiveHeaders) {
                if (sanitizedHeaders[header]) {
                    sanitizedHeaders[header] = '[REDACTED]';
                }
            }
            
            sanitized.headers = sanitizedHeaders;
        }
        
        // Remove potentially sensitive body content
        if (sanitized.body && typeof sanitized.body === 'object') {
            const sanitizedBody = { ...sanitized.body };
            const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn'];
            
            for (const field of sensitiveFields) {
                this._redactSensitiveFields(sanitizedBody, field);
            }
            
            sanitized.body = sanitizedBody;
        }
        
        return sanitized;
    }

    /**
     * Sanitize response object to remove sensitive information
     * 
     * @private
     * @param {Object} response - Original response object
     * @returns {Object} Sanitized response object
     */
    _sanitizeResponse(response) {
        // Create a sanitized copy
        const sanitized = { ...response };
        
        // Truncate large response bodies
        if (sanitized.body && typeof sanitized.body === 'object') {
            const sanitizedBody = { ...sanitized.body };
            
            // Truncate any large arrays or nested objects to prevent excessive logging
            this._truncateLargeObjects(sanitizedBody);
            
            sanitized.body = sanitizedBody;
        }
        
        return sanitized;
    }

    /**
     * Recursively redact sensitive fields in an object
     * 
     * @private
     * @param {Object} obj - Object to scan for sensitive fields
     * @param {string} sensitiveField - Field name to redact
     */
    _redactSensitiveFields(obj, sensitiveField) {
        if (!obj || typeof obj !== 'object') return;
        
        for (const key in obj) {
            if (key.toLowerCase().includes(sensitiveField.toLowerCase())) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                this._redactSensitiveFields(obj[key], sensitiveField);
            }
        }
    }

    /**
     * Truncate large objects to prevent excessive logging
     * 
     * @private
     * @param {Object} obj - Object to truncate
     * @param {number} [maxItems=10] - Maximum items to keep in arrays
     */
    _truncateLargeObjects(obj, maxItems = 10) {
        if (!obj || typeof obj !== 'object') return;
        
        for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > maxItems) {
                // Keep a few items and indicate truncation
                const originalLength = obj[key].length;
                obj[key] = obj[key].slice(0, maxItems);
                obj[key].push(`[${originalLength - maxItems} more items truncated]`);
            } else if (typeof obj[key] === 'object') {
                this._truncateLargeObjects(obj[key], maxItems);
            }
        }
    }

    /**
     * Add latency information to the response
     * 
     * @param {Object} latencyInfo - Latency information
     * @param {number} latencyInfo.requestDuration - Request duration in ms
     * @param {number} [latencyInfo.ttfb] - Time to first byte in ms
     * @returns {NetworkResponse} This response for chaining
     */
    withLatency({ requestDuration, ttfb }) {
        this.metadata.performance = {
            ...this.metadata.performance || {},
            latency: {
                requestDuration,
                ttfb
            }
        };
        return this;
    }

    /**
     * Add network details that may be helpful for clients
     * 
     * @param {Object} details - Network details
     * @param {string} [details.host] - Host that processed the request
     * @param {string} [details.region] - Region that processed the request
     * @param {string} [details.source] - Source of the request (API, cdn, etc)
     * @returns {NetworkResponse} This response for chaining
     */
    withNetworkDetails(details) {
        this.metadata.network = {
            ...this.metadata.network || {},
            ...details
        };
        return this;
    }
    
    /**
     * Get HTTP status code for this response
     * 
     * @returns {number} HTTP status code
     */
    getStatusCode() {
        return this.statusCode;
    }
}

module.exports = NetworkResponse;
