/**
 * Audit Service
 * Provides a centralized system for recording and querying audit events
 * throughout the application
 */

const { Audit, User } = require('../models');
const logger = require('../utils/logger').createLogger({
  level: 'info',
  service: 'auditService'
});
const { Op } = require('sequelize');
const { getNamespace } = require('cls-hooked');

/**
 * Audit Service - Handles the creation and retrieval of audit records
 */
class AuditService {
  /**
   * Constants for audit actions
   */
  static ACTIONS = {
    // Authentication actions
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    PASSWORD_RESET: 'PASSWORD_RESET',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    
    // CRUD operations
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    RESTORE: 'RESTORE',
    
    // Permission-related actions
    PERMISSION_GRANTED: 'PERMISSION_GRANTED',
    PERMISSION_REVOKED: 'PERMISSION_REVOKED',
    ROLE_ASSIGNED: 'ROLE_ASSIGNED',
    ROLE_REMOVED: 'ROLE_REMOVED',
    
    // System actions
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    CONFIG_CHANGED: 'CONFIG_CHANGED',
    MAINTENANCE: 'MAINTENANCE',
    
    // Business-specific actions
    ORDER_PLACED: 'ORDER_PLACED',
    ORDER_UPDATED: 'ORDER_UPDATED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
    EMAIL_SENT: 'EMAIL_SENT'
  };

  /**
   * Constants for entity types
   */
  static ENTITIES = {
    USER: 'User',
    ROLE: 'Role',
    PERMISSION: 'Permission',
    ORDER: 'Order',
    ORDER_ITEM: 'OrderItem',
    SESSION: 'Session',
    SYSTEM: 'System',
    EMAIL: 'Email',
    PAYMENT: 'Payment'
  };

  /**
   * Constants for severity levels
   */
  static SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * Constants for status types
   */
  static STATUS = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    WARNING: 'warning'
  };

  /**
   * Create an audit record
   * 
   * @param {Object} options - Audit record options
   * @param {string} options.action - The action being performed (use AuditService.ACTIONS)
   * @param {string} options.entityType - Type of entity being affected (use AuditService.ENTITIES)
   * @param {string} [options.entityId] - ID of the entity being affected
   * @param {Object} [options.oldValues] - Previous state of the entity (for updates/deletes)
   * @param {Object} [options.newValues] - New state of the entity (for creates/updates)
   * @param {string} [options.userId] - ID of the user performing the action
   * @param {Object} [options.metadata] - Additional contextual information
   * @param {string} [options.ipAddress] - IP address of the client
   * @param {string} [options.userAgent] - User agent of the client
   * @param {string} [options.requestId] - Request ID for correlation
   * @param {string} [options.status=success] - Outcome status (success, failure, warning)
   * @param {string} [options.severity=low] - Importance level (low, medium, high, critical)
   * @param {Object} [options.req] - Express request object (will extract user, IP, etc. if provided)
   * @returns {Promise<Object>} Created audit record
   */
  static async create(options) {
    try {
      // Extract request context if provided
      if (options.req) {
        const req = options.req;
        
        // Extract user ID from authenticated request
        if (!options.userId && req.user) {
          options.userId = req.user.id;
        }
        
        // Extract IP address
        if (!options.ipAddress) {
          options.ipAddress = req.ip || 
            req.connection?.remoteAddress || 
            req.headers['x-forwarded-for']?.split(',')[0].trim();
        }
        
        // Extract user agent
        if (!options.userAgent) {
          options.userAgent = req.get('User-Agent');
        }
        
        // Extract request ID
        if (!options.requestId) {
          options.requestId = req.requestId;
        }
      }
      
      // Try to get request ID from CLS namespace if not provided
      if (!options.requestId) {
        const namespace = getNamespace('request-context');
        if (namespace && namespace.active) {
          options.requestId = namespace.get('requestId');
        }
      }
      
      // Sanitize sensitive data from values
      const sanitizedOldValues = this.sanitizeValues(options.oldValues);
      const sanitizedNewValues = this.sanitizeValues(options.newValues);
      
      // Create the audit record
      const audit = await Audit.create({
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        oldValues: sanitizedOldValues,
        newValues: sanitizedNewValues,
        metadata: options.metadata,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        requestId: options.requestId,
        status: options.status || this.STATUS.SUCCESS,
        severity: options.severity || this.SEVERITY.LOW
      });
      
      // Log the audit creation
      logger.info('Audit record created', {
        auditId: audit.id,
        action: audit.action,
        entityType: audit.entityType,
        entityId: audit.entityId,
        userId: audit.userId,
        status: audit.status,
        severity: audit.severity
      });
      
      return audit;
    } catch (error) {
      // Log the error but don't throw - auditing should never break the application
      logger.error('Failed to create audit record', {
        error: error.message,
        stack: error.stack,
        options: {
          ...options,
          // Redact potentially sensitive data in the log
          oldValues: options.oldValues ? '[REDACTED]' : undefined,
          newValues: options.newValues ? '[REDACTED]' : undefined
        }
      });
      
      // Return null instead of throwing to prevent application disruption
      return null;
    }
  }

  /**
   * Sanitize sensitive data from values object
   * @private
   * @param {Object} values - Values to sanitize
   * @returns {Object} Sanitized values
   */
  static sanitizeValues(values) {
    if (!values) return values;
    
    const sensitiveFields = [
      'password', 'passwordHash', 'token', 'secret', 'apiKey', 'creditCard',
      'ssn', 'socialSecurity', 'verificationToken', 'resetPasswordToken'
    ];
    
    const sanitized = { ...values };
    
    // Redact sensitive fields
    sensitiveFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Create an audit record for a CRUD operation
   * 
   * @param {string} action - CRUD action (CREATE, READ, UPDATE, DELETE)
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @param {Object} [oldValues] - Previous state (for UPDATE/DELETE)
   * @param {Object} [newValues] - New state (for CREATE/UPDATE)
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created audit record
   */
  static async logEntityAction(action, entityType, entityId, oldValues, newValues, options = {}) {
    return this.create({
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ...options
    });
  }

  /**
   * Log a successful authentication
   * 
   * @param {string} userId - User ID
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created audit record
   */
  static async logLogin(userId, options = {}) {
    return this.create({
      action: this.ACTIONS.LOGIN,
      entityType: this.ENTITIES.USER,
      entityId: userId,
      userId,
      severity: this.SEVERITY.LOW,
      ...options
    });
  }

  /**
   * Log a failed authentication attempt
   * 
   * @param {string} userId - User ID (if known)
   * @param {string} email - Email used in the attempt
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created audit record
   */
  static async logLoginFailed(userId, email, options = {}) {
    return this.create({
      action: this.ACTIONS.LOGIN_FAILED,
      entityType: this.ENTITIES.USER,
      entityId: userId,
      userId,
      metadata: { email },
      status: this.STATUS.FAILURE,
      severity: this.SEVERITY.MEDIUM,
      ...options
    });
  }

  /**
   * Log a logout event
   * 
   * @param {string} userId - User ID
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created audit record
   */
  static async logLogout(userId, options = {}) {
    return this.create({
      action: this.ACTIONS.LOGOUT,
      entityType: this.ENTITIES.USER,
      entityId: userId,
      userId,
      ...options
    });
  }

  /**
   * Log a system error
   * 
   * @param {Error} error - The error object
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created audit record
   */
  static async logSystemError(error, options = {}) {
    return this.create({
      action: this.ACTIONS.SYSTEM_ERROR,
      entityType: this.ENTITIES.SYSTEM,
      status: this.STATUS.FAILURE,
      severity: this.SEVERITY.HIGH,
      metadata: {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack
      },
      ...options
    });
  }

  /**
   * Log a sent email
   * 
   * @param {string} recipientEmail - Email address of recipient
   * @param {string} emailType - Type of email sent
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Created audit record
   */
  static async logEmailSent(recipientEmail, emailType, options = {}) {
    return this.create({
      action: this.ACTIONS.EMAIL_SENT,
      entityType: this.ENTITIES.EMAIL,
      metadata: {
        recipientEmail,
        emailType
      },
      ...options
    });
  }

  /**
   * Get audit records with pagination and filtering
   * 
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Records per page
   * @param {string} [options.action] - Filter by action
   * @param {string} [options.entityType] - Filter by entity type
   * @param {string} [options.entityId] - Filter by entity ID
   * @param {string} [options.userId] - Filter by user ID
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.severity] - Filter by severity
   * @param {Date|string} [options.startDate] - Filter by start date
   * @param {Date|string} [options.endDate] - Filter by end date
   * @param {string} [options.sortBy=createdAt] - Field to sort by
   * @param {string} [options.sortOrder=DESC] - Sort order (ASC or DESC)
   * @returns {Promise<Object>} Paginated audit records
   */
  static async getAuditRecords(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        action,
        entityType,
        entityId,
        userId,
        status,
        severity,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;
      
      // Build where clause
      const where = {};
      
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (userId) where.userId = userId;
      if (status) where.status = status;
      if (severity) where.severity = severity;
      
      // Date range filtering
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          where.createdAt[Op.gte] = new Date(startDate);
        }
        
        if (endDate) {
          where.createdAt[Op.lte] = new Date(endDate);
        }
      }
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Execute query
      const { count, rows } = await Audit.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName', 'username']
          }
        ]
      });
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);
      
      return {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve audit records', {
        error: error.message,
        stack: error.stack,
        options
      });
      
      throw error;
    }
  }

  /**
   * Get audit history for a specific entity
   * 
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @param {Object} [options] - Additional query options
   * @returns {Promise<Array>} Entity audit history
   */
  static async getEntityHistory(entityType, entityId, options = {}) {
    return this.getAuditRecords({
      ...options,
      entityType,
      entityId
    });
  }

  /**
   * Get audit history for a specific user's actions
   * 
   * @param {string} userId - User ID
   * @param {Object} [options] - Additional query options
   * @returns {Promise<Array>} User audit history
   */
  static async getUserActionHistory(userId, options = {}) {
    return this.getAuditRecords({
      ...options,
      userId
    });
  }
}

module.exports = AuditService;
