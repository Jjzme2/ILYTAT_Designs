/**
 * Order Service
 * Manages business logic related to orders and integrates with Stripe payment processing
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const OrderModel = require('../models/Order');
const OrderItemModel = require('../models/OrderItem');
const { sequelize } = require('../models');
const { createError } = require('../utils/errorHandler');

class OrderService {
  constructor() {
    this.logger = logger.child({ component: 'OrderService' });
  }

  /**
   * Create a new order from a Stripe session
   * @param {Object} session - Stripe checkout session
   * @param {Array} cartItems - Array of cart items
   * @returns {Promise<Object>} Created order
   */
  async createOrderFromStripeSession(session, cartItems) {
    // Use a transaction to ensure database operations are atomic
    const transaction = await sequelize.transaction();
    
    try {
      // Create order record in our database
      const order = await OrderModel.create({
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        customerEmail: session.customer_details.email,
        customerName: session.customer_details.name,
        totalAmount: session.amount_total / 100, // Convert from cents
        status: 'paid',
        shippingAddress: JSON.stringify({
          name: session.shipping_details?.name || session.customer_details.name,
          address: session.shipping_details?.address || session.customer_details.address
        }),
      }, { transaction });
      
      // Create order items
      await Promise.all(cartItems.map(item => 
        OrderItemModel.create({
          orderId: order.id,
          productId: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        }, { transaction })
      ));
      
      // Commit the transaction
      await transaction.commit();
      
      return order;
    } catch (error) {
      // Rollback in case of error
      await transaction.rollback();
      
      this.logger.error({
        message: 'Failed to create order from Stripe session',
        error,
        data: { 
          sessionId: session.id,
          errorMessage: error.message
        }
      });
      
      throw createError('Failed to create order', 500);
    }
  }

  /**
   * Get orders by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of orders
   */
  async getOrdersByUserId(userId) {
    try {
      // Find all orders for this user
      const orders = await OrderModel.findAll({
        where: { userId },
        include: [
          {
            model: OrderItemModel,
            as: 'items'
          }
        ],
        order: [['createdAt', 'DESC']] // Most recent first
      });
      
      return orders;
    } catch (error) {
      this.logger.error({
        message: 'Error retrieving orders by user ID',
        error,
        data: { 
          userId,
          errorMessage: error.message
        }
      });
      
      throw createError('Failed to retrieve order history', 500);
    }
  }

  /**
   * Get order by Stripe session ID
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderBySessionId(sessionId) {
    try {
      // First, check our database for the order
      const order = await OrderModel.findOne({
        where: { stripeSessionId: sessionId },
        include: [
          {
            model: OrderItemModel,
            as: 'items'
          }
        ]
      });
      
      // If we have the order in our database, return it
      if (order) {
        return { type: 'db', data: order };
      }
      
      // If not in our database, retrieve from Stripe directly
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer', 'shipping_details', 'payment_intent']
      });
      
      if (!session) {
        throw createError('Order not found', 404);
      }
      
      return { type: 'stripe', data: session };
    } catch (error) {
      this.logger.error({
        message: 'Error retrieving order details',
        error,
        data: { 
          sessionId,
          errorMessage: error.message
        }
      });
      
      // If it's a Stripe error, it might be a permission or not found issue
      if (error.type === 'StripeInvalidRequestError') {
        throw createError('Order could not be retrieved from Stripe', 404);
      }
      
      throw error;
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    try {
      const order = await OrderModel.findByPk(orderId);
      
      if (!order) {
        throw createError('Order not found', 404);
      }
      
      order.status = status;
      await order.save();
      
      return order;
    } catch (error) {
      this.logger.error({
        message: 'Error updating order status',
        error,
        data: { 
          orderId,
          status,
          errorMessage: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * Get order details with items
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order with items
   */
  async getOrderWithItems(orderId) {
    try {
      const order = await OrderModel.findByPk(orderId, {
        include: [
          {
            model: OrderItemModel,
            as: 'items'
          }
        ]
      });
      
      if (!order) {
        throw createError('Order not found', 404);
      }
      
      return order;
    } catch (error) {
      this.logger.error({
        message: 'Error retrieving order with items',
        error,
        data: { 
          orderId,
          errorMessage: error.message
        }
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new OrderService();
