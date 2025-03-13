const axios = require('axios');
const logger = require('../utils/logger');

class PrintifyService {
    constructor() {
        this.apiKey = process.env.PRINTIFY_API_KEY;
        this.baseURL = 'https://api.printify.com/v1';
        this.logger = logger.child({ component: 'PrintifyService' });
        
        // Validate API key on initialization
        if (!this.apiKey) {
            this.logger.error('PRINTIFY_API_KEY is not set in environment variables');
            console.error('ERROR: PRINTIFY_API_KEY environment variable is not set!');
        }
        
        // Always use HTTPS for Printify API
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                // Add additional headers that might help with API requests
                'User-Agent': 'ILYTAT_Designs/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000, // Increased from 10s to 30s
            // Ensure we're not following redirects that might lead to unsecured URLs
            maxRedirects: 5
        });
        
        // Configure retry logic for network issues
        this.maxRetries = 3;
        this.retryDelay = 1000; // Start with 1 second delay
        
        // Log the initialization
        this.logger.info('PrintifyService initialized', {
            baseURL: this.baseURL,
            hasApiKey: !!this.apiKey
        });
    }

    /**
     * Makes a request to the API with retry logic for network errors
     * @param {Function} requestFn - Function that returns a promise for the request
     * @param {string} operation - Name of the operation for logging
     * @returns {Promise<any>} API response data
     * @private
     */
    async _makeRequestWithRetry(requestFn, operation) {
        let lastError;
        let retries = 0;

        while (retries <= this.maxRetries) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                // Only retry on network errors, not API errors
                if (error.request && !error.response && retries < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, retries); // Exponential backoff
                    this.logger.warn(`Network error during ${operation}, retrying in ${delay}ms (${retries + 1}/${this.maxRetries})`, {
                        error: error.message
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                } else {
                    // Non-retryable error or max retries reached
                    break;
                }
            }
        }
        
        // If we get here, all retries failed or error wasn't retryable
        throw lastError;
    }

    /**
     * Get all shops associated with the account
     * @returns {Promise<Array>} List of shops
     */
    async getShops() {
        try {
            this._validateApiKey();
            this.logger.info('Fetching shops from Printify API');
            
            const response = await this._makeRequestWithRetry(
                () => this.client.get('/shops.json'),
                'getShops'
            );
            
            this.logger.info(`Successfully retrieved ${response.data.length || 0} shops`);
            return response.data;
        } catch (error) {
            this.logger.error('Error fetching shops from Printify API', { error: error.message });
            throw this._handleError(error, 'getShops');
        }
    }

    /**
     * Get all products for a specific shop
     * @param {string} shopId - The ID of the shop
     * @returns {Promise<Array>} List of products
     */
    async getProducts(shopId) {
        try {
            this._validateApiKey();
            this._validateParameter('shopId', shopId);
            this.logger.info(`Fetching products for shop ${shopId}`);
            
            const response = await this._makeRequestWithRetry(
                () => this.client.get(`/shops/${shopId}/products.json`),
                'getProducts'
            );
            
            // Enhanced logging to debug response structure
            this.logger.debug('Raw Printify API response for products', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data,
                dataType: typeof response.data,
                isArray: Array.isArray(response.data),
                dataKeys: typeof response.data === 'object' ? Object.keys(response.data) : []
            });
            
            // Handle different response formats from Printify API
            let products = [];
            
            if (Array.isArray(response.data)) {
                // Direct array response
                products = response.data;
            } else if (typeof response.data === 'object' && response.data !== null) {
                // Object response, check for nested data array (common API pattern)
                if (response.data.data && Array.isArray(response.data.data)) {
                    this.logger.info('Using products from response.data.data structure', {
                        count: response.data.data.length
                    });
                    products = response.data.data;
                } else {
                    // No recognized structure, log and return empty array
                    this.logger.warn('Unrecognized Printify API response structure for products', {
                        shopId,
                        responseShape: JSON.stringify(Object.keys(response.data))
                    });
                    products = [];
                }
            }
            
            this.logger.info(`Successfully retrieved ${products.length} products for shop ${shopId}`);
            return products;
        } catch (error) {
            // Enhanced error handling with security-specific checks
            this.logger.error(`Error fetching products for shop ${shopId}`, { 
                error: error.message,
                stack: error.stack,
                // Add detailed information about the request context
                context: {
                    url: `${this.baseURL}/shops/${shopId}/products.json`,
                    protocol: this.baseURL.startsWith('https') ? 'https' : 'http',
                    statusCode: error.response?.status,
                    statusText: error.response?.statusText,
                    // Don't log the full API key, but indicate if it's present
                    hasApiKey: !!this.apiKey,
                    responseData: error.response?.data ? JSON.stringify(error.response.data).substring(0, 500) : null
                }
            });
            
            // Special handling for common security-related errors
            if (error.response) {
                const { status } = error.response;
                if (status === 403) {
                    this.logger.warn('Possible security-related issue with Printify API - access forbidden', {
                        shopId,
                        status,
                        usingHttps: this.baseURL.startsWith('https')
                    });
                } else if (status === 401) {
                    this.logger.warn('Authentication issue with Printify API - check your API key', {
                        shopId,
                        status,
                        apiKeyLength: this.apiKey ? this.apiKey.length : 0
                    });
                } else if (status === 426) {
                    this.logger.warn('API requires HTTPS upgrade', {
                        shopId,
                        status,
                        currentProtocol: this.baseURL.split(':')[0]
                    });
                }
            }
            
            throw this._handleError(error, 'getProducts');
        }
    }

    /**
     * Get a specific product's details
     * @param {string} shopId - The ID of the shop
     * @param {string} productId - The ID of the product
     * @returns {Promise<Object>} Product details
     */
    async getProduct(shopId, productId) {
        try {
            this._validateApiKey();
            this._validateParameter('shopId', shopId);
            this._validateParameter('productId', productId);
            this.logger.info(`Fetching product ${productId} from shop ${shopId}`);
            
            const response = await this._makeRequestWithRetry(
                () => this.client.get(`/shops/${shopId}/products/${productId}.json`),
                'getProduct'
            );
            
            this.logger.info(`Successfully retrieved product ${productId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching product ${productId} from shop ${shopId}`, { error: error.message });
            throw this._handleError(error, 'getProduct');
        }
    }

    /**
     * Get all orders for a shop
     * @param {string} shopId - The ID of the shop
     * @returns {Promise<Array>} List of orders
     */
    async getOrders(shopId) {
        try {
            this._validateApiKey();
            this._validateParameter('shopId', shopId);
            this.logger.info(`Fetching orders for shop ${shopId}`);
            
            const response = await this._makeRequestWithRetry(
                () => this.client.get(`/shops/${shopId}/orders.json`),
                'getOrders'
            );
            
            this.logger.info(`Successfully retrieved ${response.data.length || 0} orders for shop ${shopId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching orders for shop ${shopId}`, { error: error.message });
            throw this._handleError(error, 'getOrders');
        }
    }

    /**
     * Create a new order
     * @param {string} shopId - The ID of the shop
     * @param {Object} orderData - The order data
     * @returns {Promise<Object>} Created order details
     */
    async createOrder(shopId, orderData) {
        try {
            this._validateApiKey();
            this._validateParameter('shopId', shopId);
            this._validateParameter('orderData', orderData);
            this.logger.info(`Creating order for shop ${shopId}`);
            
            const response = await this._makeRequestWithRetry(
                () => this.client.post(`/shops/${shopId}/orders.json`, orderData),
                'createOrder'
            );
            
            this.logger.info(`Successfully created order ${response.data.id}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error creating order for shop ${shopId}`, { error: error.message });
            throw this._handleError(error, 'createOrder');
        }
    }

    /**
     * Validate that the API key is set
     * @private
     * @throws {Error} If API key is not set
     */
    _validateApiKey() {
        if (!this.apiKey) {
            throw new Error('Printify API key is not configured. Please set the PRINTIFY_API_KEY environment variable.');
        }
    }

    /**
     * Validate a required parameter
     * @private
     * @param {string} name - Parameter name
     * @param {any} value - Parameter value
     * @throws {Error} If parameter is not valid
     */
    _validateParameter(name, value) {
        if (value === undefined || value === null) {
            throw new Error(`Required parameter '${name}' is missing`);
        }
        
        if (name === 'shopId' && typeof value !== 'string') {
            throw new Error(`Shop ID must be a string, received ${typeof value}`);
        }
    }

    /**
     * Handle API errors
     * @private
     * @param {Error} error - The error object from axios
     * @param {string} operation - The operation that failed
     * @returns {Error} Formatted error object
     */
    _handleError(error, operation) {
        if (error.response) {
            const { status, data } = error.response;
            
            // Handle specific error codes
            if (status === 401) {
                return new Error(`Printify API Authentication failed: Invalid or missing API key. Please check your PRINTIFY_API_KEY environment variable.`);
            } else if (status === 403) {
                return new Error(`Printify API Access denied: Your account does not have permission to perform this operation.`);
            } else if (status === 404) {
                return new Error(`Printify API Resource not found: The requested resource does not exist.`);
            } else if (status === 429) {
                return new Error(`Printify API Rate limit exceeded: Too many requests. Please try again later.`);
            }
            
            return new Error(`Printify API Error during ${operation}: ${status} - ${JSON.stringify(data)}`);
        } else if (error.request) {
            // Request was made but no response received
            return new Error(`Printify API No response: The request was made but no response was received. Check your network connection.`);
        }
        
        // Something else caused the error
        return new Error(`Printify Service Error during ${operation}: ${error.message}`);
    }
}

module.exports = new PrintifyService();
