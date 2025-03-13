'use strict';

/**
 * Migration to fix featured_products table columns to ensure they follow snake_case convention
 * This targeted migration addresses potential issues with column naming in the featured_products table
 * 
 * @module migrations/fix-featured-products-columns
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('Checking featured_products table columns...');
      
      // First, check if the table exists
      const tables = await queryInterface.sequelize.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'featured_products'",
        {
          replacements: { schema: queryInterface.sequelize.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      if (tables.length === 0) {
        console.log('featured_products table does not exist, skipping migration');
        return;
      }
      
      // Get current columns
      const columns = await queryInterface.sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'featured_products'",
        {
          replacements: { schema: queryInterface.sequelize.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      console.log('Current columns:', columnNames);
      
      // Define column renames
      const columnRenames = {
        'printifyProductId': 'printify_product_id',
        'isFeatured': 'is_featured',
        'isBestSeller': 'is_best_seller',
        'displayOrder': 'display_order',
        'createdBy': 'created_by',
        'updatedBy': 'updated_by',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      };
      
      // Perform column renames
      for (const [oldName, newName] of Object.entries(columnRenames)) {
        if (columnNames.includes(oldName)) {
          console.log(`Renaming column ${oldName} to ${newName}`);
          
          // Get column details first to preserve all attributes
          const columnDetails = await queryInterface.sequelize.query(
            `SHOW FULL COLUMNS FROM \`featured_products\` LIKE '${oldName}'`,
            { type: Sequelize.QueryTypes.SELECT }
          );
          
          if (columnDetails && columnDetails.length > 0) {
            const details = columnDetails[0];
            
            // Special handling for default values
            let defaultClause = '';
            if (details.Default !== null) {
              // Check if the default is CURRENT_TIMESTAMP
              if (details.Default.toUpperCase() === 'CURRENT_TIMESTAMP') {
                defaultClause = ' DEFAULT CURRENT_TIMESTAMP';
              } else {
                defaultClause = ` DEFAULT '${details.Default}'`;
              }
            }
            
            // Construct and execute ALTER TABLE statement
            await queryInterface.sequelize.query(
              `ALTER TABLE \`featured_products\` CHANGE \`${oldName}\` \`${newName}\` ${details.Type}${
                details.Null === 'YES' ? ' NULL' : ' NOT NULL'
              }${defaultClause}${
                details.Comment ? ` COMMENT '${details.Comment}'` : ''
              }`
            );
          }
        } else if (!columnNames.includes(newName)) {
          console.log(`Neither ${oldName} nor ${newName} found in table`);
        } else {
          console.log(`Column ${newName} already exists`);
        }
      }
      
      console.log('Featured products table column migration completed successfully');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Undo the column renames (from snake_case back to camelCase)
      console.log('Reverting featured_products table columns to camelCase...');
      
      // Define reverse column renames
      const columnRenames = {
        'printify_product_id': 'printifyProductId',
        'is_featured': 'isFeatured',
        'is_best_seller': 'isBestSeller',
        'display_order': 'displayOrder',
        'created_by': 'createdBy',
        'updated_by': 'updatedBy',
        'created_at': 'createdAt',
        'updated_at': 'updatedAt'
      };
      
      // Get current columns
      const columns = await queryInterface.sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'featured_products'",
        {
          replacements: { schema: queryInterface.sequelize.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      // Perform column renames
      for (const [snakeCaseName, camelCaseName] of Object.entries(columnRenames)) {
        if (columnNames.includes(snakeCaseName)) {
          console.log(`Reverting column name from ${snakeCaseName} to ${camelCaseName}`);
          
          // Get column details first to preserve all attributes
          const columnDetails = await queryInterface.sequelize.query(
            `SHOW FULL COLUMNS FROM \`featured_products\` LIKE '${snakeCaseName}'`,
            { type: Sequelize.QueryTypes.SELECT }
          );
          
          if (columnDetails && columnDetails.length > 0) {
            const details = columnDetails[0];
            
            // Special handling for default values
            let defaultClause = '';
            if (details.Default !== null) {
              // Check if the default is CURRENT_TIMESTAMP
              if (details.Default.toUpperCase() === 'CURRENT_TIMESTAMP') {
                defaultClause = ' DEFAULT CURRENT_TIMESTAMP';
              } else {
                defaultClause = ` DEFAULT '${details.Default}'`;
              }
            }
            
            // Construct and execute ALTER TABLE statement
            await queryInterface.sequelize.query(
              `ALTER TABLE \`featured_products\` CHANGE \`${snakeCaseName}\` \`${camelCaseName}\` ${details.Type}${
                details.Null === 'YES' ? ' NULL' : ' NOT NULL'
              }${defaultClause}${
                details.Comment ? ` COMMENT '${details.Comment}'` : ''
              }`
            );
          }
        }
      }
      
      console.log('Featured products table column reversion completed successfully');
    } catch (error) {
      console.error('Error in migration reversion:', error);
      throw error;
    }
  }
};
