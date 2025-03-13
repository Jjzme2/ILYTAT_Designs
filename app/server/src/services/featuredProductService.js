/**
 * Featured Product Service
 * 
 * Handles all business logic related to featured and best-selling products.
 * This service provides methods to manage which products are featured or 
 * considered best-sellers in the store.
 * 
 * @module services/featuredProductService
 */

const { FeaturedProduct } = require('../models');
const logger = require('../utils/logger');

class FeaturedProductService {
  constructor() {
    this.logger = logger.child({ component: 'FeaturedProductService' });
  }

  /**
   * Get all featured products
   * 
   * @returns {Promise<Array>} List of featured product IDs with their display order
   */
  async getFeaturedProducts() {
    try {
      this.logger.info('Retrieving featured products');
      
      const featuredProducts = await FeaturedProduct.findAll({
        where: { is_featured: true },
        order: [['display_order', 'ASC']],
        attributes: ['printify_product_id', 'display_order']
      });
      
      this.logger.info(`Retrieved ${featuredProducts.length} featured products`);
      return featuredProducts.map(product => product.printify_product_id);
    } catch (error) {
      this.logger.error('Error retrieving featured products', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all best-selling products
   * 
   * @returns {Promise<Array>} List of best-selling product IDs with their display order
   */
  async getBestSellingProducts() {
    try {
      this.logger.info('Retrieving best-selling products');
      
      const bestSellingProducts = await FeaturedProduct.findAll({
        where: { is_best_seller: true },
        order: [['display_order', 'ASC']],
        attributes: ['printify_product_id', 'display_order']
      });
      
      this.logger.info(`Retrieved ${bestSellingProducts.length} best-selling products`);
      return bestSellingProducts.map(product => product.printify_product_id);
    } catch (error) {
      this.logger.error('Error retrieving best-selling products', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if a product is featured
   * 
   * @param {string} productId - Printify product ID
   * @returns {Promise<boolean>} Whether the product is featured
   */
  async isProductFeatured(productId) {
    try {
      const featuredProduct = await FeaturedProduct.findByPk(productId);
      return !!(featuredProduct && featuredProduct.is_featured);
    } catch (error) {
      this.logger.error(`Error checking if product ${productId} is featured`, { error: error.message });
      return false;
    }
  }

  /**
   * Check if a product is a best-seller
   * 
   * @param {string} productId - Printify product ID
   * @returns {Promise<boolean>} Whether the product is a best-seller
   */
  async isProductBestSeller(productId) {
    try {
      const featuredProduct = await FeaturedProduct.findByPk(productId);
      return !!(featuredProduct && featuredProduct.is_best_seller);
    } catch (error) {
      this.logger.error(`Error checking if product ${productId} is a best-seller`, { error: error.message });
      return false;
    }
  }

  /**
   * Set a product as featured
   * 
   * @param {string} productId - Printify product ID
   * @param {boolean} isFeatured - Whether to set as featured
   * @param {number} displayOrder - Optional display order (lower number = higher priority)
   * @param {number} userId - ID of user making the change
   * @returns {Promise<object>} Updated featured product record
   */
  async setProductFeatured(productId, isFeatured, displayOrder = 999, userId = null) {
    try {
      this.logger.info(`Setting product ${productId} featured status to ${isFeatured}`);
      
      const [featuredProduct, created] = await FeaturedProduct.findOrCreate({
        where: { printify_product_id: productId },
        defaults: {
          is_featured: isFeatured,
          display_order: displayOrder,
          created_by: userId,
          updated_by: userId
        }
      });
      
      if (!created) {
        await featuredProduct.update({
          is_featured: isFeatured,
          display_order: displayOrder !== undefined ? displayOrder : featuredProduct.display_order,
          updated_by: userId
        });
      }
      
      this.logger.info(`Successfully ${isFeatured ? 'added' : 'removed'} product ${productId} ${isFeatured ? 'to' : 'from'} featured products`);
      return featuredProduct;
    } catch (error) {
      this.logger.error(`Error setting product ${productId} featured status`, { error: error.message });
      throw error;
    }
  }

  /**
   * Set a product as best-seller
   * 
   * @param {string} productId - Printify product ID
   * @param {boolean} isBestSeller - Whether to set as best-seller
   * @param {number} displayOrder - Optional display order (lower number = higher priority)
   * @param {number} userId - ID of user making the change
   * @returns {Promise<object>} Updated featured product record
   */
  async setProductBestSeller(productId, isBestSeller, displayOrder = 999, userId = null) {
    try {
      this.logger.info(`Setting product ${productId} best-seller status to ${isBestSeller}`);
      
      const [featuredProduct, created] = await FeaturedProduct.findOrCreate({
        where: { printify_product_id: productId },
        defaults: {
          is_best_seller: isBestSeller,
          display_order: displayOrder,
          created_by: userId,
          updated_by: userId
        }
      });
      
      if (!created) {
        await featuredProduct.update({
          is_best_seller: isBestSeller,
          display_order: displayOrder !== undefined ? displayOrder : featuredProduct.display_order,
          updated_by: userId
        });
      }
      
      this.logger.info(`Successfully ${isBestSeller ? 'added' : 'removed'} product ${productId} ${isBestSeller ? 'to' : 'from'} best-selling products`);
      return featuredProduct;
    } catch (error) {
      this.logger.error(`Error setting product ${productId} best-seller status`, { error: error.message });
      throw error;
    }
  }

  /**
   * Bulk set products as featured
   * 
   * @param {Array<string>} productIds - Array of Printify product IDs
   * @param {number} userId - ID of user making the change
   * @returns {Promise<number>} Number of products updated
   */
  async bulkSetFeaturedProducts(productIds, userId = null) {
    try {
      this.logger.info(`Setting ${productIds.length} products as featured`);
      
      // First, remove all previously featured products
      await FeaturedProduct.update(
        { is_featured: false, updated_by: userId },
        { where: { is_featured: true } }
      );
      
      // Then set the new featured products
      const featuredProductRecords = await Promise.all(
        productIds.map((productId, index) => 
          this.setProductFeatured(productId, true, index + 1, userId)
        )
      );
      
      this.logger.info(`Successfully set ${featuredProductRecords.length} products as featured`);
      return featuredProductRecords.length;
    } catch (error) {
      this.logger.error(`Error bulk setting featured products`, { error: error.message });
      throw error;
    }
  }

  /**
   * Bulk set products as best-sellers
   * 
   * @param {Array<string>} productIds - Array of Printify product IDs
   * @param {number} userId - ID of user making the change
   * @returns {Promise<number>} Number of products updated
   */
  async bulkSetBestSellingProducts(productIds, userId = null) {
    try {
      this.logger.info(`Setting ${productIds.length} products as best-sellers`);
      
      // First, remove all previously best-selling products
      await FeaturedProduct.update(
        { is_best_seller: false, updated_by: userId },
        { where: { is_best_seller: true } }
      );
      
      // Then set the new best-selling products
      const bestSellingProductRecords = await Promise.all(
        productIds.map((productId, index) => 
          this.setProductBestSeller(productId, true, index + 1, userId)
        )
      );
      
      this.logger.info(`Successfully set ${bestSellingProductRecords.length} products as best-sellers`);
      return bestSellingProductRecords.length;
    } catch (error) {
      this.logger.error(`Error bulk setting best-selling products`, { error: error.message });
      throw error;
    }
  }
}

module.exports = new FeaturedProductService();
