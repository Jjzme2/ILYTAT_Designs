const printifyService = require('../services/printifyService');
const { catchAsync, createError, createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * PrintifyController handles the business logic for Printify-related operations
 * @module controllers/printifyController
 */
class PrintifyController {
    constructor() {
        this.logger = logger.child({ component: 'PrintifyController' });
    }
    
    /**
     * Get public products from all shops
     * @route GET /api/printify/products
     * @public
     */
    getPublicProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        // Log request
        this.logger.info(
            this.logger.response.business({
                message: 'Fetching public products',
                data: {
                    shopId: process.env.DEFAULT_PRINTIFY_SHOP_ID
                }
            }).withRequestDetails(req)
        );
        
        // Get configured default shop ID from environment or config
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Get products and filter only published ones
        const products = await printifyService.getProducts(shopId);
        const publishedProducts = products.filter(product => product.is_published);

        if (!publishedProducts || publishedProducts.length === 0) {
            throw createNotFoundError('Products', null, 'No products found');
        }

        // Return only necessary product information for the public
        const publicProducts = publishedProducts.map(product => ({
            id: product.id,
            title: product.title,
            description: product.description,
            images: product.images,
            variants: product.variants.map(variant => ({
                id: variant.id,
                title: variant.title,
                price: variant.price,
                sku: variant.sku,
                is_available: variant.is_available
            })),
            tags: product.tags,
            created_at: product.created_at
        }));

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Public products fetched successfully',
                data: {
                    count: publicProducts.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            publicProducts, 
            'Products retrieved successfully'
        );
    });

    /**
     * Get a specific public product
     * @route GET /api/printify/products/:productId
     * @public
     */
    getPublicProduct = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { productId } = req.params;
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Log request
        this.logger.info(
            this.logger.response.business({
                message: 'Fetching single public product',
                data: {
                    shopId,
                    productId
                }
            }).withRequestDetails(req)
        );
        
        // Call Printify API through our service
        const product = await printifyService.getProduct(shopId, productId);

        if (!product || !product.is_published) {
            throw createNotFoundError('Product', productId, 'Product not found');
        }

        // Return public product information
        const publicProduct = {
            id: product.id,
            title: product.title,
            description: product.description,
            images: product.images,
            variants: product.variants.map(variant => ({
                id: variant.id,
                title: variant.title,
                price: variant.price,
                sku: variant.sku,
                is_available: variant.is_available
            })),
            options: product.options,
            tags: product.tags,
            created_at: product.created_at
        };

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Public product fetched successfully',
                data: {
                    productId: publicProduct.id,
                    title: publicProduct.title
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            publicProduct, 
            'Product retrieved successfully'
        );
    });

    // Admin endpoints below (protected)
    
    /**
     * Get all shops associated with the Printify account
     * @route GET /api/printify/admin/shops
     * @access Admin only
     */
    getShops = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        // Log admin request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching all Printify shops',
                data: {
                    adminId: req.user.id
                }
            }).withRequestDetails(req)
        );
        
        // Call Printify API
        const shops = await printifyService.getShops();
        
        if (!shops || shops.length === 0) {
            throw createNotFoundError('Shops', null, 'No shops found');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Printify shops fetched successfully',
                data: {
                    count: shops.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            shops, 
            'Shops retrieved successfully'
        );
    });

    /**
     * Get all orders for a shop
     * @route GET /api/printify/admin/shops/:shopId/orders
     * @access Admin only
     */
    getOrders = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { shopId } = req.params;
        
        // Log admin request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching orders for shop',
                data: {
                    adminId: req.user.id,
                    shopId
                }
            }).withRequestDetails(req)
        );
        
        // Call Printify API
        const orders = await printifyService.getOrders(shopId);

        if (!orders || orders.length === 0) {
            throw createNotFoundError('Orders', null, 'No orders found for this shop');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Shop orders fetched successfully',
                data: {
                    shopId,
                    count: orders.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            orders, 
            'Orders retrieved successfully'
        );
    });
}

// Export a singleton instance
module.exports = new PrintifyController();