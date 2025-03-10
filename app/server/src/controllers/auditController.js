/**
 * Audit Controller
 * Provides API endpoints for viewing and managing audit records
 */

const AuditService = require('../services/auditService');
const logger = require('../utils/logger').createLogger({
  level: 'info',
  service: 'auditController'
});
const { validationResult } = require('express-validator');
const BaseController = require('./BaseController');

class AuditController extends BaseController {
  /**
   * Get paginated audit records with filtering
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAuditRecords(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.validationError(res, errors.array());
      }
      
      // Extract query parameters
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
      } = req.query;
      
      // Get audit records
      const result = await AuditService.getAuditRecords({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        action,
        entityType,
        entityId,
        userId,
        status,
        severity,
        startDate,
        endDate,
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      });
      
      // Return paginated response
      return this.success(res, result.data, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get audit records', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      
      return this.serverError(res, error);
    }
  }

  /**
   * Get audit record by ID
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAuditRecord(req, res) {
    try {
      const { id } = req.params;
      
      // Get audit record
      const audit = await AuditService.getAuditRecordById(id);
      
      if (!audit) {
        return this.notFound(res, 'Audit record not found');
      }
      
      return this.success(res, audit);
    } catch (error) {
      logger.error('Failed to get audit record', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      
      return this.serverError(res, error);
    }
  }

  /**
   * Get audit history for a specific entity
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getEntityHistory(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;
      
      // Get entity history
      const result = await AuditService.getEntityHistory(entityType, entityId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      });
      
      return this.success(res, result.data, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get entity history', {
        error: error.message,
        stack: error.stack,
        entityType: req.params.entityType,
        entityId: req.params.entityId
      });
      
      return this.serverError(res, error);
    }
  }

  /**
   * Get audit history for a specific user's actions
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserActionHistory(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;
      
      // Get user action history
      const result = await AuditService.getUserActionHistory(userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      });
      
      return this.success(res, result.data, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get user action history', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      return this.serverError(res, error);
    }
  }

  /**
   * Get audit statistics
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAuditStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Get audit statistics
      const stats = await AuditService.getAuditStats({
        startDate,
        endDate
      });
      
      return this.success(res, stats);
    } catch (error) {
      logger.error('Failed to get audit statistics', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      
      return this.serverError(res, error);
    }
  }
}

module.exports = AuditController;
