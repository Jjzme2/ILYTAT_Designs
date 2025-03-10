const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { auth: config } = require('../config');
const { User, Session } = require('../models');
const SessionManager = require('../middleware/sessionManager');
const EmailService = require('./emailService');
const logger = require('../utils/logger');
const cache = require('../utils/cacheService');
const APIError = require('../utils/apiError');

/**
 * Authentication Service - Handles user authentication, registration, and session management
 */
class AuthService {
  // Constants
  static TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  static LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
  static RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
  static MAX_LOGIN_ATTEMPTS = 5;

  /**
   * Generate JWT token with user information
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified
    };
    
    return jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate refresh token for user
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Generate random token
   * @returns {string} Random token
   */
  static generateRandomToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {Object} req - Express request object
   * @returns {Object} User data and tokens
   * @throws {APIError} If registration fails
   */
  static async registerUser(userData, req) {
    try {
      await this.validateUserData(userData);
      await this.checkExistingUser(userData.email, userData.username);
      
      const user = await this.createUser(userData);
      const { accessToken, refreshToken } = await this.generateUserTokens(user, req);
      
      await EmailService.sendVerificationEmail(user, user.verificationToken);

      return {
        user: this.sanitizeUserResponse(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration failed:', {
        error,
        userData: { ...userData, password: '[REDACTED]' }
      });
      
      throw this.handleError(error, 'Registration failed');
    }
  }

  /**
   * Validate user registration data
   * @private
   */
  static async validateUserData(userData) {
    const requiredFields = ['email', 'password', 'firstName', 'lastName', 'username'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      const validationErrors = missingFields.reduce((acc, field) => {
        acc[field] = `${field} is required`;
        return acc;
      }, {});
      
      throw new APIError({
        message: 'Missing required fields',
        validationErrors,
        statusCode: 400
      });
    }
  }

  /**
   * Check if email or username already exists
   * @private
   */
  static async checkExistingUser(email, username) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new APIError({
        message: 'Email already registered',
        statusCode: 409,
        validationErrors: {
          email: 'This email is already registered'
        }
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new APIError({
        message: 'Username already taken',
        statusCode: 409,
        validationErrors: {
          username: 'This username is already taken'
        }
      });
    }
  }

  /**
   * Create a new user record
   * @private
   */
  static async createUser(userData) {
    // Add debug logging for password hashing process
    logger.debug('Starting user creation process', {
      email: userData.email,
      username: userData.username,
      passwordProvided: !!userData.password,
      passwordLength: userData.password ? userData.password.length : 0
    });
    
    const salt = await bcrypt.genSalt(10);
    logger.debug('Generated bcrypt salt', {
      saltLength: salt.length,
      saltPrefix: salt.substring(0, 10) + '...'
    });
    
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    logger.debug('Password hashed successfully', {
      hashedPasswordLength: hashedPassword.length,
      hashedPasswordPrefix: hashedPassword.substring(0, 10) + '...'
    });
    
    const verificationToken = this.generateRandomToken();
    const verificationExpires = new Date(Date.now() + this.TOKEN_EXPIRY);

    // Create the user with the hashed password
    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
      verificationToken,
      verificationExpires,
      isVerified: false,
      lastLoginAt: new Date(),
      loginAttempts: 0
    });
    
    logger.debug('User created successfully', {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      storedPasswordLength: newUser.password.length,
      storedPasswordPrefix: newUser.password.substring(0, 10) + '...'
    });
    
    return newUser;
  }

  /**
   * Generate access and refresh tokens for a user
   * @private
   */
  static async generateUserTokens(user, req) {
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    await SessionManager.createSession(user, req, refreshToken);
    
    return { accessToken, refreshToken };
  }

  /**
   * Remove sensitive data from user object
   * @private
   */
  static sanitizeUserResponse(user) {
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.loginAttempts;
    return userResponse;
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Object} Success message
   * @throws {APIError} If verification fails
   */
  static async verifyEmail(token) {
    try {
      const user = await User.findOne({
        where: {
          verificationToken: token,
          verificationExpires: { [User.sequelize.Op.gt]: new Date() }
        }
      });

      if (!user) {
        throw new APIError({
          message: 'Invalid or expired verification token',
          statusCode: 400
        });
      }

      await user.update({
        isVerified: true,
        verificationToken: null,
        verificationExpires: null
      });

      return {
        message: 'Email verified successfully',
        email: user.email
      };
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw this.handleError(error, 'Email verification failed');
    }
  }
  
  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Object} Success message
   * @throws {APIError} If email resend fails
   */
  static async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new APIError({
          message: 'User not found',
          statusCode: 404
        });
      }
      
      if (user.isVerified) {
        throw new APIError({
          message: 'Email is already verified',
          statusCode: 400
        });
      }
      
      const verificationToken = this.generateRandomToken();
      const verificationExpires = new Date(Date.now() + this.TOKEN_EXPIRY);
      
      await user.update({
        verificationToken,
        verificationExpires
      });
      
      await EmailService.sendVerificationEmail(user, verificationToken);
      
      return {
        message: 'Verification email sent successfully',
        email: user.email
      };
    } catch (error) {
      logger.error('Resend verification email failed:', error);
      throw this.handleError(error, 'Failed to resend verification email');
    }
  }

  /**
   * Authenticate user and generate tokens
   * @param {Object} credentials - User credentials
   * @param {Object} req - Express request object
   * @returns {Object} User data and tokens
   * @throws {APIError} If authentication fails
   */
  static async authenticateUser(credentials, req) {
    try {
      const ipAddress = req.ip;
      await this.checkRateLimit(ipAddress);
      
      const user = await User.findOne({ where: { email: credentials.email } });
      
      // Increment login attempts before password check
      await this.incrementLoginAttempts(ipAddress);
      
      if (!user) {
        throw new APIError({
          message: 'Invalid credentials, No user found.',
          statusCode: 401
        });
      }

      await this.checkAccountLock(user);
      await this.validateUserCredentials(user, credentials.password);
      await this.checkEmailVerification(user);
      await this.manageUserSessions(user);
      
      const { accessToken, refreshToken } = await this.generateUserTokens(user, req);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login failed:', {
        error,
        email: credentials?.email
      });
      throw this.handleError(error, 'Login failed');
    }
  }

  /**
   * Check rate limiting for login attempts
   * @private
   */
  static async checkRateLimit(ipAddress) {
    const attempts = await this.getLoginAttempts(ipAddress);
    
    if (attempts >= config.rateLimit.maxLoginAttempts) {
      throw new APIError({
        message: 'Too many login attempts. Please try again later.',
        statusCode: 429
      });
    }
  }

  /**
   * Check if account is locked
   * @private
   */
  static async checkAccountLock(user) {
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new APIError({
        message: 'Account is temporarily locked. Try again later.',
        statusCode: 403
      });
    }
  }

  /**
   * Validate user password and handle failed attempts
   * @private
   */
  static async validateUserCredentials(user, password) {
    // Add detailed debug logging before password validation
    logger.debug('Attempting to validate user credentials', {
      userId: user.id,
      email: user.email,
      loginAttempts: user.loginAttempts,
      passwordProvided: !!password,
      passwordLength: password ? password.length : 0
    });
    
    const isValidPassword = await user.validatePassword(password);
    
    // Log the result of password validation
    logger.debug('Password validation completed', {
      userId: user.id,
      email: user.email,
      isValidPassword: isValidPassword
    });
    
    if (!isValidPassword) {
      await this.handleFailedLoginAttempt(user);
      
      throw new APIError({
        message: 'Invalid credentials, invalid password.',
        statusCode: 401
      });
    }
    
    // Reset login attempts and lock on successful login
    await user.update({
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date()
    });
    
    // Log successful validation
    logger.debug('User credentials validated successfully', {
      userId: user.id,
      email: user.email
    });
  }

  /**
   * Handle failed login attempt
   * @private
   */
  static async handleFailedLoginAttempt(user) {
    const updatedAttempts = user.loginAttempts + 1;
    
    // Lock account after MAX_LOGIN_ATTEMPTS failed attempts
    if (updatedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await user.update({
        loginAttempts: updatedAttempts,
        lockUntil: new Date(Date.now() + this.LOCK_DURATION)
      });
      
      throw new APIError({
        message: 'Account locked after multiple failed attempts. Try again in 30 minutes.',
        statusCode: 403
      });
    }
    
    // Just increment attempts
    await user.update({
      loginAttempts: updatedAttempts
    });
  }

  /**
   * Check if email is verified
   * @private
   */
  static async checkEmailVerification(user) {
    if (!user.isVerified) {
      throw new APIError({
        message: 'Email not verified. Please verify your email before logging in.',
        statusCode: 403,
        details: {
          requiresVerification: true,
          email: user.email,
          userId: user.id
        }
      });
    }
  }

  /**
   * Manage concurrent user sessions
   * @private
   */
  static async manageUserSessions(user) {
    const activeSessions = await Session.findAll({
      where: { 
        userId: user.id,
        isValid: true
      }
    });
    
    if (activeSessions.length >= config.session.maxConcurrentSessions) {
      // Sort sessions by createdAt and remove oldest
      activeSessions.sort((a, b) => a.createdAt - b.createdAt);
      await activeSessions[0].update({ isValid: false });
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New access token and refresh token
   * @throws {APIError} If token refresh fails
   */
  static async refreshToken(refreshToken) {
    try {
      this.validateRefreshToken(refreshToken);
      
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await this.getUserById(decoded.id);
      
      // Generate new tokens
      const newAccessToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      throw new APIError({
        message: 'Token refresh failed. Please login again.',
        statusCode: 401
      });
    }
  }

  /**
   * Resend verification email to user
   * @param {string} email - User email
   * @returns {Object} Success message
   * @throws {APIError} If email is invalid or user not found
   */
  static async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Don't leak information about existing users
        logger.info(`Verification email resend attempt for non-existent user: ${email}`);
        return { message: 'If your email is registered, a verification email has been sent' };
      }

      // If the email is already verified, just return success (don't leak info)
      if (user.isVerified) {
        logger.info(`Verification email resend attempt for already-verified user: ${email}`);
        return { message: 'If your email is registered, a verification email has been sent' };
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Save verification token with expiry
      await user.update({
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      // Send verification email
      const verificationUrl = `${config.app.clientUrl}/verify-email?token=${verificationToken}`;
      
      await EmailService.sendVerificationEmail(user.email, {
        firstName: user.firstName,
        verificationUrl
      });
      
      logger.info(`Verification email resent to: ${email}`);
      return { message: 'Verification email sent successfully' };
    } catch (error) {
      logger.error('Failed to resend verification email', { 
        error: error.message,
        email
      });
      throw new APIError({
        message: 'Failed to resend verification email',
        statusCode: 500
      });
    }
  }

  /**
   * Validate refresh token
   * @private
   */
  static validateRefreshToken(refreshToken) {
    if (!refreshToken) {
      throw new APIError({
        message: 'Refresh token is required',
        statusCode: 400
      });
    }
  }

  /**
   * Get user by ID
   * @private
   */
  static async getUserById(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new APIError({
        message: 'User not found',
        statusCode: 404
      });
    }
    
    return user;
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Object} Success message
   * @throws {APIError} If password reset request fails
   */
  static async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      // Always return success even if user not found for security
      if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return {
          message: 'If your email is registered, you will receive password reset instructions'
        };
      }
      
      // Generate reset token
      const resetToken = this.generateRandomToken();
      const resetExpires = new Date(Date.now() + this.RESET_EXPIRY);
      
      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      });
      
      await EmailService.sendPasswordResetEmail(user, resetToken);
      
      return {
        message: 'If your email is registered, you will receive password reset instructions'
      };
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw new APIError({
        message: 'Failed to process password reset request',
        statusCode: 500
      });
    }
  }
  
  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   * @throws {APIError} If password reset fails
   */
  static async resetPassword(token, newPassword) {
    try {
      const user = await this.getUserByResetToken(token);
      this.validatePasswordStrength(newPassword);
      
      await this.updateUserPassword(user, newPassword);
      await SessionManager.invalidateAllUserSessions(user.id);
      await EmailService.sendPasswordChangedEmail(user);
      
      return {
        message: 'Password has been reset successfully. Please log in with your new password.'
      };
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw this.handleError(error, 'Password reset failed');
    }
  }

  /**
   * Get user by reset token
   * @private
   */
  static async getUserByResetToken(token) {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [User.sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      throw new APIError({
        message: 'Password reset token is invalid or has expired',
        statusCode: 400
      });
    }
    
    return user;
  }

  /**
   * Validate password strength
   * @private
   */
  static validatePasswordStrength(password) {
    if (!password || password.length < config.password.minLength) {
      throw new APIError({
        message: `Password must be at least ${config.password.minLength} characters`,
        statusCode: 400
      });
    }
  }

  /**
   * Update user password
   * @private
   */
  static async updateUserPassword(user, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      loginAttempts: 0,
      lockUntil: null
    });
  }

  /**
   * Log out user
   * @param {string} token - JWT token
   * @returns {Object} Success message
   * @throws {APIError} If logout fails
   */
  static async logoutUser(token) {
    try {
      if (!token) {
        throw new APIError({
          message: 'Token is required',
          statusCode: 400
        });
      }
      
      await SessionManager.invalidateSession(token);
      
      return {
        message: 'Logout successful'
      };
    } catch (error) {
      logger.error('Logout failed:', error);
      throw this.handleError(error, 'Logout failed');
    }
  }
  
  /**
   * Log out from all devices
   * @param {string} userId - User ID
   * @returns {Object} Success message
   * @throws {APIError} If logout from all devices fails
   */
  static async logoutAllDevices(userId) {
    try {
      await SessionManager.invalidateAllUserSessions(userId);
      
      return {
        message: 'Logged out from all devices successfully'
      };
    } catch (error) {
      logger.error('Logout from all devices failed:', error);
      throw this.handleError(error, 'Logout from all devices failed');
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   * @throws {APIError} If password change fails
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.getUserById(userId);
      await this.verifyCurrentPassword(user, currentPassword);
      this.validatePasswordStrength(newPassword);
      
      await this.updateUserPassword(user, newPassword);
      await EmailService.sendPasswordChangedEmail(user);
      
      return {
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Password change failed:', error);
      throw this.handleError(error, 'Password change failed');
    }
  }

  /**
   * Verify current password
   * @private
   */
  static async verifyCurrentPassword(user, currentPassword) {
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new APIError({
        message: 'Current password is incorrect',
        statusCode: 400
      });
    }
  }

  /**
   * Get number of login attempts for an IP address
   * @private
   */
  static async getLoginAttempts(ipAddress) {
    const key = `login_attempts:${ipAddress}`;
    return cache.get(key) || 0;
  }

  /**
   * Increment login attempts for an IP address
   * @private
   */
  static async incrementLoginAttempts(ipAddress) {
    const key = `login_attempts:${ipAddress}`;
    const attempts = await this.getLoginAttempts(ipAddress);
    const newAttempts = attempts + 1;
    
    // Store with expiration (15 minutes)
    cache.set(key, newAttempts, 15 * 60);
    return newAttempts;
  }
  
  /**
   * Reset login attempts for an IP address
   * @private
   */
  static async resetLoginAttempts(ipAddress) {
    const key = `login_attempts:${ipAddress}`;
    cache.del(key);
  }

  /**
   * Handle errors by wrapping in APIError
   * @private
   */
  static handleError(error, defaultMessage, statusCode = 500) {
    return error instanceof APIError ? error : new APIError({
      message: error.message || defaultMessage,
      statusCode
    });
  }
}

module.exports = AuthService;