/**
 * ModelTransformer - Utility for transforming Sequelize model data between database and application formats
 * 
 * This utility provides middleware and helper functions to automatically convert between 
 * snake_case (database convention) and camelCase (application convention) throughout the application.
 */

const { objectSnakeToCamel, objectCamelToSnake } = require('./nameMapper');
const logger = require('./logger');

/**
 * Transform a Sequelize model instance to a camelCase representation
 * suitable for API responses and application logic
 * 
 * @param {Object} model - Sequelize model instance
 * @returns {Object} Object with camelCase properties
 */
const toCamelCase = (model) => {
  if (!model) return null;

  // Handle Sequelize models vs. plain objects
  const obj = model.toJSON ? model.toJSON() : { ...model };
  return objectSnakeToCamel(obj);
};

/**
 * Transform an application object to snake_case for database operations
 * 
 * @param {Object} applicationObj - Object with camelCase properties
 * @returns {Object} Object with snake_case properties for database operations
 */
const toSnakeCase = (applicationObj) => {
  if (!applicationObj) return null;
  return objectCamelToSnake(applicationObj);
};

/**
 * Express middleware to transform response data to camelCase
 * Place this middleware after your route handler to transform all responses
 */
const transformResponseMiddleware = (req, res, next) => {
  // Store the original res.json function
  const originalJson = res.json;
  
  // Override res.json to transform data to camelCase
  res.json = function(data) {
    try {
      if (data) {
        // Transform data to camelCase
        if (Array.isArray(data)) {
          data = data.map(item => objectSnakeToCamel(item));
        } else {
          data = objectSnakeToCamel(data);
        }
      }
      
      // Call the original json function with transformed data
      return originalJson.call(this, data);
    } catch (error) {
      logger.error('Error transforming response data:', {
        error: error.message,
        stack: error.stack
      });
      
      // Fall back to original data in case of error
      return originalJson.call(this, data);
    }
  };
  
  next();
};

/**
 * Express middleware to transform request body to snake_case
 * Place this middleware before your route handler to transform incoming data
 */
const transformRequestMiddleware = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = objectCamelToSnake(req.body);
    }
    next();
  } catch (error) {
    logger.error('Error transforming request data:', {
      error: error.message,
      stack: error.stack
    });
    next();
  }
};

/**
 * Sequelize hook functions to automatically handle transformations
 */
const sequelizeHooks = {
  /**
   * Adds automatic transformation hooks to a Sequelize model
   * @param {Object} model - Sequelize model to enhance
   */
  addToModel(model) {
    // Add a utility method to the model class
    model.toCamelCase = function(instance) {
      return toCamelCase(instance);
    };
    
    // Add helper methods to model instances
    model.prototype.toCamelCase = function() {
      return toCamelCase(this);
    };
  }
};

module.exports = {
  toCamelCase,
  toSnakeCase,
  transformResponseMiddleware,
  transformRequestMiddleware,
  sequelizeHooks
};
