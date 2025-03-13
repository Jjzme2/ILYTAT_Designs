
const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');
'use strict';


/**
 * PrintifyCache Model
 * Used for caching Printify data to reduce API calls and improve performance
 */
module.exports = (sequelize) => {
  class PrintifyCache extends Model {}

  PrintifyCache.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('product', 'shop', 'order'),
      allowNull: false
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'PrintifyCache',
    tableName: 'printify_cache',
    timestamps: true,
    indexes: [
      {
        fields: ['type', 'externalId'],
        unique: true
      }
    ]
  });

  return PrintifyCache;
};
