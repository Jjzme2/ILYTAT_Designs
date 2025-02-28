const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { auth: config } = require('../config')
const { User } = require('../models')
const SessionManager = require('../middleware/sessionManager')
const logger = require('../utils/logger')
const cache = require('../utils/cacheService')
const APIResponse = require('../utils/apiResponse')

class AuthService {
  /**
   * Generate JWT token with user information
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )
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
    )
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {Object} req - Express request object
   * @returns {Object} User data and tokens
   * @throws {Error} If registration fails
   */
  static async registerUser(userData, req) {
    try {
      // Validate required fields
      const requiredFields = ['email', 'password', 'firstName', 'lastName', 'username'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        const error = new Error('Missing required fields');
        error.validationErrors = missingFields.reduce((acc, field) => {
          acc[field] = `${field} is required`;
          return acc;
        }, {});
        error.status = 400;
        throw error;
      }

      // Check if user exists
      const existingUser = await User.findOne({ 
        where: { 
          [User.sequelize.Op.or]: [
            { email: userData.email },
            { username: userData.username }
          ]
        } 
      });

      if (existingUser) {
        const error = new Error('User already exists');
        error.status = 409;
        error.validationErrors = {
          [existingUser.email === userData.email ? 'email' : 'username']: 
          `This ${existingUser.email === userData.email ? 'email' : 'username'} is already registered`
        };
        throw error;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        lastLoginAt: new Date(),
        loginAttempts: 0
      });

      // Generate tokens
      const accessToken = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token
      await SessionManager.createSession(user.id, refreshToken, req);

      // Remove sensitive data
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.loginAttempts;

      return {
        user: userResponse,
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error({
        message: 'Registration failed',
        error: error,
        userData: { ...userData, password: '[REDACTED]' }
      });
      throw error;
    }
  }

  /**
   * Authenticate user and generate tokens
   * @param {Object} credentials - User credentials
   * @param {Object} req - Express request object
   * @returns {Object} User data and tokens
   */
  static async authenticateUser(credentials, req) {
    // Check rate limiting
    const ipAddress = req.ip
    const attempts = await this.getLoginAttempts(ipAddress)
    
    if (attempts >= config.rateLimit.maxLoginAttempts) {
      throw new Error('Too many login attempts. Please try again later.')
    }

    const user = await User.findOne({ where: { email: credentials.email } })
    
    // Increment login attempts before password check
    await this.incrementLoginAttempts(ipAddress)
    
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Reset login attempts on successful login
    await this.resetLoginAttempts(ipAddress)

    // Check concurrent sessions
    const activeSessions = await SessionManager.getActiveSessions(user.id)
    if (activeSessions.length >= config.session.maxConcurrentSessions) {
      // Remove oldest session
      await SessionManager.removeOldestSession(user.id)
    }

    // Generate tokens
    const token = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)

    // Store session with additional security metadata
    await SessionManager.createSession(user.id, req, token, {
      ipAddress,
      userAgent: req.headers['user-agent'],
      lastActivity: new Date()
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token,
      refreshToken
    }
  }

  /**
   * Get number of login attempts for an IP address
   * @private
   */
  static async getLoginAttempts(ipAddress) {
    const key = `login_attempts:${ipAddress}`
    return cache.get(key) || 0
  }

  /**
   * Increment login attempts for an IP address
   * @private
   */
  static async incrementLoginAttempts(ipAddress) {
    const key = `login_attempts:${ipAddress}`
    const attempts = (cache.get(key) || 0) + 1
    cache.set(key, attempts, config.rateLimit.loginWindow / 1000)
    return attempts
  }

  /**
   * Reset login attempts for an IP address
   * @private
   */
  static async resetLoginAttempts(ipAddress) {
    const key = `login_attempts:${ipAddress}`
    cache.del(key)
  }

  /**
   * Logout user
   * @param {string} token - JWT token
   * @param {string} userEmail - User email for logging
   */
  static async logoutUser(token, userEmail) {
    await SessionManager.invalidateSession(token)
    logger.info(`User logged out: ${userEmail}`)
  }

  /**
   * Logout user from all devices
   * @param {string} userId - User ID
   * @param {string} userEmail - User email for logging
   */
  static async logoutAllDevices(userId, userEmail) {
    await SessionManager.invalidateAllUserSessions(userId)
    logger.info(`User logged out from all devices: ${userEmail}`)
  }

  /**
   * Remove sensitive information from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   */
  static sanitizeUser(user) {
    const { id, firstName, lastName, email, role } = user
    return { id, firstName, lastName, email, role }
  }
}

module.exports = AuthService
