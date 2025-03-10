# Auditing System Guide

## Overview

The ILYTAT Designs auditing system provides a robust, maintainable, and standardized approach to tracking actions and changes throughout the application. This system follows industry best practices and is designed to be easy to use for new developers.

## Core Components

The auditing system consists of several key components:

1. **Audit Model**: Database schema for storing audit records
2. **Audit Service**: Core service for creating and retrieving audit records
3. **Audit Middleware**: Automatically audits API requests
4. **Audit Hooks**: Sequelize hooks for automatic model change auditing
5. **Audit Controller & Routes**: API endpoints for accessing audit data

## Getting Started

### Basic Usage

The simplest way to create an audit record is through the `AuditService`:

```javascript
const AuditService = require('../services/auditService');

// Create a basic audit record
await AuditService.create({
  action: AuditService.ACTIONS.UPDATE,
  entityType: AuditService.ENTITIES.USER,
  entityId: user.id,
  userId: currentUser.id,
  oldValues: oldUserData,
  newValues: newUserData
});
```

### Automatic Request Auditing

The system automatically audits API requests through the `auditMiddleware`. To enable this for your routes:

```javascript
const auditMiddleware = require('../middleware/auditMiddleware');

// Apply to all routes in a router
router.use(auditMiddleware);

// Or apply to specific routes
router.post('/users', auditMiddleware, userController.createUser);
```

### Automatic Model Change Auditing

To automatically audit changes to a Sequelize model:

```javascript
const { applyAuditHooks } = require('../utils/auditHooks');

// In your model definition
module.exports = (sequelize) => {
  class User extends Model {
    // ... model definition
  }
  
  User.init({
    // ... attributes
  }, {
    sequelize,
    modelName: 'User'
  });
  
  // Apply audit hooks
  applyAuditHooks(User, {
    entityType: 'User',
    excludeFields: ['password', 'resetToken']
  });
  
  return User;
};
```

## Audit Record Structure

Each audit record contains the following information:

- **id**: Unique identifier (UUID)
- **userId**: User who performed the action (null for system actions)
- **action**: Type of action performed (e.g., CREATE, UPDATE, DELETE)
- **entityType**: Type of entity affected (e.g., User, Order)
- **entityId**: ID of the affected entity
- **oldValues**: Previous state of the entity (for updates/deletes)
- **newValues**: New state of the entity (for creates/updates)
- **metadata**: Additional contextual information
- **ipAddress**: IP address of the client
- **userAgent**: User agent of the client
- **requestId**: Request ID for correlation
- **status**: Outcome status (success, failure, warning)
- **severity**: Importance level (low, medium, high, critical)
- **createdAt**: When the audit record was created
- **updatedAt**: When the audit record was last updated
- **deletedAt**: When the audit record was soft-deleted (if applicable)

## Audit Actions

The `AuditService.ACTIONS` object provides standardized action types:

```javascript
// Authentication actions
LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, PASSWORD_CHANGED, ACCOUNT_LOCKED

// CRUD operations
CREATE, READ, UPDATE, DELETE, RESTORE

// Permission-related actions
PERMISSION_GRANTED, PERMISSION_REVOKED, ROLE_ASSIGNED, ROLE_REMOVED

// System actions
SYSTEM_ERROR, CONFIG_CHANGED, MAINTENANCE

// Business-specific actions
ORDER_PLACED, ORDER_UPDATED, ORDER_CANCELLED, PAYMENT_PROCESSED, EMAIL_SENT
```

## Entity Types

The `AuditService.ENTITIES` object provides standardized entity types:

```javascript
USER, ROLE, PERMISSION, ORDER, ORDER_ITEM, SESSION, SYSTEM, EMAIL, PAYMENT
```

## Convenience Methods

The `AuditService` provides several convenience methods for common audit scenarios:

```javascript
// Log entity CRUD operations
await AuditService.logEntityAction(action, entityType, entityId, oldValues, newValues);

// Log authentication events
await AuditService.logLogin(userId);
await AuditService.logLoginFailed(userId, email);
await AuditService.logLogout(userId);

// Log system events
await AuditService.logSystemError(error);
await AuditService.logEmailSent(recipientEmail, emailType);
```

## Querying Audit Records

The `AuditService` provides methods for retrieving audit records:

```javascript
// Get paginated audit records with filtering
const result = await AuditService.getAuditRecords({
  page: 1,
  limit: 20,
  action: AuditService.ACTIONS.UPDATE,
  entityType: AuditService.ENTITIES.USER,
  startDate: '2025-01-01',
  endDate: '2025-03-01'
});

// Get history for a specific entity
const history = await AuditService.getEntityHistory('User', userId);

// Get actions performed by a specific user
const userActions = await AuditService.getUserActionHistory(userId);
```

## API Endpoints

The auditing system provides the following API endpoints:

- `GET /api/audit` - Get paginated audit records with filtering
- `GET /api/audit/:id` - Get audit record by ID
- `GET /api/audit/entity/:entityType/:entityId` - Get audit history for a specific entity
- `GET /api/audit/user/:userId` - Get audit history for a specific user's actions
- `GET /api/audit/stats` - Get audit statistics

## Security Considerations

### Permissions

Access to audit records is controlled through permissions:

- `audit:view` - Required to view audit records
- `audit:admin` - Required for advanced audit features

### Sensitive Data

The auditing system automatically redacts sensitive fields from audit records:

```javascript
const sensitiveFields = [
  'password', 'passwordHash', 'token', 'secret', 'apiKey', 'creditCard',
  'ssn', 'socialSecurity', 'verificationToken', 'resetPasswordToken'
];
```

## Best Practices

1. **Use Standard Actions**: Use the predefined `AuditService.ACTIONS` constants for consistency.

2. **Include Context**: Add relevant metadata to provide context for audit events.

3. **Set Appropriate Severity**: Use the correct severity level based on the importance of the action.

4. **Audit Business Events**: Audit important business events, not just technical operations.

5. **Correlation IDs**: Use request IDs to correlate related audit records.

6. **Error Handling**: The auditing system is designed to never throw exceptions that could disrupt the application. Always log errors but continue execution.

7. **Performance Considerations**: Be mindful of the performance impact of extensive auditing, especially for high-volume operations.

## Extending the Auditing System

### Adding New Actions

To add new action types:

1. Add the action constant to `AuditService.ACTIONS`
2. Document the new action type
3. Implement any specific handling logic if needed

### Adding New Entity Types

To add new entity types:

1. Add the entity type to `AuditService.ENTITIES`
2. Apply audit hooks to the corresponding model
3. Update documentation

### Custom Audit Logic

For complex auditing scenarios, you can create custom audit methods in `AuditService`:

```javascript
// Example: Custom audit method for a specific business process
static async logProductPurchase(userId, productId, quantity, amount) {
  return this.create({
    action: this.ACTIONS.ORDER_PLACED,
    entityType: this.ENTITIES.ORDER,
    userId,
    metadata: {
      productId,
      quantity,
      amount
    }
  });
}
```

## Troubleshooting

### Missing Audit Records

If audit records are not being created:

1. Check that the `auditMiddleware` is applied to the route
2. Verify that audit hooks are properly applied to the model
3. Check for errors in the application logs

### Performance Issues

If the auditing system is causing performance problems:

1. Consider reducing the scope of automatic auditing
2. Optimize database indexes
3. Implement a cleanup policy for old audit records

## Maintenance

### Database Growth

Audit tables can grow large over time. Consider implementing:

1. Regular archiving of old audit records
2. Partitioning the audit table by date
3. Setting up a retention policy

### Monitoring

Monitor the auditing system for:

1. Error rates in audit record creation
2. Database size and growth rate
3. Query performance on the audit table

## Conclusion

The ILYTAT Designs auditing system provides a comprehensive solution for tracking actions and changes throughout the application. By following this guide, developers can effectively use and extend the system to meet the application's auditing needs.
