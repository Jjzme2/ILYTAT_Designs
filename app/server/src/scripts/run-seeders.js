/**
 * Seeder Runner Script
 * 
 * This script runs the database seeders in the correct order.
 * It can be used in development environments to quickly set up test data.
 */

const { execSync } = require('child_process');
const logger = require('../utils/logger');

const loggerInstance = logger.child({ component: 'SeederRunner' });

// Define the seeders to run in the correct order
const SEEDERS = [
  '20250313001000-roles-permissions.js',
  '20250313002000-documentations.js',
  '20250313-featured-products.js'
];

/**
 * Run a specific seeder
 * @param {string} seederName - Name of the seeder file
 */
function runSeeder(seederName) {
  try {
    loggerInstance.info(`Running seeder: ${seederName}`);
    execSync(`npx sequelize-cli db:seed --seed ${seederName}`, { 
      stdio: 'inherit',
      cwd: process.cwd() 
    });
    loggerInstance.info(`Successfully ran seeder: ${seederName}`);
  } catch (error) {
    loggerInstance.error(`Error running seeder ${seederName}`, { error: error.message });
    throw error;
  }
}

/**
 * Main function to run all seeders
 */
async function runSeeders() {
  loggerInstance.info('Starting seeder runner script');
  
  try {
    // Run each seeder in sequence
    for (const seeder of SEEDERS) {
      runSeeder(seeder);
    }
    
    loggerInstance.info('All seeders completed successfully');
  } catch (error) {
    loggerInstance.error('Seeder runner failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run the main function
runSeeders().catch(err => {
  loggerInstance.error('Unexpected error in seeder runner', { error: err.message, stack: err.stack });
  process.exit(1);
});
