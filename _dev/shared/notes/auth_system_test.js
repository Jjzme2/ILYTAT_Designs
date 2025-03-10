/**
 * Authentication System Test Script
 * 
 * This script creates a test user with a known password and attempts to authenticate with it.
 * It helps diagnose issues with the password hashing and validation system.
 * 
 * Usage: 
 * 1. Run with Node.js: node auth_system_test.js
 * 2. Check the logs for detailed information about the authentication process
 */

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Import models and services
const config = require('../../app/server/src/config');
const db = require('../../app/server/src/models');
const AuthService = require('../../app/server/src/services/authService');
const logger = require('../../app/server/src/utils/logger');

async function testAuthSystem() {
  try {
    logger.info('=== Starting Authentication System Test ===');
    
    // Test credentials
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser'
    };
    
    logger.info('Test user credentials:', {
      email: testUser.email,
      password: testUser.password,
      username: testUser.username
    });
    
    // Check if test user already exists
    const existingUser = await db.User.findOne({ where: { email: testUser.email } });
    
    if (existingUser) {
      logger.info('Test user already exists, will use existing user');
      
      // Log the stored password hash for debugging
      logger.info('Stored password hash:', {
        hash: existingUser.password,
        length: existingUser.password.length
      });
      
      // Test direct bcrypt compare
      const directCompareResult = await bcrypt.compare(testUser.password, existingUser.password);
      logger.info('Direct bcrypt.compare result:', directCompareResult);
      
      // Test model's validatePassword method
      const modelValidateResult = await existingUser.validatePassword(testUser.password);
      logger.info('Model validatePassword result:', modelValidateResult);
      
      // Test AuthService authenticateUser
      try {
        const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'Test Script' } };
        const authResult = await AuthService.authenticateUser({
          email: testUser.email,
          password: testUser.password
        }, mockReq);
        
        logger.info('AuthService.authenticateUser successful:', {
          userId: authResult.user.id,
          email: authResult.user.email,
          hasToken: !!authResult.accessToken
        });
      } catch (authError) {
        logger.error('AuthService.authenticateUser failed:', {
          error: authError.message,
          stack: authError.stack
        });
      }
    } else {
      // Create a new test user
      logger.info('Creating new test user...');
      
      // Manually hash the password to see the result
      const salt = await bcrypt.genSalt(10);
      const manuallyHashedPassword = await bcrypt.hash(testUser.password, salt);
      
      logger.info('Manually hashed password:', {
        salt: salt,
        hash: manuallyHashedPassword,
        length: manuallyHashedPassword.length
      });
      
      // Create the user through AuthService
      try {
        const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'Test Script' } };
        const result = await AuthService.registerUser(testUser, mockReq);
        
        logger.info('Test user created successfully:', {
          userId: result.user.id,
          email: result.user.email
        });
        
        // Retrieve the user to check the stored password
        const createdUser = await db.User.findOne({ where: { email: testUser.email } });
        
        logger.info('Stored password hash for created user:', {
          hash: createdUser.password,
          length: createdUser.password.length
        });
        
        // Test direct bcrypt compare with created user
        const directCompareResult = await bcrypt.compare(testUser.password, createdUser.password);
        logger.info('Direct bcrypt.compare result for created user:', directCompareResult);
        
        // Test model's validatePassword method
        const modelValidateResult = await createdUser.validatePassword(testUser.password);
        logger.info('Model validatePassword result for created user:', modelValidateResult);
      } catch (createError) {
        logger.error('Failed to create test user:', {
          error: createError.message,
          stack: createError.stack
        });
      }
    }
    
    logger.info('=== Authentication System Test Completed ===');
  } catch (error) {
    logger.error('Test failed with error:', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

// Run the test
testAuthSystem().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
