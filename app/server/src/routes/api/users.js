/**
 * User Routes
 * Provides endpoints for user management with role-based access control
 * @module routes/api/users
 */
const UserController = require('../../controllers/UserController');
const { authenticateToken } = require('../../middleware/auth');
const { validateUser } = require('../../middleware/validation');
const { PERMISSIONS, checkPermission, checkOwnership } = require('../../middleware/permissions');

/**
 * Route definitions for user endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  ALL: '/',
  BY_ID: '/:id',
  USER_ROLES: '/:id/roles',
  PROFILE: '/profile',
  PREFERENCES: '/preferences',
  PERMISSIONS: '/:id/permissions'
};

/**
 * Register user routes with role-based permissions
 * @param {Express.Router} router - Express router instance
 */
const userRoutes = (router) => {
  // === USER-SPECIFIC ROUTES (own profile/data) ===
  
  // Get own user profile
  router.get(
    ROUTES.PROFILE,
    authenticateToken,
    UserController.getProfile
  );
  
  // Update own preferences
  router.put(
    ROUTES.PREFERENCES,
    authenticateToken,
    UserController.updatePreferences
  );
  
  // === USER MANAGEMENT ROUTES (require permissions) ===
  
  // Get all users (requires user:read permission)
  router.get(
    ROUTES.ALL,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_READ),
    UserController.getAll
  );
  
  // Get user by ID (requires user:read permission or ownership)
  router.get(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_READ, {
      resourceAccessCheck: async (req) => {
        // Allow users to access their own data
        return req.user.id === req.params.id;
      }
    }),
    UserController.getById
  );
  
  // Get user roles (requires user:read permission or ownership)
  router.get(
    ROUTES.USER_ROLES,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_READ, {
      resourceAccessCheck: async (req) => {
        // Allow users to view their own roles
        return req.user.id === req.params.id;
      }
    }),
    UserController.getUserRoles
  );
  
  // Get user permissions (requires user:read permission or ownership)
  router.get(
    ROUTES.PERMISSIONS,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_READ, {
      resourceAccessCheck: async (req) => {
        // Allow users to view their own permissions
        return req.user.id === req.params.id;
      }
    }),
    UserController.getUserPermissions
  );
  
  // Create user (requires user:create permission)
  router.post(
    ROUTES.ALL,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_CREATE),
    validateUser,
    UserController.create
  );
  
  // Update user (requires user:update permission or ownership)
  router.put(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_UPDATE, {
      resourceAccessCheck: async (req) => {
        // Allow users to update their own profile
        return req.user.id === req.params.id;
      }
    }),
    validateUser,
    UserController.update
  );
  
  // Delete user (requires user:delete permission)
  router.delete(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_DELETE),
    UserController.delete
  );
};

module.exports = userRoutes;