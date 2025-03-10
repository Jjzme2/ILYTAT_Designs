const { ValidationError } = require('sequelize');
const logger = require('../utils/logger');
const APIResponse = require('../utils/apiResponse');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(statusCode, message, validationErrors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.validationErrors = validationErrors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode,
    requestId: req.requestId || 'unknown'
  });

  // Handle specific error types
  if (err instanceof ValidationError) {
    const validationErrors = {};
    
    // Format Sequelize validation errors
    err.errors.forEach(e => {
      validationErrors[e.path] = e.message;
    });

    return res.status(400).json(
      APIResponse.error({
        error: new Error('Validation error'),
        clientMessage: 'The submitted data failed validation',
        requestId: req.requestId,
        context: { validationErrors }
      })
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      APIResponse.error({
        error: err,
        clientMessage: 'Authentication failed: Invalid token',
        requestId: req.requestId
      })
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      APIResponse.error({
        error: err,
        clientMessage: 'Authentication failed: Token expired',
        requestId: req.requestId
      })
    );
  }

  // For operational errors, send error details
  if (err.isOperational) {
    return res.status(err.statusCode).json(
      APIResponse.error({
        error: err,
        clientMessage: err.message,
        requestId: req.requestId,
        context: { validationErrors: err.validationErrors }
      })
    );
  }

  // For production, don't leak error details for non-operational errors
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json(
      APIResponse.error({
        error: new Error('Internal server error'),
        clientMessage: 'Something went wrong on our end. Please try again later.',
        requestId: req.requestId
      })
    );
  }

  // For development, send detailed error
  return res.status(err.statusCode).json(
    APIResponse.error({
      error: err,
      clientMessage: err.message || 'An unexpected error occurred',
      requestId: req.requestId,
      context: {
        stack: err.stack,
        validationErrors: err.validationErrors 
      }
    })
  );
};

// Create a 404 error for non-existent routes
const createNotFoundError = (req, res, next) => {
  const err = new APIError(404, `Route not found: ${req.originalUrl}`);
  next(err);
};

// Async error wrapper
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  APIError,
  errorHandler,
  createNotFoundError,
  catchAsync
};
