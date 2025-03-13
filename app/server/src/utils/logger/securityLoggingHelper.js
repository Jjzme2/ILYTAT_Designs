/**
 * Security Logging Helper
 * 
 * Provides utility functions to integrate secure logging practices
 * across different services in the application. Makes it easy to
 * create service-specific secure loggers that automatically redact
 * sensitive information.
 */
const { sanitizeObjectForLogs, redactSensitiveInfo } = require('../securityUtils');
const loggerFactory = require('./index').LoggerFactory;

/**
 * Creates a secure service logger that automatically sanitizes sensitive data
 * 
 * @param {String} serviceName - The name of the service using this logger
 * @param {Object} options - Additional options for logger configuration
 * @returns {Object} - Service-specific secure logger
 */
function createServiceLogger(serviceName, options = {}) {
  // Create a standard logger using the factory
  const factory = new loggerFactory({ 
    appName: `ilytat-designs-api-${serviceName}`,
    ...options
  });
  
  const logger = factory.createLogger();
  
  // Create a wrapper that automatically sanitizes all metadata
  return {
    // Enhanced logging methods with automatic sanitization
    emergency: (message, meta = {}) => {
      logger.emergency(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    alert: (message, meta = {}) => {
      logger.alert(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    critical: (message, meta = {}) => {
      logger.critical(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    error: (message, meta = {}) => {
      logger.error(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    warn: (message, meta = {}) => {
      logger.warn(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    notice: (message, meta = {}) => {
      logger.notice(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    info: (message, meta = {}) => {
      logger.info(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    debug: (message, meta = {}) => {
      logger.debug(message, sanitizeObjectForLogs({
        ...meta,
        service: serviceName
      }));
    },
    
    // Security-specific utility methods
    redact: redactSensitiveInfo,
    
    sanitize: sanitizeObjectForLogs,
    
    // Security audit logging for sensitive operations
    securityAudit: (action, meta = {}) => {
      logger.notice(`SECURITY AUDIT: ${action}`, sanitizeObjectForLogs({
        ...meta,
        securityEvent: true,
        service: serviceName,
        timestamp: new Date().toISOString()
      }));
    },
    
    // Access to original logger if needed
    get original() {
      return logger;
    }
  };
}

/**
 * Example usage:
 * 
 * // In your service file:
 * const { createServiceLogger } = require('../utils/logger/securityLoggingHelper');
 * const logger = createServiceLogger('auth-service');
 * 
 * // Now use it in your service:
 * logger.debug('User login attempt', { 
 *   email: user.email,  // Will be automatically redacted
 *   ipAddress: req.ip   // Non-sensitive, will be preserved
 * });
 */

module.exports = {
  createServiceLogger
};
