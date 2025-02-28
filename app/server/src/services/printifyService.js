const axios = require('axios');

class PrintifyService {
    constructor() {
        this.apiKey = process.env.PRINTIFY_API_KEY;
        this.baseURL = 'https://api.printify.com/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get all shops associated with the account
     * @returns {Promise<Array>} List of shops
     */
    async getShops() {
        try {
            const response = await this.client.get('/shops.json');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Get all products for a specific shop
     * @param {string} shopId - The ID of the shop
     * @returns {Promise<Array>} List of products
     */
    async getProducts(shopId) {
        try {
            const response = await this.client.get(`/shops/${shopId}/products.json`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
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
            const response = await this.client.get(`/shops/${shopId}/products/${productId}.json`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Get all orders for a shop
     * @param {string} shopId - The ID of the shop
     * @returns {Promise<Array>} List of orders
     */
    async getOrders(shopId) {
        try {
            const response = await this.client.get(`/shops/${shopId}/orders.json`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
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
            const response = await this.client.post(`/shops/${shopId}/orders.json`, orderData);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Handle API errors
     * @private
     * @param {Error} error - The error object from axios
     * @returns {Error} Formatted error object
     */
    _handleError(error) {
        if (error.response) {
            const { status, data } = error.response;
            return new Error(`Printify API Error: ${status} - ${JSON.stringify(data)}`);
        }
        return new Error(`Printify Service Error: ${error.message}`);
    }
}

module.exports = new PrintifyService();
