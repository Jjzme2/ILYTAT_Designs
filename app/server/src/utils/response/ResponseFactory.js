/**
 * ResponseFactory - Factory for creating standardized response objects
 * Implements dependency injection for the logger
 */
const SuccessResponse = require('./SuccessResponse');
const ErrorResponse = require('./ErrorResponse');
const NetworkResponse = require('./NetworkResponse');
const AuthResponse = require('./AuthResponse');
const BusinessResponse = require('./BusinessResponse');

class ResponseFactory {
    /**
     * Create a new ResponseFactory instance
     * 
     * @param {Object} dependencies - Injectable dependencies
     * @param {Object} dependencies.logger - Logger instance
     */
    constructor({ logger }) {
        this.logger = logger;
        
        // Bind methods to preserve 'this' context
        this.success = this.success.bind(this);
        this.error = this.error.bind(this);
        this.validation = this.validation.bind(this);
        this.network = this.network.bind(this);
        this.auth = this.auth.bind(this);
        this.business = this.business.bind(this);
        this.notFound = this.notFound.bind(this);
        this.forbidden = this.forbidden.bind(this);
        this.unauthorized = this.unauthorized.bind(this);
        this.createMiddleware = this.createMiddleware.bind(this);
    }

    /**
     * Log a response using the injected logger
     * 
     * @private
     * @param {Object} response - Response object
     * @param {string} logLevel - Log level to use
     */
    _logResponse(response, logLevel = 'info') {
        if (!this.logger) return;
        
        const logData = response.toLogFormat();
        
        // Choose appropriate log level based on response data
        if (logLevel === 'auto') {
            logLevel = response.isSuccess() ? 'info' : 'error';
        }
        
        this.logger[logLevel](`${logData.message} [${response.constructor.name}]`, {
            responseType: response.constructor.name,
            responseData: logData
        });
    }

    /**
     * Create a success response
     * 
     * @param {Object} options - Response options
     * @param {string} [options.message] - Developer message
     * @param {string} [options.userMessage] - User-friendly message
     * @param {any} [options.data] - Response data
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {SuccessResponse} Success response
     */
    success(options = {}) {
        const response = new SuccessResponse(options);
        this._ensureEnhancementMethods(response);
        this._logResponse(response);
        return response;
    }

    /**
     * Create an error response
     * 
     * @param {Object} options - Response options
     * @param {Error|string} options.error - Error object or message
     * @param {string} [options.message] - Developer message
     * @param {string} [options.userMessage] - User-friendly message
     * @param {Object} [options.metadata] - Additional metadata
     * @param {number} [options.statusCode] - HTTP status code
     * @returns {ErrorResponse} Error response
     */
    error(options) {
        const response = new ErrorResponse(options);
        this._ensureEnhancementMethods(response);
        this._logResponse(response, 'error');
        return response;
    }

    /**
     * Create a validation error response
     * 
     * @param {Object} options - Response options
     * @param {Object} options.validationErrors - Validation errors by field
     * @param {string} [options.message='Validation failed'] - Developer message
     * @param {string} [options.userMessage='The provided data is invalid'] - User message
     * @returns {ErrorResponse} Validation error response
     */
    validation({
        validationErrors,
        message = 'Validation failed',
        userMessage = 'The provided data is invalid',
        ...rest
    }) {
        const response = new ErrorResponse({
            error: new Error(message),
            message,
            userMessage,
            statusCode: 400,
            ...rest
        }).withValidationErrors(validationErrors);
        
        this._ensureEnhancementMethods(response);
        this._logResponse(response, 'warn');
        return response;
    }

    /**
     * Create a network response
     * 
     * @param {Object} options - Response options
     * @returns {NetworkResponse} Network response
     */
    network(options) {
        const response = new NetworkResponse(options);
        this._ensureEnhancementMethods(response);
        this._logResponse(response);
        return response;
    }

    /**
     * Create an authentication response
     * 
     * @param {Object} options - Response options
     * @returns {AuthResponse} Auth response
     */
    auth(options) {
        const response = new AuthResponse(options);
        this._ensureEnhancementMethods(response);
        this._logResponse(response);
        return response;
    }

    /**
     * Create a business operation response
     * 
     * @param {Object} options - Response options
     * @returns {BusinessResponse} Business response
     */
    business(options) {
        const response = new BusinessResponse(options);
        
        // Ensure the response has all the necessary enhancement methods
        this._ensureEnhancementMethods(response);
        
        this._logResponse(response);
        return response;
    }

    /**
     * Ensure a response object has all necessary enhancement methods
     * This is a safeguard to make sure all response objects have the expected methods
     * 
     * @private
     * @param {Object} response - Response object to enhance
     * @returns {Object} Enhanced response
     */
    _ensureEnhancementMethods(response) {
        // Check for and add missing methods if needed
        if (typeof response.withPerformanceMetrics !== 'function') {
            response.withPerformanceMetrics = function(metrics) {
                return this.withDevContext({
                    performance: {
                        ...metrics,
                        timestamp: new Date().toISOString()
                    }
                });
            };
        }
        
        if (typeof response.withSecurityDetails !== 'function') {
            response.withSecurityDetails = function(details) {
                return this.withDevContext({
                    security: {
                        ...details,
                        timestamp: new Date().toISOString()
                    }
                });
            };
        }
        
        if (typeof response.withRequestDetails !== 'function') {
            response.withRequestDetails = function(details) {
                return this.withDevContext({
                    request: {
                        ...details,
                        timestamp: new Date().toISOString()
                    }
                });
            };
        }
        
        return response;
    }

    /**
     * Create a not found error response
     * 
     * @param {Object} options - Response options
     * @param {string} [options.resource='Resource'] - Resource type that wasn't found
     * @param {string} [options.identifier] - Resource identifier
     * @param {string} [options.userMessage='The requested resource was not found'] - User message
     * @returns {ErrorResponse} Not found error response
     */
    notFound({
        resource = 'Resource',
        identifier,
        userMessage = 'The requested resource was not found',
        ...rest
    }) {
        const idStr = identifier ? ` with ID ${identifier}` : '';
        const message = `${resource}${idStr} not found`;
        
        const response = new ErrorResponse({
            error: new Error(message),
            message,
            userMessage,
            statusCode: 404,
            ...rest
        });
        
        this._ensureEnhancementMethods(response);
        this._logResponse(response, 'warn');
        return response;
    }

    /**
     * Create a forbidden error response
     * 
     * @param {Object} options - Response options
     * @param {string} [options.action='access this resource'] - Attempted action
     * @param {string} [options.userMessage='You do not have permission to perform this action'] - User message
     * @returns {ErrorResponse} Forbidden error response
     */
    forbidden({
        action = 'access this resource',
        userMessage = 'You do not have permission to perform this action',
        ...rest
    }) {
        const message = `Permission denied to ${action}`;
        
        const response = new ErrorResponse({
            error: new Error(message),
            message,
            userMessage,
            statusCode: 403,
            ...rest
        });
        
        this._ensureEnhancementMethods(response);
        this._logResponse(response, 'warn');
        return response;
    }

    /**
     * Create an unauthorized error response
     * 
     * @param {Object} options - Response options
     * @param {string} [options.userMessage='Authentication required'] - User message
     * @returns {ErrorResponse} Unauthorized error response
     */
    unauthorized({
        userMessage = 'Authentication required',
        ...rest
    }) {
        const message = 'Authentication required';
        
        const response = new ErrorResponse({
            error: new Error(message),
            message,
            userMessage,
            statusCode: 401,
            ...rest
        });
        
        this._ensureEnhancementMethods(response);
        this._logResponse(response, 'warn');
        return response;
    }

    /**
     * Create Express middleware that adds response helper methods to res object
     * 
     * @returns {Function} Express middleware
     */
    createMiddleware() {
        const factory = this;
        
        return function responseMiddleware(req, res, next) {
            // Add helper methods to the response object
            res.sendSuccess = function(data, message = 'Success') {
                const response = factory.success({
                    message,
                    userMessage: message,
                    data
                });
                
                factory._ensureEnhancementMethods(response);
                return res.status(200).json(response.toClientFormat());
            };
            
            res.sendError = function(error, message, statusCode = 500) {
                const response = factory.error({
                    error,
                    message: message || error.message,
                    userMessage: 'An error occurred',
                    statusCode
                });
                
                factory._ensureEnhancementMethods(response);
                return res.status(statusCode).json(response.toClientFormat());
            };
            
            // Add specialized response methods
            res.sendValidationError = function(validationErrors, message) {
                const response = factory.validation({
                    validationErrors,
                    message: message || 'Validation failed'
                });
                
                factory._ensureEnhancementMethods(response);
                return res.status(400).json(response.toClientFormat());
            };
            
            res.sendNotFound = function(resource, identifier) {
                const response = factory.notFound({
                    resource,
                    identifier
                });
                
                factory._ensureEnhancementMethods(response);
                return res.status(404).json(response.toClientFormat());
            };
            
            res.sendForbidden = function(action) {
                const response = factory.forbidden({
                    action
                });
                
                factory._ensureEnhancementMethods(response);
                return res.status(403).json(response.toClientFormat());
            };
            
            res.sendUnauthorized = function() {
                const response = factory.unauthorized({});
                
                factory._ensureEnhancementMethods(response);
                return res.status(401).json(response.toClientFormat());
            };
            
            next();
        };
    }
}

module.exports = ResponseFactory;
