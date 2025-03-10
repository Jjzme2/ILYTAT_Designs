const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../utils/logger');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: (msg) => logger.debug(msg),
    pool: dbConfig.pool,
    timezone: dbConfig.timezone,
    dialectOptions: dbConfig.dialectOptions,
    define: {
      timestamps: true,
      underscored: false,
      underscoredAll: false,
      paranoid: true,
      defaultScope: {
        attributes: { exclude: ['deletedAt'] }
      }
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

// Run database migrations
const runMigrations = async () => {
  try {
    logger.info('Running database migrations...');
    await execPromise('npx sequelize-cli db:migrate');
    logger.info('Database migrations completed successfully');
    return true;
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }

    // Run migrations in all environments
    // This is the recommended approach for schema changes
    logger.info('Running database migrations...');
    await runMigrations();
    logger.info('Database migrations completed successfully');

    // Only run seeders in development environment if SEED_DB env var is set
    if (env === 'development' && process.env.SEED_DB === 'true') {
      try {
        logger.info('Running database seeders...');
        await execPromise('npx sequelize-cli db:seed:all');
        logger.info('Database seeders completed successfully');
      } catch (seedError) {
        logger.error('Error running seeders:', seedError);
        // Continue despite seeder errors - they're not critical for app function
      }
    }

    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
};
