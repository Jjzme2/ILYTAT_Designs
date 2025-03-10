const ValidationService = require('../services/validation/ValidationService');
const APIResponse = require('../utils/apiResponse');

/**
 * Create validation middleware
 * @param {string} schemaName - Name of the schema to validate against
 * @param {string} source - Request property to validate (body, query, params)
 * @returns {function} Express middleware
 */
const createValidationMiddleware = (schemaName, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = await ValidationService.validateOrThrow(schemaName, data);
      
      // Replace request data with validated data
      req[source] = validatedData;
      next();
    } catch (error) {
      console.error('Validation error:', error.message);
      
      // Use the API Response utility to format error response
      return res.status(400).json(
        APIResponse.error({ 
          error: new Error('Validation failed'), 
          clientMessage: 'The submitted data failed validation',
          requestId: req.requestId,
          context: {
            validationErrors: parseValidationErrors(error.message)
          }
        })
      );
    }
  };
};

/**
 * Parse validation error messages from Joi into a structured object
 * @param {string} errorMessage - Error message from Joi
 * @returns {object} - Structured validation errors by field
 */
const parseValidationErrors = (errorMessage) => {
  if (!errorMessage) return {};
  
  const errors = {};
  const errorParts = errorMessage.split(', ');
  
  errorParts.forEach(part => {
    // Extract field name from the error message
    const match = part.match(/"([^"]+)"/);
    if (match && match[1]) {
      const field = match[1];
      errors[field] = part.replace(`"${field}" `, '');
    } else {
      // If we can't extract a field, use a generic key
      if (!errors.general) errors.general = [];
      errors.general.push(part);
    }
  });
  
  return errors;
};

// Export middleware creators for different entities
module.exports = {
  validateRegistration: createValidationMiddleware('userRegistration'),
  validateLogin: createValidationMiddleware('userLogin'),
  validateUser: createValidationMiddleware('userCreate'),
  validateUserUpdate: createValidationMiddleware('userUpdate'),
  validateRole: createValidationMiddleware('roleCreate'),
  validateRoleUpdate: createValidationMiddleware('roleUpdate'),
  validatePermission: createValidationMiddleware('permissionCreate'),
  validatePermissionUpdate: createValidationMiddleware('permissionUpdate'),
  validateRolePermissions: createValidationMiddleware('rolePermissionsUpdate'),
  validateUserRoles: createValidationMiddleware('userRolesUpdate'),
  validateForgotPassword: createValidationMiddleware('forgotPassword'),
  validatePasswordReset: createValidationMiddleware('passwordReset'),
  
  // Generic validation middleware creator for custom use
  validate: createValidationMiddleware
};
