/**
 * Featured Product Controller
 * 
 * This controller handles administrative operations for managing
 * featured and best-selling products.
 * 
 * @module controllers/featuredProductController
 */

const featuredProductService = require('../services/featuredProductService');
const printifyService = require('../services/printifyService');
const { catchAsync, createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const APIResponse = require('../utils/apiResponse');

class FeaturedProductController {
    constructor() {
        this.logger = logger.child({ component: 'FeaturedProductController' });
        
        // Bind methods
        this.getPublicFeaturedProducts = this.getPublicFeaturedProducts.bind(this);
        this.getPublicBestSellerProducts = this.getPublicBestSellerProducts.bind(this);
        this.getFeaturedProducts = this.getFeaturedProducts.bind(this);
        this.updateFeaturedProducts = this.updateFeaturedProducts.bind(this);
        this.toggleProductStatus = this.toggleProductStatus.bind(this);
        this._formatProducts = this._formatProducts.bind(this);
    }
    
    /**
     * Helper method to format products with proper price conversion and image handling
     * @private
     * @param {Array} products - Raw products from Printify API
     * @returns {Array} - Formatted products with proper pricing and images
     */
    _formatProducts(products) {
        // Filter for only published/visible products
        const visibleProducts = products.filter(product => product.visible === true);
        
        // Debug log to check products before mapping
        this.logger.debug('Products before formatting', {
            totalProductsCount: products.length,
            visibleProductsCount: visibleProducts.length
        });

        const formattedProducts = visibleProducts.map(product => {
            // Process images to ensure we have valid URLs
            const processedImages = Array.isArray(product.images) ? product.images.map(image => ({
                src: image.src,
                position: image.position || 'front',
                isDefault: image.isDefault || image.is_default || false,
                variantIds: image.variantIds || image.variant_ids || []
            })) : [];

            // Process variants and convert prices from cents to dollars
            const processedVariants = Array.isArray(product.variants) ? product.variants.map(variant => {
                // Check if price is already formatted as a string with a decimal point
                const priceAsFloat = typeof variant.price === 'string' && variant.price.includes('.')
                    ? parseFloat(variant.price)
                    : (variant.price / 100);

                return {
                    id: variant.id,
                    title: variant.title,
                    price: priceAsFloat.toFixed(2),
                    originalPrice: variant.originalPrice || variant.price, // Keep the original price in cents for reference
                    sku: variant.sku,
                    is_available: variant.is_available || true,
                    is_enabled: variant.is_enabled || true
                };
            }) : [];

            // Calculate price range if we have variants
            let priceRange = null;
            // First check if product already has a priceRange property
            if (product.priceRange) {
                priceRange = product.priceRange;
            } else if (processedVariants.length > 0) {
                const prices = processedVariants
                    .filter(v => v.is_enabled !== false)
                    .map(v => parseFloat(v.price));
                
                if (prices.length > 0) {
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    
                    priceRange = minPrice === maxPrice 
                        ? `$${minPrice.toFixed(2)}` 
                        : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
                }
            }

            // Return the formatted product object
            return {
                id: product.id,
                title: product.title,
                description: product.description,
                images: processedImages,
                variants: processedVariants,
                priceRange: priceRange, // Add a human-readable price range
                tags: product.tags || [],
                created_at: product.created_at,
                blueprint_id: product.blueprint_id,
                print_provider_id: product.print_provider_id
            };
        });

        // Debug log to check formatted products
        this.logger.debug('Products after formatting', {
            count: formattedProducts.length,
            sample: formattedProducts.length > 0 ? {
                id: formattedProducts[0].id,
                title: formattedProducts[0].title,
                priceRange: formattedProducts[0].priceRange,
                imagesCount: formattedProducts[0].images.length,
                variantsCount: formattedProducts[0].variants.length
            } : null
        });

        return formattedProducts;
    }

    /**
     * Get public featured products (no authentication required)
     * @route GET /api/featured-products/public
     */
    getPublicFeaturedProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        this.logger.info(
            this.logger.response.business({
                message: 'Public request for featured products',
            }).withRequestDetails(req)
        );
        
        // Get featured product IDs from our database
        const productIds = await featuredProductService.getFeaturedProducts();
        
        // Get shop ID for fetching product details
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Fetch product details for each product ID
        const productsDetails = [];
        for (const productId of productIds) {
            try {
                const product = await printifyService.getProduct(shopId, productId);
                if (product) {
                    productsDetails.push(product);
                }
            } catch (error) {
                this.logger.warn(`Error fetching product ${productId}`, { error: error.message });
                // Continue with other products even if one fails
            }
        }
        
        // Format the products with proper pricing and image handling
        const formattedProducts = this._formatProducts(productsDetails);
        
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Public featured products fetched successfully',
                data: {
                    totalIds: productIds.length,
                    retrievedProducts: productsDetails.length,
                    formattedProducts: formattedProducts.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
        
        return res.status(200).json(APIResponse.success({
            data: formattedProducts,
            message: 'Featured products retrieved successfully',
            requestId: req.requestId || ('featured-' + Date.now())
        }));
    });
    
    /**
     * Get public best-selling products (no authentication required)
     * @route GET /api/featured-products/public/bestsellers
     */
    getPublicBestSellerProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        this.logger.info(
            this.logger.response.business({
                message: 'Public request for best-seller products',
            }).withRequestDetails(req)
        );
        
        // Get best-selling product IDs from our database
        const productIds = await featuredProductService.getBestSellingProducts();
        
        // Get shop ID for fetching product details
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Fetch product details for each product ID
        const productsDetails = [];
        for (const productId of productIds) {
            try {
                const product = await printifyService.getProduct(shopId, productId);
                if (product) {
                    productsDetails.push(product);
                }
            } catch (error) {
                this.logger.warn(`Error fetching product ${productId}`, { error: error.message });
                // Continue with other products even if one fails
            }
        }
        
        // Format the products with proper pricing and image handling
        const formattedProducts = this._formatProducts(productsDetails);
        
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Public best-seller products fetched successfully',
                data: {
                    totalIds: productIds.length,
                    retrievedProducts: productsDetails.length,
                    formattedProducts: formattedProducts.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
        
        return res.status(200).json(APIResponse.success({
            data: formattedProducts,
            message: 'Best-seller products retrieved successfully',
            requestId: req.requestId || ('bestseller-' + Date.now())
        }));
    });

    /**
     * Get all featured products
     * @route GET /api/admin/featured-products
     */
    getFeaturedProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { type } = req.query;
        
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching featured products',
                data: { type }
            }).withRequestDetails(req)
        );
        
        let productIds;
        if (type === 'bestselling') {
            productIds = await featuredProductService.getBestSellingProducts();
        } else {
            productIds = await featuredProductService.getFeaturedProducts();
        }
        
        // Get shop ID for fetching product details
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Fetch product details for each product ID
        const productsDetails = [];
        for (const productId of productIds) {
            try {
                const product = await printifyService.getProduct(shopId, productId);
                if (product) {
                    productsDetails.push(product);
                }
            } catch (error) {
                this.logger.warn(`Error fetching product ${productId}`, { error: error.message });
                // Continue with other products even if one fails
            }
        }
        
        // Format the products with proper pricing and image handling
        const formattedProducts = this._formatProducts(productsDetails);
        
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Featured products fetched successfully',
                data: {
                    totalIds: productIds.length,
                    retrievedProducts: productsDetails.length,
                    formattedProducts: formattedProducts.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
        
        return res.status(200).json(APIResponse.success({
            data: formattedProducts,
            message: 'Featured products retrieved successfully',
            requestId: req.requestId || ('admin-featured-' + Date.now())
        }));
    });

    /**
     * Update featured products
     * @route POST /api/admin/featured-products
     */
    updateFeaturedProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { productIds, type } = req.body;
        const userId = req.user.id;
        
        if (!productIds || !Array.isArray(productIds)) {
            throw createError(400, 'Invalid request: productIds must be an array');
        }
        
        this.logger.info(
            this.logger.response.business({
                message: 'Admin updating featured products',
                data: { 
                    type, 
                    productCount: productIds.length,
                    userId
                }
            }).withRequestDetails(req)
        );
        
        let count;
        if (type === 'bestselling') {
            count = await featuredProductService.bulkSetBestSellingProducts(productIds, userId);
        } else {
            count = await featuredProductService.bulkSetFeaturedProducts(productIds, userId);
        }
        
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Featured products updated successfully',
                data: {
                    type,
                    updatedCount: count
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
        
        return res.status(200).json(APIResponse.success({
            data: { updatedCount: count },
            message: 'Featured products updated successfully',
            requestId: req.requestId || ('admin-featured-' + Date.now())
        }));
    });

    /**
     * Toggle a product's featured status
     * @route PUT /api/admin/featured-products/:productId
     */
    toggleProductStatus = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { productId } = req.params;
        const { featured, bestselling, displayOrder } = req.body;
        const userId = req.user.id;
        
        this.logger.info(
            this.logger.response.business({
                message: 'Admin toggling product featured status',
                data: { 
                    productId,
                    featured,
                    bestselling,
                    displayOrder,
                    userId
                }
            }).withRequestDetails(req)
        );
        
        let result = {};
        
        // Update featured status if specified
        if (featured !== undefined) {
            const featuredResult = await featuredProductService.setProductFeatured(
                productId, 
                featured, 
                displayOrder, 
                userId
            );
            result.featured = featured;
        }
        
        // Update bestselling status if specified
        if (bestselling !== undefined) {
            const bestsellingResult = await featuredProductService.setProductBestSeller(
                productId, 
                bestselling, 
                displayOrder, 
                userId
            );
            result.bestselling = bestselling;
        }
        
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Product featured status updated successfully',
                data: {
                    productId,
                    ...result
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
        
        return res.status(200).json(APIResponse.success({
            data: { 
                productId,
                ...result,
                displayOrder
            },
            message: 'Product featured status updated successfully',
            requestId: req.requestId || ('admin-featured-' + Date.now())
        }));
    });
}

module.exports = new FeaturedProductController();
