'use strict';

/**
 * Comprehensive Roles & Permissions Seeder
 * 
 * This seeder creates a complete set of roles, permissions, and role-permission relationships
 * for the ILYTAT Designs application.
 * 
 * @module seeders/roles-permissions
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const loggerInstance = logger.child({ component: 'RolesPermissionsSeeder' });
    loggerInstance.info('Starting roles and permissions seeder');

    try {
      // Define timestamp for consistency
      const now = new Date();

      // ===== ROLES =====
      loggerInstance.info('Creating roles');
      
      const roles = [
        {
          id: uuidv4(),
          name: 'admin',
          description: 'Administrator with full system access',
          isActive: true,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'manager',
          description: 'Store manager with product and order management capabilities',
          isActive: true,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'customer_support',
          description: 'Customer support with limited access to orders and customers',
          isActive: true,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'content_editor',
          description: 'Content editor with access to products and blog posts',
          isActive: true,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'user',
          description: 'Standard user with shopping capabilities',
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      ];
      
      await queryInterface.bulkInsert('roles', roles);

      // ===== PERMISSIONS =====
      loggerInstance.info('Creating permissions');
      
      const resources = [
        'user', 'role', 'permission', 'product', 'order', 
        'category', 'customer', 'payment', 'report', 'documentation',
        'featured_product', 'printify', 'dashboard', 'audit_log', 'system'
      ];
      
      const actions = ['create', 'read', 'update', 'delete', 'manage', 'list'];

      const permissions = [];
      
      // Generate comprehensive permission set for each resource and action
      for (const resource of resources) {
        for (const action of actions) {
          // Skip combinations that don't make sense
          if (
            (resource === 'permission' && action === 'delete') ||
            (resource === 'role' && action === 'delete') ||
            (resource === 'system' && ['create', 'delete'].includes(action))
          ) {
            continue;
          }
          
          permissions.push({
            id: uuidv4(),
            name: `${resource}:${action}`,
            description: `Can ${action} ${resource.replace('_', ' ')}`,
            resource: resource,
            action: action,
            attributes: JSON.stringify(['*']),
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      // Add special composite permissions
      const specialPermissions = [
        {
          id: uuidv4(),
          name: 'dashboard:view',
          description: 'Can view the admin dashboard',
          resource: 'dashboard',
          action: 'view',
          attributes: JSON.stringify(['*']),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'product:feature',
          description: 'Can feature products on the homepage',
          resource: 'product',
          action: 'feature',
          attributes: JSON.stringify(['*']),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'product:bestseller',
          description: 'Can mark products as bestsellers',
          resource: 'product',
          action: 'bestseller',
          attributes: JSON.stringify(['*']),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'order:fulfill',
          description: 'Can fulfill orders',
          resource: 'order',
          action: 'fulfill',
          attributes: JSON.stringify(['*']),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'order:refund',
          description: 'Can process refunds',
          resource: 'order',
          action: 'refund',
          attributes: JSON.stringify(['*']),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'system:settings',
          description: 'Can modify system settings',
          resource: 'system',
          action: 'settings',
          attributes: JSON.stringify(['*']),
          createdAt: now,
          updatedAt: now
        }
      ];
      
      permissions.push(...specialPermissions);
      
      await queryInterface.bulkInsert('permissions', permissions);
      
      // ===== ROLE-PERMISSION ASSIGNMENTS =====
      loggerInstance.info('Assigning permissions to roles');
      
      // Get role IDs
      const [roleRecords] = await queryInterface.sequelize.query(
        'SELECT id, name FROM roles'
      );
      
      // Get permission IDs
      const [permissionRecords] = await queryInterface.sequelize.query(
        'SELECT id, name FROM permissions'
      );
      
      // Create role-permission lookup maps for easier access
      const roleMap = roleRecords.reduce((map, role) => {
        map[role.name] = role.id;
        return map;
      }, {});
      
      const permissionMap = permissionRecords.reduce((map, permission) => {
        map[permission.name] = permission.id;
        return map;
      }, {});
      
      // Define role-permission assignments
      const rolePermissions = [];
      
      // Admin gets all permissions
      for (const permission of permissionRecords) {
        rolePermissions.push({
          id: uuidv4(),
          roleId: roleMap.admin,
          permissionId: permission.id,
          createdAt: now,
          updatedAt: now
        });
      }
      
      // Manager permissions
      const managerPermissions = [
        // Product management
        'product:create', 'product:read', 'product:update', 'product:delete', 'product:list', 'product:manage',
        'product:feature', 'product:bestseller',
        // Order management
        'order:create', 'order:read', 'order:update', 'order:list', 'order:manage', 'order:fulfill', 'order:refund',
        // Customer management
        'customer:read', 'customer:update', 'customer:list',
        // Category management
        'category:create', 'category:read', 'category:update', 'category:delete', 'category:list', 'category:manage',
        // Featured product management
        'featured_product:create', 'featured_product:read', 'featured_product:update', 'featured_product:delete', 'featured_product:list', 'featured_product:manage',
        // Printify access
        'printify:read', 'printify:list',
        // Report access
        'report:read', 'report:list',
        // Dashboard
        'dashboard:view',
        // Documentation
        'documentation:read', 'documentation:list'
      ];
      
      for (const permissionName of managerPermissions) {
        if (permissionMap[permissionName]) {
          rolePermissions.push({
            id: uuidv4(),
            roleId: roleMap.manager,
            permissionId: permissionMap[permissionName],
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      // Customer Support permissions
      const supportPermissions = [
        'order:read', 'order:update', 'order:list',
        'customer:read', 'customer:list',
        'product:read', 'product:list',
        'documentation:read', 'documentation:list',
        'dashboard:view'
      ];
      
      for (const permissionName of supportPermissions) {
        if (permissionMap[permissionName]) {
          rolePermissions.push({
            id: uuidv4(),
            roleId: roleMap.customer_support,
            permissionId: permissionMap[permissionName],
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      // Content Editor permissions
      const editorPermissions = [
        'product:read', 'product:update', 'product:list',
        'category:read', 'category:update', 'category:list',
        'featured_product:read', 'featured_product:update', 'featured_product:list',
        'documentation:create', 'documentation:read', 'documentation:update', 'documentation:list',
        'dashboard:view'
      ];
      
      for (const permissionName of editorPermissions) {
        if (permissionMap[permissionName]) {
          rolePermissions.push({
            id: uuidv4(),
            roleId: roleMap.content_editor,
            permissionId: permissionMap[permissionName],
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      // Regular user permissions
      const userPermissions = [
        'user:read', 'user:update',  // Only their own profile
        'product:read', 'product:list',
        'category:read', 'category:list',
        'order:create', 'order:read'  // Only their own orders
      ];
      
      for (const permissionName of userPermissions) {
        if (permissionMap[permissionName]) {
          rolePermissions.push({
            id: uuidv4(),
            roleId: roleMap.user,
            permissionId: permissionMap[permissionName],
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      await queryInterface.bulkInsert('RolePermissions', rolePermissions);
      
      loggerInstance.info(`Successfully seeded ${roles.length} roles, ${permissions.length} permissions, and ${rolePermissions.length} role-permission assignments`);
      
    } catch (error) {
      loggerInstance.error('Error in roles and permissions seeder', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const loggerInstance = logger.child({ component: 'RolesPermissionsSeeder' });
    loggerInstance.info('Reverting roles and permissions seeder');
    
    try {
      // Remove all seeded records in reverse order
      await queryInterface.bulkDelete('RolePermissions', null, {});
      await queryInterface.bulkDelete('permissions', null, {});
      await queryInterface.bulkDelete('roles', null, {});
      
      loggerInstance.info('Successfully reverted roles and permissions seeder');
    } catch (error) {
      loggerInstance.error('Error reverting roles and permissions seeder', { error: error.message });
      throw error;
    }
  }
};
