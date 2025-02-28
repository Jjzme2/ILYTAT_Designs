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
        
        // Add created_at if it doesn't exist
        if (!columns.created_at) {
          await queryInterface.addColumn(tableName, 'created_at', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }, { transaction });
        }

        // Add updated_at if it doesn't exist
        if (!columns.updated_at) {
          await queryInterface.addColumn(tableName, 'updated_at', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }, { transaction });
        }

        // Add deleted_at if it doesn't exist (for soft deletes)
        if (!columns.deleted_at) {
          await queryInterface.addColumn(tableName, 'deleted_at', {
            type: DataTypes.DATE,
            allowNull: true
          }, { transaction });
        }

        // Add indexes for timestamp columns
        await queryInterface.addIndex(tableName, ['created_at'], {
          name: `${tableName}_created_at_idx`,
          transaction
        });

        await queryInterface.addIndex(tableName, ['updated_at'], {
          name: `${tableName}_updated_at_idx`,
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
        await queryInterface.removeIndex(table, `${table}_created_at_idx`, { transaction });
        await queryInterface.removeIndex(table, `${table}_updated_at_idx`, { transaction });

        // Remove timestamp columns
        await queryInterface.removeColumn(table, 'deleted_at', { transaction });
        await queryInterface.removeColumn(table, 'updated_at', { transaction });
        await queryInterface.removeColumn(table, 'created_at', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
