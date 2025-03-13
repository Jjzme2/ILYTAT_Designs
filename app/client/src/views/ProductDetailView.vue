<template>
  <div class="product-detail-view">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading product details...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button class="back-button" @click="goBack">Go Back</button>
    </div>

    <div v-else-if="product" class="product-container">
      <!-- Breadcrumb navigation -->
      <div class="breadcrumb">
        <router-link :to="{ name: 'home' }">Home</router-link> &gt;
        <router-link :to="{ name: 'products' }">Products</router-link> &gt;
        <span>{{ product.title }}</span>
      </div>

      <div class="product-detail-grid">
        <!-- Product Images Gallery -->
        <div class="product-gallery">
          <div class="main-image-container">
            <img 
              :src="currentImage" 
              :alt="product.title" 
              class="main-image" 
            />
          </div>
          <div class="thumbnail-container">
            <div 
              v-for="(image, index) in product.images" 
              :key="index"
              class="thumbnail"
              :class="{ 'active': currentImageIndex === index }"
              @click="setCurrentImage(index)"
            >
              <img :src="image.src" :alt="`${product.title} - view ${index + 1}`" />
            </div>
          </div>
        </div>

        <!-- Product Information -->
        <div class="product-info">
          <h1 class="product-title">{{ product.title }}</h1>
          
          <div class="product-price" v-if="selectedVariant">
            <span class="price">{{ formatPrice(selectedVariant.price) }}</span>
            <span class="original-price" v-if="selectedVariant.compare_at">
              {{ formatPrice(selectedVariant.compare_at) }}
            </span>
          </div>
          
          <div class="product-description" v-html="product.description"></div>
          
          <!-- Variant Selectors -->
          <div class="variant-options">
            <div 
              v-for="(option, optionIndex) in product.options" 
              :key="optionIndex"
              class="option-selector"
            >
              <label>{{ option.name }}</label>
              <div class="option-values">
                <button 
                  v-for="value in option.values" 
                  :key="value"
                  class="option-value-btn"
                  :class="{ 'selected': selectedOptions[optionIndex] === value }"
                  @click="selectOption(optionIndex, value)"
                >
                  {{ value }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Quantity Selector -->
          <div class="quantity-selector">
            <label for="quantity">Quantity</label>
            <div class="quantity-controls">
              <button 
                class="quantity-btn" 
                @click="decrementQuantity" 
                :disabled="quantity <= 1"
              >-</button>
              <input 
                type="number" 
                id="quantity" 
                v-model.number="quantity" 
                min="1" 
                max="99"
              />
              <button 
                class="quantity-btn" 
                @click="incrementQuantity"
                :disabled="quantity >= 99"
              >+</button>
            </div>
          </div>
          
          <!-- Add to Cart Button -->
          <button 
            class="add-to-cart-btn" 
            @click="addToCart" 
            :disabled="!selectedVariant || !isVariantAvailable"
          >
            <span v-if="!selectedVariant">Select options</span>
            <span v-else-if="!isVariantAvailable">Out of Stock</span>
            <span v-else>Add to Cart</span>
          </button>
          
          <!-- Product Details -->
          <div class="product-details">
            <h3>Product Details</h3>
            <div v-if="product.tags && product.tags.length" class="product-tags">
              <span>Tags:</span>
              <span v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div v-if="product.category" class="product-category">
              <span>Category:</span>
              <span>{{ product.category }}</span>
            </div>
            <div v-if="product.shipping" class="product-shipping">
              <span>Shipping:</span>
              <span>{{ product.shipping }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <div class="related-products" v-if="relatedProducts.length > 0">
        <h2>You May Also Like</h2>
        <div class="related-products-grid">
          <div 
            v-for="relatedProduct in relatedProducts" 
            :key="relatedProduct.id"
            class="related-product-card"
            @click="viewProduct(relatedProduct.id)"
          >
            <div class="related-product-img">
              <img 
                :src="relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0].src : '/images/placeholder-product.jpg'" 
                :alt="relatedProduct.title" 
              />
            </div>
            <div class="related-product-info">
              <h4>{{ relatedProduct.title }}</h4>
              <p class="related-product-price">
                {{ relatedProduct.priceRange || formatPrice(relatedProduct.variants[0]?.price || 0) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'

export default {
  name: 'ProductDetailView',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const printifyStore = usePrintifyStore()
    
    // State
    const productId = ref(route.params.id)
    const currentImageIndex = ref(0)
    const selectedOptions = ref([])
    const quantity = ref(1)
    
    // Computed
    const product = computed(() => printifyStore.selectedProduct)
    const loading = computed(() => printifyStore.loading.selectedProduct)
    const error = computed(() => printifyStore.error.selectedProduct)
    
    const currentImage = computed(() => {
      if (product.value && product.value.images && product.value.images.length > 0) {
        return product.value.images[currentImageIndex.value]?.src || ''
      }
      return '/images/placeholder-product.jpg'
    })
    
    // Find the matching variant based on selected options
    const selectedVariant = computed(() => {
      if (!product.value || !product.value.variants || selectedOptions.value.length === 0) {
        return null
      }
      
      // Find the variant that matches all selected options
      return product.value.variants.find(variant => {
        // Check if every option value in the variant matches the selected options
        if (!variant.options || variant.options.length !== selectedOptions.value.length) {
          return false
        }
        
        return variant.options.every((option, index) => {
          return option === selectedOptions.value[index]
        })
      }) || null
    })
    
    const isVariantAvailable = computed(() => {
      if (!selectedVariant.value) return false
      return selectedVariant.value.is_available !== false
    })
    
    // Related products based on category or tags
    const relatedProducts = computed(() => {
      if (!product.value || !printifyStore.publicProducts.length) {
        return []
      }
      
      return printifyStore.publicProducts
        .filter(p => p.id !== product.value.id)
        .filter(p => {
          // Match by category or tags
          const sameCategory = product.value.category && p.category === product.value.category
          const sharedTags = product.value.tags && p.tags && 
            product.value.tags.some(tag => p.tags.includes(tag))
          
          return sameCategory || sharedTags
        })
        .slice(0, 4) // Limit to 4 related products
    })
    
    // Methods
    const loadProductData = async () => {
      try {
        await printifyStore.fetchPublicProductById(productId.value)
        
        // Initialize selected options
        if (product.value && product.value.options) {
          selectedOptions.value = product.value.options.map(option => option.values[0] || '')
        }
        
        // Prefetch related products if needed
        if (printifyStore.publicProducts.length === 0) {
          await printifyStore.fetchPublicProducts()
        }
      } catch (error) {
        console.error('Error loading product:', error)
      }
    }
    
    const setCurrentImage = (index) => {
      currentImageIndex.value = index
    }
    
    const selectOption = (optionIndex, value) => {
      selectedOptions.value[optionIndex] = value
    }
    
    const incrementQuantity = () => {
      quantity.value = Math.min(99, quantity.value + 1)
    }
    
    const decrementQuantity = () => {
      quantity.value = Math.max(1, quantity.value - 1)
    }
    
    const addToCart = () => {
      if (selectedVariant.value) {
        printifyStore.addToCart(product.value, selectedVariant.value, quantity.value)
      }
    }
    
    const viewProduct = (id) => {
      router.push({ name: 'product-detail', params: { id } })
    }
    
    const goBack = () => {
      router.go(-1)
    }
    
    // Format currency 
    const formatPrice = (price) => {
      // Check if already formatted with "$"
      if (typeof price === 'string' && price.startsWith('$')) {
        return price;
      }
      return `$${parseFloat(price).toFixed(2)}`
    }
    
    // Reset product data when route changes (for related product navigation)
    watch(() => route.params.id, (newId) => {
      if (newId !== productId.value) {
        productId.value = newId
        currentImageIndex.value = 0
        loadProductData()
      }
    })
    
    // Load data on component mount
    onMounted(() => {
      loadProductData()
    })
    
    return {
      product,
      loading,
      error,
      currentImage,
      currentImageIndex,
      selectedOptions,
      selectedVariant,
      isVariantAvailable,
      quantity,
      relatedProducts,
      setCurrentImage,
      selectOption,
      incrementQuantity,
      decrementQuantity,
      addToCart,
      formatPrice,
      viewProduct,
      goBack
    }
  }
}
</script>

<style>
.product-detail-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Loading and Error States */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  text-align: center;
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

.error-container {
  color: #d32f2f;
}

.back-button {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: #666;
}

.breadcrumb a {
  color: #3498db;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

/* Product Grid Layout */
.product-detail-grid {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr);
  gap: 40px;
  margin-bottom: 64px;
}

/* Product Gallery */
.product-gallery {
  display: flex;
  flex-direction: column;
}

.main-image-container {
  width: 100%;
  height: 400px;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid #eee;
  cursor: pointer;
  transition: border-color 0.2s;
}

.thumbnail:hover, .thumbnail.active {
  border-color: #3498db;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-title {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.original-price {
  font-size: 1rem;
  color: #999;
  text-decoration: line-through;
}

.product-description {
  margin: 16px 0;
  color: #555;
  line-height: 1.6;
}

/* Variant Options */
.variant-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.option-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-selector label {
  font-weight: 600;
  color: #333;
}

.option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-value-btn {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-value-btn:hover {
  border-color: #3498db;
}

.option-value-btn.selected {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

/* Quantity Selector */
.quantity-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.quantity-selector label {
  font-weight: 600;
  color: #333;
}

.quantity-controls {
  display: flex;
  align-items: center;
  width: fit-content;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.quantity-btn {
  width: 40px;
  height: 40px;
  background-color: #f7f7f7;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-controls input {
  width: 60px;
  height: 40px;
  border: none;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  text-align: center;
  font-size: 1rem;
}

/* Add to Cart Button */
.add-to-cart-btn {
  margin-top: 24px;
  padding: 16px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.add-to-cart-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

/* Product Details */
.product-details {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.product-details h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.2rem;
  color: #333;
}

.product-tags, .product-category, .product-shipping {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.product-tags span:first-child,
.product-category span:first-child,
.product-shipping span:first-child {
  font-weight: 600;
}

.tag {
  background-color: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Related Products */
.related-products {
  margin-top: 64px;
}

.related-products h2 {
  font-size: 1.5rem;
  margin-bottom: 24px;
  color: #333;
  text-align: center;
}

.related-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.related-product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.related-product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.related-product-img {
  height: 180px;
  overflow: hidden;
}

.related-product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-product-info {
  padding: 12px;
}

.related-product-info h4 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-product-price {
  font-weight: 600;
  margin: 0;
  color: #333;
}

/* Responsive Design */
@media (max-width: 768px) {
  .product-detail-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .main-image-container {
    height: 300px;
  }
  
  .product-title {
    font-size: 1.5rem;
  }
  
  .product-price .price {
    font-size: 1.3rem;
  }
  
  .related-products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
