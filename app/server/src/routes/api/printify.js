const express = require('express');
const router = express.Router();
const printifyController = require('../../controllers/printifyController');
const { authenticateToken, authorize } = require('../../middleware/auth');

/**
 * Printify API Routes
 * @module routes/api/printify
 * 
 * All routes are protected by authentication middleware.
 * Some routes require additional authorization for admin access.
 */

// Shops
router.get('/shops', 
    authenticateToken,
  printifyController.getShops
);

// Products
router.get('/shops/:shopId/products', 
    authenticateToken,
  printifyController.getProducts
);

router.get('/shops/:shopId/products/:productId', 
    authenticateToken,
  printifyController.getProduct
);

// Orders
router.get('/shops/:shopId/orders', 
    authenticateToken,
  authorize(['admin', 'manager']),
  printifyController.getOrders
);

router.post('/shops/:shopId/orders', 
    authenticateToken,
  authorize(['admin', 'manager']),
  printifyController.createOrder
);

module.exports = router;
