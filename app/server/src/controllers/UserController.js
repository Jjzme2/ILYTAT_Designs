/**
 * User Controller
 * Manages user-related operations
 * Enhanced with integrated logging and response system
 */
const BaseController = require('./BaseController');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const { createNotFoundError } = require('../utils/errorHandler');

class UserController extends BaseController {
  constructor() {
    super(User, { softDelete: true });
  }

  /**
   * Override create to hash password
   */
  create = async (req, res, next) => {
    try {
      const startTime = Date.now();
      const { password, ...userData } = req.body;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create the user with hashed password
      const user = await this.model.create({
        ...userData,
        password: hashedPassword
      });

      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();
      
      // Log the successful user creation
      const response = this.logger.response.business({
        success: true,
        message: 'User created successfully',
        userMessage: 'User account was created successfully',
        data: { id: user.id, email: user.email }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      });
      
      this.logger.info(response);
      
      // Send success response without exposing the password
      return res.sendSuccess(userResponse, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Override update to handle password updates
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const startTime = Date.now();
      const { password, ...updateData } = req.body;
      
      // Hash password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Update the user
      const [updated] = await this.model.update(updateData, {
        where: { id },
        returning: true
      });

      // If no rows were affected, the user doesn't exist
      if (!updated) {
        throw createNotFoundError('User', id);
      }

      // Fetch the updated user
      const user = await this.model.findByPk(id);
      
      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();
      
      // Log the successful update
      const response = this.logger.response.business({
        success: true,
        message: 'User updated successfully',
        userMessage: 'User account was updated successfully',
        data: { id: user.id, email: user.email }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      });
      
      this.logger.info(response);
      
      // Send success response without exposing the password
      return res.sendSuccess(userResponse, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user roles
   */
  getUserRoles = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Find the user with roles
      const user = await this.model.findByPk(id, {
        include: ['roles']
      });

      // If user not found, throw a not found error
      if (!user) {
        throw createNotFoundError('User', id);
      }
      
      // Log the successful role retrieval
      const response = this.logger.response.business({
        success: true,
        message: 'User roles retrieved successfully',
        data: { 
          id: user.id, 
          roleCount: user.roles?.length || 0 
        }
      });
      
      this.logger.info(response);
      
      // Send success response with roles
      return res.sendSuccess(user.roles, 'User roles retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UserController();
