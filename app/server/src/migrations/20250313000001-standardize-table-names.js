'use strict';

/**
 * Migration to standardize database table and column names to snake_case
 * This migration ensures consistent naming across the entire database
 * It renames tables from PascalCase or camelCase to snake_case format
 * 
 * @module migrations/standardize-table-names
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename tables to follow snake_case convention
    
    // First, check if the tables exist in their current form
    // For MySQL/MariaDB, we query the information schema
    
    try {
      // Get current tables in the database
      const tables = await queryInterface.sequelize.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :schema",
        {
          replacements: { schema: queryInterface.sequelize.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      // tables is already an array of objects with TABLE_NAME property
      const tableNames = tables.map(table => table.TABLE_NAME);
      
      // Set up mapping of current table names to new snake_case table names
      const tableRenameMap = {
        // Main tables
        'Roles': 'roles',
        'Permissions': 'permissions',
        'UserRoles': 'user_roles',
        'RolePermissions': 'role_permissions', 
        'Users': 'users',
        'Sessions': 'sessions',
        'Documentations': 'documentations',
        'Orders': 'orders',
        'OrderItems': 'order_items',
        'FeaturedProducts': 'featured_products',
        'PrintifyCaches': 'printify_caches',
        'Audits': 'audits'
      };
      
      // Perform the renames for tables that actually exist
      for (const [oldName, newName] of Object.entries(tableRenameMap)) {
        if (tableNames.includes(oldName) && oldName !== newName) {
          console.log(`Renaming table ${oldName} to ${newName}`);
          await queryInterface.renameTable(oldName, newName);
        } else if (tableNames.includes(oldName.toLowerCase()) && oldName.toLowerCase() !== newName) {
          // Handle case where table name might be stored lowercase in MySQL on case-insensitive filesystem
          console.log(`Renaming table ${oldName.toLowerCase()} to ${newName}`);
          await queryInterface.renameTable(oldName.toLowerCase(), newName);
        }
      }
      
      // Now update column names to use snake_case
      console.log('Renaming columns to use snake_case convention...');

      // Column rename mappings for each table
      const columnRenames = {
        'users': {
          'firstName': 'first_name',
          'lastName': 'last_name',
          'isActive': 'is_active',
          'isVerified': 'is_verified',
          'verificationToken': 'verification_token',
          'verificationExpires': 'verification_expires',
          'lastLogin': 'last_login',
          'resetPasswordToken': 'reset_password_token',
          'resetPasswordExpires': 'reset_password_expires',
          'loginAttempts': 'login_attempts',
          'lockUntil': 'lock_until',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'roles': {
          'roleId': 'role_id',
          'isActive': 'is_active',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at',
          'deletedAt': 'deleted_at'
        },
        'permissions': {
          'isActive': 'is_active',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'user_roles': {
          'userId': 'user_id',
          'roleId': 'role_id',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'role_permissions': {
          'roleId': 'role_id',
          'permissionId': 'permission_id',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'sessions': {
          'userId': 'user_id',
          'expiresAt': 'expires_at',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'documentations': {
          'roleId': 'role_id',
          'filePath': 'file_path',
          'isActive': 'is_active',
          'isPublic': 'is_public',
          'createdBy': 'created_by',
          'updatedBy': 'updated_by',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'orders': {
          'userId': 'user_id',
          'orderDate': 'order_date',
          'shippingAddress': 'shipping_address',
          'billingAddress': 'billing_address',
          'paymentStatus': 'payment_status',
          'orderStatus': 'order_status',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'order_items': {
          'orderId': 'order_id',
          'productId': 'product_id',
          'unitPrice': 'unit_price',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'featured_products': {
          'printifyProductId': 'printify_product_id',
          'isFeatured': 'is_featured',
          'isBestSeller': 'is_best_seller',
          'displayOrder': 'display_order',
          'createdBy': 'created_by',
          'updatedBy': 'updated_by',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'printify_caches': {
          'cacheKey': 'cache_key',
          'expiresAt': 'expires_at',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        },
        'audits': {
          'userId': 'user_id',
          'entityType': 'entity_type',
          'entityId': 'entity_id',
          'actionType': 'action_type',
          'createdAt': 'created_at',
          'updatedAt': 'updated_at'
        }
      };

      // Execute column renames for each table
      for (const [tableName, columns] of Object.entries(columnRenames)) {
        if (tableNames.includes(tableName)) {
          for (const [oldColumn, newColumn] of Object.entries(columns)) {
            // Check if the column exists before attempting to rename it
            try {
              const [tableInfo] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM ${tableName} LIKE '${oldColumn}'`,
                { type: Sequelize.QueryTypes.SELECT }
              );
              
              if (tableInfo) {
                console.log(`Renaming column ${tableName}.${oldColumn} to ${newColumn}`);
                await queryInterface.renameColumn(tableName, oldColumn, newColumn);
              }
            } catch (err) {
              console.log(`Column ${oldColumn} might not exist in table ${tableName} or may already be renamed: ${err.message}`);
              // Continue with other columns/tables
            }
          }
        }
      }
      
      // Now update foreign key constraints to use snake_case column names
      // We'll handle this for each specific table that needs changing
      
      // Example for user_roles table (if it exists)
      if (tableNames.includes('UserRoles') || tableNames.includes('user_roles')) {
        // First, get existing constraint names
        const [constraints] = await queryInterface.sequelize.query(
          `SHOW CREATE TABLE ${queryInterface.sequelize.config.database}.user_roles`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        
        // Extract constraint statements from the table creation SQL
        const createTableSql = constraints['Create Table'];
        const constraintLines = createTableSql.split('\n').filter(line => 
          line.includes('CONSTRAINT') && (line.includes('FOREIGN KEY') || line.includes('PRIMARY KEY'))
        );
        
        // Handle each constraint (this is a simplification, actual implementation would need to extract and parse constraints)
        // For MySQL, you'd typically drop and recreate the constraints
        
        // Example (not executed here as it's complex and specific to each DB schema):
        // 1. Drop existing FK constraints
        // 2. Rename columns (e.g., roleId to role_id)
        // 3. Recreate FK constraints
      }
      
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse the changes (rename tables and columns back to original names)
    // This is important for being able to roll back the migration if needed
    
    try {
      // Get current tables in the database
      const tables = await queryInterface.sequelize.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :schema",
        {
          replacements: { schema: queryInterface.sequelize.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      // tables is already an array of objects with TABLE_NAME property
      const tableNames = tables.map(table => table.TABLE_NAME);
      
      // First revert column names back to camelCase
      console.log('Reverting columns back to camelCase...');
      
      // Column rename mappings for each table (reversed from the up migration)
      const columnRenames = {
        'users': {
          'first_name': 'firstName',
          'last_name': 'lastName',
          'is_active': 'isActive',
          'is_verified': 'isVerified',
          'verification_token': 'verificationToken',
          'verification_expires': 'verificationExpires',
          'last_login': 'lastLogin',
          'reset_password_token': 'resetPasswordToken',
          'reset_password_expires': 'resetPasswordExpires',
          'login_attempts': 'loginAttempts',
          'lock_until': 'lockUntil',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'roles': {
          'role_id': 'roleId',
          'is_active': 'isActive',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt',
          'deleted_at': 'deletedAt'
        },
        'permissions': {
          'is_active': 'isActive',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'user_roles': {
          'user_id': 'userId',
          'role_id': 'roleId',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'role_permissions': {
          'role_id': 'roleId',
          'permission_id': 'permissionId',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'sessions': {
          'user_id': 'userId',
          'expires_at': 'expiresAt',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'documentations': {
          'role_id': 'roleId',
          'file_path': 'filePath',
          'is_active': 'isActive',
          'is_public': 'isPublic',
          'created_by': 'createdBy',
          'updated_by': 'updatedBy',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'orders': {
          'user_id': 'userId',
          'order_date': 'orderDate',
          'shipping_address': 'shippingAddress',
          'billing_address': 'billingAddress',
          'payment_status': 'paymentStatus',
          'order_status': 'orderStatus',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'order_items': {
          'order_id': 'orderId',
          'product_id': 'productId',
          'unit_price': 'unitPrice',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'featured_products': {
          'printify_product_id': 'printifyProductId',
          'is_featured': 'isFeatured',
          'is_best_seller': 'isBestSeller',
          'display_order': 'displayOrder',
          'created_by': 'createdBy',
          'updated_by': 'updatedBy',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        'printify_caches': {
          'cache_key': 'cacheKey',
          'expires_at': 'expiresAt',
          'created_at': 'createdAt',
          'updated_at': 'updated_at'
        },
        'audits': {
          'user_id': 'userId',
          'entity_type': 'entityType',
          'entity_id': 'entityId',
          'action_type': 'actionType',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        }
      };
      
      // Execute column renames (reversals) for each table
      for (const [tableName, columns] of Object.entries(columnRenames)) {
        if (tableNames.includes(tableName)) {
          for (const [newColumn, oldColumn] of Object.entries(columns)) {
            try {
              const [tableInfo] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM ${tableName} LIKE '${newColumn}'`,
                { type: Sequelize.QueryTypes.SELECT }
              );
              
              if (tableInfo) {
                console.log(`Reverting: renaming column ${tableName}.${newColumn} back to ${oldColumn}`);
                await queryInterface.renameColumn(tableName, newColumn, oldColumn);
              }
            } catch (err) {
              console.log(`Column ${newColumn} might not exist in table ${tableName} or may already be renamed: ${err.message}`);
              // Continue with other columns/tables
            }
          }
        }
      }
      
      // Set up mapping of snake_case table names to original names
      const tableRenameMap = {
        'roles': 'Roles',
        'permissions': 'Permissions',
        'user_roles': 'UserRoles',
        'role_permissions': 'RolePermissions',
        'users': 'Users',
        'sessions': 'Sessions',
        'documentations': 'Documentations',
        'orders': 'Orders',
        'order_items': 'OrderItems',
        'featured_products': 'FeaturedProducts',
        'printify_caches': 'PrintifyCaches',
        'audits': 'Audits'
      };
      
      // Perform the renames for tables that actually exist
      for (const [newName, oldName] of Object.entries(tableRenameMap)) {
        if (tableNames.includes(newName) && newName !== oldName) {
          console.log(`Reverting: renaming table ${newName} back to ${oldName}`);
          await queryInterface.renameTable(newName, oldName);
        }
      }
      
    } catch (error) {
      console.error('Error in migration rollback:', error);
      throw error;
    }
  }
};
