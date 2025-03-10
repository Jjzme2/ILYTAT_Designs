# Database Sync Guide

This guide explains how to use the database synchronization features in the ILYTAT Designs application.

## Automatic Daily Sync

The application is configured to automatically sync the database schema with the defined models once per day. This happens on the first server start of each day.

### How It Works

1. When the server starts, it checks if it's a new day by comparing the current date with the last recorded sync date
2. If it's a new day, the database models are synchronized automatically
3. The sync date is recorded in `logs/last_sync_date.txt`

This approach ensures that:
- Database schema stays up-to-date with model changes
- Performance is optimized by not syncing on every server restart
- New deployments with schema changes are automatically applied

## Manual Database Sync

There are situations where you might need to manually sync the database, such as:
- During development when you've made model changes and need to test them
- After a deployment with significant schema changes
- When troubleshooting database issues

### Using the Sync Script

We've created a utility script to manually sync the database:

```bash
# Navigate to the server directory
cd app/server

# Run the sync script (normal mode - preserves data)
node src/scripts/syncDatabase.js

# Run with force mode (CAUTION: Drops all tables and recreates them)
node src/scripts/syncDatabase.js --force
```

### Force Mode Warning

The `--force` option will drop all tables and recreate them, which means **all data will be lost**. Only use this in development or when you're absolutely sure it's necessary.

When using force mode, you'll be prompted to confirm by typing "YES" to proceed.

## Programmatic Sync

If you need to trigger a sync from within your code, you can use the database service directly:

```javascript
const database = require('../services/database');

// Connect and sync
await database.connect(true); // Pass true to force sync

// Or use sequelize directly for more control
const { sequelize } = require('../services/database');
await sequelize.sync({ force: false }); // Set to true to drop tables
```

## Best Practices

1. **Development**: Use manual sync as needed during development
2. **Testing**: Set up test databases with force sync before running tests
3. **Production**: Rely on the automatic daily sync for normal operations
4. **Migrations**: For complex schema changes, consider using Sequelize migrations instead of sync

## Troubleshooting

If you encounter sync issues:

1. Check the logs for specific error messages
2. Verify database connection settings in your `.env` file
3. Ensure your models are properly defined
4. For complex changes, consider using migrations instead of sync

Remember that database sync is primarily a development tool. In production environments with valuable data, migrations are generally the safer approach for schema changes.
