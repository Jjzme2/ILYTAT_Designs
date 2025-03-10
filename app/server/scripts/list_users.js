/**
 * List Users Script
 * 
 * This script lists all users in the database to help with password reset.
 * It shows basic user information without exposing sensitive data.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

// Load database configuration
const dbConfig = require('../src/config/database');
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false // Disable SQL logging
  }
);

async function listUsers() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.\n');
    
    // Query all users with limited fields
    const users = await sequelize.query(
      `SELECT id, email, firstName, lastName, username, isActive, isVerified, lastLogin 
       FROM Users ORDER BY email`,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log(`Found ${users.length} users in the database:\n`);
    
    // Display user information in a table
    console.table(users.map(user => ({
      ID: user.id,
      Email: user.email,
      Name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      Username: user.username,
      Active: user.isActive ? 'Yes' : 'No',
      Verified: user.isVerified ? 'Yes' : 'No',
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
    })));
    
    console.log('\nTo reset a password, run:');
    console.log('node scripts/reset_password.js <email> <new_password>');
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await sequelize.close();
  }
}

listUsers();
