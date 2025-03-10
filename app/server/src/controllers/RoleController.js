const BaseController = require('./BaseController');
const { Role } = require('../models');
const { createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

class RoleController extends BaseController {
  constructor() {
    super(Role);
    this.modelName = 'Role';
    this.logger = logger.child({ component: 'RoleController' });
  }

  /**
   * Get role permissions
   */
  getRolePermissions = async (req, res, next) => {
    try {
      // Log the permissions request
      this.logger.debug(
        this.logger.response.business({
          message: 'Retrieving role permissions',
          data: { roleId: req.params.id }
        }).withRequestDetails(req)
      );
      
      const role = await this.model.findByPk(req.params.id, {
        include: ['permissions']
      });

      if (!role) {
        throw createNotFoundError('Role', req.params.id, 'Role not found');
      }

      // Log successful permissions retrieval
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Role permissions retrieved successfully',
          data: { 
            roleId: role.id,
            permissionCount: role.permissions.length 
          }
        })
      );

      return res.sendSuccess(role.permissions, 'Role permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update role permissions
   */
  updateRolePermissions = async (req, res, next) => {
    try {
      const startTime = Date.now();
      const roleId = req.params.id;
      const { permissionIds } = req.body;
      
      // Log the update request
      this.logger.info(
        this.logger.response.business({
          message: 'Updating role permissions',
          data: { 
            roleId,
            permissionIds 
          }
        }).withRequestDetails(req)
      );
      
      // Check if role exists
      const role = await this.model.findByPk(roleId);
      if (!role) {
        throw createNotFoundError('Role', roleId, 'Role not found');
      }

      // Update permissions
      await role.setPermissions(permissionIds);
      
      // Get updated role with permissions
      const updatedRole = await this.model.findByPk(roleId, {
        include: ['permissions']
      });

      // Log successful permissions update
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Role permissions updated successfully',
          data: { 
            roleId: updatedRole.id,
            permissionCount: updatedRole.permissions.length 
          }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );

      return res.sendSuccess(updatedRole, 'Role permissions updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new RoleController();
