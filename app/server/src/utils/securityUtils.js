/**
 * Security utilities for handling sensitive data and logging
 * Provides helper functions to redact sensitive information in logs and responses
 */

/**
 * Redacts sensitive information for logging or display
 * @param {string|any} value - The value to redact
 * @returns {string} Redacted string in format "[REDACTED] (x characters)"
 */
const redactSensitiveInfo = (value) => {
  if (value === undefined || value === null) return 'undefined';
  const strValue = String(value);
  return `[REDACTED] (${strValue.length} characters)`;
};

/**
 * List of fields that should always be redacted in logs
 * Keep this list updated as new sensitive fields are added
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'verificationToken',
  'reset_password_token',
  'resetPasswordToken',
  'verification_token',
  'verificationToken',
  'secret',
  'apiKey',
  'api_key',
  'key',
  'apiSecret',
  'api_secret',
  'credential',
  'ssn',
  'credit_card',
  'creditCard'
];

/**
 * Redacts all sensitive fields in an object recursively
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - A new object with sensitive fields redacted
 */
const sanitizeObjectForLogs = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForLogs(item));
  }
  
  // Handle Date objects and other special types
  if (obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }
  
  // Create a new object to avoid modifying the original
  const sanitized = {};
  
  Object.keys(obj).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field name
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = redactSensitiveInfo(obj[key]);
    } 
    // Email field should be partially redacted
    else if (lowerKey.includes('email')) {
      const value = obj[key];
      if (typeof value === 'string' && value.includes('@')) {
        sanitized[key] = redactSensitiveInfo(value);
      } else {
        sanitized[key] = value;
      }
    }
    // Phone numbers should be redacted 
    else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      sanitized[key] = redactSensitiveInfo(obj[key]);
    }
    // Recursively process nested objects
    else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObjectForLogs(obj[key]);
    } 
    // Keep non-sensitive fields as is
    else {
      sanitized[key] = obj[key];
    }
  });
  
  return sanitized;
};

/**
 * Enhances the logger by providing safe logging methods that automatically redact sensitive data
 * @param {Object} logger - The original logger instance
 * @returns {Object} - Enhanced logger with safe logging methods
 */
const createSecureLogger = (logger) => {
  return {
    debug: (message, meta = {}) => logger.debug(message, sanitizeObjectForLogs(meta)),
    info: (message, meta = {}) => logger.info(message, sanitizeObjectForLogs(meta)),
    warn: (message, meta = {}) => logger.warn(message, sanitizeObjectForLogs(meta)),
    error: (message, meta = {}) => logger.error(message, sanitizeObjectForLogs(meta)),
    // Keep original methods accessible
    original: logger
  };
};

module.exports = {
  redactSensitiveInfo,
  sanitizeObjectForLogs,
  createSecureLogger,
  SENSITIVE_FIELDS
};
