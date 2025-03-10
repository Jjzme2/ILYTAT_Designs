// syncDatabase.js
// Utility script to manually sync the database schema

require('dotenv').config();
const { sequelize } = require('../services/database');
const logger = require('../utils/logger');

/**
 * Manually syncs the database schema with the defined models
 * @param {boolean} force - If true, drops tables before recreating them (USE WITH CAUTION)
 */
async function syncDatabase(force = false) {
  try {
    logger.info(`Starting manual database sync ${force ? '(FORCE MODE)' : ''}`);
    
    // Authenticate to ensure connection is valid
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Sync the database
    await sequelize.sync({ force });
    
    logger.info('Database sync completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error syncing database:', error);
    process.exit(1);
  }
}

// Check if force flag is passed
const args = process.argv.slice(2);
const forceMode = args.includes('--force');

if (forceMode) {
  // Confirmation for force mode since it's destructive
  console.log('\x1b[31m%s\x1b[0m', 'WARNING: Force mode will DROP ALL TABLES and recreate them!');
  console.log('\x1b[31m%s\x1b[0m', 'This will DELETE ALL DATA in the database!');
  console.log('\x1b[33m%s\x1b[0m', 'To proceed, type "YES" and press Enter:');
  
  process.stdin.once('data', (data) => {
    const input = data.toString().trim();
    if (input === 'YES') {
      syncDatabase(true);
    } else {
      console.log('Sync cancelled.');
      process.exit(0);
    }
  });
} else {
  // Normal mode - just syncs schema without dropping tables
  syncDatabase(false);
}
