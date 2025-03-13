---
title: Database Naming Convention Standards
createdAt: 2025-03-13
updatedAt: 2025-03-13
category: developer_docs
isPublic: true
author: ILYTAT Development Team
---

# Database Naming Convention Standards

## Overview

This document outlines the standard naming conventions for database tables, columns, and relationships in the ILYTAT Designs application. Consistent naming enhances readability, simplifies maintenance, and reduces errors in database operations.

## Table Names

- **Use snake_case**: All table names should be in snake_case (lowercase with words separated by underscores)
- **Use plural form**: Table names should be plural to represent collections (e.g., `users`, `products`, `orders`)
- **Examples**: 
  - ✅ `users`
  - ✅ `order_items`
  - ✅ `product_categories`
  - ❌ `User`
  - ❌ `OrderItem`
  - ❌ `productCategory`

## Column Names

- **Use snake_case**: All column names should be in snake_case
- **Be descriptive**: Names should clearly indicate the data they contain
- **Primary keys**: Should typically be named `id`
- **Foreign keys**: Should follow the pattern `[singular_table_name]_id` (e.g., `user_id`, `product_id`)
- **Boolean columns**: Should start with `is_`, `has_`, or similar prefixes (e.g., `is_active`, `has_subscription`)
- **Timestamps**: Standard timestamp columns should be named `created_at`, `updated_at`, and `deleted_at`
- **Examples**:
  - ✅ `first_name`
  - ✅ `is_active`
  - ✅ `created_at`
  - ❌ `firstName`
  - ❌ `isActive`
  - ❌ `createdAt`

## Join Tables

- **Use snake_case**: Join table names should be in snake_case
- **Naming pattern**: `[table1_singular]_[table2_singular]s` in alphabetical order when possible
- **Examples**:
  - ✅ `role_permissions` (for a many-to-many between roles and permissions)
  - ✅ `product_tags` (for a many-to-many between products and tags)
  - ❌ `RolePermissions`
  - ❌ `ProductTag`

## Sequelize Model Configuration

For all Sequelize models, the following configuration should be applied:

```javascript
{
  sequelize,
  modelName: 'ModelNameInPascalCase', // This is for JavaScript reference
  tableName: 'table_name_in_snake_case', // This is the actual DB table name
  underscored: true, // This ensures columns use snake_case
  timestamps: true, // Include created_at, updated_at timestamps
  paranoid: true, // Include deleted_at for soft deletes (where applicable)
}
```

## Implementation Steps

When implementing these standards in an existing database:

1. Create migrations to rename tables and columns to follow these conventions
2. Update Sequelize model definitions to use `underscored: true` and specify `tableName` in snake_case
3. Update all queries and references in the application code
4. Test thoroughly to ensure all functionality works with the new naming convention

## Examples

### Before

```javascript
class Role extends Model {
  static associate(models) {
    this.belongsToMany(models.User, {
      through: 'UserRoles',
      foreignKey: 'roleId'
    });
  }
}

Role.init({
  id: { /* ... */ },
  name: { /* ... */ },
  isActive: { /* ... */ },
  createdAt: { /* ... */ },
}, {
  sequelize,
  modelName: 'Role',
  underscored: false
});
```

### After

```javascript
class Role extends Model {
  static associate(models) {
    this.belongsToMany(models.User, {
      through: 'user_roles',
      foreignKey: 'role_id'
    });
  }
}

Role.init({
  id: { /* ... */ },
  name: { /* ... */ },
  is_active: { /* ... */ },
  created_at: { /* ... */ },
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'roles',
  underscored: true
});
```
