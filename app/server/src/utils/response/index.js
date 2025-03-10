/**
 * Response System - Unified exports for response handling
 * Provides access to all response types and factory
 */
const ResponseBase = require('./ResponseBase');
const SuccessResponse = require('./SuccessResponse');
const ErrorResponse = require('./ErrorResponse');
const NetworkResponse = require('./NetworkResponse');
const AuthResponse = require('./AuthResponse');
const BusinessResponse = require('./BusinessResponse');
const ResponseFactory = require('./ResponseFactory');

// Export all components
module.exports = {
  ResponseBase,
  SuccessResponse,
  ErrorResponse,
  NetworkResponse,
  AuthResponse,
  BusinessResponse,
  ResponseFactory,
  
  /**
   * Create a new Response Factory with the provided logger
   * @param {Object} logger - Logger instance
   * @returns {ResponseFactory} Configured response factory
   */
  createFactory: (logger) => {
    return new ResponseFactory({ logger });
  }
};
