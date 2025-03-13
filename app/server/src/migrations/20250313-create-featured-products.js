'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('featured_products', {
      printify_product_id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        comment: 'Printify product ID'
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if the product should be featured on the homepage'
      },
      is_best_seller: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if the product is a best seller'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 999,
        comment: 'Display order for the product within its respective categories (featured/bestselling)'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID who marked this product as featured/bestselling'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID who last updated this product status'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
        comment: 'Soft deletion timestamp for paranoid mode'
      }
    });

    // Add index for faster lookups on featured/bestselling status
    await queryInterface.addIndex('featured_products', ['is_featured'], {
      name: 'idx_featured_products_is_featured'
    });
    
    await queryInterface.addIndex('featured_products', ['is_best_seller'], {
      name: 'idx_featured_products_is_best_seller'
    });
    
    // Add index for display order to optimize sorting
    await queryInterface.addIndex('featured_products', ['display_order'], {
      name: 'idx_featured_products_display_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('featured_products');
  }
};
