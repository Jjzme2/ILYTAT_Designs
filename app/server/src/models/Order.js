const { Model, DataTypes } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Order model for storing customer order information
 * Related to Stripe checkout sessions and Printify fulfillment
 */
module.exports = (sequelize) => {
    class Order extends Model {
        static associate(models) {
            // Define associations - only if OrderItem exists
            if (models.OrderItem) {
                this.hasMany(models.OrderItem, { 
                    foreignKey: 'orderId',
                    as: 'items'
                });
            }
            
            // Add user association
            if (models.User) {
                this.belongsTo(models.User, { 
                    foreignKey: 'customerId'
                });
            }
        }
    }

    Order.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        // Stripe specific fields
        stripeSessionId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        stripePaymentIntentId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Customer information
        customerId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Users', 
                key: 'id'
            }
        },
        customerEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Order details
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'usd'
        },
        status: {
            type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
            defaultValue: 'pending'
        },
        // External fulfillment reference
        printifyOrderId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        fulfillmentStatus: {
            type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
            allowNull: true
        },
        // Shipping information stored as JSON
        shippingAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('shippingAddress');
                return rawValue ? JSON.parse(rawValue) : null;
            },
            set(value) {
                this.setDataValue('shippingAddress', 
                    value ? JSON.stringify(value) : null
                );
            }
        },
        // Additional metadata
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
        modelName: 'Order',
        tableName: 'Orders',
        hooks: {
            beforeCreate: (order) => {
                logger.info(`Creating new order with session ID: ${order.stripeSessionId}`);
            },
            afterCreate: (order) => {
                logger.info(`Created order with ID: ${order.id} for session: ${order.stripeSessionId}`);
            }
        },
        indexes: [
            {
                unique: true,
                fields: ['stripeSessionId']
            },
            {
                fields: ['stripePaymentIntentId']
            },
            {
                fields: ['customerId']
            },
            {
                fields: ['customerEmail']
            },
            {
                fields: ['printifyOrderId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['fulfillmentStatus']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return Order;
};
