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
      res.status(400).json(APIResponse.error('Validation failed', error.message));
    }
  };
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
  
  // Generic validation middleware creator for custom use
  validate: createValidationMiddleware
};
