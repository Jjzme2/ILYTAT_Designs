const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Helper function to safely add timestamp columns
      const addTimestampColumns = async (tableName) => {
        const tableExists = await queryInterface.tableExists(tableName);
        if (!tableExists) {
          console.log(`Table ${tableName} does not exist, skipping...`);
          return;
        }

        const columns = await queryInterface.describeTable(tableName);
        
        // Add createdAt if it doesn't exist
        if (!columns.createdAt) {
          await queryInterface.addColumn(tableName, 'createdAt', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }, { transaction });
        }

        // Add updatedAt if it doesn't exist
        if (!columns.updatedAt) {
          await queryInterface.addColumn(tableName, 'updatedAt', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }, { transaction });
        }

        // Add deletedAt if it doesn't exist (for soft deletes)
        if (!columns.deletedAt) {
          await queryInterface.addColumn(tableName, 'deletedAt', {
            type: DataTypes.DATE,
            allowNull: true
          }, { transaction });
        }

        // Add indexes for timestamp columns
        await queryInterface.addIndex(tableName, ['createdAt'], {
          name: `${tableName}_createdAt_idx`,
          transaction
        });

        await queryInterface.addIndex(tableName, ['updatedAt'], {
          name: `${tableName}_updatedAt_idx`,
          transaction
        });
      };

      // List of tables that need timestamp columns
      const tables = ['permissions', 'roles', 'printify_cache'];

      // Add timestamp columns to each table
      for (const table of tables) {
        await addTimestampColumns(table);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = ['permissions', 'roles', 'printify_cache'];

      for (const table of tables) {
        const tableExists = await queryInterface.tableExists(table);
        if (!tableExists) continue;

        // Remove indexes first
        await queryInterface.removeIndex(table, `${table}_createdAt_idx`, { transaction });
        await queryInterface.removeIndex(table, `${table}_updatedAt_idx`, { transaction });

        // Remove timestamp columns
        await queryInterface.removeColumn(table, 'deletedAt', { transaction });
        await queryInterface.removeColumn(table, 'updatedAt', { transaction });
        await queryInterface.removeColumn(table, 'createdAt', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
