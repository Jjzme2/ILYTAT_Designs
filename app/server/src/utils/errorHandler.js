/**
 * Error Handler Utilities
 * Enhanced with integrated logging and response system
 */
const { ValidationError, UniqueConstraintError } = require('sequelize');
const logger = require('./logger');
const { isResponse } = require('./response/utils');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, data = {}, userMessage = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.data = data;
    this.userMessage = userMessage || message;
  }
}

/**
 * Wraps an async route handler to catch errors
 * @param {Function} fn - The async route handler function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * Enhanced to use the response system for consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  // Check if res.sendError is available (added by response middleware)
  if (typeof res.sendError === 'function') {
    // Handle different error types with our enhanced response system
    
    // Handle Sequelize validation errors
    if (err instanceof ValidationError) {
      const validationErrors = err.errors.reduce((acc, e) => {
        acc[e.path] = e.message;
        return acc;
      }, {});
      
      return res.sendValidationError(
        validationErrors,
        'Please correct the validation errors and try again'
      );
    }

    // Handle Sequelize unique constraint errors
    if (err instanceof UniqueConstraintError) {
      const validationErrors = err.errors.reduce((acc, e) => {
        acc[e.path] = 'Must be unique';
        return acc;
      }, {});
      
      return res.sendValidationError(
        validationErrors,
        'A record with this information already exists'
      );
    }

    // Handle custom API errors
    if (err instanceof APIError) {
      return res.sendError(
        err,
        err.userMessage,
        err.statusCode
      );
    }

    // Handle JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
      return res.sendUnauthorized('Your session is invalid. Please log in again.');
    }

    if (err.name === 'TokenExpiredError') {
      return res.sendUnauthorized('Your session has expired. Please log in again.');
    }

    // Handle 404 errors
    if (err.name === 'NotFoundError') {
      return res.sendNotFound(
        err.resource || 'Resource',
        err.identifier,
        err.message || 'The requested resource was not found'
      );
    }

    // Handle other errors using our error response
    const statusCode = err.statusCode || 500;
    const userMessage = statusCode < 500
      ? err.userMessage || err.message
      : 'An unexpected error occurred. Our team has been notified.';
    
    return res.sendError(err, userMessage, statusCode);
  } else {
    // Fallback for when response middleware is not available
    // Log error with context
    logger.error('Error occurred (fallback handler)', { 
      error: err, 
      url: req.originalUrl,
      method: req.method
    });

    // Handle Sequelize validation errors
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    // Handle Sequelize unique constraint errors
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        error: 'Resource already exists',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    // Handle custom API errors
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        data: err.data
      });
    }

    // Handle JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    // Handle 404 errors
    if (err.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: err.message || 'Resource not found'
      });
    }

    // Handle other errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message;

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }
};

/**
 * Creates a new APIError
 * @param {string} message - Error message (for developers)
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Additional error data
 * @param {string} userMessage - User-friendly error message
 * @returns {APIError} New APIError instance
 */
const createError = (message, statusCode = 500, data = {}, userMessage = null) => {
  return new APIError(message, statusCode, data, userMessage);
};

/**
 * Creates a NotFoundError
 * @param {string} resource - Name of the resource that wasn't found
 * @param {string|number} [identifier] - Optional identifier of the resource
 * @param {string} [userMessage] - Optional user-friendly message
 * @returns {Error} New NotFoundError instance
 */
const createNotFoundError = (resource, identifier = null, userMessage = null) => {
  const idStr = identifier ? ` with ID ${identifier}` : '';
  const message = `${resource}${idStr} not found`;
  
  const error = new Error(message);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  error.resource = resource;
  error.identifier = identifier;
  error.userMessage = userMessage || `The requested ${resource.toLowerCase()} could not be found`;
  
  return error;
};

module.exports = {
  APIError,
  catchAsync,
  errorHandler,
  createError,
  createNotFoundError
};
