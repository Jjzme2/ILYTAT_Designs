/**
 * Base Controller Factory
 * Provides common CRUD operations and can be extended for specific needs
 */
class BaseController {
  constructor(model, options = {}) {
    this.model = model;
    this.options = {
      // Default options
      softDelete: false,
      defaultScope: true,
      ...options
    };
  }

  /**
   * Create a new resource
   */
  create = async (req, res, next) => {
    try {
      const resource = await this.model.create(req.body);
      res.status(201).json(resource);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all resources with pagination
   */
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      const { rows: resources, count } = await this.model.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order]],
        ...this.options.defaultScope && { scope: 'defaultScope' }
      });

      res.json({
        resources,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single resource by ID
   */
  getById = async (req, res, next) => {
    try {
      const resource = await this.model.findByPk(req.params.id);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      res.json(resource);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a resource
   */
  update = async (req, res, next) => {
    try {
      const [updated] = await this.model.update(req.body, {
        where: { id: req.params.id },
        returning: true
      });

      if (!updated) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      const resource = await this.model.findByPk(req.params.id);
      res.json(resource);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a resource
   */
  delete = async (req, res, next) => {
    try {
      const id = req.params.id;
      const resource = await this.model.findByPk(id);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (this.options.softDelete) {
        await resource.update({ isActive: false });
      } else {
        await resource.destroy();
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BaseController;
