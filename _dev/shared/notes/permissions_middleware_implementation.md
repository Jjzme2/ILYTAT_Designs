# Permissions Middleware Implementation Guide

## Introduction

This document provides a comprehensive guide to the permissions middleware implementation in ILYTAT Designs. We've created a robust role-based access control system that extends beyond simple role checks to provide granular resource-level permissions.

## Implementation Overview

The permissions middleware works alongside our existing authentication system to provide a layered security approach:

1. **Authentication Layer**: Verifies the user's identity and attaches the user object to the request
2. **Permissions Layer**: Checks if the authenticated user has the required permissions for the requested action
3. **Resource Access Layer**: For specific resources, verifies if the user can access the particular resource instance

## Key Components

### 1. Permissions Constants

We use standardized permission naming conventions in the format `resource:action`:

```javascript
// In middleware/permissions.js
const PERMISSIONS = {
  // User permissions
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Documentation permissions
  DOC_READ: 'documentation:read',
  DOC_CREATE: 'documentation:create',
  DOC_UPDATE: 'documentation:update',
  DOC_DELETE: 'documentation:delete',
  
  // System permissions
  SYSTEM_READ: 'system:read',
  SYSTEM_MANAGE: 'system:manage'
};
```

### 2. Permission Checking Middleware

The `checkPermission` middleware verifies that the user has the required permissions:

```javascript
/**
 * Middleware to check if a user has the required permissions
 * @param {string|string[]} requiredPermissions - Permission(s) required for access
 * @param {Object} options - Additional options for permission checking
 * @returns {Function} Express middleware
 */
const checkPermission = (requiredPermissions, options = {}) => {
  return async (req, res, next) => {
    // Default options
    const opts = {
      requireAll: true, // Whether all permissions are required (AND logic)
      resourceAccessCheck: null, // Function to check resource-specific access
      ...options
    };
    
    try {
      // User should be attached to req by authenticateToken middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Convert to array if single permission string provided
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      
      // Check if user has required permissions
      const hasPermission = await userHasPermissions(
        req.user,
        permissions,
        opts.requireAll
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
          error: 'You do not have the required permissions to access this resource'
        });
      }
      
      // Check resource-specific access if provided
      if (opts.resourceAccessCheck) {
        const canAccessResource = await opts.resourceAccessCheck(req);
        
        if (!canAccessResource) {
          return res.status(403).json({
            success: false,
            message: 'Resource access denied',
            error: 'You do not have permission to access this specific resource'
          });
        }
      }
      
      // If we reach here, user has all required permissions
      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: process.env.NODE_ENV === 'production' ? null : error.message
      });
    }
  };
};
```

### 3. Resource-Specific Access Checks

For fine-grained control over specific resources, we implement resource access checks:

```javascript
// Example from documentation routes
router.get(
  ROUTES.BY_ID,
  authenticateToken,
  checkPermission(PERMISSIONS.DOC_READ, {
    resourceAccessCheck: async (req) => {
      // Check if user can access this specific document
      return await documentationController.canUserAccessDoc(req.user, req.params.id);
    }
  }),
  documentationController.getById
);
```

## Implementation in Routes

### Documentation Routes

We've implemented tiered access levels in our documentation routes:

```javascript
const documentationRoutes = (router) => {
  // PUBLIC ROUTES - no authentication required
  router.get('/public', documentationController.getPublicDocumentation);
  
  // AUTHENTICATED USER ROUTES - any logged-in user
  router.get(
    '/',
    authenticateToken,
    documentationController.getForCurrentUser
  );
  
  // ROLE-SPECIFIC ROUTES
  router.get(
    '/developer',
    authenticateToken,
    checkPermission([PERMISSIONS.DOC_READ, 'developer:access']),
    documentationController.getDeveloperDocs
  );
  
  // ADMIN-ONLY ROUTES
  router.put(
    '/:id',
    authenticateToken,
    checkPermission(PERMISSIONS.DOC_UPDATE),
    documentationController.update
  );
};
```

### System Routes

System health and monitoring routes also use granular permissions:

```javascript
const systemRoutes = (router) => {
  // Basic health check (public)
  router.get(ROUTES.HEALTH, systemController.getHealthStatus);
  
  // Developer routes
  router.get(
    ROUTES.HEALTH_DETAILED,
    authenticateToken,
    checkPermission([PERMISSIONS.SYSTEM_READ, 'developer:access']),
    systemController.getDetailedHealth
  );
  
  // Admin-only routes
  router.get(
    ROUTES.LOGS,
    authenticateToken,
    checkPermission(PERMISSIONS.SYSTEM_MANAGE),
    systemController.getLogs
  );
};
```

## Permission Checking Logic

The underlying functions for checking permissions:

```javascript
/**
 * Check if a user has the specified permissions
 * @param {Object} user - User object from authentication
 * @param {string[]} permissions - Array of permissions to check
 * @param {boolean} requireAll - Whether all permissions are required
 * @returns {boolean} Whether user has the required permissions
 */
const userHasPermissions = async (user, permissions, requireAll = true) => {
  try {
    // Admin role has all permissions
    if (user.role === 'admin') return true;
    
    // Developer role has specific permissions
    if (user.role === 'developer' && permissions.includes('developer:access')) return true;
    
    // Check for specific role-based permissions
    if (permissions.includes(`${user.role}:access`)) return true;
    
    // If we need all permissions, check that every permission is present
    if (requireAll) {
      for (const permission of permissions) {
        const hasPermission = await userHasPermission(user, permission);
        if (!hasPermission) return false;
      }
      return true;
    } 
    // Otherwise, check if user has ANY of the permissions
    else {
      for (const permission of permissions) {
        const hasPermission = await userHasPermission(user, permission);
        if (hasPermission) return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false; // Fail closed - deny on error
  }
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object from authentication
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has the permission
 */
const userHasPermission = async (user, permission) => {
  try {
    // Get user's role permissions from database
    const userRole = await Role.findOne({
      where: { name: user.role },
      include: [{ model: Permission, as: 'permissions' }]
    });
    
    if (!userRole) return false;
    
    // Check if permission exists in the user's role permissions
    return userRole.permissions.some(p => p.name === permission);
  } catch (error) {
    console.error('Error checking specific permission:', error);
    return false; // Fail closed - deny on error
  }
};
```

## Database Schema

The permissions system is backed by these database models:

```javascript
// Role model
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING
    }
  });
  
  Role.associate = models => {
    Role.belongsToMany(models.Permission, {
      through: 'RolePermissions',
      as: 'permissions',
      foreignKey: 'roleId'
    });
    
    Role.hasMany(models.User, {
      foreignKey: 'roleId'
    });
  };
  
  return Role;
};

// Permission model
module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING
    }
  });
  
  Permission.associate = models => {
    Permission.belongsToMany(models.Role, {
      through: 'RolePermissions',
      as: 'roles',
      foreignKey: 'permissionId'
    });
  };
  
  return Permission;
};
```

## Best Practices

1. **Layer your security**: Always apply authentication before permission checks.

2. **Structure routes by access level**: Group routes by public, authenticated, and role-specific sections.

3. **Use constants for permissions**: Always use `PERMISSIONS` constants rather than string literals.

4. **Implement resource ownership checks**: Use `resourceAccessCheck` for user-specific resources.

5. **Fail securely**: Always deny access on errors (fail closed).

6. **Consistent response format**: Use standardized error responses for permission denials.

7. **Documentation**: Add JSDoc comments to all route handlers explaining required permissions.

## Extending the Permissions System

To add new permissions:

1. Add new constants to the `PERMISSIONS` object.
2. Add the permissions to your database (via seeders or migrations).
3. Assign permissions to appropriate roles.
4. Apply the permission middleware to routes requiring those permissions.

## Example: Adding a New Resource Type

```javascript
// 1. Add permissions constants
const PERMISSIONS = {
  // ... existing permissions

  // New report permissions
  REPORT_READ: 'report:read',
  REPORT_CREATE: 'report:create',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete'
};

// 2. Create seeder for new permissions
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const reportPermissions = [
      { name: 'report:read', description: 'Read reports', createdAt: new Date(), updatedAt: new Date() },
      { name: 'report:create', description: 'Create reports', createdAt: new Date(), updatedAt: new Date() },
      { name: 'report:update', description: 'Update reports', createdAt: new Date(), updatedAt: new Date() },
      { name: 'report:delete', description: 'Delete reports', createdAt: new Date(), updatedAt: new Date() }
    ];
    
    return queryInterface.bulkInsert('Permissions', reportPermissions);
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Permissions', {
      name: { [Sequelize.Op.in]: ['report:read', 'report:create', 'report:update', 'report:delete'] }
    });
  }
};

// 3. Use in routes
const reportRoutes = (router) => {
  router.get(
    '/',
    authenticateToken,
    checkPermission(PERMISSIONS.REPORT_READ),
    reportController.getAll
  );
  
  router.post(
    '/',
    authenticateToken,
    checkPermission(PERMISSIONS.REPORT_CREATE),
    reportController.create
  );
  
  // With resource-specific access
  router.put(
    '/:id',
    authenticateToken,
    checkPermission(PERMISSIONS.REPORT_UPDATE, {
      resourceAccessCheck: async (req) => {
        const report = await Report.findByPk(req.params.id);
        return report && report.userId === req.user.id;
      }
    }),
    reportController.update
  );
};
```

## Conclusion

This permissions middleware provides a flexible foundation for implementing role-based access control throughout our API. By combining authentication, role-based permissions, and resource-specific checks, we've created a secure and granular access control system that can be extended to support additional resources and permissions as our application grows.
