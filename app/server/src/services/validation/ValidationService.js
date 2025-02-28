/**
 * Validation Service
 * Provides a flexible way to validate data against predefined schemas
 */
class ValidationService {
  constructor(schemas) {
    this.schemas = schemas;
  }

  /**
   * Validate data against a schema
   * @param {string} schemaName - Name of the schema to validate against
   * @param {object} data - Data to validate
   * @param {object} options - Joi validation options
   * @returns {object} - { value, error }
   */
  validate(schemaName, data, options = {}) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    const defaultOptions = {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
      ...options
    };

    return schema.validate(data, defaultOptions);
  }

  /**
   * Validate data and throw error if invalid
   * @param {string} schemaName - Name of the schema to validate against
   * @param {object} data - Data to validate
   * @param {object} options - Joi validation options
   * @returns {object} - Validated data
   * @throws {Error} - If validation fails
   */
  validateOrThrow(schemaName, data, options = {}) {
    const { error, value } = this.validate(schemaName, data, options);
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      throw new Error(errorMessage);
    }
    return value;
  }

  /**
   * Check if data is valid against a schema
   * @param {string} schemaName - Name of the schema to validate against
   * @param {object} data - Data to validate
   * @returns {boolean}
   */
  isValid(schemaName, data) {
    const { error } = this.validate(schemaName, data);
    return !error;
  }

  /**
   * Get validation errors
   * @param {string} schemaName - Name of the schema to validate against
   * @param {object} data - Data to validate
   * @returns {Array} - Array of error messages
   */
  getErrors(schemaName, data) {
    const { error } = this.validate(schemaName, data);
    if (!error) return [];
    
    return error.details.map(detail => ({
      message: detail.message,
      path: detail.path,
      type: detail.type
    }));
  }
}

// Create and export validation service instance
const schemas = require('./schemas');
module.exports = new ValidationService(schemas);
