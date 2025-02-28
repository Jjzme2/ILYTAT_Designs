const { Session } = require('../models')
const logger = require('../utils/logger')

/**
 * Session Manager Middleware
 * Handles session creation, validation, and cleanup
 */
class SessionManager {
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
        userId: user.id,
        token: token,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt,
        isValid: true
      })

      logger.info(`New session created for user: ${user.email}`)
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
      const session = await Session.findOne({
        where: { token }
      })

      if (!session) {
        return false
      }

      // Check if session is expired or invalidated
      if (!session.isValid || new Date() > session.expiresAt) {
        await session.update({ isValid: false })
        return false
      }

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
        await session.update({ isValid: false })
        logger.info(`Session invalidated for token: ${token.substring(0, 10)}...`)
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
      await Session.update(
        { isValid: false },
        { where: { userId } }
      )
      logger.info(`All sessions invalidated for user: ${userId}`)
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
      const result = await Session.destroy({
        where: {
          expiresAt: { [Op.lt]: new Date() }
        }
      })
      logger.info(`Cleaned up ${result} expired sessions`)
    } catch (error) {
      logger.error('Session cleanup error:', error)
    }
  }
}

module.exports = SessionManager
