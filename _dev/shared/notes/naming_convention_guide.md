# Naming Convention Guide: Using the Name Mapping System

## Introduction

This document covers the naming convention system implemented in ILYTAT Designs to handle the transition between database conventions (snake_case) and application conventions (camelCase). This system addresses inconsistencies in the codebase where both conventions are used interchangeably.

## Background

- **Database Convention**: Uses `snake_case` (e.g., `is_verified`, `first_name`, `user_id`)
- **Application Convention**: Uses `camelCase` (e.g., `isVerified`, `firstName`, `userId`)

## Implementation

Two utility modules have been implemented to handle naming conventions:

1. **nameMapper.js** - Core utility functions for converting names
2. **modelTransformer.js** - Integration with Express and Sequelize

### Core Functions

#### `nameMapper.js`

```javascript
// Convert string from snake_case to camelCase
const userField = nameMapper.snakeToCamel('is_verified'); // returns 'isVerified'

// Convert string from camelCase to snake_case
const dbField = nameMapper.camelToSnake('lastLogin'); // returns 'last_login'

// Convert an entire object's keys from snake_case to camelCase
const camelCaseUser = nameMapper.objectSnakeToCamel(userFromDatabase);

// Convert an entire object's keys from camelCase to snake_case
const snakeCaseData = nameMapper.objectCamelToSnake(requestData);

// Use predefined mappings for common fields
const camelField = nameMapper.mapField('first_name', true); // returns 'firstName'
const snakeField = nameMapper.mapField('isActive', false); // returns 'is_active'
```

#### `modelTransformer.js`

```javascript
// Transform a Sequelize model to camelCase object
const userForApi = modelTransformer.toCamelCase(userModel);

// Transform a camelCase object to snake_case for database
const dataForDatabase = modelTransformer.toSnakeCase(requestBody);

// Apply to Express routes
app.use(modelTransformer.transformResponseMiddleware); // Transform responses to camelCase
app.use(modelTransformer.transformRequestMiddleware); // Transform requests to snake_case

// Apply to Sequelize models
modelTransformer.sequelizeHooks.addToModel(User);
// Now you can use: const camelUser = user.toCamelCase();
```

## Usage Guidelines

### When to Use Each Convention

1. **Database Interactions (snake_case)**
   - Database schema definitions
   - Sequelize model definitions
   - Raw SQL queries
   - Database migrations and seeders

2. **Application Code (camelCase)**
   - Vue components and templates
   - JavaScript business logic
   - Controller logic
   - API responses
   - Client-side state management

### Integration Points

To maintain consistency across the application, use the utilities at these key integration points:

1. **API Controllers**
   - Use `transformResponseMiddleware` to ensure all API responses use camelCase
   - Use `transformRequestMiddleware` to convert incoming request data to snake_case

2. **Sequelize Models**
   - Add the transformation hooks to all models
   - Use the `.toCamelCase()` instance method when preparing data for API responses

3. **Vue Components**
   - Always use camelCase in Vue component properties
   - Forms should use camelCase for field names that match database fields

## Common Issues and Solutions

### Handling Edge Cases

Some fields might have special transformation requirements. Add these to the `fieldMappings` object in `nameMapper.js`:

```javascript
const fieldMappings = {
  // Add special case mappings here
  special_field_name: 'specialFieldNameCustomized'
};
```

### Deep Objects and Arrays

The utilities handle nested objects and arrays automatically, transforming all levels of nesting.

### Performance Considerations

For large objects or high-frequency operations, consider:
- Caching transformed results
- Only transforming necessary fields
- Performing transformations in background tasks when possible

## Best Practices

1. **Consistency**: Always use camelCase in JavaScript/Vue and snake_case in database definitions
2. **No Direct Mixing**: Never mix conventions within a single component or function
3. **Use The Utilities**: Don't manually convert between conventions
4. **Documentation**: Comment code that requires special naming convention handling
5. **Testing**: Include tests for both conventions when testing data processing functions

## Maintenance

When adding new models or fields:

1. Update the `fieldMappings` object in `nameMapper.js` with any special case mappings
2. Ensure new Sequelize models have `underscored: true` to maintain snake_case in the database
3. Apply the transformation hooks to new models

## Further Reading

- [Sequelize Documentation on Naming Strategies](https://sequelize.org/docs/v6/core-concepts/model-basics/#naming-strategy)
- [JavaScript Naming Conventions](https://www.robinwieruch.de/javascript-naming-conventions/)
- [SQL Naming Conventions](https://www.sqlshack.com/learn-sql-naming-conventions/)
