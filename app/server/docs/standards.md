# ILYTAT Designs API Routing Standards

## Route Structure Standards

To maintain consistency across the API and improve code maintainability, we've established the following standards for defining route files.

### Route File Pattern

All route files should follow this standardized pattern:

1. **Export a Function That Accepts a Router**
   - Route files should export a function that takes an Express router as a parameter
   - This function registers all routes on the provided router
   - Example: `module.exports = (router) => { /* register routes */ };`

2. **Define Route Paths as Constants**
   - All route paths should be defined in a `ROUTES` object
   - Use descriptive names for routes in UPPERCASE
   - Example:
     ```javascript
     const ROUTES = {
       ALL: '/',
       BY_ID: '/:id',
       CUSTOM_ACTION: '/custom-action'
     };
     ```

3. **Separate Concerns**
   - Route files should only define routes and middleware
   - Business logic should be delegated to controllers
   - Controllers should follow the BaseController pattern when possible

4. **Document Routes With JSDoc**
   - Use JSDoc comments to document each route's purpose and access level
   - Example:
     ```javascript
     /**
      * @route POST /api/auth/login
      * @desc Authenticate user & get token
      * @access Public
      */
     ```

### Example Route File

```javascript
// routes/api/example.js
const ExampleController = require('../../controllers/ExampleController');
const { authenticateToken } = require('../../middleware/auth');
const { validateExample } = require('../../middleware/validation');

const ROUTES = {
  ALL: '/',
  BY_ID: '/:id',
  CUSTOM_ACTION: '/custom-action'
};

const exampleRoutes = (router) => {
  // Apply middleware if needed
  router.use(authenticateToken);

  // Define routes
  router.get(ROUTES.ALL, ExampleController.getAll);
  router.get(ROUTES.BY_ID, ExampleController.getById);
  router.post(ROUTES.ALL, validateExample, ExampleController.create);
  router.put(ROUTES.BY_ID, validateExample, ExampleController.update);
  router.delete(ROUTES.BY_ID, ExampleController.delete);
  router.post(ROUTES.CUSTOM_ACTION, ExampleController.customAction);
};

module.exports = exampleRoutes;
```

### Registering Routes in index.js

When registering routes in the main index.js file, create a new router instance for each route file:

```javascript
const express = require('express');
const router = express.Router();
const exampleRoutes = require('./example');

// Create router and apply routes
const exampleRouter = express.Router();
exampleRoutes(exampleRouter);
router.use('/example', exampleRouter);

module.exports = router;
```

## Controllers

Controllers should:

1. Follow the inheritance pattern, extending BaseController when possible
2. Use consistent logging patterns
3. Use standardized response formats
4. Handle errors with try/catch and pass to the error middleware

## Benefits of This Approach

This standardized pattern:

- Improves code readability and maintainability
- Ensures consistency across the codebase
- Makes it easier for new developers to understand the API structure
- Facilitates testing by clearly separating concerns
- Promotes code reuse through consistent patterns

## Route File Standardization Tracking

### ✅ Completed
1. ✅ auth.js - Converted to functional pattern with ROUTES object
2. ✅ users.js - Converted to functional pattern with ROUTES object 
3. ✅ payments.js - Converted to functional pattern with ROUTES object
4. ✅ index.js - Updated to support functional route pattern

### 🔄 Pending
1. 🔄 roles.js - Needs conversion to functional pattern
2. 🔄 documentations.js - Needs conversion to functional pattern
3. 🔄 printify.js - Needs conversion to functional pattern
4. 🔄 debug.js - Needs conversion to functional pattern
5. 🔄 contact.js - Needs conversion to functional pattern
6. 🔄 audit.js - Needs conversion to functional pattern
