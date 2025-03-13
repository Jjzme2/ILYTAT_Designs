---
title: Database Seeding Guide
createdAt: 2025-03-13
updatedAt: 2025-03-13
category: developer_docs
isPublic: true
author: ILYTAT Development Team
---

# Database Seeding Guide

## Overview

This guide explains how to effectively use Sequelize seeders to populate your database with initial or test data for the ILYTAT Designs application.

## Basic Concepts

Seeders are special files that contain code to populate database tables with data. They are typically used for:

1. Creating initial required data for the application to function
2. Setting up test data for development or testing environments
3. Populating reference/lookup tables with standard values

## Seeder Structure

A typical seeder file follows this structure:

```javascript
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Code to insert data
    await queryInterface.bulkInsert('table_name', [
      {
        id: uuidv4(),
        name: 'Example Item',
        description: 'This is an example',
        created_at: new Date(),
        updated_at: new Date()
      },
      // More items...
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Code to remove the data
    await queryInterface.bulkDelete('table_name', null, {});
  }
};
```

## Creating Seeders

To create a new seeder, use the Sequelize CLI:

```bash
npx sequelize-cli seed:generate --name seed-name
```

This will create a new file in the `seeders` directory.

## Running Seeders

To run all seeders:

```bash
npx sequelize-cli db:seed:all
```

To run a specific seeder:

```bash
npx sequelize-cli db:seed --seed name-of-seed-file
```

To undo the most recent seeder:

```bash
npx sequelize-cli db:seed:undo
```

To undo all seeders:

```bash
npx sequelize-cli db:seed:undo:all
```

## Best Practices

1. **Use UUIDs** for primary keys in seed data to ensure consistency across environments
2. **Set timestamps** consistently for all records in a single seeder run
3. **Handle relationships** by creating parent records before child records
4. **Make seeders idempotent** when possible (able to be run multiple times without creating duplicate data)
5. **Include comprehensive down methods** to properly clean up seeded data

## Using Factory Patterns for Test Data

For generating large amounts of test data, consider using factory patterns:

```javascript
// Example factory function
function createUserFactory(overrides = {}) {
  return {
    id: uuidv4(),
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

// In your seeder
const users = Array(50).fill().map((_, index) => 
  createUserFactory({ username: `test_user_${index}` })
);
await queryInterface.bulkInsert('users', users);
```

For more details on implementing factory patterns, see our [Factory Pattern Guide](./patterns/factory_pattern.md).

## Handling Production Data

For production environments, consider:

1. Only seeding essential reference data
2. Using environment variables to control which seeders run
3. Creating separate seeders for development vs. production data

## Seeder Organization

Organize seeders by module and dependency order:

1. Independent tables first (roles, permissions, etc.)
2. Dependent tables next (users, products, etc.)
3. Join tables last (user_roles, product_categories, etc.)

Use a numbering convention in filenames to ensure proper execution order:

```
20250301001000-roles.js
20250301002000-permissions.js
20250301003000-role-permissions.js
```

## Troubleshooting Common Issues

- **Foreign key constraints**: Ensure parent records exist before creating child records
- **Unique constraints**: Check for duplicate values in unique columns
- **Missing columns**: Verify that all required columns have values provided
- **Data type mismatches**: Ensure provided values match column data types

## Additional Resources

- [Sequelize Documentation on Seeders](https://sequelize.org/master/manual/migrations.html#creating-first-seed)
- [Our Dependency Injection Guide](./dependency_injection.md) for testing with seeded data
- [Our Testing Guidelines](./testing_guidelines.md) for using seed data in tests
