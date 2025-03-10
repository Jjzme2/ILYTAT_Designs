'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Audits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entityId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      oldValues: {
        type: Sequelize.JSON,
        allowNull: true
      },
      newValues: {
        type: Sequelize.JSON,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      requestId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('success', 'failure', 'warning'),
        defaultValue: 'success'
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes for efficient querying
    await queryInterface.addIndex('Audits', ['action']);
    await queryInterface.addIndex('Audits', ['entityType', 'entityId']);
    await queryInterface.addIndex('Audits', ['userId']);
    await queryInterface.addIndex('Audits', ['createdAt']);
    await queryInterface.addIndex('Audits', ['severity']);
    await queryInterface.addIndex('Audits', ['status']);
    await queryInterface.addIndex('Audits', ['requestId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Audits');
  }
};
