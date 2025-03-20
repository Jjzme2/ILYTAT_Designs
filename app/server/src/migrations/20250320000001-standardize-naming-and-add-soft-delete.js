'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Standardize table names (if not already done)
    // Most tables appear to already use the correct format, but we'll ensure consistency
    
    // 2. Standardize column names in Users table
    await queryInterface.renameColumn('users', 'firstName', 'first_name');
    await queryInterface.renameColumn('users', 'lastName', 'last_name');
    await queryInterface.renameColumn('users', 'isActive', 'is_active');
    await queryInterface.renameColumn('users', 'lastLogin', 'last_login');
    await queryInterface.renameColumn('users', 'resetPasswordToken', 'reset_password_token');
    await queryInterface.renameColumn('users', 'resetPasswordExpires', 'reset_password_expires');
    
    // 3. Standardize column names in other tables
    
    // 3.1 Audits Table
    await queryInterface.renameColumn('audits', 'entityType', 'entity_type');
    await queryInterface.renameColumn('audits', 'entityId', 'entity_id');
    await queryInterface.renameColumn('audits', 'oldValues', 'old_values');
    await queryInterface.renameColumn('audits', 'newValues', 'new_values');
    await queryInterface.renameColumn('audits', 'ipAddress', 'ip_address');
    await queryInterface.renameColumn('audits', 'userAgent', 'user_agent');
    await queryInterface.renameColumn('audits', 'requestId', 'request_id');
    await queryInterface.renameColumn('audits', 'createdAt', 'created_at');
    await queryInterface.renameColumn('audits', 'updatedAt', 'updated_at');
    

    // 3.2 FeaturedProducts - Already in snake_case based on model review
    
    // Roles table
    await queryInterface.renameColumn('roles', 'displayName', 'display_name');
    
    // Permissions table
    await queryInterface.renameColumn('permissions', 'displayName', 'display_name');
    
    // Orders table
    await queryInterface.renameColumn('orders', 'orderTotal', 'order_total');
    await queryInterface.renameColumn('orders', 'orderDate', 'order_date');
    await queryInterface.renameColumn('orders', 'orderStatus', 'order_status');
    await queryInterface.renameColumn('orders', 'paymentStatus', 'payment_status');
    await queryInterface.renameColumn('orders', 'shippingAddress', 'shipping_address');
    await queryInterface.renameColumn('orders', 'billingAddress', 'billing_address');
    await queryInterface.renameColumn('orders', 'trackingNumber', 'tracking_number');
    await queryInterface.renameColumn('orders', 'estimatedDelivery', 'estimated_delivery');
    
    // OrderItems table
    await queryInterface.renameColumn('order_items', 'productId', 'product_id');
    await queryInterface.renameColumn('order_items', 'productName', 'product_name');
    await queryInterface.renameColumn('order_items', 'productPrice', 'product_price');
    await queryInterface.renameColumn('order_items', 'productVariant', 'product_variant');
    await queryInterface.renameColumn('order_items', 'productImage', 'product_image');
    
    // 4. Add deleted_at column for soft delete to all tables that don't have it
    const tables = [
      'users', 
      'roles', 
      'permissions', 
      'user_roles', 
      'role_permissions', 
      'sessions',
      'documentations',
      'printify_caches',
      'audits',
      'featured_products',
      'orders',
      'order_items'
    ];
    
    for (const table of tables) {
      // Check if deleted_at column already exists
      const tableInfo = await queryInterface.describeTable(table);
      if (!tableInfo.deleted_at) {
        await queryInterface.addColumn(table, 'deleted_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove deleted_at columns
    const tables = [
      'users', 
      'roles', 
      'permissions', 
      'user_roles', 
      'role_permissions', 
      'sessions',
      'documentations',
      'printify_caches',
      'audits',
      'featured_products',
      'orders',
      'order_items'
    ];
    
    for (const table of tables) {
      try {
        await queryInterface.removeColumn(table, 'deleted_at');
      } catch (error) {
        console.log(`Warning: Could not remove deleted_at from ${table}. It may not exist.`);
      }
    }
    
    // 2. Revert column names in Users table
    await queryInterface.renameColumn('users', 'first_name', 'firstName');
    await queryInterface.renameColumn('users', 'last_name', 'lastName');
    await queryInterface.renameColumn('users', 'is_active', 'isActive');
    await queryInterface.renameColumn('users', 'last_login', 'lastLogin');
    await queryInterface.renameColumn('users', 'reset_password_token', 'resetPasswordToken');
    await queryInterface.renameColumn('users', 'reset_password_expires', 'resetPasswordExpires');
    
    // 3. Revert column names in other tables
    
    // 3.1 Audit table
    await queryInterface.renameColumn('audits', 'entity_type', 'entityType');
    await queryInterface.renameColumn('audits', 'entity_id', 'entityId');
    await queryInterface.renameColumn('audits', 'old_values', 'oldValues');
    await queryInterface.renameColumn('audits', 'new_values', 'newValues');
    await queryInterface.renameColumn('audits', 'ip_address', 'ipAddress');
    await queryInterface.renameColumn('audits', 'user_agent', 'userAgent');
    await queryInterface.renameColumn('audits', 'request_id', 'requestId');
    await queryInterface.renameColumn('audits', 'created_at', 'createdAt');
    await queryInterface.renameColumn('audits', 'updated_at', 'updatedAt');
    
    // Roles table
    await queryInterface.renameColumn('roles', 'display_name', 'displayName');
    
    // Permissions table
    await queryInterface.renameColumn('permissions', 'display_name', 'displayName');
    
    // Orders table
    await queryInterface.renameColumn('orders', 'order_total', 'orderTotal');
    await queryInterface.renameColumn('orders', 'order_date', 'orderDate');
    await queryInterface.renameColumn('orders', 'order_status', 'orderStatus');
    await queryInterface.renameColumn('orders', 'payment_status', 'paymentStatus');
    await queryInterface.renameColumn('orders', 'shipping_address', 'shippingAddress');
    await queryInterface.renameColumn('orders', 'billing_address', 'billingAddress');
    await queryInterface.renameColumn('orders', 'tracking_number', 'trackingNumber');
    await queryInterface.renameColumn('orders', 'estimated_delivery', 'estimatedDelivery');
    
    // OrderItems table
    await queryInterface.renameColumn('order_items', 'product_id', 'productId');
    await queryInterface.renameColumn('order_items', 'product_name', 'productName');
    await queryInterface.renameColumn('order_items', 'product_price', 'productPrice');
    await queryInterface.renameColumn('order_items', 'product_variant', 'productVariant');
    await queryInterface.renameColumn('order_items', 'product_image', 'productImage');
  }
};