import { defineStore } from 'pinia'
import axios from '@/utils/axios'
import { useAuthStore } from './auth'

export const usePrintifyStore = defineStore('printify', {
  state: () => ({
    // Shop data (admin only)
    shops: [],
    recentOrders: [],
    
    // Product data (both public and admin)
    publicProducts: [],
    featuredProducts: [],
    bestSellerProducts: [],
    totalProducts: 0,
    products: [], // Admin products
    selectedProduct: null,
    
    // Shopping cart
    cart: [],
    currentOrder: null,
    orderHistory: [],
    
    // UI state
    loading: {
      products: false,
      publicProducts: false,
      featuredProducts: false,
      bestSellerProducts: false,
      selectedProduct: false,
      checkout: false,
      order: false,
      orderHistory: false,
      shops: false,
      orders: false
    },
    error: {
      products: null,
      publicProducts: null,
      featuredProducts: null,
      bestSellerProducts: null,
      selectedProduct: null,
      checkout: null,
      order: null,
      orderHistory: null,
      shops: null,
      orders: null
    }
  }),

  getters: {
    getProductById: (state) => (id) => {
      return state.products.find(product => product.id === id)
    },
    
    getPublicProductById: (state) => (id) => {
      return state.publicProducts.find(product => product.id === id)
    },
    
    cartTotal: (state) => {
      return state.cart.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    },
    
    cartItemCount: (state) => {
      return state.cart.reduce((count, item) => count + item.quantity, 0)
    },
    
    getOrderStatus: (state) => {
      if (!state.currentOrder) return 'unknown';
      
      // Return status based on the order object structure
      // Different depending on if it's from our database or Stripe
      if (state.currentOrder.status) {
        return state.currentOrder.status;
      }
      
      if (state.currentOrder.payment_status) {
        return state.currentOrder.payment_status;
      }
      
      return 'processing';
    }
  },

  actions: {
    // ==== PUBLIC ACTIONS (No authentication required) ====
    
    /**
     * Fetch public products that any visitor can view
     * No authentication required
     */
    async fetchPublicProducts() {
      if (this.loading.publicProducts) return
      
      this.loading.publicProducts = true
      this.error.publicProducts = null
      
      try {
        const { data } = await axios.get('/api/printify/products')
        this.publicProducts = data.data || []
        return this.publicProducts
      } catch (error) {
        this.error.publicProducts = error.response?.data?.message || 'Failed to fetch products'
        console.error('Error fetching public products:', error)
        // Initialize empty array to prevent UI errors
        this.publicProducts = []
        throw error
      } finally {
        this.loading.publicProducts = false
      }
    },
    
    /**
     * Fetch featured products for homepage
     * No authentication required
     */
    async fetchFeaturedProducts() {
      if (this.loading.featuredProducts) return
      
      this.loading.featuredProducts = true
      this.error.featuredProducts = null
      
      try {
        // Use the dedicated endpoint for featured products
        const { data } = await axios.get('/api/featured-products/public')
        this.featuredProducts = data.data || []
        console.log('Featured products data:', this.featuredProducts);
        return this.featuredProducts
      } catch (error) {
        this.error.featuredProducts = error.response?.data?.message || 'Failed to fetch featured products'
        console.error('Error fetching featured products:', error)
        this.featuredProducts = []
        throw error
      } finally {
        this.loading.featuredProducts = false
      }
    },
    
    /**
     * Fetch best-selling products
     * No authentication required
     */
    async fetchBestSellerProducts() {
      if (this.loading.bestSellerProducts) return
      
      this.loading.bestSellerProducts = true
      this.error.bestSellerProducts = null
      
      try {
        // Use the dedicated endpoint for bestseller products
        const { data } = await axios.get('/api/featured-products/public/bestsellers')
        this.bestSellerProducts = data.data || []
        console.log('Best seller products data:', this.bestSellerProducts);
        return this.bestSellerProducts
      } catch (error) {
        this.error.bestSellerProducts = error.response?.data?.message || 'Failed to fetch best sellers'
        console.error('Error fetching best sellers:', error)
        this.bestSellerProducts = []
        throw error
      } finally {
        this.loading.bestSellerProducts = false
      }
    },
    
    /**
     * Fetch a single public product by ID
     * No authentication required
     */
    async fetchPublicProductById(productId) {
      if (this.loading.selectedProduct) return
      
      this.loading.selectedProduct = true
      this.error.selectedProduct = null
      
      try {
        const { data } = await axios.get(`/api/printify/products/${productId}`)
        this.selectedProduct = data.data
        return this.selectedProduct
      } catch (error) {
        this.error.selectedProduct = error.response?.data?.message || 'Failed to fetch product'
        console.error(`Error fetching product ${productId}:`, error)
        throw error
      } finally {
        this.loading.selectedProduct = false
      }
    },
    
    // ==== ADMIN ACTIONS (Authentication required) ====
    
    /**
     * Fetch all shops (admin only)
     * Requires authentication
     */
    async fetchShops() {
      if (this.loading.shops) return
      
      this.loading.shops = true
      this.error.shops = null
      
      try {
        // Ensure user is authenticated before making the request
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to access shop data')
        }
        
        // Use the correct endpoint with authentication
        const { data } = await axios.get('/api/printify/admin/shops')
        this.shops = data.data || []
        return this.shops
      } catch (error) {
        this.error.shops = error.response?.data?.message || 'Failed to fetch shops'
        // Initialize empty array to prevent UI errors
        this.shops = []
        console.error('Error fetching shops:', error)
        throw error
      } finally {
        this.loading.shops = false
      }
    },

    /**
     * Fetch orders for a specific shop (admin only)
     * Requires authentication
     */
    async fetchOrders(shopId) {
      if (this.loading.orders) return
      
      this.loading.orders = true
      this.error.orders = null
      
      try {
        // Ensure user is authenticated before making the request
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to access order data')
        }
        
        // Use the correct admin endpoint with authentication
        const { data } = await axios.get(`/api/printify/admin/shops/${shopId}/orders`)
        
        // Store recent orders
        this.recentOrders = data.data || []
        
        // Update total products count
        this.updateTotalProductsCount()
        
        return this.recentOrders
      } catch (error) {
        this.error.orders = error.response?.data?.message || 'Failed to fetch orders'
        // Initialize empty array to prevent UI errors
        this.recentOrders = []
        console.error('Error fetching orders:', error)
        throw error
      } finally {
        this.loading.orders = false
      }
    },
    
    /**
     * Helper to calculate total products across all shops
     */
    updateTotalProductsCount() {
      try {
        // Count unique products from orders or use products length
        if (this.products.length > 0) {
          this.totalProducts = this.products.length
        } else {
          // Fallback to 0 if no products available yet
          this.totalProducts = 0
        }
      } catch (error) {
        console.error('Error calculating total products:', error)
        this.totalProducts = 0
      }
    },

    /**
     * Fetch admin products (admin only)
     * Requires authentication
     */
    async fetchAdminProducts() {
      if (this.loading.products) return
      
      this.loading.products = true
      this.error.products = null
      
      try {
        // Ensure user is authenticated before making the request
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to access product data')
        }
        
        // Use the correct endpoint with authentication
        const { data } = await axios.get('/api/printify/admin/products')
        this.products = data.data || []
        return this.products
      } catch (error) {
        this.error.products = error.response?.data?.message || 'Failed to fetch products'
        this.products = []
        console.error('Error fetching admin products:', error)
        throw error
      } finally {
        this.loading.products = false
      }
    },

    /**
     * Fetch admin product by ID (admin only)
     * Requires authentication
     */
    async fetchAdminProductById(productId) {
      if (this.loading.selectedProduct) return
      
      this.loading.selectedProduct = true
      this.error.selectedProduct = null
      
      try {
        // Ensure user is authenticated before making the request
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to access product data')
        }
        
        // Use the correct endpoint with authentication
        const { data } = await axios.get(`/api/printify/admin/products/${productId}`)
        this.selectedProduct = data.data
        return this.selectedProduct
      } catch (error) {
        this.error.selectedProduct = error.response?.data?.message || 'Failed to fetch product'
        console.error(`Error fetching admin product ${productId}:`, error)
        throw error
      } finally {
        this.loading.selectedProduct = false
      }
    },

    // ==== CART MANAGEMENT (No authentication required) ====
    
    /**
     * Add a product to the cart
     */
    addToCart(product, variant, quantity = 1) {
      const existingItem = this.cart.find(item => 
        item.id === product.id && item.variantId === variant.id
      )
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.cart.push({
          id: product.id,
          title: product.title,
          image: product.images?.[0]?.src || '',
          variantId: variant.id,
          variantTitle: variant.title,
          price: variant.price,
          quantity: quantity
        })
      }
      
      // Save cart to localStorage for persistence
      localStorage.setItem('printify-cart', JSON.stringify(this.cart))
    },
    
    /**
     * Update a cart item's quantity
     */
    updateCartItem(itemIndex, quantity) {
      if (quantity <= 0) {
        this.cart.splice(itemIndex, 1)
      } else {
        this.cart[itemIndex].quantity = quantity
      }
      
      // Update localStorage
      localStorage.setItem('printify-cart', JSON.stringify(this.cart))
    },
    
    /**
     * Remove an item from the cart
     */
    removeFromCart(itemIndex) {
      this.cart.splice(itemIndex, 1)
      localStorage.setItem('printify-cart', JSON.stringify(this.cart))
    },
    
    /**
     * Clear the entire cart
     */
    clearCart() {
      this.cart = []
      localStorage.removeItem('printify-cart')
    },
    
    // Load cart from localStorage on store initialization
    loadCart() {
      const savedCart = localStorage.getItem('printify-cart')
      if (savedCart) {
        try {
          this.cart = JSON.parse(savedCart)
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error)
          this.cart = []
        }
      }
    },
    
    // Customer order history (requires authentication)
    async fetchCustomerOrders() {
      if (this.loading.orderHistory) return
      
      this.loading.orderHistory = true
      this.error.orderHistory = null
      
      try {
        // Ensure user is authenticated
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to access order history')
        }
        
        const { data } = await axios.get('/api/printify/customer/orders')
        this.orderHistory = data.data || []
        return this.orderHistory
      } catch (error) {
        this.error.orderHistory = error.response?.data?.message || 'Failed to fetch order history'
        this.orderHistory = []
        console.error('Error fetching order history:', error)
        throw error
      } finally {
        this.loading.orderHistory = false
      }
    }
  }
})