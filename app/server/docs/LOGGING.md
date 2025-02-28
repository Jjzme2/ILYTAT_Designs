# Advanced Logging System Documentation

## Overview

The ILYTAT Designs logging system is built on top of Winston, providing enterprise-grade logging capabilities with features like:

- Multiple log levels with color coding
- Correlation IDs for request tracking
- Automatic log rotation and compression
- Performance metrics tracking
- Structured logging with context
- Security event logging
- Database query logging
- Environment-specific configurations
- Factory system for standardized error and log creation

## Log Levels

The system uses the following log levels (from highest to lowest priority):

1. `emergency` - System is unusable
2. `alert` - Action must be taken immediately
3. `critical` - Critical conditions
4. `error` - Error conditions
5. `warn` - Warning conditions
6. `notice` - Normal but significant condition
7. `info` - Informational messages
8. `debug` - Debug-level messages
9. `trace` - Fine-grained debug messages

## Log Files

Logs are stored in the `app/server/logs` directory:

- `emergency-YYYY-MM-DD.log` - System-critical issues
- `error-YYYY-MM-DD.log` - Application errors
- `combined-YYYY-MM-DD.log` - All log entries
- `performance-YYYY-MM-DD.log` - Performance metrics

## Features

### Correlation IDs

Every request is assigned a unique correlation ID, making it easy to trace requests across the system:

```javascript
logger.info('Processing payment', {
    correlationId: 'abc-123',
    amount: 100,
    currency: 'USD'
});
```

### Performance Monitoring

Track system performance metrics:

```javascript
logger.logPerformance('api_response_time', 150, {
    endpoint: '/api/users',
    method: 'GET'
});
```

### Security Events

Log security-related events:

```javascript
logger.logSecurityEvent({
    type: 'authentication_failure',
    severity: 'high',
    description: 'Multiple failed login attempts'
}, {
    ip: '192.168.1.1',
    attempts: 5
});
```

### Database Query Logging

Monitor database performance:

```javascript
logger.logQuery({
    sql: 'SELECT * FROM users WHERE id = ?',
    bindings: [123]
}, 50, results);
```

## Factory System

### Error Factory

The `ErrorFactory` provides standardized error creation with automatic metadata enrichment:

```javascript
// Create HTTP error
const notFoundError = ErrorFactory.createHttpError(404, 'User not found', {
    userId: 123
});

// Create validation error
const validationError = ErrorFactory.createValidationError({
    email: 'Invalid email format',
    password: 'Password too short'
});

// Create database error
const dbError = ErrorFactory.createDatabaseError(
    'createUser',
    originalError,
    { userId: 123 }
);

// Create authentication error
const authError = ErrorFactory.createAuthenticationError(
    'Invalid credentials',
    { attemptCount: 3 }
);
```

### Log Factory

The `LogFactory` creates enriched, standardized log entries:

```javascript
// API request logging
const apiLog = LogFactory.createApiLog(req, {
    duration: 150,
    cache: 'miss'
});

// Performance logging
const perfLog = LogFactory.createPerformanceLog(
    'api_response_time',
    150,
    { threshold: 200 }
);

// Security event logging
const securityLog = LogFactory.createSecurityLog({
    type: 'authentication_failure',
    severity: 'high'
}, {
    userId: 123,
    ip: '192.168.1.1'
});

// Database query logging
const dbLog = LogFactory.createDatabaseLog(
    query,
    duration,
    results,
    { cache: 'hit' }
);

// Business logic logging
const businessLog = LogFactory.createBusinessLog(
    'order_created',
    { orderId: 456, amount: 100 },
    { status: 'success' }
);

// Audit logging
const auditLog = LogFactory.createAuditLog(
    'user_update',
    oldData,
    newData,
    { 
        userId: 123,
        resource: 'users',
        resourceId: 456
    }
);
```

### Factory Features

1. **Automatic Metadata Enrichment**
   - Correlation IDs
   - Timestamps
   - Host information
   - Process metrics
   - System status

2. **Sensitive Data Masking**
   - Automatic masking of sensitive fields
   - Configurable masking patterns
   - Deep object traversal

3. **Standardized Error Types**
   - HTTP errors
   - Validation errors
   - Database errors
   - Authentication errors
   - Authorization errors
   - Business logic errors

4. **Structured Log Types**
   - API logs
   - Performance logs
   - Security logs
   - Database logs
   - Business logs
   - Audit logs

## Configuration

The logging system is configured through `src/utils/logger/config.js`. Key configurations include:

- Log retention periods
- Performance thresholds
- Security monitoring settings
- Environment-specific settings

## Maintenance

### Log Rotation

Logs are automatically rotated based on size and date. Manual rotation:

```bash
npm run logs:rotate
```

### Log Cleanup

Clean up old archived logs:

```bash
npm run logs:clean
```

## Best Practices

1. **Use Appropriate Log Levels**
   - `error` for application errors
   - `warn` for warning conditions
   - `info` for normal operations
   - `debug` for development information

2. **Include Context**
   ```javascript
   logger.info('User action', {
       userId: user.id,
       action: 'profile_update',
       changes: {...}
   });
   ```

3. **Handle Sensitive Data**
   - Never log passwords, tokens, or sensitive personal information
   - Use the security configuration to mask sensitive fields

4. **Performance Considerations**
   - Use debug level judiciously in production
   - Monitor log file sizes
   - Set up log rotation and cleanup

## Integration with External Services

The logging system is designed to integrate with external monitoring services. Common integrations:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic
- AWS CloudWatch

## Error Handling

The logger includes robust error handling:

```javascript
try {
    // Your code
} catch (error) {
    logger.logError(error, {
        component: 'UserService',
        operation: 'createUser',
        userId: user.id
    });
}
```

## Development vs Production

The logging system automatically adjusts based on the environment:

- Development: Console output with colors, debug level enabled
- Production: File-only logging, info level and above
- Test: Minimal logging, no colors

## Monitoring and Alerts

The logging system can be configured to trigger alerts based on:

- Error frequency
- Performance degradation
- Security incidents
- Resource utilization

## Contributing

When adding new logging features:

1. Follow the established patterns
2. Update this documentation
3. Consider backward compatibility
4. Add appropriate tests
5. Consider performance implications

## Support

For issues or questions about the logging system:

1. Check the logs in `app/server/logs`
2. Review this documentation
3. Contact the development team

Remember: Good logging practices are essential for maintaining a healthy production system!
