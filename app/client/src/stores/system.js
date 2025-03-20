/**
 * System Store
 * Manages system health, time, and performance metrics
 */
import { defineStore } from 'pinia';
import axios from '@/utils/axios';

export const useSystemStore = defineStore('system', {
  state: () => ({
    // Server time information
    time: {
      server: {
        iso: null,
        unix: null,
        utc: null,
        local: null,
        timestamp: null,
        lastSync: null
      },
      client: {
        iso: null,
        unix: null,
        utc: null,
        local: null,
        timestamp: null,
        lastSync: null
      }
    },
    
    // Health status information
    health: {
      status: null,
      environment: null,
      uptime: null,
      lastChecked: null,
      stripe: {
        status: null,
        lastChecked: null 
      }
    },
    
    // Detailed health information (for admin)
    detailedHealth: {
      system: {
        platform: null,
        nodeVersion: null,
        memory: null,
        cpu: null
      },
      database: {
        connected: null,
        dialect: null,
        name: null
      }
    },
    
    // Performance metrics
    performance: {
      memoryUsage: null,
      cpuUsage: null,
      loadAverage: null,
      databaseResponseTime: null
    },
    
    // UI state
    loading: {
      time: false,
      health: false,
      detailedHealth: false,
      performance: false
    },
    error: {
      time: null,
      health: null,
      detailedHealth: null,
      performance: null
    },
    
    // Time synchronization
    timeDiff: 0, // Difference between client and server time in milliseconds
    timeLastSynced: null // When the time was last synced with the server
  }),

  getters: {
    /**
     * Check if the system is healthy
     * @returns {boolean} True if the system is healthy
     */
    isHealthy: (state) => {
      return state.health.status === 'healthy';
    },
    
    /**
     * Check if Stripe is healthy
     * @returns {boolean} True if Stripe is healthy
     */
    isStripeHealthy: (state) => {
      return state.health.stripe.status === 'healthy';
    },
    
    /**
     * Get the server time adjusted for any drift
     * @returns {Date} Current server time
     */
    serverTime: (state) => {
      if (!state.time.timestamp) return new Date();
      
      // Calculate current server time by adding time passed since last sync
      const clientNow = Date.now();
      const clientTimeSinceSync = clientNow - (state.timeLastSynced || clientNow);
      return new Date(state.time.timestamp + clientTimeSinceSync);
    },
    
    /**
     * Get formatted server time in locale string
     * @returns {string} Formatted server time
     */
    formattedServerTime: (state) => {
      if (!state.time.timestamp) return '';
      
      const serverTime = new Date(state.time.timestamp);
      return serverTime.toLocaleString();
    },
    
    /**
     * Check if time is synchronized with server
     * @returns {boolean} True if time is synced
     */
    isTimeSynced: (state) => {
      return !!state.timeLastSynced;
    }
  },

  actions: {
/**
 * Fetch Stripe service status
 * @returns {Object} Stripe status data
 */
async fetchStripeStatus() {
  if (this.loading.stripe) return;
  
  this.loading.stripe = true;
  this.error.stripe = null;
  
  try {
    const { data } = await axios.get('/api/system/stripe/status');
    
    if (data.success && data.data) {
      this.health.stripe = {
        status: data.data.status,
        lastChecked: new Date().toISOString()
      };
      return this.health.stripe;
    }
  } catch (error) {
    this.error.stripe = error.response?.data?.message || 'Failed to fetch Stripe status';
    console.error('Error fetching Stripe status:', error);
    
    // Set status to 'error' if request failed
    this.health.stripe = {
      status: 'error',
      lastChecked: new Date().toISOString()
    };
  } finally {
    this.loading.stripe = false;
  }
},

    /**
     * Fetch current server time
     * @returns {Object} Server time data
     */
    async fetchServerTime() {
      if (this.loading.time) return;
      
      this.loading.time = true;
      this.error.time = null;
      
      try {
        const { data } = await axios.get('/api/system/time');
        
        if (data.success && data.data) {
          this.time = data.data;
          this.timeLastSynced = Date.now();
          
          // Calculate time difference between client and server
          const serverTime = new Date(data.data.timestamp).getTime();
          const clientTime = Date.now();
          this.timeDiff = serverTime - clientTime;
          
          return this.time;
        }
      } catch (error) {
        this.error.time = error.response?.data?.message || 'Failed to fetch server time';
        console.error('Error fetching server time:', error);
      } finally {
        this.loading.time = false;
      }
    },
    
    /**
     * Fetch basic health status
     * @returns {Object} Health status data
     */
    async fetchHealthStatus() {
      if (this.loading.health) return;
      
      this.loading.health = true;
      this.error.health = null;
      
      try {
        const { data } = await axios.get('/api/system/health');
        
        if (data.success && data.data) {
          this.health = data.data;
          return this.health;
        }
      } catch (error) {
        this.error.health = error.response?.data?.message || 'Failed to fetch health status';
        console.error('Error fetching health status:', error);
      } finally {
        this.loading.health = false;
      }
    },
    
    /**
     * Fetch detailed health information (admin only)
     * @returns {Object} Detailed health data
     */
    async fetchDetailedHealth() {
      if (this.loading.detailedHealth) return;
      
      this.loading.detailedHealth = true;
      this.error.detailedHealth = null;
      
      try {
        const { data } = await axios.get('/api/system/health/detailed');
        
        if (data.success && data.data) {
          this.detailedHealth = data.data;
          return this.detailedHealth;
        }
      } catch (error) {
        this.error.detailedHealth = error.response?.data?.message || 'Failed to fetch detailed health';
        console.error('Error fetching detailed health:', error);
      } finally {
        this.loading.detailedHealth = false;
      }
    },
    
    /**
     * Fetch performance metrics (admin only)
     * @returns {Object} Performance metrics data
     */
    async fetchPerformanceMetrics() {
      if (this.loading.performance) return;
      
      this.loading.performance = true;
      this.error.performance = null;
      
      try {
        const { data } = await axios.get('/api/system/performance');
        
        if (data.success && data.data) {
          this.performance = data.data;
          return this.performance;
        }
      } catch (error) {
        this.error.performance = error.response?.data?.message || 'Failed to fetch performance metrics';
        console.error('Error fetching performance metrics:', error);
      } finally {
        this.loading.performance = false;
      }
    },
    
    /**
     * Initialize system store by fetching basic health and time
     * Called once on application startup
     */
    async initialize() {
      try {
        // Fetch server time first to establish time synchronization
        await this.fetchServerTime();
        
        // Fetch basic health status
        await this.fetchHealthStatus();
        
        // Set up periodic time synchronization every 30 minutes
        setInterval(() => {
          this.fetchServerTime();
        }, 30 * 60 * 1000);
        
      } catch (error) {
        console.error('Failed to initialize system store:', error);
      }
    },
    
    /**
     * Converts a client-side timestamp to an estimated server timestamp
     * @param {number} clientTimestamp - Client-side timestamp
     * @returns {number} Estimated server timestamp
     */
    clientToServerTime(clientTimestamp) {
      return clientTimestamp + this.timeDiff;
    },
    
    /**
     * Converts a server timestamp to an estimated client-side timestamp
     * @param {number} serverTimestamp - Server-side timestamp
     * @returns {number} Estimated client timestamp
     */
    serverToClientTime(serverTimestamp) {
      return serverTimestamp - this.timeDiff;
    }
  }
});