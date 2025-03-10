# Database Migration Guide

## Overview

This document explains how to work with Sequelize migrations in the ILYTAT Designs application. Database migrations allow us to track and apply changes to the database schema in a consistent way across all environments.

## Migration Workflow

### Creating a Migration

To create a new migration:

```bash
npx sequelize-cli migration:generate --name migration-name
```

This will create a new migration file in the `app/server/src/migrations` directory with a timestamp prefix.

### Writing Migrations

Migration files export two functions:
- `up`: Actions to perform when applying the migration
- `down`: Actions to perform when reverting the migration

Example:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      // ... other fields
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};
```

### Running Migrations

To apply all pending migrations:

```bash
npx sequelize-cli db:migrate
```

To revert the most recent migration:

```bash
npx sequelize-cli db:migrate:undo
```

To revert all migrations:

```bash
npx sequelize-cli db:migrate:undo:all
```

## Best Practices

1. **Always test migrations** - Test both up and down migrations in a development environment before applying them to production.

2. **Keep migrations small and focused** - Each migration should make a small, focused change to the database. This makes troubleshooting easier.

3. **Ensure reversibility** - Always implement the `down` method to properly revert changes made in the `up` method.

4. **Avoid destructive changes** - Be careful with operations like dropping columns or tables, and ensure you're not losing data.

5. **Run migrations during maintenance windows** - For production, schedule migrations during maintenance windows to minimize impact.

6. **Version control migrations** - Always commit migration files to version control.

7. **Document complex migrations** - Add comments to explain any complex or unusual changes in your migration file.

## Common Patterns

### Adding a Column

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Users', 'newColumn', {
    type: Sequelize.STRING,
    allowNull: true
  });
},

down: async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('Users', 'newColumn');
}
```

### Modifying a Column

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('Users', 'existingColumn', {
    type: Sequelize.STRING(100),
    allowNull: false,
    defaultValue: 'default value'
  });
},

down: async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('Users', 'existingColumn', {
    type: Sequelize.STRING(50),
    allowNull: true,
    defaultValue: null
  });
}
```

### Adding an Index

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.addIndex('Users', ['email', 'username']);
},

down: async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('Users', ['email', 'username']);
}
```

## Troubleshooting

1. **Migration fails to apply**: Check for syntax errors, ensure dependencies exist (e.g., tables, columns).

2. **Migration conflicts**: If multiple developers create migrations with conflicting changes, resolve conflicts by creating a new migration.

3. **Migration history issues**: If the migration history in the SequelizeMeta table is out of sync, you may need to manually fix the table.
