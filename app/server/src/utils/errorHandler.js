const { ValidationError, UniqueConstraintError } = require('sequelize');
const logger = require('./logger');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, data = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.data = data;
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
 */
const errorHandler = (err, req, res, next) => {
  // Log error with enhanced context
  logger.logAPIError(err, req);

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
};

/**
 * Creates a new APIError
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Additional error data
 * @returns {APIError} New APIError instance
 */
const createError = (message, statusCode = 500, data = {}) => {
  return new APIError(message, statusCode, data);
};

/**
 * Creates a NotFoundError
 * @param {string} resource - Name of the resource that wasn't found
 * @returns {APIError} New NotFoundError instance
 */
const createNotFoundError = (resource) => {
  const error = new Error(`${resource} not found`);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  return error;
};

module.exports = {
  APIError,
  catchAsync,
  errorHandler,
  createError,
  createNotFoundError
};
