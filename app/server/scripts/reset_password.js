/**
 * Password Reset Script
 * 
 * This script allows resetting a user's password by email address.
 * It directly updates the database with a properly hashed password.
 * 
 * Usage:
 * node reset_password.js <email> <new_password>
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
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
    logging: console.log
  }
);

async function resetPassword() {
  try {
    // Get email and password from command line arguments
    const email = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!email || !newPassword) {
      console.error('Usage: node reset_password.js <email> <new_password>');
      process.exit(1);
    }
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Generated password hash:', hashedPassword.substring(0, 10) + '...');
    console.log('Is properly formatted bcrypt hash:', hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$'));
    
    // Update user password directly using SQL query to avoid model hooks
    const result = await sequelize.query(
      `UPDATE Users SET password = :hashedPassword, loginAttempts = 0, lockUntil = NULL WHERE email = :email`,
      {
        replacements: { 
          hashedPassword, 
          email 
        },
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    
    if (result[1] === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    
    console.log(`Password reset successful for user: ${email}`);
    console.log('You can now log in with the new password.');
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await sequelize.close();
  }
}

resetPassword();
