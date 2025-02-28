const BaseController = require('./BaseController');
const { Role } = require('../models');

class RoleController extends BaseController {
  constructor() {
    super(Role);
  }

  /**
   * Get role permissions
   */
  getRolePermissions = async (req, res, next) => {
    try {
      const role = await this.model.findByPk(req.params.id, {
        include: ['permissions']
      });

      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      res.json(role.permissions);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update role permissions
   */
  updateRolePermissions = async (req, res, next) => {
    try {
      const role = await this.model.findByPk(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      const { permissionIds } = req.body;
      await role.setPermissions(permissionIds);
      
      const updatedRole = await this.model.findByPk(req.params.id, {
        include: ['permissions']
      });

      res.json(updatedRole);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new RoleController();
