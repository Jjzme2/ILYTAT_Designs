<template>
  <div class="upcoming-products-view">
    <header class="view-header">
      <h1>Upcoming Products</h1>
      <p class="sub-heading">Preview products that are not yet released to the public</p>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-indicator"></div>
      <p>Loading upcoming products...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load upcoming products</h3>
      <p>{{ error }}</p>
      <button @click="fetchUpcomingProducts" class="btn btn-primary">
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="upcomingProducts.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>No upcoming products found</h3>
      <p>There are no upcoming products currently in development.</p>
    </div>

    <!-- Products Grid -->
    <div v-else class="products-grid">
      <div
        v-for="product in upcomingProducts"
        :key="product.id"
        class="product-card"
      >
        <div class="product-badge">Upcoming</div>
        <img 
          :src="product.thumbnail || '/images/placeholder-product.png'" 
          :alt="product.title" 
          class="product-image"
          @error="handleImageError"
        />
        <div class="product-content">
          <h3 class="product-title">{{ product.title }}</h3>
          <p class="product-description">{{ product.description || 'No description available' }}</p>
          <div class="product-meta">
            <span class="product-status" :class="product.status">
              {{ product.status || 'draft' }}
            </span>
            <span class="product-price" v-if="product.price">
              {{ formatPrice(product.price) }}
            </span>
            <span class="product-price pricing-tbd" v-else>
              Pricing TBD
            </span>
          </div>
          <div class="product-release">
            <span class="release-label">Expected Release:</span>
            <span class="release-date">{{ formatReleaseDate(product.releaseDate) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'UpcomingProductsView',
  setup() {
    const printifyStore = usePrintifyStore()
    const authStore = useAuthStore()
    const router = useRouter()

    // Computed properties
    const loading = computed(() => printifyStore.loading.upcomingProducts)
    const error = computed(() => printifyStore.error.upcomingProducts)
    const upcomingProducts = computed(() => printifyStore.upcomingProducts || [])

    // Methods
    const fetchUpcomingProducts = async () => {
      if (!authStore.isAuthenticated) {
        // Redirect to login if not authenticated
        router.push({ 
          name: 'login', 
          query: { redirect: router.currentRoute.value.fullPath } 
        })
        return
      }
      
      await printifyStore.fetchUpcomingProducts()
    }

    const formatPrice = (price) => {
      if (!price) return 'Pricing TBD'
      
      // Format the price as currency
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }

    const formatReleaseDate = (date) => {
      if (!date) return 'Coming Soon'
      
      try {
        // Try to format the date
        const releaseDate = new Date(date)
        // Check if valid date
        if (isNaN(releaseDate.getTime())) {
          return 'Coming Soon'
        }
        
        return releaseDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (e) {
        return 'Coming Soon'
      }
    }

    const handleImageError = (event) => {
      // Replace broken images with a placeholder
      event.target.src = '/images/placeholder-product.png'
    }

    // Lifecycle hook
    onMounted(() => {
      // Check if user is authenticated
      if (!authStore.isAuthenticated) {
        // Will be handled by router navigation guard
        console.warn('Authentication required to view upcoming products')
        return
      }
      
      // Fetch upcoming products on component mount
      fetchUpcomingProducts()
    })

    return {
      loading,
      error,
      upcomingProducts,
      fetchUpcomingProducts,
      formatPrice,
      formatReleaseDate,
      handleImageError
    }
  }
}
</script>

<style>
.upcoming-products-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 2rem;
  text-align: center;
}

.view-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
}

.sub-heading {
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.loading-indicator {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--color-primary);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error state */
.error-state {
  text-align: center;
  padding: 2rem;
  background-color: rgba(var(--color-danger-rgb), 0.1);
  border-radius: 8px;
  margin: 1rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
  background-color: var(--color-background-alt);
  border-radius: 8px;
  margin: 1rem 0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Products grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.product-card {
  background: var(--color-background-alt);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 2;
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid var(--color-border);
}

.product-content {
  padding: 1.5rem;
}

.product-title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.product-description {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.product-status {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
}

.product-status.active {
  background-color: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.product-status.draft {
  background-color: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning);
}

.product-status.archived {
  background-color: rgba(var(--color-info-rgb), 0.2);
  color: var(--color-info);
}

.product-price {
  font-weight: bold;
  color: var(--color-text);
}

.pricing-tbd {
  font-style: italic;
  opacity: 0.8;
}

.product-release {
  margin-top: 1rem;
  font-size: 0.9rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
  display: flex;
  justify-content: space-between;
}

.release-label {
  color: var(--color-text-muted);
}

.release-date {
  font-weight: bold;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  .product-image {
    height: 160px;
  }

  .product-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
