'use strict';

/**
 * Seeder for Featured Products
 * 
 * This seeder creates initial featured and best-selling products in the database.
 * In a production environment, these would be managed through the admin interface.
 * 
 * @module seeders/featured-products
 */

const logger = require('../utils/logger');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const loggerInstance = logger.child({ component: 'FeaturedProductsSeeder' });
    loggerInstance.info('Starting featured products seeder');

    try {
      // Sample product IDs - based on common Printify product ID format
      // These should be replaced with actual Printify product IDs from your shop in production
      const sampleProductIds = [
        '61f94c7cd489e70cdf3d59ec', // T-shirt design 1
        '61f94e52d489e70cdf3d5a01', // Hoodie design 1
        '61f950a1d489e70cdf3d5a27', // Mug design 1
        '61f952f8d489e70cdf3d5a3b', // Phone case design 1
        '61f9554ad489e70cdf3d5a52', // Tote bag design 1
        '61f957b2d489e70cdf3d5a67', // Poster design 1
        '61f95a04d489e70cdf3d5a81', // Pillow design 1
        '61f95c77d489e70cdf3d5a98', // Hat design 1
        '61f95ed5d489e70cdf3d5aaf', // Sticker design 1
        '61f961a8d489e70cdf3d5ac4'  // Notebook design 1
      ];

      // Get current timestamp for createdAt and updatedAt
      const now = new Date();

      // Create featured products (first 5 products)
      const featuredProducts = sampleProductIds.slice(0, 5).map((id, index) => ({
        printifyProductId: id,
        isFeatured: true,
        isBestSeller: false,
        displayOrder: index + 1,
        createdAt: now,
        updatedAt: now
      }));

      // Create best-selling products (next 5 products)
      const bestSellingProducts = sampleProductIds.slice(5).map((id, index) => ({
        printifyProductId: id,
        isFeatured: false,
        isBestSeller: true,
        displayOrder: index + 1,
        createdAt: now,
        updatedAt: now
      }));

      // Mark 2 products as both featured and bestsellers
      // We're updating the first 2 featured products to also be bestsellers
      featuredProducts[0].isBestSeller = true;
      featuredProducts[1].isBestSeller = true;

      // Combine all product records
      const allProductRecords = [
        ...featuredProducts,
        ...bestSellingProducts
      ];

      // Insert records into the database
      await queryInterface.bulkInsert('featured_products', allProductRecords);

      loggerInstance.info(`Successfully seeded ${allProductRecords.length} featured product records (${featuredProducts.length} featured, ${bestSellingProducts.length} bestsellers, ${2} both)`);
    } catch (error) {
      loggerInstance.error('Error in featured products seeder', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const loggerInstance = logger.child({ component: 'FeaturedProductsSeeder' });
    loggerInstance.info('Reverting featured products seeder');
    
    try {
      // Remove all seeded records
      await queryInterface.bulkDelete('featured_products', null, {});
      loggerInstance.info('Successfully reverted featured products seeder');
    } catch (error) {
      loggerInstance.error('Error reverting featured products seeder', { error: error.message });
      throw error;
    }
  }
};
