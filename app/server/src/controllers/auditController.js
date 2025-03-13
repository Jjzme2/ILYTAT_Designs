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

  /**
   * Export audit logs to CSV or JSON format
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async exportAuditLogs(req, res) {
    try {
      const { format = 'json' } = req.query;
      const {
        startDate,
        endDate,
        entityType,
        action
      } = req.query;
      
      // Get all audit records matching criteria (no pagination)
      const result = await AuditService.getAuditRecords({
        // Skip pagination for exports
        page: 1,
        limit: 10000, // Reasonable limit for exports
        action,
        entityType,
        startDate,
        endDate,
        // Always sort by creation date for exports
        sortBy: 'createdAt',
        sortOrder: 'ASC'
      });
      
      const records = result.data;
      
      // Log export attempt
      logger.info('Audit logs export requested', {
        userId: req.user.id,
        format,
        recordCount: records.length,
        filters: {
          startDate,
          endDate,
          entityType,
          action
        }
      });
      
      if (format === 'csv') {
        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`); 
        
        // Create CSV header row
        let csv = 'id,timestamp,action,entityType,entityId,userId,status,severity,details\n';
        
        // Add rows
        records.forEach(record => {
          // Clean details for CSV format
          const details = record.details ? JSON.stringify(record.details).replace(/"/g, '""') : '';
          
          csv += `"${record.id}","${record.createdAt}","${record.action}","${record.entityType}",`+
                 `"${record.entityId}","${record.userId}","${record.status}","${record.severity}",`+
                 `"${details}"\n`;
        });
        
        return res.send(csv);
      } else {
        // Return JSON format
        return this.success(res, records, {
          message: 'Audit logs exported successfully',
          meta: {
            exportTime: new Date().toISOString(),
            recordCount: records.length,
            filters: {
              startDate: startDate || 'all',
              endDate: endDate || 'all',
              entityType: entityType || 'all',
              action: action || 'all'
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to export audit logs', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      
      return this.serverError(res, error);
    }
  }
}

module.exports = AuditController;
