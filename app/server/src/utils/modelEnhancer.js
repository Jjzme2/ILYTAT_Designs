/**
 * ModelEnhancer - Utility for applying common enhancements to Sequelize models
 * 
 * This utility provides a standardized way to enhance all Sequelize models with
 * consistent naming conventions and additional functionality.
 */

const { sequelizeHooks } = require('./modelTransformer');
const logger = require('./logger');

/**
 * Apply consistent configuration to a Sequelize model definition
 * 
 * @param {Object} modelOptions - The options object passed to Model.init
 * @returns {Object} Enhanced model options with standardized configuration
 */
const enhanceModelOptions = (modelOptions) => {
  // Always ensure underscored is true for snake_case DB columns
  return {
    ...modelOptions,
    underscored: true,
    // Add default timestamps in snake_case unless explicitly disabled
    ...(modelOptions.timestamps !== false && {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: modelOptions.paranoid ? 'deleted_at' : undefined
    })
  };
};

/**
 * Apply all enhancements to a Sequelize model
 * 
 * @param {Model} model - The Sequelize model class to enhance
 */
const enhanceModel = (model) => {
  try {
    // Add name mapping transformation methods
    sequelizeHooks.addToModel(model);
    
    logger.info(`Enhanced model: ${model.name} with standard transformations`);
  } catch (error) {
    logger.error(`Error enhancing model ${model.name}:`, error);
  }
};

/**
 * Apply attribute definitions that follow the snake_case convention
 * 
 * This ensures model attributes are consistently defined with names
 * that match the database column names (snake_case)
 * 
 * @param {Object} attributes - The attributes object passed to Model.init
 * @returns {Object} The attributes with any necessary adjustments
 */
const standardizeAttributes = (attributes) => {
  // No changes needed - just ensure attributes use snake_case names
  // This function can be expanded if additional standardization is needed
  return attributes;
};

module.exports = {
  enhanceModelOptions,
  enhanceModel,
  standardizeAttributes
};
