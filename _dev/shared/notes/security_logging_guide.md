# Secure Logging Guidelines for ILYTAT Designs

## Overview

This document outlines the secure logging practices implemented across the ILYTAT Designs application to ensure sensitive data is never exposed in logs, even during debugging or development. These practices follow industry standards for data protection and privacy.

## Core Security Principles

1. **No Sensitive Data in Logs**: Never log passwords, tokens, personal information, or other sensitive data in their original form.
2. **Consistent Redaction Format**: All sensitive data is redacted using the format `[REDACTED] (x characters)` where `x` represents the length of the redacted string.
3. **Granular Control**: The system provides utilities to control exactly what information is redacted without compromising debugging capabilities.

## Using the Security Utilities

We've implemented a centralized security utilities module that provides consistent methods for redacting sensitive information:

```javascript
const { redactSensitiveInfo, sanitizeObjectForLogs, createSecureLogger } = require('../utils/securityUtils');

// Redact a single sensitive value
logger.debug('Processing user', { 
  userId: user.id,
  email: redactSensitiveInfo(user.email) // Will output: [REDACTED] (20 characters)
});

// Automatically sanitize an entire object
logger.info('Authentication attempt', sanitizeObjectForLogs({
  email: 'user@example.com',
  password: 'secret123',
  clientInfo: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
}));
// The password will be automatically redacted in the output
```

## Enhanced Logging Methods

For convenience, you can create a secure logger wrapper that automatically sanitizes log data:

```javascript
const logger = require('../utils/logger');
const { createSecureLogger } = require('../utils/securityUtils');

const secureLogger = createSecureLogger(logger);

// All sensitive fields will be automatically redacted
secureLogger.info('User data received', userData);
```

## Predefined Sensitive Fields

The following fields are automatically identified as sensitive and will be redacted:

- Passwords and credentials
- Authentication tokens (access, refresh, verification, reset)
- API keys and secrets
- Email addresses
- Phone numbers
- Any field containing terms like 'secret', 'key', 'token', etc.

## Adding Custom Sensitive Fields

To add new sensitive fields to the automatic redaction system, update the `SENSITIVE_FIELDS` array in `securityUtils.js`:

```javascript
// In securityUtils.js
const SENSITIVE_FIELDS = [
  // existing fields...
  'new_sensitive_field',
  'another_field'
];
```

## Best Practices

1. **Prefer Structured Logging**: Use the metadata object parameter of logging methods rather than string interpolation, as it allows better control over redaction.
2. **Log Minimal Information**: Only log what's necessary for debugging and monitoring.
3. **Be Cautious with User Data**: When in doubt about whether something should be logged, err on the side of caution and redact it.
4. **Audit Logging Usage**: Periodically review logs to ensure sensitive information is not being inadvertently exposed.

## Implementation Examples

### Authentication Service

```javascript
// Example of secure logging in authentication processes
logger.debug('Attempting to validate user credentials', {
  userId: user.id,
  email: redactSensitiveInfo(user.email),
  loginAttempts: user.login_attempts,
  passwordProvided: !!password // Boolean flag is safe to log
});
```

### Session Management

```javascript
// Example of secure session token handling
logger.debug('Validating session token', {
  token: redactSensitiveInfo(token)
});
```

## Testing Security Logging

When writing tests for components that use secure logging, ensure that:

1. Sensitive data is properly redacted in all log outputs
2. The redaction doesn't interfere with normal operation
3. Error handling properly sanitizes sensitive data in error messages and stack traces

## Questions and Support

For questions about secure logging practices or to report potential security issues, please contact the security team or create an issue in the security category of our project management system.
