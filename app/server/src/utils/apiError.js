/**
 * Custom API Error class for handling application-specific errors
 * Extends the built-in Error class with additional properties for API error handling
 */
class APIError extends Error {
  /**
   * Create a new APIError
   * @param {Object} options - Error options
   * @param {string} options.message - Error message
   * @param {number} options.statusCode - HTTP status code (default: 500)
   * @param {Object} options.validationErrors - Validation errors object (optional)
   * @param {string} options.errorCode - Custom error code (optional)
   * @param {boolean} options.isOperational - Whether error is operational (default: true)
   * @param {Error} options.originalError - Original error that caused this error (optional)
   */
  constructor({
    message,
    statusCode = 500,
    validationErrors = null,
    errorCode = null,
    isOperational = true,
    originalError = null
  }) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.originalError = originalError;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a plain object for API response
   * @returns {Object} Error object for API response
   */
  toJSON() {
    const response = {
      status: 'error',
      statusCode: this.statusCode,
      message: this.message
    };

    if (this.validationErrors) {
      response.validationErrors = this.validationErrors;
    }

    if (this.errorCode) {
      response.errorCode = this.errorCode;
    }

    return response;
  }

  /**
   * Create a Bad Request (400) error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static badRequest(message, options = {}) {
    return new APIError({
      message: message || 'Bad Request',
      statusCode: 400,
      ...options
    });
  }

  /**
   * Create an Unauthorized (401) error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static unauthorized(message, options = {}) {
    return new APIError({
      message: message || 'Unauthorized',
      statusCode: 401,
      ...options
    });
  }

  /**
   * Create a Forbidden (403) error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static forbidden(message, options = {}) {
    return new APIError({
      message: message || 'Forbidden',
      statusCode: 403,
      ...options
    });
  }

  /**
   * Create a Not Found (404) error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static notFound(message, options = {}) {
    return new APIError({
      message: message || 'Resource not found',
      statusCode: 404,
      ...options
    });
  }

  /**
   * Create a Conflict (409) error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static conflict(message, options = {}) {
    return new APIError({
      message: message || 'Conflict',
      statusCode: 409,
      ...options
    });
  }

  /**
   * Create a Validation Error (422) error
   * @param {string} message - Error message
   * @param {Object} validationErrors - Validation errors object
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static validationError(message, validationErrors, options = {}) {
    return new APIError({
      message: message || 'Validation Error',
      statusCode: 422,
      validationErrors,
      ...options
    });
  }

  /**
   * Create a Server Error (500) error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {APIError} New APIError instance
   */
  static serverError(message, options = {}) {
    return new APIError({
      message: message || 'Internal Server Error',
      statusCode: 500,
      ...options
    });
  }
}

module.exports = APIError;
