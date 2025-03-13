/**
 * Printify API Routes
 * @module routes/api/printify
 * 
 * This module provides endpoints for interacting with the Printify API
 * - Public routes: Accessible without authentication (product browsing)
 * - Customer routes: Require basic authentication (order management)
 * - Admin routes: Require elevated permissions (shop management)
 */
const printifyController = require('../../controllers/printifyController');
const paymentController = require('../../controllers/paymentController');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');
const rawBodyMiddleware = require('../../middleware/rawBodyMiddleware');

/**
 * Route definitions for Printify API endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  // Public routes (no authentication required)
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:productId',
  CATEGORIES: '/categories',
  SEARCH: '/search',
  
  // Customer routes (requires authentication)
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_ORDER_DETAIL: '/customer/orders/:orderId',
  SHOPS: '/shops',
  SHOP_ORDERS: '/shops/:shopId/orders',
  
  // Payment routes
  PAYMENT_CHECKOUT: '/payment/create-checkout',
  PAYMENT_SUCCESS: '/payment/success', 
  PAYMENT_CANCEL: '/payment/cancel',
  PAYMENT_WEBHOOK: '/payment/webhook',
  
  // Admin routes (requires elevated permissions)
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_DETAIL: '/admin/products/:productId',
  ADMIN_SHOPS: '/admin/shops',
  ADMIN_SHOP_DETAIL: '/admin/shops/:shopId',
  ADMIN_SHOP_ORDERS: '/admin/shops/:shopId/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:orderId'
};

/**
 * Register Printify API routes with role-based permissions
 * @param {Express.Router} router - Express router instance
 */
const printifyRoutes = (router) => {
  // === PUBLIC ROUTES (No Authentication Required) ===
  
  // Get all published products
  router.get(ROUTES.PRODUCTS, printifyController.getPublicProducts);
  
  // Get single product details
  router.get(ROUTES.PRODUCT_DETAIL, printifyController.getPublicProduct);
  
  // Get product categories
  router.get(ROUTES.CATEGORIES, printifyController.getCategories);
  
  // Search products
  router.get(ROUTES.SEARCH, printifyController.searchProducts);

  // Payment success and cancel endpoints (public redirects from Stripe)
  router.get(ROUTES.PAYMENT_SUCCESS, paymentController.handlePaymentSuccess);
  router.get(ROUTES.PAYMENT_CANCEL, paymentController.handlePaymentCancel);
  
  // Webhook handler - secured by Stripe signature verification
  router.post(
    ROUTES.PAYMENT_WEBHOOK, 
    rawBodyMiddleware,
    paymentController.handleStripeWebhook
  );

  // === CUSTOMER ROUTES (Authentication Required) ===
  
  // Create checkout session
  router.post(
    ROUTES.PAYMENT_CHECKOUT, 
    authenticateToken,
    paymentController.createCheckoutSession
  );
  
  // Get customer's own orders
  router.get(
    ROUTES.CUSTOMER_ORDERS,
    authenticateToken,
    printifyController.getCustomerOrders
  );
  
  // Get customer's order detail
  router.get(
    ROUTES.CUSTOMER_ORDER_DETAIL,
    authenticateToken,
    checkPermission(PERMISSIONS.ORDER_READ, {
      resourceAccessCheck: async (req) => {
        // Allow user to access their own orders
        const order = await printifyController.getOrderById(req.params.orderId);
        return order && (order.customerId === req.user.id);
      }
    }),
    printifyController.getOrderDetails
  );
  
  // Get all shops (authenticated users)
  router.get(
    ROUTES.SHOPS, 
    authenticateToken,
    printifyController.getShops
  );
  
  // Get shop orders (authenticated users)
  router.get(
    ROUTES.SHOP_ORDERS, 
    authenticateToken,
    printifyController.getOrders
  );

  // === ADMIN ROUTES (Elevated Permissions Required) ===
  
  // Get all shops (admin only)
  router.get(
    ROUTES.ADMIN_SHOPS, 
    authenticateToken,
    checkPermission(PERMISSIONS.PRINTIFY_MANAGE),
    printifyController.getShops
  );
  
  // Get shop details (admin only)
  router.get(
    ROUTES.ADMIN_SHOP_DETAIL,
    authenticateToken,
    checkPermission(PERMISSIONS.PRINTIFY_MANAGE),
    printifyController.getShopDetails
  );

  // Get shop orders (admin only)
  router.get(
    ROUTES.ADMIN_SHOP_ORDERS, 
    authenticateToken,
    checkPermission(PERMISSIONS.PRINTIFY_MANAGE),
    printifyController.getOrders
  );
  
  // Get admin product list (admin only)
  router.get(
    ROUTES.ADMIN_PRODUCTS,
    authenticateToken,
    checkPermission(PERMISSIONS.PRINTIFY_MANAGE),
    printifyController.getAdminProducts
  );
  
  // Get admin product detail (admin only)
  router.get(
    ROUTES.ADMIN_PRODUCT_DETAIL,
    authenticateToken,
    checkPermission(PERMISSIONS.PRINTIFY_MANAGE),
    printifyController.getAdminProductDetail
  );
  
  // Get admin order detail (admin only)
  router.get(
    ROUTES.ADMIN_ORDER_DETAIL,
    authenticateToken,
    checkPermission(PERMISSIONS.PRINTIFY_MANAGE),
    printifyController.getAdminOrderDetail
  );
};

module.exports = printifyRoutes;