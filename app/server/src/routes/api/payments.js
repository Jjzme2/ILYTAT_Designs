/**
 * Payment Routes
 * Provides endpoints for payment processing with role-based access control
 * @module routes/api/payments
 */
const paymentController = require('../../controllers/paymentController');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');
const rawBodyMiddleware = require('../../middleware/rawBodyMiddleware');

/**
 * Route definitions for payment endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  // Customer endpoints
  CREATE_CHECKOUT: '/create-checkout',
  ORDERS: '/orders',
  USER_ORDERS: '/user/:userId/orders',
  ORDER_BY_ID: '/order/:orderId',
  ORDER_BY_SESSION: '/order/:sessionId',
  SUCCESS: '/success',
  CANCEL: '/cancel',
  
  // Admin endpoints
  ALL_ORDERS: '/admin/orders',
  ORDER_STATS: '/admin/stats',
  REFUND: '/admin/refund/:orderId',
  
  // External integration
  WEBHOOK: '/webhook'
};

/**
 * Register payment routes with role-based permissions
 * @param {Express.Router} router - Express router instance
 */
const paymentRoutes = (router) => {
  // === USER PAYMENT ROUTES ===
  
  // Create checkout session (any authenticated user)
  router.post(
    ROUTES.CREATE_CHECKOUT, 
    authenticateToken, 
    paymentController.createCheckoutSession
  );

  // Get user's own order history
  router.get(
    ROUTES.ORDERS, 
    authenticateToken, 
    paymentController.getUserOrderHistory
  );

  // Success and cancel endpoints for Stripe redirection
  router.get(ROUTES.SUCCESS, paymentController.handlePaymentSuccess);
  router.get(ROUTES.CANCEL, paymentController.handlePaymentCancel);

  // Get order details by session ID (must be owner or admin)
  router.get(
    ROUTES.ORDER_BY_SESSION, 
    authenticateToken,
    checkPermission(PERMISSIONS.PAYMENT_READ, {
      resourceAccessCheck: async (req) => {
        // Allow user to access their own order
        const order = await paymentController.getOrderBySessionIdInternal(req.params.sessionId);
        return order && (order.userId === req.user.id);
      }
    }),
    paymentController.getOrderBySessionId
  );
  
  // === ADMIN PAYMENT ROUTES ===
  
  // Get any user's order history (admin only)
  router.get(
    ROUTES.USER_ORDERS,
    authenticateToken,
    checkPermission(PERMISSIONS.PAYMENT_MANAGE),
    paymentController.getUserOrdersByAdmin
  );
  
  // Get all orders (admin only)
  router.get(
    ROUTES.ALL_ORDERS,
    authenticateToken,
    checkPermission(PERMISSIONS.PAYMENT_MANAGE),
    paymentController.getAllOrders
  );
  
  // Get order statistics (admin only)
  router.get(
    ROUTES.ORDER_STATS,
    authenticateToken,
    checkPermission(PERMISSIONS.PAYMENT_MANAGE),
    paymentController.getOrderStatistics
  );
  
  // Process refund (admin only)
  router.post(
    ROUTES.REFUND,
    authenticateToken,
    checkPermission(PERMISSIONS.PAYMENT_REFUND),
    paymentController.processRefund
  );

  // === EXTERNAL INTEGRATION ROUTES ===
  
  // Webhook handler - needs raw body for Stripe signature verification
  // No authentication - secured by Stripe signature
  router.post(
    ROUTES.WEBHOOK, 
    rawBodyMiddleware, 
    paymentController.handleStripeWebhook
  );
};

module.exports = paymentRoutes;