<template>
  <div class="products-view">
    <section class="hero-section">
      <div class="hero-content">
        <h1>Discover Our Collection</h1>
        <p>Unique designs crafted with passion and style</p>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="featured-products-section">
      <div class="section-header">
        <h2>Featured Products</h2>
        <p>Explore our handpicked selection of exceptional items</p>
      </div>

      <div v-if="loading.featuredProducts" class="loading-container">
        <div class="spinner"></div>
        <p>Loading featured products...</p>
      </div>

      <div v-else-if="error.featuredProducts" class="error-container">
        <p>{{ error.featuredProducts }}</p>
      </div>

      <div v-else class="products-grid">
        <product-card 
          v-for="product in featuredProducts" 
          :key="product.id" 
          :product="product"
          @click="viewProductDetails(product.id)" 
        />
      </div>
    </section>

    <!-- Best Sellers Section -->
    <section class="best-sellers-section">
      <div class="section-header">
        <h2>Best Sellers</h2>
        <p>Our customers' favorites</p>
      </div>

      <div v-if="loading.bestSellerProducts" class="loading-container">
        <div class="spinner"></div>
        <p>Loading best sellers...</p>
      </div>

      <div v-else-if="error.bestSellerProducts" class="error-container">
        <p>{{ error.bestSellerProducts }}</p>
      </div>

      <div v-else class="products-grid">
        <product-card 
          v-for="product in bestSellerProducts" 
          :key="product.id" 
          :product="product"
          @click="viewProductDetails(product.id)" 
        />
      </div>
    </section>

    <!-- All Products Section -->
    <section class="all-products-section">
      <div class="section-header">
        <h2>All Products</h2>
        <p>Browse our complete collection</p>
      </div>

      <div class="filter-controls">
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search products..." 
            @input="filterProducts"
          />
        </div>
        <div class="category-filter">
          <select v-model="selectedCategory" @change="filterProducts">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="sort-options">
          <select v-model="sortOption" @change="filterProducts">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div v-if="loading.publicProducts" class="loading-container">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>

      <div v-else-if="error.publicProducts" class="error-container">
        <p>{{ error.publicProducts }}</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="no-results">
        <p>No products found matching your criteria</p>
      </div>

      <div v-else class="products-grid">
        <product-card 
          v-for="product in filteredProducts" 
          :key="product.id" 
          :product="product"
          @click="viewProductDetails(product.id)" 
        />
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1" 
          class="pagination-btn"
        >
          Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages" 
          class="pagination-btn"
        >
          Next
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'
import ProductCard from '@/components/product/ProductCard.vue'

export default {
  name: 'ProductsView',
  components: {
    ProductCard
  },
  setup() {
    const router = useRouter()
    const printifyStore = usePrintifyStore()
    
    // Data
    const searchQuery = ref('')
    const selectedCategory = ref('')
    const sortOption = ref('featured')
    const currentPage = ref(1)
    const itemsPerPage = ref(12)
    const categories = ref([])
    
    // Computed properties
    const featuredProducts = computed(() => printifyStore.featuredProducts || [])
    const bestSellerProducts = computed(() => printifyStore.bestSellerProducts || [])
    const allProducts = computed(() => printifyStore.publicProducts || [])
    
    const loading = computed(() => ({
      publicProducts: printifyStore.loading.publicProducts,
      featuredProducts: printifyStore.loading.featuredProducts,
      bestSellerProducts: printifyStore.loading.bestSellerProducts
    }))
    
    const error = computed(() => ({
      publicProducts: printifyStore.error.publicProducts,
      featuredProducts: printifyStore.error.featuredProducts,
      bestSellerProducts: printifyStore.error.bestSellerProducts
    }))
    
    // Calculate filtered products
    const filteredProducts = computed(() => {
      let result = [...allProducts.value]
      
      // Apply category filter
      if (selectedCategory.value) {
        result = result.filter(product => 
          product.category === selectedCategory.value
        )
      }
      
      // Apply search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(product => 
          product.title.toLowerCase().includes(query) || 
          product.description.toLowerCase().includes(query)
        )
      }
      
      // Apply sorting
      switch (sortOption.value) {
        case 'newest':
          result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          break
        case 'price-low':
          result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
          break
        case 'price-high':
          result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
          break
        // For featured, we use the default order from the API
      }
      
      return result
    })
    
    // Pagination
    const paginatedProducts = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage.value
      const endIndex = startIndex + itemsPerPage.value
      return filteredProducts.value.slice(startIndex, endIndex)
    })
    
    const totalPages = computed(() => {
      return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
    })
    
    // Methods
    const loadProducts = async () => {
      try {
        // Load all product data
        await Promise.all([
          printifyStore.fetchPublicProducts(),
          printifyStore.fetchFeaturedProducts(),
          printifyStore.fetchBestSellerProducts()
        ])
        
        // Extract unique categories from products
        const uniqueCategories = new Set()
        printifyStore.publicProducts.forEach(product => {
          if (product.category) {
            uniqueCategories.add(product.category)
          }
        })
        categories.value = Array.from(uniqueCategories)
        
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    
    const filterProducts = () => {
      // Reset to first page when changing filters
      currentPage.value = 1
    }
    
    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        // Scroll to products section
        document.querySelector('.all-products-section').scrollIntoView({ behavior: 'smooth' })
      }
    }
    
    const viewProductDetails = (productId) => {
      router.push({ name: 'product-detail', params: { id: productId } })
    }
    
    // Load data on component mount
    onMounted(() => {
      loadProducts()
      
      // Load cart from localStorage
      printifyStore.loadCart()
    })
    
    return {
      // Data
      searchQuery,
      selectedCategory,
      sortOption,
      currentPage,
      categories,
      
      // Computed
      featuredProducts,
      bestSellerProducts,
      filteredProducts,
      totalPages,
      loading,
      error,
      
      // Methods
      filterProducts,
      changePage,
      viewProductDetails
    }
  }
}
</script>

<style>
.products-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* Hero Section */
.hero-section {
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #3a5fad 0%, #6e45e2 50%, #d88771 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%);
  z-index: 1;
}

.hero-content {
  text-align: center;
  color: white;
  padding: 20px;
  position: relative;
  z-index: 2;
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  font-weight: 700;
}

.hero-content p {
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}

/* Section Styling */
.section-header {
  text-align: center;
  margin-bottom: 32px;
}

.section-header h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #333;
}

.section-header p {
  font-size: 1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.featured-products-section,
.best-sellers-section,
.all-products-section {
  margin-bottom: 64px;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.search-container {
  flex: 1;
  min-width: 200px;
}

.search-container input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.category-filter,
.sort-options {
  min-width: 150px;
}

.category-filter select,
.sort-options select {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-container {
  text-align: center;
  padding: 32px;
  background-color: #fff5f5;
  border: 1px solid #ffebee;
  border-radius: 8px;
  color: #d32f2f;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 48px 0;
  color: #666;
  font-size: 1.1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 32px;
  gap: 16px;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.pagination-btn:not(:disabled):hover {
  background-color: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #666;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-section {
    height: 250px;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .hero-content p {
    font-size: 1rem;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container,
  .category-filter,
  .sort-options {
    width: 100%;
  }
}
</style>
