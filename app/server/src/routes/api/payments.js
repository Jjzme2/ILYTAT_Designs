const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentController');
const { authenticateToken } = require('../../middleware/auth');
const rawBodyMiddleware = require('../../middleware/rawBodyMiddleware');

/**
 * Payment Routes
 * Handles all Stripe payment processing endpoints
 */

// Create checkout session
router.post('/create-checkout', authenticateToken, paymentController.createCheckoutSession);

// Get user's order history
router.get('/orders', authenticateToken, paymentController.getUserOrderHistory);

// Success and cancel endpoints for Stripe redirection
router.get('/success', paymentController.handlePaymentSuccess);
router.get('/cancel', paymentController.handlePaymentCancel);

// Get order details by session ID
router.get('/order/:sessionId', paymentController.getOrderBySessionId);

// Webhook handler - needs raw body for Stripe signature verification
router.post(
  '/webhook', 
  rawBodyMiddleware, 
  paymentController.handleStripeWebhook
);

module.exports = router;
