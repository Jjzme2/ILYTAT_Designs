# Permissions Middleware Usage Guide

## Overview

This guide demonstrates how to use the new permissions middleware to implement fine-grained access control in your API routes. The permissions system builds on our existing authentication framework while adding more granular control over resource access.

## Basic Concepts

The permissions system is based on these key concepts:

1. **Permission Constants**: Standardized string identifiers for permissions (e.g., `user:read`, `document:create`)
2. **Resource-Based Checks**: Permissions can be checked against specific resources
3. **Ownership Verification**: Determine if a user owns a resource they're trying to access
4. **Role-Based Access**: Permissions inherited from user roles

## Implementation Examples

### 1. Basic Permission Check

```javascript
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');

// In your route file:
const ROUTES = {
  GET_ALL_USERS: '/',
  GET_USER: '/:id',
  CREATE_USER: '/',
  UPDATE_USER: '/:id',
  DELETE_USER: '/:id'
};

const userRoutes = (router) => {
  // Public route - no permission check
  router.get('/public-info', userController.getPublicInfo);
  
  // Protected routes with permission checks
  router.get(
    ROUTES.GET_ALL_USERS,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_READ),
    userController.getAllUsers
  );
  
  router.get(
    ROUTES.GET_USER,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_READ),
    userController.getUserById
  );
  
  router.post(
    ROUTES.CREATE_USER,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_CREATE),
    userController.createUser
  );
  
  router.put(
    ROUTES.UPDATE_USER,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_UPDATE),
    userController.updateUser
  );
  
  router.delete(
    ROUTES.DELETE_USER,
    authenticateToken,
    checkPermission(PERMISSIONS.USER_DELETE),
    userController.deleteUser
  );
};
```

### 2. Multiple Permissions Check

For operations requiring multiple permissions:

```javascript
router.post(
  '/bulk-operations',
  authenticateToken,
  checkPermission(
    [PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE], 
    { all: true } // Requires ALL permissions
  ),
  userController.bulkOperations
);
```

### 3. Resource Ownership Check

Ensure users can only modify their own resources:

```javascript
router.put(
  '/documents/:id',
  authenticateToken,
  checkOwnership('Document', 'id', 'createdBy'),  // Check if user owns the document
  documentController.updateDocument
);
```

### 4. Combined Permission and Resource Check

For granular checks that combine permissions with resource-specific logic:

```javascript
router.put(
  '/documents/:id',
  authenticateToken,
  checkPermission(PERMISSIONS.DOC_UPDATE, {
    resourceAccessCheck: async (req) => {
      // Custom logic to check document access
      const document = await Document.findByPk(req.params.id);
      if (!document) return false;
      
      // Allow access if user is the owner or a collaborator
      return document.userId === req.user.id || 
             await document.hasCollaborator(req.user.id);
    }
  }),
  documentController.updateDocument
);
```

### 5. Using with Existing Auth Middleware

You can combine the new permissions middleware with our existing role-based authorize middleware:

```javascript
router.post(
  '/admin-only-action',
  authenticateToken,
  authorize(['admin']),               // First check role
  checkPermission(PERMISSIONS.ADMIN), // Then check specific permission
  adminController.performAction
);
```

## Defining Permissions in Database

To implement this system, ensure your database contains the necessary permissions:

```javascript
// Example seeder for permissions
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Permissions', [
      { name: 'user:read', description: 'Can read user data', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:create', description: 'Can create users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:update', description: 'Can update users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:delete', description: 'Can delete users', createdAt: new Date(), updatedAt: new Date() },
      // Add other permissions here
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Permissions', null, {});
  }
};
```

## Best Practices

1. **Use Constants**: Always use the `PERMISSIONS` constants rather than hardcoded strings
2. **Resource-Specific Logic**: Implement resource-specific access logic where appropriate
3. **Keep It Simple**: Don't overcomplicate permission checks - aim for readability
4. **Performance**: Consider caching permissions for frequently accessed resources
5. **Documentation**: Document the permissions required for each endpoint in your API docs
6. **Testing**: Write tests for permission checks to ensure they're working correctly

## Handling Permission Errors

The middleware returns standardized error responses:

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

Ensure your client-side code handles these responses appropriately.

## Migration Strategy

When migrating existing routes to use the new permissions system:

1. Identify the specific permissions needed for each route
2. Add the permissions to your database
3. Update your route handlers to use the new middleware
4. Test thoroughly to ensure permissions work as expected

By following this guide, you can implement consistent, fine-grained access control across your API while maintaining the standardized route pattern we've established.
