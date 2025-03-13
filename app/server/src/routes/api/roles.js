/**
 * Role Routes
 * Provides endpoints for role management with role-based access control
 * @module routes/api/roles
 */
const RoleController = require('../../controllers/RoleController');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');
const { validateRole } = require('../../middleware/validation');

/**
 * Route definitions for role endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  ALL: '/',
  BY_ID: '/:id',
  ROLE_PERMISSIONS: '/:id/permissions',
  AVAILABLE_PERMISSIONS: '/available-permissions'
};

/**
 * Register role routes with role-based permissions
 * @param {Express.Router} router - Express router instance
 */
const roleRoutes = (router) => {
  // === READ-ONLY ROUTES (for users with role:read permission) ===
  
  // Get all roles
  router.get(
    ROUTES.ALL, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_READ),
    RoleController.getAll
  );
  
  // Get role by ID
  router.get(
    ROUTES.BY_ID, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_READ),
    RoleController.getById
  );
  
  // Get role permissions
  router.get(
    ROUTES.ROLE_PERMISSIONS, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_READ),
    RoleController.getRolePermissions
  );
  
  // Get all available permissions (for role management)
  router.get(
    ROUTES.AVAILABLE_PERMISSIONS,
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_READ),
    RoleController.getAvailablePermissions
  );
  
  // === MANAGEMENT ROUTES (for users with role:create/update/delete permissions) ===
  
  // Create new role
  router.post(
    ROUTES.ALL, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_CREATE),
    validateRole, 
    RoleController.create
  );
  
  // Update role
  router.put(
    ROUTES.BY_ID, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_UPDATE),
    validateRole, 
    RoleController.update
  );
  
  // Update role permissions
  router.put(
    ROUTES.ROLE_PERMISSIONS, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_UPDATE),
    RoleController.updateRolePermissions
  );
  
  // Delete role
  router.delete(
    ROUTES.BY_ID, 
    authenticateToken,
    checkPermission(PERMISSIONS.ROLE_DELETE),
    RoleController.delete
  );
};

module.exports = roleRoutes;
