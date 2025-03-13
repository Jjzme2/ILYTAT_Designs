/**
 * Documentation routes
 * Provides role-specific documentation access with granular permissions
 * @module routes/api/documentations
 */
const documentationController = require('../../controllers/documentationController');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');

/**
 * Route definitions for documentation endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  ALL: '/',
  BY_ID: '/:id',
  BY_ROLE: '/role/:roleId',
  BY_CATEGORY: '/category/:category',
  // New developer-specific routes
  DEVELOPER: '/developer',
  USER: '/user',
  ADMIN: '/admin',
  // File-based documentation routes
  FILES: '/files',
  FILE_CONTENT: '/files/:filePath(*)', // Using (*) to match any path including slashes
  SAVE_FILE: '/files/:filePath(*)/save'
};

/**
 * Register documentation routes with role-based access control
 * @param {Express.Router} router - Express router instance
 */
const documentationRoutes = (router) => {
  // === PUBLIC ROUTES ===
  
  // Basic public documentation (if any)
  router.get('/public', documentationController.getPublicDocumentation);
  
  // === AUTHENTICATED ROUTES ===
  
  // Get documentation by user's own role (automatically filtered)
  router.get(
    ROUTES.ALL,
    authenticateToken,
    documentationController.getForCurrentUser
  );
  
  // Get specific documentation by ID (with role check)
  router.get(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_READ, {
      resourceAccessCheck: async (req) => {
        // This would check if the requested doc is accessible to the user's role
        return await documentationController.canUserAccessDoc(req.user, req.params.id);
      }
    }),
    documentationController.getById
  );

  // Get documentation by role
  router.get(
    ROUTES.BY_ROLE, 
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_READ),
    documentationController.getByRole
  );

  // Get documentation by category
  router.get(
    ROUTES.BY_CATEGORY,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_READ),
    documentationController.getByCategory
  );
  
  // === ROLE-SPECIFIC DOCUMENTATION ROUTES ===
  
  // Developer documentation (only for developers and admins)
  router.get(
    ROUTES.DEVELOPER,
    authenticateToken,
    checkPermission([PERMISSIONS.DOC_READ, 'developer:access']), // Requires either general doc read or developer access
    documentationController.getDeveloperDocs
  );
  
  // User documentation (for users, developers, and admins)
  router.get(
    ROUTES.USER,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_READ),
    documentationController.getUserDocs
  );
  
  // Admin documentation (admin only)
  router.get(
    ROUTES.ADMIN,
    authenticateToken,
    checkPermission('admin:access'), // Admin-specific permission
    documentationController.getAdminDocs
  );

  // === FILE-BASED DOCUMENTATION ROUTES ===
  
  // Get all markdown files available in the codebase
  router.get(
    ROUTES.FILES,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_READ),
    documentationController.getMarkdownFiles
  );
  
  // Get content of a specific markdown file
  router.get(
    ROUTES.FILE_CONTENT,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_READ),
    documentationController.getMarkdownFileContent
  );
  
  // Save content to a markdown file
  router.post(
    ROUTES.SAVE_FILE,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_UPDATE),
    documentationController.saveMarkdownFile
  );

  // === CONTENT MANAGEMENT ROUTES (ADMIN ONLY) ===

  // Create new documentation
  router.post(
    ROUTES.ALL,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_CREATE),
    documentationController.create
  );

  // Update documentation
  router.put(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_UPDATE),
    documentationController.update
  );

  // Delete documentation
  router.delete(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_DELETE),
    documentationController.delete
  );
};

module.exports = documentationRoutes;