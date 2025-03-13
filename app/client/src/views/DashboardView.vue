<template>
  <div class="dashboard-view">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="api-status-indicator">
        <div :class="['status-dot', apiConnected ? 'connected' : 'disconnected']"></div>
        <span>Printify API: {{ apiConnected ? 'Connected' : 'Disconnected' }}</span>
        <button v-if="!apiConnected" @click="checkApiConnection" class="btn-check-connection">
          Check Connection
        </button>
      </div>
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Total Shops</h3>
          <p v-if="printifyStore.loading.shops">
            <span class="loading-indicator">Loading...</span>
          </p>
          <p v-else>{{ printifyStore.shops?.length || 0 }}</p>
          <p v-if="printifyStore.error.shops" class="error-text">
            {{ printifyStore.error.shops }}
          </p>
        </div>
        <div class="stat-card">
          <h3>Active Products</h3>
          <p v-if="printifyStore.loading.products">
            <span class="loading-indicator">Loading...</span>
          </p>
          <p v-else>{{ printifyStore.totalProducts || 0 }}</p>
          <p v-if="printifyStore.error.products" class="error-text">
            {{ printifyStore.error.products }}
          </p>
        </div>
        <div class="stat-card">
          <h3>Recent Orders</h3>
          <p v-if="printifyStore.loading.orders">
            <span class="loading-indicator">Loading...</span>
          </p>
          <p v-else>{{ printifyStore.recentOrders?.length || 0 }}</p>
          <p v-if="printifyStore.error.orders" class="error-text">
            {{ printifyStore.error.orders }}
          </p>
        </div>
      </div>
    </header>

    <section class="dashboard-content">
      <div class="dashboard-section">
        <h2>Recent Activity</h2>
        <div class="activity-list">
          <div v-if="loading" class="loading-placeholder">
            Loading recent activity...
          </div>
          <div v-else-if="recentActivity.length === 0" class="empty-state">
            No recent activity to display
          </div>
          <div v-else v-for="activity in recentActivity" :key="activity.id" class="activity-item">
            <span class="activity-icon" :class="activity.type">{{ getActivityIcon(activity.type) }}</span>
            <div class="activity-details">
              <p class="activity-message">{{ activity.message }}</p>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>Quick Actions</h2>
        <div class="quick-actions">
          <router-link to="/printify/shops" class="action-card">
            <span class="action-icon">🏪</span>
            <h3>Manage Shops</h3>
            <p>View and manage your Printify shops</p>
          </router-link>
          <router-link to="/documentation" class="action-card">
            <span class="action-icon">📚</span>
            <h3>Documentation</h3>
            <p>Access guides and documentation</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- API Setup Guide Modal -->
    <div v-if="showApiSetupGuide" class="api-setup-modal">
      <div class="api-setup-content">
        <h2>Printify API Setup Guide</h2>
        <button class="close-btn" @click="showApiSetupGuide = false">&times;</button>
        
        <div class="setup-steps">
          <h3>Getting Your Printify API Key</h3>
          <ol>
            <li>Log in to your <a href="https://printify.com/app/login" target="_blank">Printify account</a></li>
            <li>Navigate to <strong>Settings</strong> > <strong>API Settings</strong></li>
            <li>Click on <strong>Generate API Key</strong> if you don't already have one</li>
            <li>Copy your API key (it starts with <code>pfy_</code>)</li>
          </ol>
          
          <h3>Setting Up Your Environment</h3>
          <ol>
            <li>Create a <code>.env</code> file in your server directory if it doesn't exist already</li>
            <li>Add the following line to your <code>.env</code> file: 
              <pre>PRINTIFY_API_KEY=your_printify_api_key</pre>
            </li>
            <li>Replace <code>your_printify_api_key</code> with the key you copied from Printify</li>
            <li>Restart your server to apply the changes</li>
          </ol>
          
          <h3>Troubleshooting Common Issues</h3>
          <ul>
            <li><strong>401 Unauthorized</strong>: Your API key is invalid or not properly set</li>
            <li><strong>403 Forbidden</strong>: Your account doesn't have permission for this operation</li>
            <li><strong>429 Too Many Requests</strong>: You've exceeded the API rate limits</li>
          </ul>
          
          <button @click="closeGuideAndRefresh" class="btn-primary">I've Set Up My API Key</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { usePrintifyStore } from '@/stores/printify'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'DashboardView',
  setup() {
    const printifyStore = usePrintifyStore()
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const loading = ref(true)
    const recentActivity = ref([])
    const error = ref(null)
    const apiConnected = ref(false)
    const detailedError = ref(null)
    const showApiSetupGuide = ref(false)

    const isAuthenticated = computed(() => authStore.isAuthenticated)

    const getActivityIcon = (type) => {
      const icons = {
        order: '🛍️',
        product: '📦',
        shop: '🏪',
        system: '⚙️'
      }
      return icons[type] || '📝'
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    async function loadDashboardData() {
      loading.value = true
      error.value = null
      
      if (!authStore.isAuthenticated) {
        loading.value = false
        error.value = 'Authentication required'
        return
      }

      try {
        const printifyStore = usePrintifyStore()
        
        // First, check if we can fetch shops from Printify
        try {
          await printifyStore.fetchShops()
          apiConnected.value = true
        } catch (err) {
          apiConnected.value = false
          detailedError.value = err.message || 'Unknown error'
          showApiSetupGuide.value = err.message?.includes('401') || err.message?.includes('Unauthorized') || false
          throw err
        }
        
        // If we have shops, fetch orders for the first shop
        if (printifyStore.shops?.length > 0) {
          const shopId = printifyStore.shops[0].id
          await printifyStore.fetchOrders(shopId)
        }
        
        // For demonstration purposes, generate some recent activity
        // In a real app, this would come from your API
        recentActivity.value = generateDemoActivity()
        
      } catch (err) {
        error.value = err.message || 'An error occurred while loading dashboard data'
        console.error('Dashboard loading error:', err)
      } finally {
        loading.value = false
      }
    }

    const checkApiConnection = async () => {
      await loadDashboardData()
    }

    const closeGuideAndRefresh = () => {
      showApiSetupGuide.value = false
      checkApiConnection()
    }

    onMounted(async () => {
      await loadDashboardData()
    })

    return {
      printifyStore,
      loading,
      recentActivity,
      getActivityIcon,
      formatTime,
      error,
      apiConnected,
      detailedError,
      showApiSetupGuide,
      checkApiConnection,
      closeGuideAndRefresh
    }
  }
}
</script>

<style>
.dashboard-view {
  padding: var(--spacing-4);
}

.dashboard-header {
  margin-bottom: var(--spacing-6);
}

.api-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.connected {
  background-color: #4CAF50;
}

.disconnected {
  background-color: #f44336;
}

.btn-check-connection {
  margin-left: 8px;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
  margin-top: var(--spacing-4);
}

.stat-card {
  background: var(--color-background-alt);
  padding: var(--spacing-4);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.stat-card h3 {
  color: var(--color-text-light);
  margin-bottom: var(--spacing-2);
}

.stat-card p {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
}

.error-text {
  font-size: 0.875rem;
  color: var(--color-error);
  margin-top: var(--spacing-2);
  font-weight: normal;
}

.loading-indicator {
  color: var(--color-text-light);
  font-size: 1rem;
}

.dashboard-section {
  margin-bottom: var(--spacing-6);
}

.activity-list {
  background: var(--color-background-alt);
  border-radius: var(--radius);
  padding: var(--spacing-4);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: var(--spacing-3);
  font-size: 1.25rem;
}

.activity-details {
  flex: 1;
}

.activity-message {
  margin-bottom: var(--spacing-1);
}

.activity-time {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
}

.action-card {
  background: var(--color-background-alt);
  border-radius: var(--radius);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: var(--color-text);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.action-card h3 {
  margin-bottom: var(--spacing-2);
  color: var(--color-primary);
}

.loading-placeholder, 
.empty-state {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--color-text-light);
}

.api-setup-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.api-setup-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.setup-steps {
  margin-top: 16px;
}

.setup-steps h3 {
  margin-top: 24px;
  margin-bottom: 12px;
  color: #333;
}

.setup-steps ol, .setup-steps ul {
  padding-left: 24px;
  line-height: 1.6;
}

.setup-steps li {
  margin-bottom: 12px;
}

.setup-steps pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  margin: 8px 0;
  overflow-x: auto;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  margin-top: 24px;
  cursor: pointer;
  font-weight: 500;
}
</style>
