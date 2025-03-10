const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request logger middleware
 * Logs information about each request and attaches a unique requestId
 * that can be used for tracking the request through the system
 */
const requestLogger = (req, res, next) => {
  // Generate unique ID for request tracking
  req.requestId = uuidv4();

  // Log basic request info
  logger.info({
    message: 'API Request',
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId
  });

  // Capture start time for performance tracking
  req.startTime = Date.now();

  // Capture the original end function
  const originalEnd = res.end;
  
  // Wrap the res.end function to log response details
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - req.startTime;
    
    // Log response details
    logger.info({
      message: 'API Response',
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId
    });
    
    // Call the original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;
