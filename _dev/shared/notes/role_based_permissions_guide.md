# Role-Based Permissions System Implementation Guide

## Introduction

This document provides a comprehensive overview of the role-based permissions system implemented in ILYTAT Designs. The permissions system is designed to provide granular, resource-based access control across the application, ensuring that users can only access resources and perform actions they are authorized to.

## Core Components

The permissions system is built around the following core components:

### 1. Permission Constants

We use standardized permission naming conventions in the format `resource:action` to maintain consistency and clarity:

```javascript
// Example from middleware/permissions.js
const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Documentation permissions
  DOC_READ: 'documentation:read',
  DOC_CREATE: 'documentation:create',
  DOC_UPDATE: 'documentation:update',
  DOC_DELETE: 'documentation:delete',
  
  // Audit permissions
  AUDIT_VIEW: 'audit:view',
  AUDIT_ADMIN: 'audit:admin',
  AUDIT_EXPORT: 'audit:export',
  
  // System permissions
  SYSTEM_READ: 'system:read',
  SYSTEM_MANAGE: 'system:manage'
};
```

### 2. Middleware Functions

The permissions middleware provides several key functions for implementing access control:

#### `checkPermission(requiredPermissions, options)`

This is the primary middleware used to protect routes:

```javascript
// Basic usage to restrict access to users with 'user:read' permission
router.get(
  '/users',
  authenticateToken,
  checkPermission(PERMISSIONS.USER_READ),
  userController.getAll
);

// Multiple permissions (AND logic - require all)
router.put(
  '/users/:id',
  authenticateToken,
  checkPermission([PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_READ], { all: true }),
  userController.update
);

// Multiple permissions (OR logic - require any)
router.get(
  '/system/logs',
  authenticateToken,
  checkPermission([PERMISSIONS.SYSTEM_READ, 'admin:access'], { all: false }),
  systemController.getLogs
);
```

#### `checkOwnership(modelName, idParam, ownerField)`

This middleware checks if the authenticated user owns the resource being accessed:

```javascript
// Check if user owns the document they're trying to update
router.put(
  '/documents/:id',
  authenticateToken,
  checkOwnership('Document', 'id', 'createdBy'),
  documentController.update
);
```

#### Resource-Specific Access Checks

For complex access control logic, you can use the `resourceAccessCheck` option:

```javascript
router.get(
  '/audit/user/:userId',
  authenticateToken,
  checkPermission(PERMISSIONS.AUDIT_VIEW, {
    resourceAccessCheck: async (req) => {
      // Allow users to view their own audit history
      // Admins and those with AUDIT_ADMIN can view anyone's history
      return req.user.id === req.params.userId || 
             req.user.role === 'admin' || 
             await userHasPermission(req.user, PERMISSIONS.AUDIT_ADMIN);
    }
  }),
  auditController.getUserActionHistory
);
```

### 3. Helper Functions

The permissions system also provides helper functions for checking permissions programmatically:

#### `userHasPermission(user, permission)`

Checks if a user has a specific permission:

```javascript
const canAccessDoc = await userHasPermission(req.user, PERMISSIONS.DOC_READ);
```

#### `userHasPermissions(user, permissions, requireAll)`

Checks if a user has multiple permissions:

```javascript
// Check if user has ALL these permissions
const canManageDocs = await userHasPermissions(
  req.user, 
  [PERMISSIONS.DOC_CREATE, PERMISSIONS.DOC_UPDATE, PERMISSIONS.DOC_DELETE],
  true
);

// Check if user has ANY of these permissions
const canAccessSystem = await userHasPermissions(
  req.user,
  [PERMISSIONS.SYSTEM_READ, PERMISSIONS.SYSTEM_MANAGE],
  false
);
```

## Implementation Patterns

Here are common patterns for implementing permissions across different types of routes:

### 1. Public Routes

These routes require no authentication or permissions:

```javascript
router.get('/health', systemController.getHealthStatus);
router.get('/documentation/public', documentationController.getPublicDocumentation);
```

### 2. Authenticated Routes (Any User)

These routes require authentication but no specific permissions:

```javascript
router.get(
  '/me',
  authenticateToken,
  userController.getProfile
);
```

### 3. Role-Based Routes

These routes require specific role or permission:

```javascript
// Developer-specific documentation
router.get(
  '/documentation/developer',
  authenticateToken,
  checkPermission([PERMISSIONS.DOC_READ, 'developer:access']),
  documentationController.getDeveloperDocs
);

// Admin-only routes
router.get(
  '/system/logs',
  authenticateToken,
  checkPermission(PERMISSIONS.SYSTEM_MANAGE),
  systemController.getLogs
);
```

### 4. Resource Ownership Routes

These routes check if the user owns the resource:

```javascript
// User can only update their own comments
router.put(
  '/comments/:id',
  authenticateToken,
  checkOwnership('Comment', 'id'),
  commentController.update
);
```

### 5. Complex Access Control

For complex scenarios with multiple factors:

```javascript
router.put(
  '/documents/:id',
  authenticateToken,
  checkPermission(PERMISSIONS.DOC_UPDATE, {
    resourceAccessCheck: async (req) => {
      const doc = await Document.findByPk(req.params.id);
      
      // Can edit if:
      // 1. User created the document, OR
      // 2. User is in the document's collaborators list, OR
      // 3. User is admin
      return !doc ? false : (
        doc.createdBy === req.user.id ||
        (doc.collaborators && doc.collaborators.includes(req.user.id)) ||
        req.user.role === 'admin'
      );
    }
  }),
  documentController.update
);
```

## Controllers and Resource-Specific Logic

Controllers often implement their own resource-specific permission checks:

```javascript
// Example from documentationController.js
canUserAccessDoc = async (user, docId) => {
  try {
    // Get user role information
    const userRole = await Role.findOne({ where: { name: user.role } });
    if (!userRole) return false;
    
    // Find the documentation
    const doc = await Documentation.findOne({
      where: { id: docId, isActive: true }
    });
    
    if (!doc) return false;
    
    // Public docs are accessible to all authenticated users
    if (doc.isPublic) return true;
    
    // Check if doc is accessible to user's role
    if (doc.roleId === userRole.id) return true;
    
    // Admin and developers have access to all docs
    if (['admin', 'developer'].includes(user.role)) return true;
    
    // User is the creator of the doc
    if (doc.createdBy === user.id) return true;
    
    return false;
  } catch (error) {
    logger.error(`Error checking document access: ${error.message}`);
    return false; // Fail closed - deny access on error
  }
};
```

## Database Schema

The permissions system relies on these database models:

### Role Model

```javascript
const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: DataTypes.STRING
});

Role.associate = (models) => {
  Role.belongsToMany(models.Permission, {
    through: 'RolePermissions',
    as: 'permissions'
  });
  
  Role.hasMany(models.User, {
    foreignKey: 'roleId'
  });
};
```

### Permission Model

```javascript
const Permission = sequelize.define('Permission', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: DataTypes.STRING
});

Permission.associate = (models) => {
  Permission.belongsToMany(models.Role, {
    through: 'RolePermissions',
    as: 'roles'
  });
};
```

### UserPermission Model (for user-specific permissions)

```javascript
const UserPermission = sequelize.define('UserPermission', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Permissions',
      key: 'id'
    }
  }
});
```

## Best Practices

1. **Always use the PERMISSIONS constants** rather than string literals to avoid typos and inconsistencies.

2. **Layer your security:** Apply authentication (`authenticateToken`) before permission checks.

3. **Structure routes by access level:** Group routes by public, authenticated, role-specific, and admin sections.

4. **Implement resource ownership checks:** Use `resourceAccessCheck` for user-specific resources.

5. **Fail securely:** Always deny access on errors (fail closed).

6. **Use consistent response formats:** Standardize your error responses for permission denials.

7. **Document your permissions:** Add JSDoc comments to all routes explaining required permissions.

8. **Cache permissions:** For large applications, consider caching user permissions to reduce database load.

9. **Log permission failures:** Ensure security issues can be investigated.

## Extending the System

To add new permissions:

1. Add new constants to the `PERMISSIONS` object in `middleware/permissions.js`.
2. Add the permissions to your database (via seeders or migrations).
3. Assign permissions to appropriate roles.
4. Apply the middleware to routes requiring those permissions.

## Real-World Examples

### Documentation Routes

```javascript
// Public (no auth required)
router.get('/public', documentationController.getPublicDocumentation);

// Any authenticated user (their own role-based docs)
router.get(
  '/',
  authenticateToken,
  documentationController.getForCurrentUser
);

// Developer-specific
router.get(
  '/developer',
  authenticateToken,
  checkPermission([PERMISSIONS.DOC_READ, 'developer:access']),
  documentationController.getDeveloperDocs
);

// Admin-only
router.put(
  '/:id',
  authenticateToken,
  checkPermission(PERMISSIONS.DOC_UPDATE),
  documentationController.update
);
```

### Audit Routes

```javascript
// Basic audit access
router.get(
  '/',
  authenticateToken,
  checkPermission(PERMISSIONS.AUDIT_VIEW),
  auditController.getAuditRecords
);

// Resource-specific access
router.get(
  '/user/:userId',
  authenticateToken,
  checkPermission(PERMISSIONS.AUDIT_VIEW, {
    resourceAccessCheck: async (req) => {
      return req.user.id === req.params.userId || 
             req.user.role === 'admin' || 
             await userHasPermission(req.user, PERMISSIONS.AUDIT_ADMIN);
    }
  }),
  auditController.getUserActionHistory
);

// Admin-only operations
router.get(
  '/stats',
  authenticateToken,
  checkPermission(PERMISSIONS.AUDIT_ADMIN),
  auditController.getAuditStats
);
```

## Troubleshooting

### Common Issues

1. **Middleware order matters:** Always put `authenticateToken` before permission middleware.

2. **Missing user object:** The `req.user` object must be populated by the authentication middleware.

3. **Permission string mismatches:** Use constants to avoid typos in permission strings.

4. **Database schema issues:** Ensure your associations between User, Role, and Permission models are correct.

### Debugging Permissions

For debugging permission issues, you can:

1. **Log user permissions:**
```javascript
const userPerms = await loadUserPermissions(req.user.id);
console.log(`User ${req.user.id} permissions:`, userPerms);
```

2. **Add temporary debugging middleware:**
```javascript
router.use((req, res, next) => {
  if (req.user) {
    console.log(`[DEBUG] User ${req.user.id} with role '${req.user.role}' 
      accessing ${req.method} ${req.originalUrl}`);
  }
  next();
});
```

## Conclusion

This role-based permissions system provides a flexible foundation for implementing access control throughout our API. By combining authentication, role-based permissions, and resource-specific checks, we've created a secure and granular access control system that can be extended to support additional resources and permissions as our application grows.

Remember that security is never a one-time implementation but an ongoing practice. Regularly review and update your permissions as your application evolves.
