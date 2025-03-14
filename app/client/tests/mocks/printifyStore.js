/**
 * Mock implementation of the Printify store for testing
 * This ensures proper state initialization and prevents undefined errors
 */
import { defineStore } from 'pinia';
import mockAxios from './axios';

// Create a mock Printify store with properly initialized state
export const usePrintifyStore = defineStore('printify', {
  state: () => ({
    // Initialize state with default values
    selectedProduct: null,
    products: [],
    shops: [], // Ensure this is defined to avoid 'shops is undefined' error
    recentOrders: [],
    totalProducts: 0,
    currentShop: null,
    
    // Loading states
    loading: {
      products: false,
      selectedProduct: false,
      shops: false,
      orders: false
    },
    
    // Error states
    error: {
      products: null,
      selectedProduct: null,
      shops: null,
      orders: null
    }
  }),
  
  actions: {
    // Mock product fetching action
    async fetchPublicProductById(productId) {
      if (!productId) {
        this.error.selectedProduct = 'No product ID provided';
        return;
      }
      
      this.loading.selectedProduct = true;
      this.error.selectedProduct = null;
      
      try {
        // For testing without API calls
        if (process.env.USE_MOCKS === 'true') {
          // Return a mock product
          this.selectedProduct = {
            id: productId,
            title: 'Mock Product',
            description: 'This is a mock product for testing',
            images: [{ src: 'https://example.com/image.jpg' }],
            variants: [],
            _fallback: false
          };
        } else {
          // Try to actually fetch from API
          try {
            const response = await mockAxios.get(`/api/printifyApi/public/products/${productId}`);
            if (response.data && response.data.success) {
              this.selectedProduct = response.data.data;
            } else {
              throw new Error('Invalid response format');
            }
          } catch (error) {
            console.error('Error fetching product:', error);
            // Create a fallback product when API fails
            this.selectedProduct = {
              id: productId,
              title: 'Product Not Found',
              description: 'Unable to load this product',
              _fallback: true,
              _reason: error.message || 'Unknown error'
            };
          }
        }
      } catch (error) {
        this.error.selectedProduct = error.message || 'Error fetching product';
        console.error('Error in fetchPublicProductById:', error);
      } finally {
        this.loading.selectedProduct = false;
      }
    },
    
    // Mock shops fetching action
    async fetchShops() {
      this.loading.shops = true;
      this.error.shops = null;
      
      try {
        if (process.env.USE_MOCKS === 'true') {
          // Return mock shops data
          this.shops = [
            { id: 'shop1', title: 'Test Shop 1', store_type: 'shopify' },
            { id: 'shop2', title: 'Test Shop 2', store_type: 'etsy' }
          ];
        } else {
          try {
            const response = await mockAxios.get('/api/printifyApi/admin/shops');
            if (response.data && response.data.success) {
              this.shops = response.data.data || [];
            } else {
              throw new Error('Invalid shops response format');
            }
          } catch (error) {
            console.error('Error fetching shops:', error);
            this.error.shops = error.message || 'Error fetching shops';
            this.shops = []; // Initialize as empty array to avoid undefined errors
          }
        }
      } catch (error) {
        this.error.shops = error.message || 'Error fetching shops';
        console.error('Error in fetchShops:', error);
        this.shops = []; // Ensure shops is always at least an empty array
      } finally {
        this.loading.shops = false;
      }
    },
    
    // Mock specific shop fetching
    async fetchShop(shopId) {
      if (!shopId) {
        this.error.shops = 'No shop ID provided';
        return;
      }
      
      try {
        if (process.env.USE_MOCKS === 'true') {
          this.currentShop = { 
            id: shopId, 
            title: 'Mock Shop', 
            store_type: 'shopify'
          };
        } else {
          const response = await mockAxios.get(`/api/printifyApi/admin/shops/${shopId}`);
          if (response.data && response.data.success) {
            this.currentShop = response.data.data;
          } else {
            throw new Error('Invalid shop response format');
          }
        }
      } catch (error) {
        this.error.shops = error.message || 'Error fetching shop';
        this.currentShop = null;
      }
    }
  }
});
