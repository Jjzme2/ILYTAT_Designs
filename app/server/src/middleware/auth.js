const dotenv = require('dotenv')
dotenv.config()
const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')
const SessionManager = require('./sessionManager')
const { nameMapper } = require('../utils/nameMapper')
const { redactSensitiveInfo: redact, sanitizeObjectForLogs } = require('../utils/securityUtils')

/**
 * Safely redact sensitive information for logging
 * @private
 */
const redactSensitiveInfo = (value) => {
  return sanitizeObjectForLogs(value);
}

/**
 * Middleware to authenticate JWT token and validate session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
/**
 * Middleware to authenticate JWT token and validate session
 * Enhanced with detailed error logging and developer-friendly messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Check if Authorization header exists and extract token
    const authHeader = req.headers.authorization
    
    // Log request with minimal info for debugging purposes
    logger.debug('Authenticating request', { 
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader
    })
    
    // Extract token from Authorization header
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      logger.info('Authentication failed: No token provided', { 
        path: req.path, 
        ip: req.ip 
      })
      return res.status(401).json({ 
        success: false,
        message: 'No token provided',
        code: 'AUTH_NO_TOKEN' 
      })
    }

    // Verify token with JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Validate session in database
    const isValidSession = await SessionManager.validateSession(token)
    if (!isValidSession) {
      logger.info('Authentication failed: Invalid session', sanitizeObjectForLogs({ 
        userId: decoded?.id,
        path: req.path,
        token
      }))
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired session',
        code: 'AUTH_INVALID_SESSION' 
      })
    }

    // Attach user to request for downstream middleware and route handlers
    req.user = decoded
    
    // Transform user object to camelCase if needed
    if (req.user) {
      req.user = nameMapper.toCamelCase(req.user)
    }
    
    // Pass control to next middleware
    next()
  } catch (error) {
    // Handle common JWT errors with specific messages
    if (error.name === 'TokenExpiredError') {
      logger.info('Authentication failed: Token expired', { path: req.path })
      return res.status(401).json({ 
        success: false,
        message: 'Authentication token has expired',
        code: 'AUTH_TOKEN_EXPIRED' 
      })
    }
    if (error.name === 'JsonWebTokenError') {
      logger.info('Authentication failed: Invalid token format', { 
        path: req.path,
        error: error.message 
      })
      return res.status(401).json({ 
        success: false,
        message: 'Invalid authentication token',
        code: 'AUTH_INVALID_TOKEN' 
      })
    }
    
    // Log unexpected errors with full details for debugging
    logger.error('Unexpected authentication error:', sanitizeObjectForLogs({
      errorName: error.name,
      errorMessage: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip
    }))
    
    // Return generic error to avoid leaking implementation details
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication',
      code: 'AUTH_SERVER_ERROR'
    })
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
