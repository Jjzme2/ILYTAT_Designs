# API Route Standardization Guide

## Overview

This document outlines the standardized approach for creating and structuring API routes in the ILYTAT Designs application. Following these standards ensures consistency, maintainability, and clarity across the codebase.

## Route File Structure

Every API route file should follow this standardized pattern:

```javascript
/**
 * Module description
 * @module routes/api/[route-name]
 */

// Import controllers and middleware
const SomeController = require('../../controllers/someController');
const { authenticateToken, authorize } = require('../../middleware/auth');

/**
 * Route definitions
 * Centralized path constants for maintainability
 */
const ROUTES = {
  GET_ALL: '/',
  GET_BY_ID: '/:id',
  CREATE: '/',
  UPDATE: '/:id',
  DELETE: '/:id',
  // Define additional route paths as needed
};

/**
 * Register routes
 * @param {Express.Router} router - Express router instance
 */
const someRoutes = (router) => {
  // Public routes
  router.get(
    ROUTES.GET_ALL,
    SomeController.getAll
  );

  // Protected routes
  router.get(
    ROUTES.GET_BY_ID,
    authenticateToken,
    SomeController.getById
  );

  router.post(
    ROUTES.CREATE,
    authenticateToken,
    authorize(['admin']),
    SomeController.create
  );

  router.put(
    ROUTES.UPDATE,
    authenticateToken,
    authorize(['admin']),
    SomeController.update
  );

  router.delete(
    ROUTES.DELETE,
    authenticateToken,
    authorize(['admin']),
    SomeController.delete
  );
};

module.exports = someRoutes;
```

## Key Components

### 1. JSDoc Comments

Each route file should include proper documentation:
- Module description at the top
- Description of the exported function
- Description of route constants

### 2. ROUTES Constant

Define all route paths in a centralized `ROUTES` constant object:
- Makes it easy to see all available routes
- Ensures consistency in route naming
- Simplifies updates to route paths

### 3. Function-Based Export

Export a function that accepts an Express router instance:
- Promotes modularity and reusability
- Allows for better testing
- Avoids side effects from immediate route registration

### 4. Route Organization

Group routes logically:
- Public vs. protected routes
- By resource type or function
- With appropriate middleware in a consistent order

## Registering Routes

In the main `routes/api/index.js` file, register routes using this pattern:

```javascript
// Create a dedicated router for each route module
const someRouter = express.Router();
someRoutes(someRouter);
router.use('/some-resource', someRouter);
```

## Middleware Usage

Standardized middleware application:
1. `authenticateToken`: Used for routes requiring authentication
2. `authorize(['role1', 'role2'])`: Used for role-based access control
3. Custom middleware should be applied consistently across similar routes

## Controllers

Route handlers should be organized in controller files:
- Each route file should have a corresponding controller
- Business logic should be separated from route definitions
- Controllers should follow a consistent naming convention

## Error Handling

Consistent error handling approach:
- Use try/catch blocks in controllers
- Return standardized error responses
- Log errors appropriately

## Examples

Refer to these model implementations:
- `routes/api/auth.js`
- `routes/api/users.js`
- `routes/api/roles.js`

## Troubleshooting

If a route is not working as expected:
1. Verify that the route is registered in `routes/api/index.js`
2. Check that the path in the ROUTES constant is correct
3. Ensure all middleware is properly configured
4. Confirm that the controller function exists and is exported correctly

## Client-Side Integration

When working with these routes on the client side:
1. Use the full path starting with `/api/`
2. Follow the same naming conventions
3. Handle errors consistently

## Maintenance

When adding new routes:
1. Follow this standardization pattern
2. Update this document if new patterns emerge
3. Ensure all team members are aware of any changes to the standards
