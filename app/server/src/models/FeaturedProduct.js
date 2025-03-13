/**
 * Featured Product Model
 * 
 * This model stores the relationship between products and their featured/bestselling status
 * It allows admin users to mark specific products as featured or bestselling
 * for highlighting on the storefront.
 * 
 * @module models/FeaturedProduct
 */

'use strict';

const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');

module.exports = (sequelize) => {
  class FeaturedProduct extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // No direct associations as this is a reference to external Printify products
    }
  }

  const attributes = standardizeAttributes({
    printify_product_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      comment: 'Printify product ID',
      validate: {
        notEmpty: true
      }
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if the product should be featured on the homepage'
    },
    is_best_seller: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if the product is a best seller'
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 999,
      comment: 'Display order for the product within its respective categories (featured/bestselling)'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who marked this product as featured/bestselling'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who last updated this product status'
    }
  });

  const options = enhanceModelOptions({
    sequelize,
    modelName: 'FeaturedProduct',
    tableName: 'featured_products',
    timestamps: true,
    paranoid: true,
    comment: 'Stores products marked as featured or bestselling for storefront display'
  });

  FeaturedProduct.init(attributes, options);

  return FeaturedProduct;
};
