const printifyService = require('../services/printifyService');
const featuredProductService = require('../services/featuredProductService');
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
        const { featured, bestSelling, includeHidden } = req.query;
        
        // Log request with query parameters
        this.logger.info(
            this.logger.response.business({
                message: 'Fetching public products',
                data: {
                    shopId: process.env.DEFAULT_PRINTIFY_SHOP_ID,
                    featured: featured === 'true',
                    bestSelling: bestSelling === 'true',
                    includeHidden: includeHidden === 'true'
                }
            }).withRequestDetails(req)
        );
        
        // Get configured default shop ID from environment or config
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // If we need featured or best-selling products, get their IDs first
        let featuredProductIds = [];
        let bestSellingProductIds = [];
        
        if (featured === 'true') {
            featuredProductIds = await featuredProductService.getFeaturedProducts();
            this.logger.info(`Retrieved ${featuredProductIds.length} featured product IDs`);
        }
        
        if (bestSelling === 'true') {
            bestSellingProductIds = await featuredProductService.getBestSellingProducts();
            this.logger.info(`Retrieved ${bestSellingProductIds.length} best-selling product IDs`);
        }
        
        // Get products and filter only published ones
        const products = await printifyService.getProducts(shopId);
        
        // Defensive check - ensure products is an array
        if (!Array.isArray(products)) {
            this.logger.warn(`Products returned from API is not an array: ${typeof products}`, {
                shopId,
                productsType: typeof products,
                productsValue: products
            });

            // Add more detailed debugging to see the full API response structure
            this.logger.debug("Detailed API response debugging", {
                shopId, 
                responseType: typeof products,
                isNull: products === null,
                isUndefined: products === undefined,
                hasData: products && typeof products === 'object',
                keys: products && typeof products === 'object' ? Object.keys(products) : [],
                stringified: JSON.stringify(products, null, 2)
            });
            
            // Return empty array with a message
            return res.sendSuccess(
                [], 
                'No products available at this time'
            );
        }
        
        // CRITICAL FIX: Strictly filter by visible flag, no exceptions unless explicitly requested
        const publishedProducts = includeHidden === 'true' 
            ? products 
            : products.filter(product => product.visible === true);

        // Add debugging to understand why no products are considered published
        if (products.length > 0 && publishedProducts.length === 0) {
            // Log information about the first few products to understand their structure
            this.logger.debug('Product publication debug info', {
                totalProducts: products.length,
                publishedProducts: publishedProducts.length,
                sampleProductKeys: Object.keys(products[0]),
                // Check different possible publication status fields
                sampleProduct: {
                    id: products[0].id,
                    title: products[0].title,
                    isPublished: products[0].is_published,
                    published: products[0].published,
                    status: products[0].status,
                    visible: products[0].visible,
                    publishStatus: products[0].publish_status
                }
            });
        }

        // Remove fallback to alternative fields - we want strict control over visibility
        if (!publishedProducts || publishedProducts.length === 0) {
            this.logger.info('No published products found with visible=true', { shopId });
            // Instead of throwing an error, return empty array with a message
            return res.sendSuccess(
                [], 
                'No published products found'
            );
        }

        // Apply filtering based on query parameters
        let filteredProducts = publishedProducts;
        
        // Filter for featured products
        if (featured === 'true') {
            this.logger.info('Filtering for featured products');
            
            if (featuredProductIds.length > 0) {
                // If we have explicit featured products in our database, prioritize those
                filteredProducts = filteredProducts.filter(product => 
                    featuredProductIds.includes(product.id)
                );
                
                this.logger.info(`Found ${filteredProducts.length} featured products from database`);
            } else {
                // Fallback to tag-based filtering only if we don't have any in the database
                const taggedFeatured = filteredProducts.filter(product => 
                    (product.tags && product.tags.includes('featured')) || 
                    product.featured === true || 
                    product.is_featured === true
                );
                
                if (taggedFeatured.length > 0) {
                    filteredProducts = taggedFeatured;
                    this.logger.info(`Found ${filteredProducts.length} products with featured tags/properties`);
                }
            }
            
            if (filteredProducts.length === 0) {
                this.logger.info('No featured products found');
                return res.sendSuccess([], 'No featured products found');
            }
        }
        
        // Filter for best-selling products
        if (bestSelling === 'true') {
            this.logger.info('Filtering for best-selling products');
            
            if (bestSellingProductIds.length > 0) {
                // If we have explicit best-selling products in our database, prioritize those
                filteredProducts = filteredProducts.filter(product => 
                    bestSellingProductIds.includes(product.id)
                );
                
                this.logger.info(`Found ${filteredProducts.length} best-selling products from database`);
            } else {
                // Fallback to tag-based filtering only if we don't have any in the database
                const taggedBestSellers = filteredProducts.filter(product => 
                    (product.tags && (product.tags.includes('best-seller') || product.tags.includes('bestseller'))) || 
                    product.best_seller === true || 
                    product.is_best_seller === true
                );
                
                if (taggedBestSellers.length > 0) {
                    filteredProducts = taggedBestSellers;
                    this.logger.info(`Found ${filteredProducts.length} products with best-seller tags/properties`);
                } else {
                    // If no products are explicitly marked as best-sellers, we'll simulate by taking the top N
                    // In a real implementation, this would be based on actual sales data
                    const TOP_N = 8; // Number of products to consider as "best-selling"
                    filteredProducts = filteredProducts.slice(0, Math.min(TOP_N, filteredProducts.length));
                    this.logger.info(`No products explicitly marked as best-sellers, returning top ${filteredProducts.length} products`);
                }
            }
            
            if (filteredProducts.length === 0) {
                this.logger.info('No best-selling products found');
                return res.sendSuccess([], 'No best-selling products found');
            }
        }

        // Return only necessary product information for the public
        return this._formatAndReturnProducts(filteredProducts, res, startTime);
    });
    
    /**
     * Format and return products in a standardized way
     * @private
     */
    _formatAndReturnProducts(products, res, startTime) {
        // Filter for only published/visible products
        const visibleProducts = products.filter(product => product.visible === true);
        
        // Debug log to check products before mapping
        this.logger.debug('Products before formatting', {
            totalProductsCount: products.length,
            visibleProductsCount: visibleProducts.length,
            firstProductSample: visibleProducts.length > 0 ? {
                id: visibleProducts[0].id,
                title: visibleProducts[0].title,
                hasImages: Array.isArray(visibleProducts[0].images),
                hasVariants: Array.isArray(visibleProducts[0].variants)
            } : null
        });

        const publicProducts = visibleProducts.map(product => {
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

        // Debug log to check public products after mapping
        this.logger.debug('Public products after formatting', {
            count: publicProducts.length,
            sample: publicProducts.length > 0 ? {
                id: publicProducts[0].id,
                title: publicProducts[0].title,
                priceRange: publicProducts[0].priceRange,
                imagesCount: publicProducts[0].images.length,
                variantsCount: publicProducts[0].variants.length
            } : null
        });

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

        // Use APIResponse class directly if sendSuccess doesn't work
        const APIResponse = require('../utils/apiResponse');
        
        // Return a properly structured response with the products data
        return res.status(200).json(APIResponse.success({
            data: publicProducts,
            message: 'Products retrieved successfully',
            requestId: res.req ? res.req.requestId : ('manual-id-' + Date.now())
        }));
    }

    /**
     * Get a specific public product
     * @route GET /api/printify/products/:productId
     * @public
     */
    getPublicProduct = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { productId } = req.params;
        const { allowHidden } = req.query;
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Log request
        this.logger.info(
            this.logger.response.business({
                message: 'Fetching single public product',
                data: {
                    shopId,
                    productId,
                    allowHidden: allowHidden === 'true'
                }
            }).withRequestDetails(req)
        );
        
        try {
            // Call Printify API through our service
            this.logger.debug(`Calling printifyService.getProduct with shopId=${shopId}, productId=${productId}`);
            const product = await printifyService.getProduct(shopId, productId);
            
            // Enhanced debugging to see what we're getting from the service
            this.logger.debug('Product data received from printifyService:', {
                productId,
                productExists: !!product,
                productType: typeof product,
                hasError: product && product._error ? true : false,
                isVisible: product ? product.visible : 'unknown',
                productKeys: product ? Object.keys(product) : [],
                productDataPreview: product ? JSON.stringify(product).substring(0, 500) : 'null'
            });
    
            // If product is completely missing, handle this case specifically
            if (!product) {
                this.logger.warn(`Product ${productId} not found in shop ${shopId}`);
                // Instead of throwing error, return an empty object with our enhanced response system
                return res.sendSuccess(
                    {}, // Empty object instead of null
                    'Product not found', 
                    404
                );
            }
            
            // Check for error indicator from printifyService
            if (product._error) {
                this.logger.error(`Error from printifyService: ${product._error}`, {
                    errorDetails: product
                });
                return res.sendError(
                    null,
                    product._error, 
                    product._statusCode || 500
                );
            }
            
            // NEW: Check if product is not visible and hidden products are not allowed
            if (!product.visible && allowHidden !== 'true') {
                this.logger.warn(`Product ${productId} is not visible and hidden viewing is not allowed`);
                return res.sendSuccess(
                    {}, 
                    'Product not available for viewing', 
                    403
                );
            }
    
            // Return complete product information necessary for the detail view
            const publicProduct = {
                id: product.id || productId,
                title: product.title || 'Untitled Product',
                description: product.description || '',
                images: Array.isArray(product.images) ? product.images : [],
                variants: Array.isArray(product.variants) 
                    ? product.variants.map(variant => ({
                        id: variant.id,
                        title: variant.title || 'Default Variant',
                        price: variant.price || 0,
                        sku: variant.sku || '',
                        is_available: variant.is_available !== false, // Default to true
                        compare_at: variant.compare_at || null
                    })) 
                    : [],
                options: Array.isArray(product.options) ? product.options : [],
                tags: Array.isArray(product.tags) ? product.tags : [],
                created_at: product.created_at || new Date().toISOString(),
                updated_at: product.updated_at || product.created_at || new Date().toISOString(),
                category: this._extractCategory(product),
                shipping: 'Standard shipping (7-14 business days)',
                metadata: product.metadata || {}
            };
    
            // Calculate price range if we have variants
            if (publicProduct.variants.length > 0) {
                const prices = publicProduct.variants
                    .filter(v => v.is_available !== false)
                    .map(v => parseFloat(v.price));
                    
                if (prices.length > 0) {
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    
                    publicProduct.priceRange = minPrice === maxPrice 
                        ? `$${minPrice.toFixed(2)}` 
                        : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
                } else {
                    publicProduct.priceRange = 'Price unavailable';
                }
            } else {
                publicProduct.priceRange = 'Price unavailable';
            }
    
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
                    duration: req.getElapsedTime ? req.getElapsedTime() : (Date.now() - startTime)
                })
            );
    
            // Special handling specifically for the public product endpoint
            // Direct response to avoid any issues with the response formatter
            return res.status(200).json({
                success: true,
                data: publicProduct,
                message: 'Product retrieved successfully',
                error: null
            });
        } catch (error) {
            // Log the error for debugging
            this.logger.error(`Error fetching product ${productId}:`, {
                error: error.message,
                stack: error.stack,
                shopId,
                productId
            });
            
            // Instead of letting the error propagate, handle it here and return a safe response
            return res.sendSuccess(
                {}, // Empty object instead of null
                'Error retrieving product', 
                500
            );
        }
    });

    /**
     * Extract category from product tags or metadata
     * @private
     */
    _extractCategory(product) {
        // Check if we have a category in metadata
        if (product.metadata && product.metadata.category) {
            return product.metadata.category;
        }

        // Default categories to check in tags
        const categoryTags = ['clothing', 'accessories', 'home-decor', 'wall-art'];
        
        // Check if any of the product tags match our category list
        if (Array.isArray(product.tags)) {
            for (const tag of product.tags) {
                if (categoryTags.includes(tag.toLowerCase())) {
                    // Convert to title case for display
                    return tag.charAt(0).toUpperCase() + tag.slice(1);
                }
            }
        }
        
        // Default category
        return 'Other';
    }

    /**
     * Get product categories
     * @route GET /api/printify/categories
     * @public
     */
    getCategories = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        // Log request
        this.logger.info(
            this.logger.response.business({
                message: 'Fetching product categories',
            }).withRequestDetails(req)
        );
        
        // For now, return predefined categories
        // In a production environment, this would come from Printify or your database
        const categories = [
            { id: 'clothing', name: 'Clothing', count: 0 },
            { id: 'accessories', name: 'Accessories', count: 0 },
            { id: 'home-decor', name: 'Home Decor', count: 0 },
            { id: 'wall-art', name: 'Wall Art', count: 0 }
        ];
        
        // Count products in each category from default shop
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        const products = await printifyService.getProducts(shopId);
        
        // Defensive check - ensure products is an array
        if (Array.isArray(products)) {
            // Update category counts only if products is an array
            products.forEach(product => {
                const productTags = product.tags || [];
                categories.forEach(category => {
                    if (productTags.includes(category.id)) {
                        category.count++;
                    }
                });
            });
        } else {
            this.logger.warn(`Products returned from API is not an array: ${typeof products}`, {
                shopId,
                productsType: typeof products,
                productsValue: products
            });

            // Add more detailed debugging to see the full API response structure
            this.logger.debug("Detailed API response debugging", {
                shopId, 
                responseType: typeof products,
                isNull: products === null,
                isUndefined: products === undefined,
                hasData: products && typeof products === 'object',
                keys: products && typeof products === 'object' ? Object.keys(products) : [],
                stringified: JSON.stringify(products, null, 2)
            });
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Product categories fetched successfully',
                data: {
                    count: categories.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            categories, 
            'Categories retrieved successfully',
            200
        );
    });
    
    /**
     * Search for products
     * @route GET /api/printify/search
     * @public
     */
    searchProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { query, category, sort, page = 1, limit = 20 } = req.query;
        
        // Log search request
        this.logger.info(
            this.logger.response.business({
                message: 'Searching products',
                data: { query, category, sort, page, limit }
            }).withRequestDetails(req)
        );
        
        // Get all products from default shop
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        const allProducts = await printifyService.getProducts(shopId);
        
        // Filter products by query and category
        let filteredProducts = allProducts.filter(product => {
            // Only include published products
            if (!product.visible) return false;
            
            // Filter by search query
            const matchesQuery = !query || 
                product.title.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase());
                
            // Filter by category
            const matchesCategory = !category || 
                (product.tags && product.tags.includes(category));
                
            return matchesQuery && matchesCategory;
        });
        
        // Sort products
        if (sort) {
            switch(sort) {
                case 'price-asc':
                    filteredProducts.sort((a, b) => {
                        const aPrice = a.variants[0]?.price || 0;
                        const bPrice = b.variants[0]?.price || 0;
                        return aPrice - bPrice;
                    });
                    break;
                case 'price-desc':
                    filteredProducts.sort((a, b) => {
                        const aPrice = a.variants[0]?.price || 0;
                        const bPrice = b.variants[0]?.price || 0;
                        return bPrice - aPrice;
                    });
                    break;
                case 'newest':
                    filteredProducts.sort((a, b) => {
                        return new Date(b.created_at) - new Date(a.created_at);
                    });
                    break;
                case 'oldest':
                    filteredProducts.sort((a, b) => {
                        return new Date(a.created_at) - new Date(b.created_at);
                    });
                    break;
            }
        }
        
        // Paginate results
        const totalCount = filteredProducts.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        // Map to public product format
        const results = paginatedProducts.map(product => ({
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
                message: 'Product search completed successfully',
                data: {
                    totalCount,
                    returnedCount: results.length,
                    page,
                    limit
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess({
            results,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)
            }
        }, 'Search completed successfully', 200);
    });

    /**
     * Get shop details
     * @route GET /api/printify/admin/shops/:shopId
     * @access Admin only
     */
    getShopDetails = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { shopId } = req.params;
        
        // Log admin request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching shop details',
                data: {
                    adminId: req.user.id,
                    shopId
                }
            }).withRequestDetails(req)
        );
        
        // Call Printify API
        const shop = await printifyService.getShopDetails(shopId);

        if (!shop) {
            throw createNotFoundError('Shop', shopId, 'Shop not found');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Shop details fetched successfully',
                data: {
                    shopId: shop.id,
                    title: shop.title
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            shop, 
            'Shop details retrieved successfully',
            200
        );
    });

    /**
     * Get customer orders
     * @route GET /api/printify/customer/orders
     * @access Authenticated user
     */
    getCustomerOrders = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const userId = req.user.id;
        
        // Log request
        this.logger.info(
            this.logger.response.business({
                message: 'Customer fetching own orders',
                data: { userId }
            }).withRequestDetails(req)
        );
        
        // Get orders for user from database or service
        // In a real implementation, this would filter orders based on the user ID
        const userOrders = await printifyService.getUserOrders(userId);

        if (!userOrders || userOrders.length === 0) {
            return res.sendSuccess([], 'No orders found for this customer', 200);
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Customer orders fetched successfully',
                data: {
                    userId,
                    count: userOrders.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            userOrders, 
            'Orders retrieved successfully',
            200
        );
    });

    /**
     * Get order details
     * @route GET /api/printify/customer/orders/:orderId
     * @access Authenticated user (own orders)
     */
    getOrderDetails = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { orderId } = req.params;
        const userId = req.user.id;
        
        // Log request
        this.logger.info(
            this.logger.response.business({
                message: 'Customer fetching order details',
                data: { userId, orderId }
            }).withRequestDetails(req)
        );
        
        // Get specific order
        const order = await printifyService.getOrderById(orderId);

        if (!order) {
            throw createNotFoundError('Order', orderId, 'Order not found');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Order details fetched successfully',
                data: {
                    orderId: order.id,
                    status: order.status
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            order, 
            'Order details retrieved successfully',
            200
        );
    });

    /**
     * Helper method to get order by ID
     * Used by the permission check middleware
     */
    getOrderById = async (orderId) => {
        try {
            // This would connect to your database or service to get an order
            return await printifyService.getOrderById(orderId);
        } catch (error) {
            this.logger.error('Error fetching order by ID:', error);
            return null;
        }
    };

    /**
     * Get admin product list
     * @route GET /api/printify/admin/products
     * @access Admin only
     */
    getAdminProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const shopId = req.query.shopId || process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Log admin request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching products',
                data: {
                    adminId: req.user.id,
                    shopId
                }
            }).withRequestDetails(req)
        );
        
        // Get all products (including unpublished)
        const products = await printifyService.getProducts(shopId);

        if (!products || products.length === 0) {
            throw createNotFoundError('Products', null, 'No products found for this shop');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Admin products fetched successfully',
                data: {
                    shopId,
                    count: products.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            products, 
            'Admin products retrieved successfully',
            200
        );
    });

    /**
     * Get admin product detail
     * @route GET /api/printify/admin/products/:productId
     * @access Admin only
     */
    getAdminProductDetail = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { productId } = req.params;
        const shopId = req.query.shopId || process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Log admin request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching product details',
                data: {
                    adminId: req.user.id,
                    shopId,
                    productId
                }
            }).withRequestDetails(req)
        );
        
        // Get full product details
        const product = await printifyService.getProduct(shopId, productId);

        if (!product) {
            throw createNotFoundError('Product', productId, 'Product not found');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Admin product details fetched successfully',
                data: {
                    productId: product.id,
                    title: product.title
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            product, 
            'Admin product details retrieved successfully',
            200
        );
    });

    /**
     * Get admin order detail
     * @route GET /api/printify/admin/orders/:orderId
     * @access Admin only
     */
    getAdminOrderDetail = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { orderId } = req.params;
        
        // Log admin request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin fetching order details',
                data: {
                    adminId: req.user.id,
                    orderId
                }
            }).withRequestDetails(req)
        );
        
        // Get full order details
        const order = await printifyService.getOrderById(orderId);

        if (!order) {
            throw createNotFoundError('Order', orderId, 'Order not found');
        }

        // Log successful response
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Admin order details fetched successfully',
                data: {
                    orderId: order.id,
                    status: order.status
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );

        return res.sendSuccess(
            order, 
            'Admin order details retrieved successfully',
            200
        );
    });

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
            'Shops retrieved successfully',
            200
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
            'Orders retrieved successfully',
            200
        );
    });

    /**
     * Get upcoming products (products marked as not visible)
     * @route GET /api/printify/upcoming-products
     * @auth Required - Any authenticated user can access
     */
    getUpcomingProducts = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        // Log request info with user data from JWT token
        this.logger.info(
            this.logger.response.business({
                message: 'Fetching upcoming products (preview)',
                data: {
                    shopId: process.env.DEFAULT_PRINTIFY_SHOP_ID,
                    userId: req.user?.id || 'unknown'
                }
            }).withRequestDetails(req)
        );
        
        // Get configured default shop ID from environment or config
        const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
        
        // Get all products
        const products = await printifyService.getProducts(shopId);
        
        // Defensive check - ensure products is an array
        if (!Array.isArray(products)) {
            this.logger.warn(`Products returned from API is not an array: ${typeof products}`);
            return res.sendSuccess([], 'No upcoming products available');
        }
        
        // Ensure each product has the expected structure before filtering
        const validProducts = products.filter(product => product && typeof product === 'object');
        
        // Filter for products marked as not visible
        const upcomingProducts = validProducts.filter(product => product.visible === false);
        
        if (upcomingProducts.length === 0) {
            return res.sendSuccess([], 'No upcoming products found');
        }
        
        // Format and return the upcoming products
        const formattedProducts = upcomingProducts.map(product => this._formatProduct(product));
        
        this.logger.info(`Found ${formattedProducts.length} upcoming products`);
        const responseTime = Date.now() - startTime;
        
        return res.sendSuccess(
            formattedProducts,
            'Upcoming products retrieved successfully',
            200,
            { responseTime: `${responseTime}ms` }
        );
    });

    _formatProduct(product) {
        // Defensive check - if product is null or not an object, return an empty product
        if (!product || typeof product !== 'object') {
            this.logger.warn('Attempted to format null or invalid product');
            return {
                id: 'unknown',
                title: 'Unknown Product',
                description: 'Product information unavailable',
                status: 'unavailable',
                images: [],
                variants: []
            };
        }
        
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
    }
}

// Export a singleton instance
module.exports = new PrintifyController();