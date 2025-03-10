# Database Management Guide

## Overview

This guide outlines the best practices for database management in the ILYTAT Designs application, focusing on initialization, migrations, and schema changes.

## Database Initialization Process

The application now follows these steps during server startup:

1. **Connection Testing**: Verifies database connectivity
2. **Migrations**: Applies pending migrations to update the schema
3. **Seeders** (optional): Populates development databases with test data when explicitly enabled

## Best Practices

### Using Migrations Instead of Sync

We've moved away from using `sequelize.sync()` for several important reasons:

#### Problems with `sequelize.sync()`

1. **Data Loss Risk**: Using `{ force: true }` drops tables and recreates them, potentially causing data loss
2. **Schema Conflicts**: Using `{ alter: true }` can cause unpredictable schema changes when model definitions don't match the database exactly
3. **Performance Issues**: Sync operations analyze the entire schema on every startup, which is inefficient
4. **No Version Control**: Sync changes aren't tracked in version control, making it difficult to audit schema changes
5. **No Rollback Support**: Unlike migrations, sync operations can't be rolled back if something goes wrong

#### Benefits of Migrations

1. **Version Controlled**: Migrations are tracked in source control
2. **Incremental Changes**: Each migration represents a specific change to the schema
3. **Bidirectional**: Migrations support both up (apply) and down (revert) operations
4. **Environment Consistency**: The same migrations run in all environments
5. **Better Performance**: Only pending migrations are applied, not a full schema analysis
6. **Data Preservation**: Migrations are designed to preserve data during schema changes

### Creating Migrations

To create a new migration:

```bash
npx sequelize-cli migration:generate --name add-column-to-users
```

Migration template:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Code to apply the migration
    await queryInterface.addColumn('Users', 'newColumn', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Code to revert the migration
    await queryInterface.removeColumn('Users', 'newColumn');
  }
};
```

### Using Seeders

Seeders are used to populate the database with initial or test data. They should only run in development environments and only when explicitly enabled.

To create a seeder:

```bash
npx sequelize-cli seed:generate --name demo-users
```

To enable seeders during development:

```
SEED_DB=true npm run dev
```

## Environment-Specific Behavior

| Environment | Migrations | Seeders | Sync |
|-------------|------------|---------|------|
| Development | ✅ Always | ✅ When SEED_DB=true | ❌ Never |
| Test        | ✅ Always | ❌ Never | ❌ Never |
| Production  | ✅ Always | ❌ Never | ❌ Never |

## Database Schema Changes Workflow

Follow this workflow when making changes to the database schema:

1. **Update Models**: Modify the Sequelize model files to reflect the desired changes
2. **Create Migration**: Generate a migration file that implements the same changes
3. **Test Migration**: Run the migration in a development environment and verify it works correctly
4. **Commit Changes**: Commit both the model and migration changes to version control
5. **Deploy**: When deployed, the application will automatically run pending migrations

## Troubleshooting

### Migration Failed

If a migration fails:

1. Check the error message in the logs
2. Fix the issue in the migration file
3. If the migration was partially applied, you may need to manually fix the database or use the down migration

### Database Out of Sync with Models

If you notice discrepancies between your models and the database schema:

1. **DO NOT** use `sequelize.sync()` to fix it
2. Create a new migration that makes the necessary changes to align the database with the models

## Security Considerations

- Migrations should validate inputs and sanitize data
- Avoid using raw SQL queries in migrations when possible
- Be careful with migrations that modify sensitive data

## Performance Considerations

- Large migrations should be broken down into smaller, focused migrations
- Consider the impact of migrations on production databases with large datasets
- For very large tables, consider using batched operations in migrations

## Conclusion

By following these best practices, we ensure that our database schema changes are:

- Tracked in version control
- Applied consistently across environments
- Safe for production deployments
- Reversible if issues arise

This approach aligns with industry standards for database schema management in production applications.
