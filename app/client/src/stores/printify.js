import { defineStore } from 'pinia'
import axios from '@/utils/axios'

export const usePrintifyStore = defineStore('printify', {
  state: () => ({
    shops: [],
    products: {},  // Keyed by shopId
    orders: {},    // Keyed by shopId
    loading: {
      shops: false,
      products: false,
      orders: false
    },
    error: {
      shops: null,
      products: null,
      orders: null
    }
  }),

  getters: {
    getShopById: (state) => (id) => {
      return state.shops.find(shop => shop.id === id)
    },
    
    getProductsByShopId: (state) => (shopId) => {
      return state.products[shopId] || []
    },
    
    getOrdersByShopId: (state) => (shopId) => {
      return state.orders[shopId] || []
    },
    
    recentOrders: (state) => {
      // Combine all orders from all shops and sort by date
      const allOrders = Object.values(state.orders)
        .flat()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Return the 10 most recent orders
      return allOrders.slice(0, 10);
    },

    totalProducts: (state) => {
      return Object.values(state.products)
        .flat()
        .length;
    }
  },

  actions: {
    // Shops
    async fetchShops() {
      if (this.loading.shops) return
      
      this.loading.shops = true
      this.error.shops = null
      
      try {
        const { data } = await axios.get('/api/printifyApi/shops')
        this.shops = data.data
      } catch (error) {
        this.error.shops = error.response?.data?.message || 'Failed to fetch shops'
        throw error
      } finally {
        this.loading.shops = false
      }
    },

    // Products
    async fetchProducts(shopId) {
      if (this.loading.products) return
      
      this.loading.products = true
      this.error.products = null
      
      try {
        const { data } = await axios.get(`/api/printifyApi/shops/${shopId}/products`)
        this.products[shopId] = data.data
      } catch (error) {
        this.error.products = error.response?.data?.message || 'Failed to fetch products'
        throw error
      } finally {
        this.loading.products = false
      }
    },

    // Orders
    async fetchOrders(shopId) {
      if (this.loading.orders) return
      
      this.loading.orders = true
      this.error.orders = null
      
      try {
        const { data } = await axios.get(`/api/printifyApi/shops/${shopId}/orders`)
        this.orders[shopId] = data.data
      } catch (error) {
        this.error.orders = error.response?.data?.message || 'Failed to fetch orders'
        throw error
      } finally {
        this.loading.orders = false
      }
    },

    async createOrder(shopId, orderData) {
      try {
        const { data } = await axios.post(`/api/printifyApi/shops/${shopId}/orders`, orderData)
        
        // Update orders cache
        if (!this.orders[shopId]) {
          this.orders[shopId] = []
        }
        this.orders[shopId].unshift(data.data)
        
        return data.data
      } catch (error) {
        throw error.response?.data?.message || 'Failed to create order'
      }
    },

    // Cache management
    clearShopCache() {
      this.shops = []
    },

    clearProductCache(shopId) {
      if (shopId) {
        delete this.products[shopId]
      } else {
        this.products = {}
      }
    },

    clearOrderCache(shopId) {
      if (shopId) {
        delete this.orders[shopId]
      } else {
        this.orders = {}
      }
    }
  }
})
