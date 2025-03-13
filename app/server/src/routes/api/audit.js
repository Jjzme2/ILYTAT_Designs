/**
 * Audit API Routes
 * Provides endpoints for accessing and managing audit records
 * Implements role-based permissions middleware for access control
 */
const AuditController = require('../../controllers/auditController');
const { check, query, param } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission, userHasPermission } = require('../../middleware/permissions');

// Route paths definition
const ROUTES = {
  ALL: '/',
  BY_ID: '/:id',
  ENTITY_HISTORY: '/entity/:entityType/:entityId',
  USER_HISTORY: '/user/:userId',
  STATS: '/stats'
};

/**
 * Permission constants for audit operations
 * Following the standardized permission naming convention: resource:action
 */
if (!PERMISSIONS.AUDIT_VIEW) {
  // Define audit permissions if not already defined in the permissions middleware
  Object.assign(PERMISSIONS, {
    AUDIT_VIEW: 'audit:view',
    AUDIT_ADMIN: 'audit:admin',
    AUDIT_EXPORT: 'audit:export'
  });
}

/**
 * Audit routes registration function
 * @param {Express.Router} router - Express router instance
 */
const auditRoutes = (router) => {
  /**
   * @route   GET /api/audit
   * @desc    Get paginated audit records with filtering
   * @access  Private (requires audit:view permission)
   */
  router.get(
    ROUTES.ALL,
    authenticateToken,
    checkPermission(PERMISSIONS.AUDIT_VIEW),
    [
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('action').optional().isString(),
      query('entityType').optional().isString(),
      query('entityId').optional().isString(),
      query('userId').optional().isUUID(4),
      query('status').optional().isIn(['success', 'failure', 'warning']),
      query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('sortBy').optional().isString(),
      query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc'])
    ],
    AuditController.getAuditRecords
  );

  /**
   * @route   GET /api/audit/:id
   * @desc    Get audit record by ID
   * @access  Private (requires audit:view permission)
   */
  router.get(
    ROUTES.BY_ID,
    authenticateToken,
    checkPermission(PERMISSIONS.AUDIT_VIEW),
    [
      param('id').isUUID(4).withMessage('Invalid audit record ID')
    ],
    AuditController.getAuditRecord
  );

  /**
   * @route   GET /api/audit/entity/:entityType/:entityId
   * @desc    Get audit history for a specific entity
   * @access  Private (requires audit:view permission)
   */
  router.get(
    ROUTES.ENTITY_HISTORY,
    authenticateToken,
    checkPermission(PERMISSIONS.AUDIT_VIEW),
    [
      param('entityType').isString().withMessage('Entity type is required'),
      param('entityId').isString().withMessage('Entity ID is required'),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('sortBy').optional().isString(),
      query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc'])
    ],
    AuditController.getEntityHistory
  );

  /**
   * @route   GET /api/audit/user/:userId
   * @desc    Get audit history for a specific user's actions
   * @access  Private (requires audit:view permission)
   */
  router.get(
    ROUTES.USER_HISTORY,
    authenticateToken,
    checkPermission(PERMISSIONS.AUDIT_VIEW, {
      // Resource-specific access check for user history
      resourceAccessCheck: async (req) => {
        // Allow users to view their own audit history
        // Admins and those with AUDIT_ADMIN can view anyone's history
        return req.user.id === req.params.userId || 
               req.user.role === 'admin' || 
               await userHasPermission(req.user, PERMISSIONS.AUDIT_ADMIN);
      }
    }),
    [
      param('userId').isUUID(4).withMessage('Invalid user ID'),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('sortBy').optional().isString(),
      query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc'])
    ],
    AuditController.getUserActionHistory
  );

  /**
   * @route   GET /api/audit/stats
   * @desc    Get audit statistics
   * @access  Private (requires audit:admin permission)
   */
  router.get(
    ROUTES.STATS,
    authenticateToken,
    checkPermission(PERMISSIONS.AUDIT_ADMIN),
    [
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601()
    ],
    AuditController.getAuditStats
  );
  
  /**
   * @route   GET /api/audit/export
   * @desc    Export audit logs to CSV/JSON
   * @access  Private (requires audit:export permission)
   */
  router.get(
    '/export',
    authenticateToken,
    checkPermission(PERMISSIONS.AUDIT_EXPORT),
    [
      query('format').isIn(['csv', 'json']).withMessage('Format must be csv or json'),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('entityType').optional().isString(),
      query('action').optional().isString()
    ],
    AuditController.exportAuditLogs
  );
};

module.exports = auditRoutes;
