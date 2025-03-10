const { Model, DataTypes } = require('sequelize');

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
                    foreignKey: 'orderId',
                    as: 'order'
                });
            }
        }
    }

    OrderItem.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Orders',
                key: 'id'
            }
        },
        // Product information
        productId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'External ID of the product (e.g., Printify product ID)'
        },
        variantId: {
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
        variantTitle: {
            type: DataTypes.STRING,
            allowNull: true
        },
        imageUrl: {
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
    }, {
        sequelize,
        modelName: 'OrderItem',
        tableName: 'OrderItems',
        indexes: [
            {
                fields: ['orderId']
            },
            {
                fields: ['productId']
            },
            {
                fields: ['variantId']
            }
        ]
    });

    return OrderItem;
};
