<template>
  <div class="products-view">
    <header class="view-header">
      <h1>Products</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="handleCreateProduct">
          Create Product
        </button>
      </div>
    </header>

    <div class="filters">
      <input
        v-model="filters.search"
        type="text"
        placeholder="Search products..."
        class="filter-input"
      />
      <select v-model="filters.status" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      Loading products...
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      No products found
    </div>

    <div v-else class="products-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
      >
        <img :src="product.thumbnail" :alt="product.title" class="product-image" />
        <div class="product-content">
          <h3 class="product-title">{{ product.title }}</h3>
          <p class="product-description">{{ product.description }}</p>
          <div class="product-meta">
            <span class="product-status" :class="product.status">
              {{ product.status }}
            </span>
            <span class="product-price">
              {{ formatPrice(product.price) }}
            </span>
          </div>
          <div class="product-actions">
            <button
              class="btn btn-secondary"
              @click="handleEditProduct(product)"
            >
              Edit
            </button>
            <button
              class="btn btn-danger"
              @click="handleDeleteProduct(product)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
        class="btn btn-secondary"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
        class="btn btn-secondary"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'ProductsView',
  setup() {
    const route = useRoute()
    const printifyStore = usePrintifyStore()
    const uiStore = useUIStore()
    const loading = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = 12

    const filters = ref({
      search: '',
      status: ''
    })

    const loadProducts = async () => {
      try {
        loading.value = true
        await printifyStore.fetchProducts(route.params.shopId)
      } catch (error) {
        uiStore.notifyError('Failed to load products')
      } finally {
        loading.value = false
      }
    }

    const filteredProducts = computed(() => {
      let products = printifyStore.products

      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        products = products.filter(p => 
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
        )
      }

      if (filters.value.status) {
        products = products.filter(p => p.status === filters.value.status)
      }

      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return products.slice(start, end)
    })

    const totalPages = computed(() => 
      Math.ceil(printifyStore.products.length / itemsPerPage)
    )

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }

    const changePage = (page) => {
      currentPage.value = page
      window.scrollTo(0, 0)
    }

    const handleCreateProduct = () => {
      // Implement product creation logic
    }

    const handleEditProduct = (product) => {
      // Implement product editing logic
    }

    const handleDeleteProduct = async (product) => {
      if (!confirm('Are you sure you want to delete this product?')) return

      try {
        await printifyStore.deleteProduct(product.id)
        uiStore.notifySuccess('Product deleted successfully')
      } catch (error) {
        uiStore.notifyError('Failed to delete product')
      }
    }

    watch(filters, () => {
      currentPage.value = 1
    })

    onMounted(() => {
      loadProducts()
    })

    return {
      loading,
      filters,
      filteredProducts,
      currentPage,
      totalPages,
      formatPrice,
      changePage,
      handleCreateProduct,
      handleEditProduct,
      handleDeleteProduct
    }
  }
}
</script>

<style>
.products-view {
  padding: var(--spacing-4);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.filters {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.filter-input,
.filter-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-background);
  color: var(--color-text);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-4);
}

.product-card {
  background: var(--color-background-alt);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-content {
  padding: var(--spacing-4);
}

.product-title {
  margin-bottom: var(--spacing-2);
}

.product-description {
  color: var(--color-text-light);
  margin-bottom: var(--spacing-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.product-status {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius);
  font-size: 0.875rem;
}

.product-status.active {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.product-status.draft {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.product-status.archived {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.product-actions {
  display: flex;
  gap: var(--spacing-2);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-6);
}

.page-info {
  color: var(--color-text-light);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
