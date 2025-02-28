const BaseController = require('./BaseController');
const { User } = require('../models');
const bcrypt = require('bcrypt');

class UserController extends BaseController {
  constructor() {
    super(User, { softDelete: true });
  }

  /**
   * Override create to hash password
   */
  create = async (req, res, next) => {
    try {
      const { password, ...userData } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await this.model.create({
        ...userData,
        password: hashedPassword
      });

      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();
      res.status(201).json(userResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Override update to handle password updates
   */
  update = async (req, res, next) => {
    try {
      const { password, ...updateData } = req.body;
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const [updated] = await this.model.update(updateData, {
        where: { id: req.params.id },
        returning: true
      });

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = await this.model.findByPk(req.params.id);
      const { password: _, ...userResponse } = user.toJSON();
      res.json(userResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user roles
   */
  getUserRoles = async (req, res, next) => {
    try {
      const user = await this.model.findByPk(req.params.id, {
        include: ['roles']
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user.roles);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UserController();
