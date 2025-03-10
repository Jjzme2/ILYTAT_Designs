# Database Management

This directory contains the database configuration and migration management for the ILYTAT Designs application.

## Structure

- `index.js` - Main database initialization and configuration
- `migrations/` - Database migrations
- `models/` - Sequelize models

## Migrations

Migrations are used to manage database schema changes in a safe and version-controlled way. Each migration file contains both the changes to apply (`up`) and how to reverse them (`down`).

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Undo the last migration
npm run rollback

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

### Creating New Migrations

```bash
npx sequelize-cli migration:generate --name your-migration-name
```

### Migration Naming Convention

Migrations are timestamped and named descriptively:
- `YYYYMMDDHHMMSS-action-description.js`
Example: `20250228135213-add-timestamps.js`

## Models

Models are defined using Sequelize and follow these conventions:
- Use UUID for primary keys
- Include timestamps (`createdAt`, `updatedAt`, `deletedAt`)
- Use soft deletes where appropriate
- Follow consistent naming (snake_case for database, camelCase for JS)

### Model Configuration

All models include:
- Proper timestamp handling
- Soft delete capability
- Appropriate indexes
- Validation rules
- Clear associations

## Best Practices

1. **Always use migrations** for schema changes
   - Never modify the database schema directly
   - Document all changes in migration files
   - Include both up and down migrations

2. **Transaction Safety**
   - Wrap related changes in transactions
   - Ensure rollback capability
   - Handle errors appropriately

3. **Data Integrity**
   - Use appropriate constraints
   - Add indexes for frequently queried fields
   - Validate data at the model level

4. **Performance**
   - Monitor query performance
   - Use appropriate field types
   - Index strategically

5. **Security**
   - Never store sensitive data in plaintext
   - Use environment variables for credentials
   - Implement proper access controls

## Environment Configuration

The database configuration is managed through environment variables:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
```

## Troubleshooting

If you encounter migration issues:

1. Check the SequelizeMeta table
   ```sql
   SELECT * FROM SequelizeMeta ORDER BY name;
   ```

2. Verify environment variables
   ```bash
   echo $DB_NAME
   ```

3. Check database connectivity
   ```bash
   npm run db:check
   ```

4. Common Issues:
   - Timestamp conflicts: Ensure proper timezone settings
   - Foreign key constraints: Use proper migration order
   - Connection issues: Verify credentials and permissions
