# Security Configuration

## Content Security Policy (CSP)

The application implements a Content Security Policy to protect against XSS attacks and other security vulnerabilities. The CSP is configured in `app.js` using the `helmet` middleware.

### Current CSP Configuration

```javascript
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https:', 'wss:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
})
```

### Directive Explanations

- `defaultSrc`: Fallback for other resource types not explicitly specified
- `scriptSrc`: Controls which scripts can be executed
  - `'self'`: Scripts from same origin
  - `'unsafe-inline'`: Required for Vue.js inline scripts
  - `'unsafe-eval'`: Required for Vue.js development and runtime
- `styleSrc`: Controls which styles can be applied
  - `'unsafe-inline'`: Required for Vue.js style binding
  - `https:`: Allows loading styles from any HTTPS source
- `imgSrc`: Controls which images can be loaded
  - `data:`: Allows data URIs for images
  - `https:`: Allows loading images from any HTTPS source
- `connectSrc`: Controls which URLs can be loaded using script interfaces
  - `https:`: Allows HTTPS API connections
  - `wss:`: Allows WebSocket connections
- `fontSrc`: Controls where fonts can be loaded from
- `objectSrc`: Restricts `<object>`, `<embed>`, and `<applet>` elements
- `mediaSrc`: Controls which media (audio/video) can be loaded
- `frameSrc`: Controls which URLs can be loaded into frames

### Security Considerations

1. `'unsafe-inline'` and `'unsafe-eval'` are required for Vue.js functionality but do introduce some security risks. These are mitigated by:
   - Strict input validation
   - XSS protection through Vue's template syntax
   - Regular security audits of dependencies

2. WebSocket connections (`wss:`) are allowed for real-time features but restricted to secure connections only.

3. External resources (images, fonts, styles) are restricted to HTTPS connections only.

### Future Improvements

1. Consider implementing nonce-based CSP for better security once Vue.js supports it
2. Regularly review and update CSP rules based on application needs
3. Monitor CSP violation reports to identify potential security issues
4. Consider implementing Subresource Integrity (SRI) for external resources
