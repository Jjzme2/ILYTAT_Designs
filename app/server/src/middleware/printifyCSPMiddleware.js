/**
 * Custom middleware to ensure Printify domains are allowed in Content-Security-Policy
 * 
 * This middleware adds the Printify domain to the CSP header regardless of other
 * security configurations, ensuring images can be loaded from Printify's API.
 */

const printifyCSPMiddleware = (req, res, next) => {
  res.on('header', () => {
    // Get existing CSP header
    const existingCSP = res.getHeader('Content-Security-Policy');
    
    // Define Printify domains that need to be allowed
    const printifyDomains = [
      'https://images-api.printify.com',
      'https://*.printify.com'
    ];
    
    if (existingCSP) {
      // If CSP exists, modify it to include Printify domains
      let cspValue = existingCSP.toString();
      
      // Check if img-src directive exists
      if (cspValue.includes('img-src')) {
        // Add Printify domains to img-src directive
        cspValue = cspValue.replace(
          /(img-src[^;]*)/,
          (match) => {
            // Don't add domains if they're already there
            let newMatch = match;
            printifyDomains.forEach(domain => {
              if (!newMatch.includes(domain)) {
                newMatch += ` ${domain}`;
              }
            });
            return newMatch;
          }
        );
      } else {
        // If img-src directive doesn't exist, add it
        cspValue += "; img-src 'self' data: blob: " + printifyDomains.join(' ');
      }
      
      // Set the modified CSP header
      res.setHeader('Content-Security-Policy', cspValue);
    } else {
      // If CSP doesn't exist, create a basic one with Printify domains
      const cspValue = `default-src 'self'; img-src 'self' data: blob: ${printifyDomains.join(' ')}`;
      res.setHeader('Content-Security-Policy', cspValue);
    }
  });
  
  next();
};

module.exports = printifyCSPMiddleware;
