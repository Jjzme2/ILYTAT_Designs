<template>
  <div class="dashboard-view">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Total Shops</h3>
          <p>{{ printifyStore.shops.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Active Products</h3>
          <p>{{ printifyStore.totalProducts }}</p>
        </div>
        <div class="stat-card">
          <h3>Recent Orders</h3>
          <p>{{ printifyStore.loading.orders ? '...' : printifyStore.recentOrders?.length || 0 }}</p>
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { usePrintifyStore } from '@/stores/printify'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'DashboardView',
  setup() {
    const printifyStore = usePrintifyStore()
    const uiStore = useUIStore()
    const loading = ref(true)
    const recentActivity = ref([])

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

    const loadDashboardData = async () => {
      try {
        loading.value = true
        await printifyStore.fetchShops()
        
        // Fetch orders for each shop
        for (const shop of printifyStore.shops) {
          await printifyStore.fetchOrders(shop.id)
        }
      } catch (error) {
        uiStore.notifyError('Failed to load dashboard data')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadDashboardData()
    })

    return {
      printifyStore,
      loading,
      recentActivity,
      getActivityIcon,
      formatTime
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
  display: block;
  padding: var(--spacing-4);
  background: var(--color-background-alt);
  border-radius: var(--radius);
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
  display: block;
}

.action-card h3 {
  margin-bottom: var(--spacing-2);
}

.action-card p {
  color: var(--color-text-light);
}

.loading-placeholder,
.empty-state {
  text-align: center;
  padding: var(--spacing-4);
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
