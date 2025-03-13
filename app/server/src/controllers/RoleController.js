const BaseController = require('./BaseController');
const { Role, Permission } = require('../models');
const { createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { PERMISSIONS } = require('../middleware/permissions');

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

  /**
   * Get all available permissions for the system
   * Used in the role management UI to assign permissions to roles
   */
  getAvailablePermissions = async (req, res, next) => {
    try {
      // Log the request
      this.logger.debug(
        this.logger.response.business({
          message: 'Retrieving available permissions',
          data: { requestedBy: req.user.id }
        }).withRequestDetails(req)
      );
      
      // First try to get all permissions from the database
      const dbPermissions = await Permission.findAll({
        attributes: ['id', 'name', 'description', 'category'],
        order: [['category', 'ASC'], ['name', 'ASC']]
      });
      
      // Format permissions with structured metadata
      const formattedPermissions = {
        // Convert array to object with categories
        byCategory: dbPermissions.reduce((acc, permission) => {
          const category = permission.category || 'Other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: permission.id,
            name: permission.name,
            description: permission.description || permission.name
          });
          return acc;
        }, {}),
        // Full list of permissions
        all: dbPermissions.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || p.name,
          category: p.category || 'Other'
        })),
        // Standard permissions from the PERMISSIONS constant
        standard: Object.entries(PERMISSIONS).map(([key, value]) => ({
          key,
          name: value,
          description: key.toLowerCase().replace('_', ' ')
        }))
      };

      // Log successful permissions retrieval
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Available permissions retrieved successfully',
          data: { 
            categoryCount: Object.keys(formattedPermissions.byCategory).length,
            permissionCount: formattedPermissions.all.length 
          }
        })
      );

      return res.sendSuccess(
        formattedPermissions, 
        'Available permissions retrieved successfully'
      );
    } catch (error) {
      this.logger.error('Error retrieving available permissions:', error);
      next(error);
    }
  };
}

module.exports = new RoleController();
