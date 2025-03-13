/**
 * System Routes
 * Routes for system monitoring, health checks, and logs
 * Implements granular permission control for different user roles
 * @module routes/api/system
 */

const systemController = require('../../controllers/systemController');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');

/**
 * Route definitions for the system endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  // Health endpoints
  HEALTH: '/health',
  HEALTH_SUMMARY: '/health/summary',
  HEALTH_DETAILED: '/health/detailed',
  
  // Logs endpoints
  LOGS: '/logs',
  LOGS_ERROR: '/logs/error',
  LOGS_ACCESS: '/logs/access',
  LOGS_AUDIT: '/logs/audit',
  
  // Statistics and monitoring
  STATS: '/stats',
  PERFORMANCE: '/performance',
  MEMORY: '/memory'
};

/**
 * Register system routes with role-based permissions
 * @param {Express.Router} router - Express router instance
 */
const systemRoutes = (router) => {
  // === PUBLIC ROUTES ===
  
  // Basic health check (limited info, publicly accessible)
  router.get(ROUTES.HEALTH, systemController.getHealthStatus);
  
  // === USER ROUTES ===
  
  // Health summary (authenticated users can see basic system health)
  router.get(
    ROUTES.HEALTH_SUMMARY,
    authenticateToken,
    systemController.getHealthSummary
  );
  
  // === DEVELOPER ROUTES ===
  
  // Detailed health information (developers and admin)
  router.get(
    ROUTES.HEALTH_DETAILED, 
    authenticateToken,
    checkPermission([PERMISSIONS.SYSTEM_READ, 'developer:access']),
    systemController.getDetailedHealth
  );
  
  // Performance metrics (developers and admin)
  router.get(
    ROUTES.PERFORMANCE,
    authenticateToken,
    checkPermission([PERMISSIONS.SYSTEM_READ, 'developer:access']),
    systemController.getPerformanceMetrics
  );
  
  // Memory usage (developers and admin)
  router.get(
    ROUTES.MEMORY,
    authenticateToken,
    checkPermission([PERMISSIONS.SYSTEM_READ, 'developer:access']),
    systemController.getMemoryUsage
  );
  
  // === ADMIN-ONLY ROUTES ===
  
  // Application logs (admin only)
  router.get(
    ROUTES.LOGS,
    authenticateToken,
    checkPermission(PERMISSIONS.SYSTEM_MANAGE),
    systemController.getLogs
  );
  
  // Error logs (admin only)
  router.get(
    ROUTES.LOGS_ERROR,
    authenticateToken,
    checkPermission(PERMISSIONS.SYSTEM_MANAGE),
    systemController.getErrorLogs
  );
  
  // Access logs (admin only)
  router.get(
    ROUTES.LOGS_ACCESS,
    authenticateToken,
    checkPermission(PERMISSIONS.SYSTEM_MANAGE),
    systemController.getAccessLogs
  );
  
  // System statistics (admin only)
  router.get(
    ROUTES.STATS,
    authenticateToken,
    checkPermission(PERMISSIONS.SYSTEM_MANAGE),
    systemController.getSystemStats
  );
};

module.exports = systemRoutes;
