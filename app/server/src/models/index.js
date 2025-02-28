const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { sequelize } = require('../database');

const models = {};

// Read all model files
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize);
      models[model.name] = model;
      logger.info(`Loaded model: ${model.name}`);
    } catch (error) {
      logger.error(`Error loading model ${file}:`, error);
    }
  });

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
    logger.info(`Associated model: ${modelName}`);
  }
});

// Export models and sequelize instance
module.exports = {
  ...models,
  sequelize
};
