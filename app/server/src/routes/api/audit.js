/**
 * Audit API Routes
 * Provides endpoints for accessing and managing audit records
 */

const express = require('express');
const router = express.Router();
const AuditController = require('../../controllers/auditController');
const { check, query, param } = require('express-validator');
const auth = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/permissions');

// Middleware to ensure only authorized users can access audit records
const requireAuditAccess = [
  auth.requireAuth,
  checkPermission('audit:view')
];

// Middleware to ensure only admin users can access advanced audit features
const requireAuditAdmin = [
  auth.requireAuth,
  checkPermission('audit:admin')
];

/**
 * @route   GET /api/audit
 * @desc    Get paginated audit records with filtering
 * @access  Private (requires audit:view permission)
 */
router.get(
  '/',
  requireAuditAccess,
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
  '/:id',
  requireAuditAccess,
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
  '/entity/:entityType/:entityId',
  requireAuditAccess,
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
  '/user/:userId',
  requireAuditAccess,
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
  '/stats',
  requireAuditAdmin,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  AuditController.getAuditStats
);

module.exports = router;
