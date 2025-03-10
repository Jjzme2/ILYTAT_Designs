/**
 * Raw Body Middleware
 * Preserves the raw request body for Stripe webhook signature verification
 * Required for Stripe webhook verification which needs to verify the exact body content
 */
module.exports = (req, res, next) => {
  // Skip if not a webhook route
  if (req.originalUrl !== '/api/payment/webhook') {
    return next();
  }

  // Save raw body for Stripe webhook verification
  let rawBody = '';
  
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    req.rawBody = rawBody;
    next();
  });
};
