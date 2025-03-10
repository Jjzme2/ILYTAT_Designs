/**
 * Password Manager
 * Centralized utility for password-related operations
 */

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('./logger');
const APIError = require('./apiError');

class PasswordManager {
  /**
   * Generate a salted bcrypt hash for a password
   * @param {string} password - The plain text password to hash
   * @returns {Promise<string>} - Bcrypt hashed password
   */
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.debug('Password hashed successfully', {
        hashedPasswordLength: hashedPassword.length,
        hashedPasswordPrefix: hashedPassword.substring(0, 10) + '...',
        isProperlyHashed: hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')
      });
      
      return hashedPassword;
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Reset a user's password
   * @param {string} email - User's email
   * @param {string} newPassword - New plain text password
   * @returns {Promise<Object>} - Result with success status and message
   */
  static async resetPassword(email, newPassword) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new APIError({
          message: 'User not found',
          statusCode: 404
        });
      }
      
      const hashedPassword = await this.hashPassword(newPassword);
      
      await user.update({
        password: hashedPassword,
        loginAttempts: 0,
        lockUntil: null
      });
      
      logger.info('Password reset successful', {
        userId: user.id,
        email: user.email
      });
      
      return {
        success: true,
        message: 'Password reset successful'
      };
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error instanceof APIError 
        ? error 
        : new APIError({
            message: 'Password reset failed',
            statusCode: 500,
            error
          });
    }
  }
  
  /**
   * Update a user's verification status to verified
   * @param {string} email - User's email
   * @returns {Promise<Object>} - Result with success status and message
   */
  static async markEmailAsVerified(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new APIError({
          message: 'User not found',
          statusCode: 404
        });
      }
      
      await user.update({
        isVerified: true,
        verificationToken: null,
        verificationExpires: null
      });
      
      logger.info('Email marked as verified', {
        userId: user.id,
        email: user.email
      });
      
      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      logger.error('Email verification update failed:', error);
      throw error instanceof APIError 
        ? error 
        : new APIError({
            message: 'Email verification update failed',
            statusCode: 500,
            error
          });
    }
  }
}

module.exports = PasswordManager;
