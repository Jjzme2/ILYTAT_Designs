/**
 * Base Controller Factory
 * Provides common CRUD operations and can be extended for specific needs
 * Enhanced with integrated logging and response system
 */
const logger = require('../utils/logger');
const { createNotFoundError } = require('../utils/errorHandler');

class BaseController {
  constructor(model, options = {}) {
    this.model = model;
    this.modelName = model.name || 'Resource';
    this.options = {
      // Default options
      softDelete: false,
      defaultScope: true,
      ...options
    };
    
    // Logger specific to this controller instance
    this.logger = logger.child({ 
      controller: this.constructor.name,
      model: this.modelName
    });
  }

  /**
   * Create a new resource
   */
  create = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Create the resource
      const resource = await this.model.create(req.body);
      
      // Log the operation success with business response
      const response = this.logger.response.business({
        success: true,
        message: `${this.modelName} created successfully`,
        userMessage: `${this.modelName} was created successfully`,
        data: { id: resource.id }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      });
      
      this.logger.info(response);
      
      // Send success response
      return res.sendSuccess(resource, `${this.modelName} created successfully`, 201);
    } catch (error) {
      // Let the error handler middleware handle it
      next(error);
    }
  };

  /**
   * Get all resources with pagination
   */
  getAll = async (req, res, next) => {
    try {
      const startTime = Date.now();
      const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      // Find resources with pagination
      const { rows: resources, count } = await this.model.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order]],
        ...this.options.defaultScope && { scope: 'defaultScope' }
      });

      // Create pagination metadata
      const pagination = {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      };

      // Log the operation success
      const response = this.logger.response.business({
        success: true,
        message: `Retrieved ${resources.length} of ${count} ${this.modelName} records`,
        data: { count, page, limit }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      });
      
      this.logger.info(response);
      
      // Send success response with pagination
      return res.sendPaginatedSuccess(resources, pagination, `${this.modelName} list retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single resource by ID
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Find the resource by ID
      const resource = await this.model.findByPk(id);
      
      // If resource not found, throw a not found error
      if (!resource) {
        throw createNotFoundError(this.modelName, id);
      }
      
      // Log the successful retrieval
      const response = this.logger.response.business({
        success: true,
        message: `${this.modelName} retrieved successfully`,
        data: { id }
      });
      
      this.logger.info(response);
      
      // Send success response
      return res.sendSuccess(resource, `${this.modelName} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a resource
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const startTime = Date.now();
      
      // Update the resource
      const [updated] = await this.model.update(req.body, {
        where: { id },
        returning: true
      });

      // If no rows were affected, the resource doesn't exist
      if (!updated) {
        throw createNotFoundError(this.modelName, id);
      }

      // Fetch the updated resource
      const resource = await this.model.findByPk(id);
      
      // Log the successful update
      const response = this.logger.response.business({
        success: true,
        message: `${this.modelName} updated successfully`,
        userMessage: `${this.modelName} was updated successfully`,
        data: { id }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      });
      
      this.logger.info(response);
      
      // Send success response
      return res.sendSuccess(resource, `${this.modelName} updated successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a resource
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Find the resource first
      const resource = await this.model.findByPk(id);

      // If resource not found, throw a not found error
      if (!resource) {
        throw createNotFoundError(this.modelName, id);
      }

      // Handle soft delete or hard delete based on options
      if (this.options.softDelete) {
        await resource.update({ isActive: false });
      } else {
        await resource.destroy();
      }

      // Log the successful deletion
      const response = this.logger.response.business({
        success: true,
        message: `${this.modelName} ${this.options.softDelete ? 'deactivated' : 'deleted'} successfully`,
        userMessage: `${this.modelName} was ${this.options.softDelete ? 'deactivated' : 'deleted'} successfully`,
        data: { id }
      });
      
      this.logger.info(response);
      
      // Send success response with no content
      return res.sendSuccess(null, `${this.modelName} ${this.options.softDelete ? 'deactivated' : 'deleted'} successfully`, 204);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BaseController;
