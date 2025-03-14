/**
 * Request Timing Middleware
 * Tracks request start time and automatically adds performance metrics to responses
 */
module.exports = function requestTimingMiddleware(req, res, next) {
  // Record the request start time
  req.startTime = Date.now();
  
  // Add a helper method to calculate elapsed time
  req.getElapsedTime = () => Date.now() - req.startTime;
  
  // Use the 'finish' event to log response time after the response has been sent
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    
    // Log the request timing
    if (req.logger) {
      req.logger.debug(`Request ${req.method} ${req.originalUrl} completed in ${duration}ms`);
    }
  });
  
  next();
};
