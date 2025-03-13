/**
 * Secure Logger
 * 
 * Extends the base logger with security features to automatically
 * redact sensitive information in logs and provide a consistent
 * logging interface across the application.
 */
const baseLogger = require('./baseLogger');
const LoggerFactory = require('./loggerFactory');
const { sanitizeObjectForLogs, SENSITIVE_FIELDS } = require('../securityUtils');

/**
 * Creates a secure logger that automatically sanitizes sensitive data
 * 
 * @param {Object} options - Configuration options for the logger
 * @param {String} options.module - The module name for contextual logging
 * @param {Array<String>} options.additionalSensitiveFields - Additional fields to redact
 * @returns {Object} - Secure logger instance
 */
function createSecureLogger(options = {}) {
  const { module = 'app', additionalSensitiveFields = [] } = options;
  
  // Create the logger using the factory if available, otherwise use base logger
  let logger;
  try {
    const loggerFactory = new LoggerFactory();
    logger = loggerFactory.createLogger();
  } catch (error) {
    logger = baseLogger;
    logger.warn('Failed to create logger with factory, falling back to base logger', { error });
  }

  // Create secure wrapper that sanitizes all log data
  const secureLogger = {
    // Create a sanitized metadata object
    _prepareMetadata: (meta = {}) => {
      // Add module context
      const enrichedMeta = { 
        ...meta,
        module,
      };
      
      // Sanitize the enriched metadata
      return sanitizeObjectForLogs(enrichedMeta);
    },
    
    // Secure logging methods
    emergency: (message, meta = {}) => 
      logger.emergency(message, secureLogger._prepareMetadata(meta)),
    
    alert: (message, meta = {}) => 
      logger.alert(message, secureLogger._prepareMetadata(meta)),
    
    critical: (message, meta = {}) => 
      logger.critical(message, secureLogger._prepareMetadata(meta)),
    
    error: (message, meta = {}) => 
      logger.error(message, secureLogger._prepareMetadata(meta)),
    
    warn: (message, meta = {}) => 
      logger.warn(message, secureLogger._prepareMetadata(meta)),
    
    notice: (message, meta = {}) => 
      logger.notice(message, secureLogger._prepareMetadata(meta)),
    
    info: (message, meta = {}) => 
      logger.info(message, secureLogger._prepareMetadata(meta)),
    
    debug: (message, meta = {}) => 
      logger.debug(message, secureLogger._prepareMetadata(meta)),
    
    trace: (message, meta = {}) => 
      logger.trace?.(message, secureLogger._prepareMetadata(meta)),
    
    // Allow access to the original logger for edge cases
    get original() {
      return logger;
    }
  };

  return secureLogger;
}

// Create default secure logger instance
const secureLogger = createSecureLogger();

// Export both the factory function and default instance
module.exports = secureLogger;
module.exports.createSecureLogger = createSecureLogger;
