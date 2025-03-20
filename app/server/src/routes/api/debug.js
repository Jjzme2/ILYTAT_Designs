/**
 * Debug Routes
 * 
 * IMPORTANT: These routes are for development and debugging only.
 * They should be disabled or removed in production.
 */
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const AuthService = require('../../services/authService');
const logger = require('../../utils/logger');
const APIError = require('../../utils/apiError');

const ROUTES = {
  AUTH_TEST: '/auth-test',
  HASH_PASSWORD: '/hash-password'
};

/**
 * Debug controller handler functions
 */
const debugController = {
  /**
   * Test authentication with provided credentials or create a test user
   */
  authTest: async (req, res, next) => {
    try {
      logger.debug('=== Starting Authentication Debug Test ===');
      
      // Test credentials from request or defaults
      const testUser = {
        email: req.body.email || 'test@example.com',
        password: req.body.password || 'TestPassword123!',
        firstName: req.body.firstName || 'Test',
        lastName: req.body.lastName || 'User',
        username: req.body.username || 'testuser'
      };
      
      logger.debug('Test user credentials:', {
        email: testUser.email,
        password: testUser.password,
        username: testUser.username
      });
      
      // Check if test user already exists
      const existingUser = await User.findOne({ where: { email: testUser.email } });
      
      const results = {
        userExists: !!existingUser,
        directBcryptCompare: false,
        modelValidatePassword: false,
        authServiceAuthenticate: false,
        storedPasswordHash: null,
        errors: []
      };
      
      if (existingUser) {
        logger.debug('Test user found in database', {
          userId: existingUser.id,
          email: existingUser.email
        });
        
        // Log the stored password hash for debugging
        results.storedPasswordHash = {
          prefix: existingUser.password.substring(0, 10) + '...',
          length: existingUser.password.length
        };
        
        logger.debug('Stored password hash:', {
          hash: existingUser.password,
          length: existingUser.password.length
        });
        
        // Test direct bcrypt compare
        try {
          const directCompareResult = await bcrypt.compare(testUser.password, existingUser.password);
          results.directBcryptCompare = directCompareResult;
          
          logger.debug('Direct bcrypt.compare result:', directCompareResult);
        } catch (bcryptError) {
          const errorMsg = `Direct bcrypt.compare failed: ${bcryptError.message}`;
          results.errors.push(errorMsg);
          logger.error(errorMsg, bcryptError);
        }
        
        // Test model's validatePassword method
        try {
          const modelValidateResult = await existingUser.validatePassword(testUser.password);
          results.modelValidatePassword = modelValidateResult;
          
          logger.debug('Model validatePassword result:', modelValidateResult);
        } catch (validateError) {
          const errorMsg = `Model validatePassword failed: ${validateError.message}`;
          results.errors.push(errorMsg);
          logger.error(errorMsg, validateError);
        }
        
        // Test AuthService authenticateUser
        try {
          const authResult = await AuthService.authenticateUser({
            email: testUser.email,
            password: testUser.password
          }, req);
          
          results.authServiceAuthenticate = true;
          
          logger.debug('AuthService.authenticateUser successful:', {
            userId: authResult.user.id,
            email: authResult.user.email,
            hasToken: !!authResult.accessToken
          });
        } catch (authError) {
          const errorMsg = `AuthService.authenticateUser failed: ${authError.message}`;
          results.errors.push(errorMsg);
          
          logger.error('AuthService.authenticateUser failed:', {
            error: authError.message,
            stack: authError.stack
          });
        }
      } else {
        // Create a new test user
        logger.debug('Test user not found, creating new user...');
        
        // Manually hash the password to see the result
        const salt = await bcrypt.genSalt(10);
        const manuallyHashedPassword = await bcrypt.hash(testUser.password, salt);
        
        logger.debug('Manually hashed password:', {
          salt: salt,
          hash: manuallyHashedPassword,
          length: manuallyHashedPassword.length
        });
        
        // Create the user through AuthService
        try {
          const result = await AuthService.registerUser(testUser, req);
          
          logger.debug('Test user created successfully:', {
            userId: result.user.id,
            email: result.user.email
          });
          
          // Retrieve the user to check the stored password
          const createdUser = await User.findOne({ where: { email: testUser.email } });
          
          results.userCreated = true;
          results.storedPasswordHash = {
            prefix: createdUser.password.substring(0, 10) + '...',
            length: createdUser.password.length
          };
          
          logger.debug('Stored password hash for created user:', {
            hash: createdUser.password,
            length: createdUser.password.length
          });
          
          // Test direct bcrypt compare with created user
          const directCompareResult = await bcrypt.compare(testUser.password, createdUser.password);
          results.directBcryptCompare = directCompareResult;
          
          logger.debug('Direct bcrypt.compare result for created user:', directCompareResult);
          
          // Test model's validatePassword method
          const modelValidateResult = await createdUser.validatePassword(testUser.password);
          results.modelValidatePassword = modelValidateResult;
          
          logger.debug('Model validatePassword result for created user:', modelValidateResult);
        } catch (createError) {
          const errorMsg = `Failed to create test user: ${createError.message}`;
          results.errors.push(errorMsg);
          
          logger.error('Failed to create test user:', {
            error: createError.message,
            stack: createError.stack
          });
        }
      }
      
      logger.debug('=== Authentication Debug Test Completed ===');
      
      return res.json({
        success: true,
        message: 'Authentication debug test completed',
        results
      });
    } catch (error) {
      logger.error('Debug test failed with error:', {
        error: error.message,
        stack: error.stack
      });
      
      return next(new APIError(
        `Debug test failed: ${error.message}`,
        500
      ));
    }
  },

  /**
   * Hash a password and return the result
   */
  hashPassword: async (req, res, next) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return next(new APIError(
          'Password is required',
          400
        ));
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      return res.json({
        success: true,
        originalPassword: password,
        hashedPassword,
        salt,
        passwordLength: password.length,
        hashedPasswordLength: hashedPassword.length
      });
    } catch (error) {
      return next(new APIError(
        `Failed to hash password: ${error.message}`,
        500
      ));
    }
  }
};

/**
 * Debug routes definition
 */
const debugRoutes = (router) => {
  /**
   * @route   POST /api/debug/auth-test
   * @desc    Test authentication with provided credentials or create a test user
   * @access  Private (Development only)
   */
  router.post(ROUTES.AUTH_TEST, debugController.authTest);

  /**
   * @route   POST /api/debug/hash-password
   * @desc    Hash a password and return the result
   * @access  Private (Development only)
   */
  router.post(ROUTES.HASH_PASSWORD, debugController.hashPassword);
};

module.exports = debugRoutes;
