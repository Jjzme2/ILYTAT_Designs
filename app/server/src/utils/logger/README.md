# Enterprise Logging System

## Overview

This is a professional-grade logging system designed with scalability, maintainability, and observability in mind. It follows the SOLID principles and provides comprehensive logging capabilities for the ILYTAT Designs application.

## Architecture

The logging system follows a factory-based architecture with clear separation of concerns:

```
src/utils/logger/
├── baseLogger.js         # Core Winston configuration
├── index.js             # Extended logger with factory methods
├── config.js            # Logger configuration
├── factories/
│   ├── index.js         # Factory exports
│   ├── ErrorFactory.js  # Error creation
│   ├── LogFactory.js    # Log entry creation
│   ├── MetricFactory.js # Metrics handling
│   ├── ResponseFactory.js # API response handling
│   └── ValidationFactory.js # Data validation
```

## Features

- Multiple log levels with color coding
- Automatic log rotation and compression
- Correlation IDs for request tracking
- Performance metrics tracking
- Security event logging
- Database query logging
- Structured logging with context
- Environment-specific configurations

## Usage

### Basic Logging

```javascript
const logger = require('./utils/logger');

// Info level
logger.info('Operation successful', { userId: 123 });

// Error level with context
logger.error('Operation failed', {
    error: new Error('Database connection failed'),
    context: { operation: 'user_create' }
});
```

### Factory Usage

```javascript
const { 
    ErrorFactory,
    LogFactory,
    ResponseFactory,
    MetricFactory,
    ValidationFactory 
} = require('./utils/logger/factories');

// Create and log an error
const error = ErrorFactory.createValidationError({
    email: 'Invalid format'
});

// Track a metric
MetricFactory.incrementMetric('api.requests.total');

// Create an API response
const response = ResponseFactory.success(data, 'User created');

// Validate data
await ValidationFactory.validate('createUser', userData);
```

### Middleware Usage

```javascript
const {
    requestLogger,
    errorLogger,
    performanceLogger,
    securityLogger
} = require('./middleware/loggingMiddleware');

app.use(requestLogger);
app.use(securityLogger);
app.use(performanceLogger(1000)); // 1 second threshold
app.use(errorLogger);
```

## Best Practices

1. **Use Appropriate Log Levels**
   - `error`: Application errors (500 errors)
   - `warn`: Warning conditions (400 errors)
   - `info`: Normal operations
   - `debug`: Development information
   - `trace`: Detailed debugging

2. **Include Context**
   ```javascript
   logger.info('User action', {
       userId: user.id,
       action: 'profile_update',
       changes: {...}
   });
   ```

3. **Handle Sensitive Data**
   - Never log passwords or tokens
   - Use LogFactory to automatically mask sensitive data
   - Configure sensitive fields in config.js

4. **Use Correlation IDs**
   - Every request gets a unique correlation ID
   - Include it in all related log entries
   - Makes debugging and tracing easier

5. **Performance Considerations**
   - Use appropriate log levels in production
   - Monitor log file sizes
   - Configure log rotation appropriately
   - Use metrics for performance tracking

## Error Handling

```javascript
try {
    await someOperation();
} catch (error) {
    const enhancedError = ErrorFactory.createDatabaseError(
        'createUser',
        error,
        { userId: 123 }
    );
    logger.logError(enhancedError);
    throw enhancedError;
}
```

## Metrics

```javascript
// Track custom metrics
MetricFactory.startCustomMetric('cache.hit_ratio', async () => {
    const stats = await cache.getStats();
    return stats.hits / (stats.hits + stats.misses);
});

// Track business metrics
MetricFactory.incrementMetric('orders.completed');
MetricFactory.setMetric('active_users', activeCount);
```

## Configuration

The logging system can be configured through `config.js`:

```javascript
module.exports = {
    base: {
        service: 'ilytat-designs-api',
        logsDir: '/path/to/logs',
        maxSize: '20m',
        maxFiles: '14d'
    },
    retention: {
        error: '30d',
        combined: '7d'
    }
    // ... more configuration options
};
```

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

## Security

The logging system includes several security features:

1. Automatic PII masking
2. Sensitive data redaction
3. Security event tracking
4. Rate limiting monitoring
5. Suspicious activity detection

## Testing

When testing, you can use the logger in test mode:

```javascript
process.env.NODE_ENV = 'test';
const logger = require('./utils/logger');
```

This will:
- Disable console colors
- Write to test-specific log files
- Not interfere with production logs

## Contributing

When adding new features to the logging system:

1. Follow the established patterns
2. Update this documentation
3. Consider backward compatibility
4. Add appropriate tests
5. Consider performance implications

## Support

For issues or questions:

1. Check the logs in `app/server/logs`
2. Review this documentation
3. Contact the development team

## Future Enhancements

Planned improvements:

1. ELK Stack integration
2. Real-time log streaming
3. Advanced log analytics
4. Custom metric dashboards
5. Automated alert system

Remember: Good logging practices are essential for maintaining a healthy production system!
