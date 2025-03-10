/**
 * Audit Middleware
 * Automatically records audit events for API requests
 */

const AuditService = require('../services/auditService');
const logger = require('../utils/logger').createLogger({
  level: 'info',
  service: 'auditMiddleware'
});

/**
 * Configuration for audit middleware
 */
const config = {
  // Paths that should not be audited (e.g., health checks, static assets)
  excludePaths: [
    '/api/health',
    '/api/metrics',
    '/favicon.ico',
    '/static',
    '/assets'
  ],
  
  // HTTP methods that should be audited
  includeMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  
  // Whether to audit all GET requests (can generate a lot of audit records)
  auditGetRequests: false,
  
  // Whether to include request body in audit records (may contain sensitive data)
  includeRequestBody: false,
  
  // Whether to include response body in audit records (may be large)
  includeResponseBody: false,
  
  // Maximum size of request/response bodies to include (in bytes)
  maxBodySize: 10 * 1024, // 10KB
  
  // Map HTTP methods to audit actions
  methodToAction: {
    'POST': AuditService.ACTIONS.CREATE,
    'PUT': AuditService.ACTIONS.UPDATE,
    'PATCH': AuditService.ACTIONS.UPDATE,
    'DELETE': AuditService.ACTIONS.DELETE,
    'GET': AuditService.ACTIONS.READ
  }
};

/**
 * Determine if a request should be audited based on path and method
 * @param {Object} req - Express request object
 * @returns {boolean} Whether the request should be audited
 */
function shouldAuditRequest(req) {
  // Skip excluded paths
  for (const path of config.excludePaths) {
    if (req.path.startsWith(path)) {
      return false;
    }
  }
  
  // Check HTTP method
  if (req.method === 'GET') {
    return config.auditGetRequests;
  }
  
  return config.includeMethods.includes(req.method);
}

/**
 * Extract entity type and ID from request path
 * @param {Object} req - Express request object
 * @returns {Object} Entity type and ID
 */
function extractEntityInfo(req) {
  // Extract entity information from URL pattern
  // Assumes RESTful URL structure like /api/users/123
  const pathParts = req.path.split('/').filter(Boolean);
  
  // Skip 'api' prefix if present
  const startIndex = pathParts[0] === 'api' ? 1 : 0;
  
  if (pathParts.length > startIndex) {
    // Convert plural resource name to singular entity type
    // e.g., 'users' -> 'User'
    let entityType = pathParts[startIndex];
    
    // Handle common plural forms
    if (entityType.endsWith('s')) {
      entityType = entityType.slice(0, -1);
    } else if (entityType.endsWith('ies')) {
      entityType = entityType.slice(0, -3) + 'y';
    }
    
    // Capitalize first letter
    entityType = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    // Extract ID if present in URL
    const entityId = pathParts.length > startIndex + 1 ? pathParts[startIndex + 1] : null;
    
    return { entityType, entityId };
  }
  
  return { entityType: 'Unknown', entityId: null };
}

/**
 * Safely extract request body for audit
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized request body
 */
function extractRequestBody(req) {
  if (!config.includeRequestBody || !req.body) {
    return null;
  }
  
  try {
    // Create a copy of the body
    const body = { ...req.body };
    
    // Redact sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (body[field]) {
        body[field] = '[REDACTED]';
      }
    });
    
    // Stringify and check size
    const bodyString = JSON.stringify(body);
    if (bodyString.length > config.maxBodySize) {
      return { _truncated: true, _size: bodyString.length };
    }
    
    return body;
  } catch (error) {
    logger.warn('Failed to extract request body for audit', {
      error: error.message,
      path: req.path
    });
    return null;
  }
}

/**
 * Middleware to audit API requests
 */
function auditMiddleware(req, res, next) {
  // Skip if request should not be audited
  if (!shouldAuditRequest(req)) {
    return next();
  }
  
  // Store original timestamp
  req.auditStartTime = Date.now();
  
  // Extract entity information
  const { entityType, entityId } = extractEntityInfo(req);
  
  // Capture the original end function
  const originalEnd = res.end;
  
  // Wrap the res.end function to create audit record after response
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - req.auditStartTime;
    
    // Determine action from HTTP method
    const action = config.methodToAction[req.method] || AuditService.ACTIONS.READ;
    
    // Determine status based on response status code
    let status = AuditService.STATUS.SUCCESS;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      status = AuditService.STATUS.WARNING;
    } else if (res.statusCode >= 500) {
      status = AuditService.STATUS.FAILURE;
    }
    
    // Determine severity based on status code
    let severity = AuditService.SEVERITY.LOW;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      severity = AuditService.SEVERITY.MEDIUM;
    } else if (res.statusCode >= 500) {
      severity = AuditService.SEVERITY.HIGH;
    }
    
    // Create audit record
    AuditService.create({
      action,
      entityType,
      entityId,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
      status,
      severity,
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode: res.statusCode,
        duration,
        requestBody: extractRequestBody(req)
      }
    }).catch(error => {
      // Log error but don't disrupt response
      logger.error('Failed to create audit record in middleware', {
        error: error.message,
        stack: error.stack,
        path: req.path
      });
    });
    
    // Call the original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

module.exports = auditMiddleware;
