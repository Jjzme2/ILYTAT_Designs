# Database Seeding Guide

**Last Updated:** March 10, 2025

## Overview

This guide provides comprehensive information on using Sequelize seeders for database population in the ILYTAT Designs application. Database seeding is crucial for development, testing, and initial production setup.

## Introduction to Sequelize Seeders

Sequelize seeders are JavaScript files that populate your database with test or initial data. They are particularly useful for:

- Creating consistent test environments
- Setting up initial application state
- Populating reference data
- Generating large datasets for performance testing

## Seeder Location and Structure

All seeders are located in the `app/server/src/seeders/` directory. Seeder files follow a timestamp-based naming convention:

```
YYYYMMDDHHMMSS-seed-entity-name.js
```

For example:
- `20250227000001-seed-roles.js`
- `20250227000002-seed-permissions.js`
- `20250227000003-seed-users.js`

## Basic Seeder Structure

A typical seeder file has the following structure:

```javascript
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add seed data
    return queryInterface.bulkInsert('TableName', [
      {
        id: uuidv4(),
        name: 'Example Name',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // More records...
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove seed data
    return queryInterface.bulkDelete('TableName', null, {});
  }
};
```

## Running Seeders

### Basic Commands

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Run a specific seeder
npx sequelize-cli db:seed --seed 20250227000001-seed-roles.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Undo a specific seeder
npx sequelize-cli db:seed:undo --seed 20250227000001-seed-roles.js
```

### NPM Scripts

For convenience, the following npm scripts are available:

```bash
# Run all seeders
npm run db:seed

# Undo all seeders
npm run db:seed:undo
```

## Factory Pattern for Test Data

The application implements a factory pattern for generating test data. This approach provides several benefits:

- Consistent data generation
- Reduced code duplication
- Easy customization of test data
- Support for relationships between entities

### Factory Implementation

The factory pattern is implemented in the `app/server/src/utils/factories/` directory:

```
factories/
├── index.js                # Factory registry
├── userFactory.js          # User factory
├── roleFactory.js          # Role factory
├── permissionFactory.js    # Permission factory
└── orderFactory.js         # Order factory
```

### Basic Factory Usage

```javascript
const { factories } = require('../utils/factories');

// Create a user with default attributes
const user = factories.user.build();

// Create a user with custom attributes
const adminUser = factories.user.build({
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  isActive: true
});

// Create multiple users
const users = factories.user.buildList(10);

// Create related entities
const role = factories.role.build();
const userWithRole = factories.user.build({
  roles: [role]
});
```

## Example: Simple Factory

Here's an example of a simple factory for creating user data:

```javascript
// userFactory.js
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const faker = require('faker');

const userFactory = {
  build: (overrides = {}) => {
    const defaultAttributes = {
      id: uuidv4(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: bcrypt.hashSync('password123', 10),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      ...defaultAttributes,
      ...overrides
    };
  },

  buildList: (count, overrides = {}) => {
    return Array(count).fill().map(() => userFactory.build(overrides));
  }
};

module.exports = userFactory;
```

## Example: Factory with Relationships

Here's an example of a factory that handles relationships:

```javascript
// orderFactory.js
const { v4: uuidv4 } = require('uuid');
const faker = require('faker');
const userFactory = require('./userFactory');

const orderFactory = {
  build: (overrides = {}) => {
    // Create a user if not provided
    const user = overrides.user || userFactory.build();
    
    const defaultAttributes = {
      id: uuidv4(),
      customerId: user.id,
      customerEmail: user.email,
      customerName: `${user.firstName} ${user.lastName}`,
      totalAmount: faker.commerce.price(10, 500),
      currency: 'USD',
      status: 'paid',
      fulfillmentStatus: 'pending',
      shippingAddress: {
        street: faker.address.streetAddress(),
        city: faker.address.city(),
        state: faker.address.stateAbbr(),
        zipCode: faker.address.zipCode(),
        country: 'US'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      ...defaultAttributes,
      ...overrides
    };
  },

  buildList: (count, overrides = {}) => {
    return Array(count).fill().map(() => orderFactory.build(overrides));
  }
};

module.exports = orderFactory;
```

## Example: Using Factories in Seeders

Here's how to use factories in a seeder file:

```javascript
// 20250227000003-seed-users.js
'use strict';
const { factories } = require('../utils/factories');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    const adminUser = factories.user.build({
      email: 'admin@ilytat.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isVerified: true
    });

    // Create regular users
    const regularUsers = factories.user.buildList(10);

    // Combine all users
    const users = [adminUser, ...regularUsers];

    return queryInterface.bulkInsert('Users', users);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
```

## Best Practices

### 1. Seed Order Matters

When seeding related data, ensure that parent entities are seeded before child entities. For example:

1. Seed roles and permissions first
2. Seed users next
3. Seed user-role associations
4. Seed orders and other user-dependent data

### 2. Use Transactions

Wrap seeding operations in transactions to ensure data consistency:

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('TableName', seedData, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
```

### 3. Idempotent Seeders

Make seeders idempotent (can be run multiple times without side effects):

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if data already exists
    const existingRecords = await queryInterface.sequelize.query(
      'SELECT * FROM TableName WHERE name = :name',
      {
        replacements: { name: 'Example Name' },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingRecords.length === 0) {
      // Only insert if no records exist
      return queryInterface.bulkInsert('TableName', seedData);
    }
    
    return Promise.resolve();
  }
};
```

### 4. Environment-Specific Seeding

Create different seeders for different environments:

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const env = process.env.NODE_ENV || 'development';
    
    if (env === 'development') {
      // Seed extensive test data
      return queryInterface.bulkInsert('TableName', devData);
    } else if (env === 'production') {
      // Seed only essential data
      return queryInterface.bulkInsert('TableName', prodData);
    }
    
    return Promise.resolve();
  }
};
```

## Troubleshooting Common Issues

### Foreign Key Constraints

**Issue**: Seeding fails due to foreign key constraints.

**Solution**: Ensure that referenced entities exist before seeding dependent entities. Use the correct order of seeding operations.

### Duplicate Entries

**Issue**: Seeding fails due to unique constraint violations.

**Solution**: Make seeders idempotent by checking for existing records before insertion.

### UUID Generation

**Issue**: UUIDs are not generated correctly.

**Solution**: Ensure that the UUID library is imported and used correctly:

```javascript
const { v4: uuidv4 } = require('uuid');

const seedData = {
  id: uuidv4(),  // Generates a new UUID
  // Other fields...
};
```

## Conclusion

Effective database seeding is crucial for development and testing. By following this guide and using the factory pattern, you can create consistent, maintainable seed data for the ILYTAT Designs application.
