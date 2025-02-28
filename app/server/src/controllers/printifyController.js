const printifyService = require('../services/printifyService');
const { catchAsync, createError, createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * PrintifyController handles the business logic for Printify-related operations
 * @module controllers/printifyController
 */
class PrintifyController {
    /**
     * Get all shops associated with the Printify account
     * @route GET /api/v1/shops
     */
    getShops = catchAsync(async (req, res) => {
        const shops = await printifyService.getShops();
        
        if (!shops || shops.length === 0) {
            throw createNotFoundError('No shops found');
        }

        res.status(200).json({
            success: true,
            data: shops
        });
    });

    /**
     * Get all products for a specific shop
     * @route GET /api/v1/shops/:shopId/products
     */
    getProducts = catchAsync(async (req, res) => {
        const { shopId } = req.params;
        const products = await printifyService.getProducts(shopId);

        if (!products || products.length === 0) {
            throw createNotFoundError('No products found for this shop');
        }

        res.status(200).json({
            success: true,
            data: products
        });
    });

    /**
     * Get specific product details
     * @route GET /api/v1/shops/:shopId/products/:productId
     */
    getProduct = catchAsync(async (req, res) => {
        const { shopId, productId } = req.params;
        const product = await printifyService.getProduct(shopId, productId);

        if (!product) {
            throw createNotFoundError('Product not found');
        }

        res.status(200).json({
            success: true,
            data: product
        });
    });

    /**
     * Get all orders for a shop
     * @route GET /api/v1/shops/:shopId/orders
     * @access Admin, Manager
     */
    getOrders = catchAsync(async (req, res) => {
        const { shopId } = req.params;
        const orders = await printifyService.getOrders(shopId);

        if (!orders || orders.length === 0) {
            throw createNotFoundError('No orders found for this shop');
        }

        res.status(200).json({
            success: true,
            data: orders
        });
    });

    /**
     * Create a new order
     * @route POST /api/v1/shops/:shopId/orders
     * @access Admin, Manager
     */
    createOrder = catchAsync(async (req, res) => {
        const { shopId } = req.params;
        const orderData = req.body;

        if (!orderData || Object.keys(orderData).length === 0) {
            throw createError('Order data is required', 400);
        }

        const order = await printifyService.createOrder(shopId, orderData);

        res.status(201).json({
            success: true,
            data: order
        });
    });
}

// Export a singleton instance
module.exports = new PrintifyController();
