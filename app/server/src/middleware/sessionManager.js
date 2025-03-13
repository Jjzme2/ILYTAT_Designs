const { Session } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const { nameMapper } = require('../utils/nameMapper')
const { redactSensitiveInfo, sanitizeObjectForLogs } = require('../utils/securityUtils')

/**
 * Session Manager Middleware
 * Handles session creation, validation, and cleanup
 */
class SessionManager {
  /**
   * Safely redact sensitive information for logging
   * @private
   */
  static redactSensitiveInfo(value) {
    return redactSensitiveInfo(value);
  }

  /**
   * Create a new session for a user
   * @param {Object} user - User object
   * @param {Object} req - Express request object
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Created session
   */
  static async createSession(user, req, token) {
    try {
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const session = await Session.create({
        user_id: user.id,
        token: token,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        expires_at: expiresAt,
        is_valid: true
      })

      // Log session creation with session ID for easier troubleshooting
      logger.info(`New session created for user: ${user.email}`, {
        sessionId: session.id,
        userId: user.id,
        // Redact token from logs
        token: this.redactSensitiveInfo(token)
      })
      
      return session
    } catch (error) {
      logger.error('Session creation error:', error)
      throw error
    }
  }

  /**
   * Validate a session
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} Whether the session is valid
   */
  static async validateSession(token) {
    try {
      // Debug log to help track token validation with redacted token
      logger.debug('Validating session token', {
        token: this.redactSensitiveInfo(token)
      })
      
      const session = await Session.findOne({
        where: { 
          token,
          is_valid: true,
          expires_at: { [Op.gt]: new Date() }
        }
      })

      if (!session) {
        logger.debug('Session validation failed: Session not found or invalid')
        return false
      }

      // Additional logging on successful validation
      logger.debug('Session validated successfully', { 
        sessionId: session.id,
        userId: session.user_id
      })
      
      return true
    } catch (error) {
      logger.error('Session validation error:', error)
      return false
    }
  }

  /**
   * Invalidate a session
   * @param {string} token - JWT token
   * @returns {Promise<void>}
   */
  static async invalidateSession(token) {
    try {
      const session = await Session.findOne({
        where: { token }
      })

      if (session) {
        await session.update({ is_valid: false })
        logger.info(`Session invalidated successfully`, {
          sessionId: session.id,
          token: this.redactSensitiveInfo(token)
        })
      } else {
        logger.warn(`Attempted to invalidate non-existent session`, {
          token: this.redactSensitiveInfo(token)
        })
      }
    } catch (error) {
      logger.error('Session invalidation error:', error)
      throw error
    }
  }

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async invalidateAllUserSessions(userId) {
    try {
      const result = await Session.update(
        { is_valid: false },
        { where: { user_id: userId } }
      )
      
      logger.info(`All sessions invalidated for user`, {
        userId: userId,
        sessionsUpdated: result[0]
      })
    } catch (error) {
      logger.error('User sessions invalidation error:', error)
      throw error
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<void>}
   */
  static async cleanupExpiredSessions() {
    try {
      // Soft delete expired sessions instead of hard delete
      const result = await Session.update(
        { is_valid: false },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            is_valid: true
          }
        }
      )
      
      logger.info(`Marked ${result[0]} expired sessions as invalid`)
    } catch (error) {
      logger.error('Session cleanup error:', error)
    }
  }
}

module.exports = SessionManager
