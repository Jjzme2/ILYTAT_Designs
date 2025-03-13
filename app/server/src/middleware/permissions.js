/**
 * Permissions Middleware
 * Provides granular, resource-based permission control
 * @module middleware/permissions
 */

const logger = require('../utils/logger');
const { Role, Permission, UserPermission } = require('../models');

/**
 * Permission constants for standardized permission naming
 */
const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage', // Encompasses all user operations

  // Role permissions
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_MANAGE: 'role:manage', // Encompasses all role operations

  // Document permissions
  DOC_CREATE: 'document:create',
  DOC_READ: 'document:read',
  DOC_UPDATE: 'document:update',
  DOC_DELETE: 'document:delete',
  DOC_MANAGE: 'document:manage', // Encompasses all document operations

  // Audit permissions
  AUDIT_READ: 'audit:read',
  AUDIT_MANAGE: 'audit:manage',

  // System permissions
  SYSTEM_READ: 'system:read',
  SYSTEM_MANAGE: 'system:manage',

  // Printify permissions
  PRINTIFY_READ: 'printify:read',
  PRINTIFY_MANAGE: 'printify:manage',

  // Contact permissions
  CONTACT_READ: 'contact:read',
  CONTACT_MANAGE: 'contact:manage',

  // Payment permissions
  PAYMENT_READ: 'payment:read',
  PAYMENT_PROCESS: 'payment:process',
  PAYMENT_REFUND: 'payment:refund',
  PAYMENT_MANAGE: 'payment:manage',

  // Global admin
  ADMIN: 'admin:all' // Super admin permission
};

/**
 * Check if user has specific permissions for a resource
 * @param {string|string[]} requiredPermissions - Required permission(s)
 * @param {Object} options - Additional options
 * @param {boolean} options.all - If true, user must have all permissions (default: false)
 * @param {Function} options.resourceAccessCheck - Optional function to check resource access
 * @returns {Function} Middleware function
 * 
 * @example
 * // Check if user has permission to read users
 * checkPermission(PERMISSIONS.USER_READ)
 * 
 * // Check if user has all required permissions
 * checkPermission([PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE], { all: true })
 * 
 * // Check resource-specific permissions
 * checkPermission(PERMISSIONS.DOC_UPDATE, {
 *   resourceAccessCheck: async (req) => {
 *     const doc = await Document.findByPk(req.params.id);
 *     return doc && doc.ownerId === req.user.id;
 *   }
 * })
 */
const checkPermission = (requiredPermissions, options = {}) => {
  const permissionsArray = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  const { all = false, resourceAccessCheck } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }

      // Admin users bypass all permission checks
      if (req.user.role === 'admin' || 
         (req.user.roles && req.user.roles.includes('admin')) ||
         (req.user.permissions && req.user.permissions.includes(PERMISSIONS.ADMIN))) {
        return next();
      }
      
      // Get user permissions
      const userPermissions = req.user.permissions || [];
      
      // Check permissions
      const hasPermissions = all
        ? permissionsArray.every(perm => userPermissions.includes(perm))
        : permissionsArray.some(perm => userPermissions.includes(perm));
      
      if (!hasPermissions) {
        return res.status(403).json({
          success: false, 
          message: 'Insufficient permissions'
        });
      }
      
      // If resource-specific access check is provided, run it
      if (resourceAccessCheck && typeof resourceAccessCheck === 'function') {
        const hasAccess = await resourceAccessCheck(req);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Resource access denied'
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

/**
 * Check if user owns a resource or has admin permissions
 * @param {string} modelName - Sequelize model name
 * @param {string} idParam - Request parameter containing resource ID
 * @param {string} ownerField - Field in the model that contains the owner ID (default: 'userId')
 * @returns {Function} Middleware function
 * 
 * @example
 * // Check if user owns a document or is an admin
 * checkOwnership('Document', 'id')
 * 
 * // Check with custom owner field
 * checkOwnership('Product', 'productId', 'createdBy')
 */
const checkOwnership = (modelName, idParam, ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }
      
      // Admin users bypass ownership checks
      if (req.user.role === 'admin' || 
         (req.user.roles && req.user.roles.includes('admin')) ||
         (req.user.permissions && req.user.permissions.includes(PERMISSIONS.ADMIN))) {
        return next();
      }
      
      const resourceId = req.params[idParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `Missing ${idParam} parameter`
        });
      }
      
      // Get the model
      const models = require('../models');
      const Model = models[modelName];
      if (!Model) {
        return res.status(500).json({
          success: false,
          message: `Model ${modelName} not found`
        });
      }
      
      // Find the resource
      const resource = await Model.findByPk(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }
      
      // Check ownership
      if (resource[ownerField] !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership check'
      });
    }
  };
};

/**
 * Initialize user permissions from database
 * @param {Object} req - Express request object
 * @returns {Promise<string[]>} Array of permission strings
 */
const loadUserPermissions = async (userId) => {
  try {
    // Get user's role-based permissions
    const userWithRole = await User.findByPk(userId, {
      include: {
        model: Role,
        include: [Permission]
      }
    });
    
    if (!userWithRole) {
      return [];
    }
    
    // Extract permissions from user's role
    const rolePermissions = userWithRole.Role ? 
      userWithRole.Role.Permissions.map(p => p.name) : [];
    
    // Get user's direct permissions
    const userPermissions = await UserPermission.findAll({
      where: { userId },
      include: [Permission]
    });
    
    const directPermissions = userPermissions.map(up => up.Permission.name);
    
    // Combine and remove duplicates
    return [...new Set([...rolePermissions, ...directPermissions])];
  } catch (error) {
    logger.error('Error loading user permissions:', error);
    return [];
  }
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} Whether user has permission
 */
const userHasPermission = async (user, permission) => {
  try {
    // Admin users have all permissions
    if (user.role === 'admin' || 
        (user.roles && user.roles.includes('admin')) || 
        (user.permissions && user.permissions.includes(PERMISSIONS.ADMIN))) {
      return true;
    }

    // Get user permissions if not already loaded
    const userPermissions = user.permissions || await loadUserPermissions(user.id);
    
    // Check if the permission exists in the user's permissions
    return userPermissions.includes(permission);
  } catch (error) {
    logger.error('Error checking user permission:', error);
    return false; // Deny access on error (fail closed)
  }
};

/**
 * Check if a user has multiple permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permissions to check
 * @param {boolean} requireAll - Whether all permissions are required (true) or any (false)
 * @returns {Promise<boolean>} Whether user has the required permissions
 */
const userHasPermissions = async (user, permissions, requireAll = true) => {
  try {
    // Admin users have all permissions
    if (user.role === 'admin' || 
        (user.roles && user.roles.includes('admin')) || 
        (user.permissions && user.permissions.includes(PERMISSIONS.ADMIN))) {
      return true;
    }
    
    // If we need all permissions, check that every permission is present
    if (requireAll) {
      for (const permission of permissions) {
        const hasPermission = await userHasPermission(user, permission);
        if (!hasPermission) return false;
      }
      return true;
    } 
    // Otherwise, check if user has ANY of the permissions
    else {
      for (const permission of permissions) {
        const hasPermission = await userHasPermission(user, permission);
        if (hasPermission) return true;
      }
      return false;
    }
  } catch (error) {
    logger.error('Error checking user permissions:', error);
    return false; // Deny access on error (fail closed)
  }
};

module.exports = {
  PERMISSIONS,
  checkPermission,
  checkOwnership,
  loadUserPermissions,
  userHasPermission,
  userHasPermissions
};
