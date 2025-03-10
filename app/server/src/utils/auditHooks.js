/**
 * Audit Hooks Utility
 * Provides Sequelize hooks for automatic auditing of model changes
 */

const AuditService = require('../services/auditService');
const logger = require('./logger').createLogger({
  level: 'info',
  service: 'auditHooks'
});
const { getNamespace } = require('cls-hooked');

/**
 * Get the current user ID from the CLS namespace
 * @returns {string|null} User ID or null if not available
 */
function getCurrentUserId() {
  try {
    const namespace = getNamespace('request-context');
    if (namespace && namespace.active) {
      return namespace.get('userId');
    }
    return null;
  } catch (error) {
    logger.warn('Failed to get current user ID from namespace', {
      error: error.message
    });
    return null;
  }
}

/**
 * Get the current request ID from the CLS namespace
 * @returns {string|null} Request ID or null if not available
 */
function getCurrentRequestId() {
  try {
    const namespace = getNamespace('request-context');
    if (namespace && namespace.active) {
      return namespace.get('requestId');
    }
    return null;
  } catch (error) {
    logger.warn('Failed to get current request ID from namespace', {
      error: error.message
    });
    return null;
  }
}

/**
 * Apply audit hooks to a Sequelize model
 * 
 * @param {Object} model - Sequelize model
 * @param {Object} options - Configuration options
 * @param {string} options.entityType - Entity type for audit records
 * @param {Array<string>} [options.excludeFields=[]] - Fields to exclude from audit records
 * @param {boolean} [options.auditCreation=true] - Whether to audit creation events
 * @param {boolean} [options.auditUpdate=true] - Whether to audit update events
 * @param {boolean} [options.auditDeletion=true] - Whether to audit deletion events
 * @param {boolean} [options.auditRestoration=true] - Whether to audit restoration events
 */
function applyAuditHooks(model, options) {
  const {
    entityType,
    excludeFields = [],
    auditCreation = true,
    auditUpdate = true,
    auditDeletion = true,
    auditRestoration = true
  } = options;
  
  // Always exclude these fields
  const defaultExcludeFields = [
    'createdAt',
    'updatedAt',
    'deletedAt'
  ];
  
  const allExcludeFields = [...new Set([...defaultExcludeFields, ...excludeFields])];
  
  /**
   * Filter object to exclude specified fields
   * @param {Object} values - Object to filter
   * @returns {Object} Filtered object
   */
  function filterValues(values) {
    if (!values) return values;
    
    const filtered = { ...values };
    
    allExcludeFields.forEach(field => {
      delete filtered[field];
    });
    
    return filtered;
  }
  
  // Audit creation
  if (auditCreation) {
    model.addHook('afterCreate', async (instance, options) => {
      try {
        const userId = options.userId || getCurrentUserId();
        const requestId = options.requestId || getCurrentRequestId();
        
        await AuditService.create({
          action: AuditService.ACTIONS.CREATE,
          entityType,
          entityId: instance.id,
          userId,
          requestId,
          newValues: filterValues(instance.toJSON())
        });
      } catch (error) {
        logger.error('Failed to create audit record for model creation', {
          error: error.message,
          stack: error.stack,
          entityType,
          entityId: instance.id
        });
      }
    });
  }
  
  // Audit updates
  if (auditUpdate) {
    model.addHook('beforeUpdate', async (instance, options) => {
      if (instance._previousDataValues) {
        // Store previous values for use in afterUpdate
        instance._auditPreviousValues = { ...instance._previousDataValues };
      }
    });
    
    model.addHook('afterUpdate', async (instance, options) => {
      try {
        const userId = options.userId || getCurrentUserId();
        const requestId = options.requestId || getCurrentRequestId();
        
        // Only audit if there were changes
        if (instance._changed && Object.keys(instance._changed).length > 0) {
          await AuditService.create({
            action: AuditService.ACTIONS.UPDATE,
            entityType,
            entityId: instance.id,
            userId,
            requestId,
            oldValues: filterValues(instance._auditPreviousValues),
            newValues: filterValues(instance.toJSON())
          });
        }
      } catch (error) {
        logger.error('Failed to create audit record for model update', {
          error: error.message,
          stack: error.stack,
          entityType,
          entityId: instance.id
        });
      }
    });
  }
  
  // Audit deletion
  if (auditDeletion) {
    model.addHook('beforeDestroy', async (instance, options) => {
      try {
        const userId = options.userId || getCurrentUserId();
        const requestId = options.requestId || getCurrentRequestId();
        
        await AuditService.create({
          action: AuditService.ACTIONS.DELETE,
          entityType,
          entityId: instance.id,
          userId,
          requestId,
          oldValues: filterValues(instance.toJSON())
        });
      } catch (error) {
        logger.error('Failed to create audit record for model deletion', {
          error: error.message,
          stack: error.stack,
          entityType,
          entityId: instance.id
        });
      }
    });
  }
  
  // Audit restoration (for paranoid models)
  if (auditRestoration) {
    model.addHook('afterRestore', async (instance, options) => {
      try {
        const userId = options.userId || getCurrentUserId();
        const requestId = options.requestId || getCurrentRequestId();
        
        await AuditService.create({
          action: AuditService.ACTIONS.RESTORE,
          entityType,
          entityId: instance.id,
          userId,
          requestId,
          newValues: filterValues(instance.toJSON())
        });
      } catch (error) {
        logger.error('Failed to create audit record for model restoration', {
          error: error.message,
          stack: error.stack,
          entityType,
          entityId: instance.id
        });
      }
    });
  }
}

/**
 * Set up CLS middleware to track user ID and request ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function auditContextMiddleware(req, res, next) {
  const namespace = getNamespace('request-context');
  
  if (namespace) {
    namespace.run(() => {
      // Set request ID in namespace
      if (req.requestId) {
        namespace.set('requestId', req.requestId);
      }
      
      // Set user ID in namespace if authenticated
      if (req.user && req.user.id) {
        namespace.set('userId', req.user.id);
      }
      
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  applyAuditHooks,
  auditContextMiddleware
};
