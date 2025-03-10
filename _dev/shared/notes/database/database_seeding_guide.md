# Database Seeding Guide

## Overview

This document explains how to use Sequelize seeders to populate the database with initial or test data in the ILYTAT Designs application. Seeders are essential for maintaining consistent test environments and initializing production systems with required data.

## Seeding Workflow

### Creating a Seeder

To create a new seeder:

```bash
npx sequelize-cli seed:generate --name seed-name
```

This will create a new seeder file in the `app/server/src/seeders` directory with a timestamp prefix.

### Writing Seeders

Seeder files export two functions:
- `up`: Actions to perform when running the seeder
- `down`: Actions to perform when reverting the seeder

Example:

```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // Create admin user
    return queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      email: 'admin@ilytat.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      isVerified: true,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the seeded admin user
    return queryInterface.bulkDelete('Users', {
      email: 'admin@ilytat.com'
    });
  }
};
```

### Running Seeders

To run all seeders:

```bash
npx sequelize-cli db:seed:all
```

To run a specific seeder:

```bash
npx sequelize-cli db:seed --seed 20230520123456-seed-name.js
```

To undo the most recent seeder:

```bash
npx sequelize-cli db:seed:undo
```

To undo a specific seeder:

```bash
npx sequelize-cli db:seed:undo --seed 20230520123456-seed-name.js
```

To undo all seeders:

```bash
npx sequelize-cli db:seed:undo:all
```

## Environment-Specific Seeding

It's often useful to have different seed data for different environments:

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // Create development/test data
      // ...
    } else if (process.env.NODE_ENV === 'production') {
      // Create production initial data
      // ...
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    // Implement appropriate cleanup based on environment
  }
};
```

## Using Factory Patterns for Seeders

For more complex applications, consider using factory patterns to generate seed data:

```javascript
// app/server/src/utils/factories/userFactory.js
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class UserFactory {
  static async createOne(overrides = {}) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(overrides.password || 'Password123!', salt);
    
    return {
      id: uuidv4(),
      email: `user-${Date.now()}@example.com`,
      username: `user-${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      password: hashedPassword,
      isVerified: true,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }
  
  static async createMany(count, overrides = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createOne({
        email: `user-${i}-${Date.now()}@example.com`,
        username: `user-${i}-${Date.now()}`,
        ...overrides
      }));
    }
    return users;
  }
}

module.exports = UserFactory;
```

Then in your seeder:

```javascript
const UserFactory = require('../utils/factories/userFactory');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create 10 regular users
    const users = await UserFactory.createMany(10);
    
    // Create 1 admin user with overrides
    const admin = await UserFactory.createOne({
      email: 'admin@ilytat.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    return queryInterface.bulkInsert('Users', [...users, admin]);
  },
  
  down: async (queryInterface, Sequelize) => {
    // Remove all seeded users
    return queryInterface.bulkDelete('Users', null, {});
  }
};
```

## Best Practices

1. **Idempotent seeders** - Make sure seeders can be run multiple times without creating duplicate data.

2. **Use transactions** - Wrap multiple operations in transactions to ensure data consistency.

3. **Clear dependency order** - Run seeders in the correct order to respect foreign key constraints.

4. **Keep production and test seeders separate** - Use environment checks to run different seed data.

5. **Implement proper clean-up** - Always implement the `down` method to clean up seeded data.

6. **Use factories for complex data** - Use factory patterns to generate complex test data.

7. **Reference constraints** - Be aware of foreign key constraints when deleting data in the `down` method.

## Testing with Seeders

Seeders are particularly useful for setting up test environments:

```javascript
// In your test setup file
before(async function() {
  // Run migrations
  await sequelize.sync({ force: false });
  
  // Run seeders
  await require('../seeders/20230520123456-seed-roles').up(queryInterface, Sequelize);
  await require('../seeders/20230520123457-seed-admin-user').up(queryInterface, Sequelize);
});

after(async function() {
  // Clean up
  await require('../seeders/20230520123457-seed-admin-user').down(queryInterface, Sequelize);
  await require('../seeders/20230520123456-seed-roles').down(queryInterface, Sequelize);
});
```
