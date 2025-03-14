/**
 * ResponseBase - Base class for all response objects
 * Provides common functionality and structure for all response types
 */
const dataEncoder = require('../security/dataEncoder');

class ResponseBase {
    /**
     * Create a base response object
     * 
     * @param {boolean} success - Whether the operation was successful
     * @param {string} message - Developer-oriented message describing the response
     * @param {string} userMessage - User-friendly message appropriate for client display
     * @param {Object|Array} data - Response data payload
     * @param {Object} metadata - Additional metadata for the response
     */
    constructor(success, message, userMessage, data, metadata = {}) {
        this.success = success;
        this.message = message;
        this.userMessage = userMessage;
        
        // Process and validate data with more robust null/undefined handling
        this.data = this._processData(data, metadata);
        
        this.metadata = {
            timestamp: new Date().toISOString(),
            requestId: this._getRequestIdFromContext(),
            version: '1.1', // API response version for tracking changes
            ...metadata
        };

        // Initialize developer context
        this._devContext = {};
    }

    /**
     * Process and validate data to ensure it's never null or undefined
     * Uses more reliable type checking and resource metadata
     * 
     * @private
     * @param {any} data - The data to process
     * @param {Object} metadata - Metadata with resource information
     * @returns {any} Processed data that is never null or undefined
     */
    _processData(data, metadata) {
        // If data is already defined, validate it based on expected resource type
        if (data !== null && data !== undefined) {
            return data;
        }
        
        // Determine resource type more reliably through metadata and context
        const isCollection = 
            metadata.resourceType === 'collection' || 
            (this.message && (
                /list|all|many|multiple|search|query|find/i.test(this.message)
            ));
        
        // Default values based on resource type
        if (isCollection) {
            return [];
        }
        
        // Check if we're expecting a specific model type from metadata
        if (metadata.resourceType === 'single' && metadata.modelName) {
            // Return a skeleton object with id for consistency
            return { id: null };
        }
        
        // Generic fallback for other cases
        return {};
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
     * Enhanced with data validation and optional encoding for sensitive data
     * 
     * @param {Object} options - Options for client formatting
     * @param {boolean} options.encodeSensitiveData - Whether to encode sensitive data
     * @param {boolean} options.includeDevelopmentData - Whether to include dev data in non-prod envs
     * @returns {Object} Client-safe response object
     */
    toClientFormat(options = {}) {
        const { 
            encodeSensitiveData = false, 
            includeDevelopmentData = process.env.NODE_ENV !== 'production' 
        } = options;
        
        // Validate data before sending to client
        const validatedData = this._ensureValidData(this.data);
        
        // Base response format
        const clientResponse = {
            success: this.success,
            message: this.userMessage, // Only show user-friendly message
            requestId: this.metadata.requestId
        };
        
        // Process data based on sensitivity
        if (encodeSensitiveData) {
            // For sensitive data, encode it
            const { data: encodedData, metadata: encodingMetadata } = 
                dataEncoder.encode(validatedData, { sensitive: true, scope: this.constructor.name });
            
            clientResponse.data = encodedData;
            clientResponse.encoding = encodingMetadata;
        } else {
            // Regular data
            clientResponse.data = validatedData;
        }
        
        // Include selected metadata that's relevant for clients
        const clientMetadata = {};
        const clientSafeMetadataKeys = ['timestamp', 'version', 'pagination', 'cache'];
        
        for (const key of clientSafeMetadataKeys) {
            if (this.metadata[key] !== undefined) {
                clientMetadata[key] = this.metadata[key];
            }
        }
        
        if (Object.keys(clientMetadata).length > 0) {
            clientResponse.metadata = clientMetadata;
        }
        
        // Include helpful debug info in development environments
        if (includeDevelopmentData && this._devContext?.debug) {
            clientResponse.debug = this._devContext.debug;
        }
        
        return clientResponse;
    }

    /**
     * Ensure data is valid and safe before sending to client
     * Guards against null values, converts dates, etc.
     * 
     * @private
     * @param {any} data - Data to validate
     * @returns {any} Validated and sanitized data
     */
    _ensureValidData(data) {
        // Handle null/undefined at the top level
        if (data === null || data === undefined) {
            return this._processData(null, this.metadata);
        }
        
        // Handle different data types
        if (Array.isArray(data)) {
            // Process each item in the array
            return data.map(item => this._processDataItem(item));
        } else if (data !== null && typeof data === 'object') {
            // Process object properties
            return this._processDataItem(data);
        }
        
        // Primitives can be returned as is
        return data;
    }

    /**
     * Process an individual data item for client safety
     * 
     * @private
     * @param {Object} item - Data item to process
     * @returns {Object} Processed item
     */
    _processDataItem(item) {
        if (item === null || item === undefined || typeof item !== 'object') {
            return item;
        }
        
        const result = { ...item };
        
        // Convert Date objects to ISO strings
        for (const [key, value] of Object.entries(result)) {
            // Handle nested objects recursively
            if (value !== null && typeof value === 'object') {
                if (value instanceof Date) {
                    result[key] = value.toISOString();
                } else if (Array.isArray(value)) {
                    result[key] = value.map(v => this._processDataItem(v));
                } else {
                    result[key] = this._processDataItem(value);
                }
            }
        }
        
        return result;
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
    
    /**
     * Add tracing information for distributed systems
     * Helps with tracking request flow through multiple services
     * 
     * @param {Object} traceInfo - Tracing information
     * @param {string} traceInfo.traceId - Unique trace identifier
     * @param {string} [traceInfo.parentId] - Parent span identifier
     * @param {string} [traceInfo.spanId] - Current span identifier
     * @returns {ResponseBase} This response for chaining
     */
    withTracing(traceInfo) {
        this.metadata.tracing = traceInfo;
        return this;
    }
    
    /**
     * Add debug information that can be sent to clients in non-production environments
     * 
     * @param {Object} debugInfo - Debug information
     * @returns {ResponseBase} This response for chaining
     */
    withDebugInfo(debugInfo) {
        return this.withDevContext({
            debug: {
                ...debugInfo,
                timestamp: new Date().toISOString()
            }
        });
    }
}

module.exports = ResponseBase;
