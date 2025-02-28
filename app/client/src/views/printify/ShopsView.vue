<template>
  <div class="shops-view">
    <header class="shops-view__header">
      <h1>My Shops</h1>
      <div class="shops-view__actions">
        <BaseButton
          @click="refreshShops"
          :loading="loading"
          variant="ghost"
        >
          Refresh
        </BaseButton>
      </div>
    </header>

    <div v-if="error" class="alert alert--danger">
      {{ error }}
    </div>

    <div v-if="loading && !shops.length" class="shops-view__loading">
      Loading shops...
    </div>

    <div v-else-if="!shops.length" class="shops-view__empty">
      <p>No shops found. Please connect your Printify account.</p>
      <BaseButton @click="handleConnectPrintify">
        Connect Printify
      </BaseButton>
    </div>

    <div v-else class="shops-grid">
      <div v-for="shop in shops" :key="shop.id" class="shop-card">
        <div class="shop-card__header">
          <h3>{{ shop.title }}</h3>
          <span :class="['shop-status', `shop-status--${shop.status}`]">
            {{ shop.status }}
          </span>
        </div>

        <div class="shop-card__stats">
          <div class="stat">
            <span class="stat__label">Products</span>
            <span class="stat__value">{{ shop.products_count }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Orders</span>
            <span class="stat__value">{{ shop.orders_count }}</span>
          </div>
        </div>

        <div class="shop-card__actions">
          <BaseButton
            @click="navigateToProducts(shop.id)"
            variant="ghost"
          >
            View Products
          </BaseButton>
          <BaseButton
            v-if="hasManagerAccess"
            @click="navigateToOrders(shop.id)"
            variant="ghost"
          >
            View Orders
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from '@/utils/axios'
import BaseButton from '@/components/base/BaseButton.vue'

export default {
  name: 'ShopsView',
  components: {
    BaseButton
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const shops = ref([])
    const loading = ref(false)
    const error = ref(null)

    const hasManagerAccess = computed(() => {
      return authStore.hasRole(['admin', 'manager'])
    })

    const fetchShops = async () => {
      loading.value = true
      error.value = null
      
      try {
        const { data } = await axios.get('/api/printifyApi/shops')
        shops.value = data.data
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load shops'
      } finally {
        loading.value = false
      }
    }

    const refreshShops = () => {
      fetchShops()
    }

    const handleConnectPrintify = () => {
      // Implement Printify OAuth connection logic
    }

    const navigateToProducts = (shopId) => {
      router.push({
        name: 'printify-products',
        params: { shopId }
      })
    }

    const navigateToOrders = (shopId) => {
      router.push({
        name: 'printify-orders',
        params: { shopId }
      })
    }

    onMounted(() => {
      fetchShops()
    })

    return {
      shops,
      loading,
      error,
      hasManagerAccess,
      refreshShops,
      handleConnectPrintify,
      navigateToProducts,
      navigateToOrders
    }
  }
}
</script>

<style scoped>
.shops-view {
  padding: var(--spacing-6);
}

.shops-view__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.shops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.shop-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.shop-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.shop-status {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
}

.shop-status--active {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.shop-status--inactive {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.shop-card__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat__label {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.stat__value {
  font-size: 1.25rem;
  font-weight: 600;
}

.shop-card__actions {
  display: flex;
  gap: var(--spacing-2);
}

.shops-view__empty {
  text-align: center;
  padding: var(--spacing-8);
}

.shops-view__loading {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-text-light);
}

.alert {
  padding: var(--spacing-4);
  border-radius: var(--radius);
  margin-bottom: var(--spacing-4);
}

.alert--danger {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}
</style>
