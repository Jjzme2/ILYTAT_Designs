const dotenv = require('dotenv')
dotenv.config()
const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')
const SessionManager = require('./sessionManager')

/**
 * Middleware to authenticate JWT token and validate session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Validate session
    const isValidSession = await SessionManager.validateSession(token)
    if (!isValidSession) {
      return res.status(401).json({ message: 'Invalid or expired session' })
    }

    // Attach user to request
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    
    logger.error('Authentication error:', error)
    res.status(500).json({ message: 'Server error during authentication' })
  }
}

/**
 * Middleware to check if user has required roles and permissions
 * @param {string|string[]|Object} requirements - Required roles/permissions
 * @returns {Function} Middleware function
 * 
 * @example
 * // Check for single role
 * authorize('admin')
 * 
 * // Check for multiple roles (OR condition)
 * authorize(['admin', 'manager'])
 * 
 * // Check for specific permissions
 * authorize({ permissions: ['create:user', 'delete:user'] })
 * 
 * // Check for roles AND permissions
 * authorize({ 
 *   roles: ['admin', 'manager'],
 *   permissions: ['create:user'],
 *   requireAll: true // require all permissions (default: false)
 * })
 */
const authorize = (requirements) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required' 
        });
      }

      // Normalize requirements to object format
      const config = normalizeRequirements(requirements);
      
      // Check roles if specified
      if (config.roles && config.roles.length > 0) {
        const hasRole = config.roles.some(role => 
          req.user.role === role || (req.user.roles && req.user.roles.includes(role))
        );
        
        if (!hasRole) {
          return res.status(403).json({ 
            message: 'Insufficient role permissions' 
          });
        }
      }

      // Check permissions if specified
      if (config.permissions && config.permissions.length > 0) {
        const userPermissions = req.user.permissions || [];
        
        const hasPermissions = config.requireAll
          ? config.permissions.every(perm => userPermissions.includes(perm))
          : config.permissions.some(perm => userPermissions.includes(perm));

        if (!hasPermissions) {
          return res.status(403).json({ 
            message: 'Insufficient permissions' 
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({ 
        message: 'Server error during authorization' 
      });
    }
  };
};

/**
 * Helper function to normalize authorization requirements
 * @private
 */
const normalizeRequirements = (requirements) => {
  if (!requirements) {
    return { roles: [], permissions: [], requireAll: false };
  }

  if (typeof requirements === 'string') {
    return { roles: [requirements], permissions: [], requireAll: false };
  }

  if (Array.isArray(requirements)) {
    return { roles: requirements, permissions: [], requireAll: false };
  }

  return {
    roles: Array.isArray(requirements.roles) ? requirements.roles : [],
    permissions: Array.isArray(requirements.permissions) ? requirements.permissions : [],
    requireAll: !!requirements.requireAll
  };
};

module.exports = {
  authenticateToken,
  authorize
};
