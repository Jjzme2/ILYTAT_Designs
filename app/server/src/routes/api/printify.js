const express = require('express');
const router = express.Router();
const printifyController = require('../../controllers/printifyController');
const paymentController = require('../../controllers/paymentController');
const { authenticateToken, authorize } = require('../../middleware/auth');

/**
 * Printify API Routes
 * @module routes/api/printify
 * 
 * Public routes are accessible without authentication
 * Admin routes require authentication and authorization
 */

// Public Routes
router.get('/products', printifyController.getPublicProducts);
router.get('/products/:productId', printifyController.getPublicProduct);

// Payment Routes
router.post('/payment/create-checkout', paymentController.createCheckoutSession);
router.get('/payment/success', paymentController.handlePaymentSuccess);
router.get('/payment/cancel', paymentController.handlePaymentCancel);
router.post('/payment/webhook', paymentController.handleStripeWebhook);

// Admin Routes (Protected)
router.get('/admin/shops', 
    authenticateToken,
    authorize(['admin']),
    printifyController.getShops
);

router.get('/admin/shops/:shopId/orders', 
    authenticateToken,
    authorize(['admin']),
    printifyController.getOrders
);

module.exports = router;