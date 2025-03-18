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
    upcomingProducts: [], // New state property
    
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
      orders: false,
      upcomingProducts: false // New loading state
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
      orders: null,
      upcomingProducts: null // New error state
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
      this.selectedProduct = null // Reset selected product before fetching
      
      try {
        console.log(`Fetching product with ID: ${productId}`)
        const response = await axios.get(`/api/printify/products/${productId}`)
        
        // Check if the API returns success with valid data
        if (response.data?.success === true) {
          // Check if the response has error status or notFound flag
          if (response.data.meta?.error === true || response.data.meta?.notFound === true) {
            console.warn(`API returned ${response.data.meta?.notFound ? 'notFound' : 'error'} status for product: ${productId}`)
            const errorMessage = response.data.message || (response.data.meta?.notFound ? 'Product not found' : 'Error retrieving product')
            
            // Create a fallback product with information from the response message
            this.selectedProduct = this._createFallbackProduct(productId, errorMessage)
            
            // Set a specific error that the UI can handle gracefully
            this.error.selectedProduct = response.data.meta?.notFound ? 'product_not_found' : 'api_error'
            return this.selectedProduct
          }
          
          // First check if response.data.data exists and is an object
          if (response.data.data && typeof response.data.data === 'object') {
            // Case 1: Normal successful response with data object
            
            // Additional check - does the data actually have meaningful product information?
            if (response.data.data.id) {
              this.selectedProduct = response.data.data
              console.log("Successfully loaded product:", this.selectedProduct.title)
              return this.selectedProduct
            } else {
              // The data object exists but has no meaningful content
              console.warn('API returned empty product object for ID:', productId)
              
              // Create a fallback product object for UI rendering
              this.selectedProduct = this._createFallbackProduct(productId, 'Product data is incomplete')
              return this.selectedProduct
            }
          } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length === 0) {
            // Case 2: API returned empty array
            console.warn('API returned empty array for product ID:', productId)
            this.selectedProduct = this._createFallbackProduct(productId, 'Product not found')
            return this.selectedProduct
          } else if (response.data.data && Object.keys(response.data.data).length === 0) {
            // Case 3: Server returned success with empty object
            // This matches our new server-side response for not-found products
            console.warn('API returned empty object for product ID:', productId)
            
            // Create a fallback product with information from the response message
            const message = response.data.message || 'Product not available'
            this.selectedProduct = this._createFallbackProduct(productId, message)
            
            // Set a specific error that the UI can handle gracefully
            this.error.selectedProduct = 'product_not_found'
            return this.selectedProduct
          } else {
            // Case 4: API returned success but with null/undefined data
            console.warn('API returned success but with null/undefined data for product:', productId)
            
            // Check if there might be product info elsewhere in the response
            if (response.data.product) {
              this.selectedProduct = response.data.product
              return this.selectedProduct
            } else {
              // Create a fallback product object for UI rendering
              this.selectedProduct = this._createFallbackProduct(productId, 'Product data not available')
              
              // Set an error flag but don't throw, allowing the UI to render a fallback state
              this.error.selectedProduct = 'data_unavailable'
              return this.selectedProduct
            }
          }
        } else {
          // Response was not a success
          console.error('API returned error response:', response.data)
          const message = response.data?.message || 'Failed to fetch product'
          
          // Create a fallback product but mark as error
          this.selectedProduct = this._createFallbackProduct(productId, message)
          this.error.selectedProduct = message
          return this.selectedProduct
        }
      } catch (error) {
        // Handle network errors or other exceptions
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch product'
        console.error(`Error fetching product ${productId}:`, error)
        
        // Create a fallback product for error state
        this.selectedProduct = this._createFallbackProduct(productId, errorMessage)
        this.error.selectedProduct = errorMessage
        
        // Log the error but don't throw so UI can show fallback state
        console.error('Error loading product data:', error)
        return this.selectedProduct
      } finally {
        this.loading.selectedProduct = false
      }
    },
    
    /**
     * Create a fallback product object for UI rendering when actual data is unavailable
     * @private
     */
    _createFallbackProduct(productId, reason) {
      return {
        id: productId,
        title: 'Product Unavailable',
        description: `This product cannot be displayed at this time. ${reason}`,
        images: [],
        variants: [],
        priceRange: 'N/A',
        _fallback: true,
        _reason: reason
      }
    },
    
    // ==== AUTHENTICATED USER ACTIONS (Authentication required) ====
    
    /**
     * Fetch upcoming products (not yet published)
     * Requires authentication
     */
    async fetchUpcomingProducts() {
      const authStore = useAuthStore();
      
      // Check if user is authenticated
      if (!authStore.isAuthenticated) {
        this.error.upcomingProducts = 'Authentication required to view upcoming products';
        return;
      }
      
      this.loading.upcomingProducts = true;
      this.error.upcomingProducts = null;
      
      try {
        const { data } = await axios.get('/api/printify/upcoming-products');
        
        if (data && data.success) {
          // Store upcoming products in state
          this.upcomingProducts = data.data;
        } else {
          // Handle unsuccessful response
          this.error.upcomingProducts = 'Failed to load upcoming products';
          console.error('Failed to load upcoming products:', data);
        }
      } catch (error) {
        // Handle authentication errors specially
        if (error.response && error.response.status === 401) {
          this.error.upcomingProducts = 'You must be logged in to view upcoming products';
          
          // Redirect to login if authentication error
          const authStore = useAuthStore();
          if (!authStore.isAuthenticated) {
            // Let the router handle the redirect via navigation guard
            console.warn('Authentication required for upcoming products');
          }
        } else {
          // Handle other errors
          this.error.upcomingProducts = error.message || 'Error loading upcoming products';
          console.error('Error fetching upcoming products:', error);
        }
      } finally {
        this.loading.upcomingProducts = false;
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