const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');

/**
 * OrderItem model for storing individual line items in an order
 * Represents products purchased in a specific order
 */
module.exports = (sequelize) => {
    class OrderItem extends Model {
        static associate(models) {
            // Define associations - only if Order exists
            if (models.Order) {
                this.belongsTo(models.Order, { 
                    foreignKey: 'order_id',
                    as: 'order'
                });
            }
        }
    }

    const attributes = standardizeAttributes({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            }
        },
        // Product information
        product_id: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'External ID of the product (e.g., Printify product ID)'
        },
        variant_id: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'External ID of the product variant'
        },
        // Order details
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        // Additional information
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        variant_title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Optional metadata
        metadata: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('metadata');
                return rawValue ? JSON.parse(rawValue) : null;
            },
            set(value) {
                this.setDataValue('metadata', 
                    value ? JSON.stringify(value) : null
                );
            }
        }
    });

    const options = enhanceModelOptions({
        sequelize,
        modelName: 'OrderItem',
        tableName: 'order_items',
        indexes: [
            {
                fields: ['order_id']
            },
            {
                fields: ['product_id']
            },
            {
                fields: ['variant_id']
            }
        ]
    });

    OrderItem.init(attributes, options);

    return OrderItem;
};
