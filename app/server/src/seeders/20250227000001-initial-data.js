const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create default roles
    const roles = await queryInterface.bulkInsert('Roles', [
      {
        id: uuidv4(),
        name: 'admin',
        description: 'Administrator with full access',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'user',
        description: 'Standard user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // Create default permissions
    const permissions = await queryInterface.bulkInsert('Permissions', [
      {
        id: uuidv4(),
        name: 'user:read',
        description: 'Can read user information',
        resource: 'user',
        action: 'read',
        attributes: JSON.stringify(['*']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'user:write',
        description: 'Can create and update user information',
        resource: 'user',
        action: 'write',
        attributes: JSON.stringify(['*']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'user:delete',
        description: 'Can delete users',
        resource: 'user',
        action: 'delete',
        attributes: JSON.stringify(['*']),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const users = await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // Assign roles and permissions
    // Note: In a real production environment, you would want to be more selective
    // about which permissions are assigned to which roles
    const [adminRole] = await queryInterface.sequelize.query(
      'SELECT id FROM Roles WHERE name = "admin"'
    );
    const [adminUser] = await queryInterface.sequelize.query(
      'SELECT id FROM Users WHERE username = "admin"'
    );
    const [allPermissions] = await queryInterface.sequelize.query(
      'SELECT id FROM Permissions'
    );

    // Assign admin role to admin user
    await queryInterface.bulkInsert('UserRoles', [
      {
        id: uuidv4(),
        userId: adminUser[0].id,
        roleId: adminRole[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Assign all permissions to admin role
    await Promise.all(allPermissions.map(permission => 
      queryInterface.bulkInsert('RolePermissions', [
        {
          id: uuidv4(),
          roleId: adminRole[0].id,
          permissionId: permission.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
    ));
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all seeded data in reverse order
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('UserRoles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
