import { defineStore } from 'pinia'
import axios from '@/utils/axios'

export const usePrintifyStore = defineStore('printify', {
  state: () => ({
    products: [],
    selectedProduct: null,
    cart: [],
    currentOrder: null,
    orderHistory: [],
    loading: {
      products: false,
      selectedProduct: false,
      checkout: false,
      order: false,
      orderHistory: false
    },
    error: {
      products: null,
      selectedProduct: null,
      checkout: null,
      order: null,
      orderHistory: null
    }
  }),

  getters: {
    getProductById: (state) => (id) => {
      return state.products.find(product => product.id === id)
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
    // Products
    async fetchProducts() {
      if (this.loading.products) return
      
      this.loading.products = true
      this.error.products = null
      
      try {
        const { data } = await axios.get('/api/printify/products')
        this.products = data.data
      } catch (error) {
        this.error.products = error.response?.data?.message || 'Failed to fetch products'
        throw error
      } finally {
        this.loading.products = false
      }
    },

    async fetchProductById(productId) {
      if (this.loading.selectedProduct) return
      
      this.loading.selectedProduct = true
      this.error.selectedProduct = null
      
      try {
        const { data } = await axios.get(`/api/printify/products/${productId}`)
        this.selectedProduct = data.data
        return this.selectedProduct
      } catch (error) {
        this.error.selectedProduct = error.response?.data?.message || 'Failed to fetch product'
        throw error
      } finally {
        this.loading.selectedProduct = false
      }
    },

    // Cart Management
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
          image: product.images[0]?.src || '',
          variantId: variant.id,
          variantTitle: variant.title,
          price: variant.price,
          quantity: quantity
        })
      }
      
      // Save cart to localStorage for persistence
      localStorage.setItem('printify-cart', JSON.stringify(this.cart))
    },
    
    updateCartItem(itemIndex, quantity) {
      if (quantity <= 0) {
        this.cart.splice(itemIndex, 1)
      } else {
        this.cart[itemIndex].quantity = quantity
      }
      
      // Update localStorage
      localStorage.setItem('printify-cart', JSON.stringify(this.cart))
    },
    
    removeFromCart(itemIndex) {
      this.cart.splice(itemIndex, 1)
      localStorage.setItem('printify-cart', JSON.stringify(this.cart))
    },
    
    clearCart() {
      this.cart = []
      localStorage.removeItem('printify-cart')
    },
    
    loadCartFromStorage() {
      const savedCart = localStorage.getItem('printify-cart')
      if (savedCart) {
        this.cart = JSON.parse(savedCart)
      }
    },
    
    // Checkout Process
    async createCheckoutSession() {
      if (this.loading.checkout) return
      
      this.loading.checkout = true
      this.error.checkout = null
      
      try {
        const { data } = await axios.post('/api/payment/create-checkout', {
          items: this.cart
        })
        
        // Redirect to Stripe checkout
        window.location.href = data.url
        
        return data
      } catch (error) {
        this.error.checkout = error.response?.data?.message || 'Checkout failed'
        throw error
      } finally {
        this.loading.checkout = false
      }
    },
    
    // Order Management
    async fetchOrderBySessionId(sessionId) {
      if (this.loading.order) return
      
      this.loading.order = true
      this.error.order = null
      
      try {
        const { data } = await axios.get(`/api/payment/order/${sessionId}`)
        this.currentOrder = data.data
        
        // If checkout was successful, clear the cart
        if (this.currentOrder && (this.currentOrder.status === 'paid' || this.currentOrder.payment_status === 'paid')) {
          this.clearCart()
        }
        
        return this.currentOrder
      } catch (error) {
        this.error.order = error.response?.data?.message || 'Failed to fetch order details'
        throw error
      } finally {
        this.loading.order = false
      }
    },
    
    async fetchOrderHistory() {
      if (this.loading.orderHistory) return
      
      this.loading.orderHistory = true
      this.error.orderHistory = null
      
      try {
        const { data } = await axios.get('/api/payment/orders')
        this.orderHistory = data.data
        return this.orderHistory
      } catch (error) {
        this.error.orderHistory = error.response?.data?.message || 'Failed to fetch order history'
        throw error
      } finally {
        this.loading.orderHistory = false
      }
    },
    
    // Process order after successful payment
    processSuccessfulPayment(sessionId) {
      // Store the session ID in localStorage temporarily
      localStorage.setItem('last-successful-order', sessionId)
      
      // Clear the cart since the purchase was successful
      this.clearCart()
    }
  }
})