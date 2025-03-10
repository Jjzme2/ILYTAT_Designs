// src/services/database.js
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: console.log
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_TEST || `${process.env.DB_DATABASE}_test`,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

const sequelize = new Sequelize(
  currentConfig.database,
  currentConfig.username,
  currentConfig.password,
  {
    host: currentConfig.host,
    dialect: currentConfig.dialect,
    logging: currentConfig.logging,
    pool: currentConfig.pool
  }
);

/**
 * Checks if today is a new day compared to the last recorded date
 * @returns {boolean} True if it's a new day, false otherwise
 */
function isNewDay() {
  try {
    const lastRunFilePath = path.join(__dirname, '../../../logs/last_sync_date.txt');
    
    // Get current date (without time)
    const today = new Date().toISOString().split('T')[0];
    
    // Check if the file exists
    if (fs.existsSync(lastRunFilePath)) {
      // Read the last run date from the file
      const lastRunDate = fs.readFileSync(lastRunFilePath, 'utf8').trim();
      
      // Update the file with today's date
      fs.writeFileSync(lastRunFilePath, today);
      
      // Return true if today is different from the last run date
      return today !== lastRunDate;
    } else {
      // If the file doesn't exist, create it with today's date
      // Ensure the directory exists
      const dir = path.dirname(lastRunFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(lastRunFilePath, today);
      
      // First run, so consider it a new day
      return true;
    }
  } catch (error) {
    console.error('Error checking if it\'s a new day:', error);
    // In case of error, default to true to be safe
    return true;
  }
}

/**
 * Establishes a connection to the database and optionally syncs the models
 * @param {boolean} [sync=false] - Whether to sync the database models
 * @returns {Promise} A promise that resolves when the connection is established
 * @throws {Error} If the connection fails
 */
async function connect(sync = false) {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    if (sync) {
      console.log('Syncing database models...');
      await sequelize.sync();
      console.log('Database models synchronized successfully.');
    }
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

/**
 * Closes the database connection
 * @returns {Promise} A promise that resolves when the connection is closed
 */
async function disconnect() {
  try {
    await sequelize.close();
    console.log('Database connection closed successfully.');
    return true;
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connect,
  disconnect,
  config,
  isNewDay
};