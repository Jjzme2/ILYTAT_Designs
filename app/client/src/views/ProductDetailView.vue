<template>
  <div class="product-detail-view">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading product details...</p>
    </div>

    <!-- New section for fallback products -->
    <div v-else-if="productIsFallback" class="product-unavailable-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h2>{{ product.title }}</h2>
      <p>{{ product.description }}</p>
      <div class="action-buttons">
        <button class="back-button" @click="goBack">Go Back</button>
        <button class="retry-button" @click="retryFetch">Try Again</button>
      </div>
    </div>

    <div v-else-if="error && !product" class="error-container">
      <p>{{ typeof error === 'string' ? error : 'There was an error loading this product' }}</p>
      <button class="back-button" @click="goBack">Go Back</button>
      <button class="retry-button" @click="retryFetch">Try Again</button>
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
              <div class="thumbnail-wrapper">
                <img :src="image.src" :alt="`${product.title} - view ${index + 1}`" />
              </div>
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
              <div class="option-values" :class="{ 'color-options': option.name.toLowerCase().includes('color') }">
                <button 
                  v-for="value in option.values" 
                  :key="value.id || value"
                  class="option-value-btn"
                  :class="{ 
                    'selected': isOptionSelected(optionIndex, value),
                    'color-option': option.name.toLowerCase().includes('color')
                  }"
                  :style="getColorStyle(option, value)"
                  @click="selectOption(optionIndex, value)"
                  :title="getOptionDisplayValue(value)"
                >
                  <span v-if="!option.name.toLowerCase().includes('color')">
                    {{ getOptionDisplayValue(value) }}
                  </span>
                  <span v-else class="color-name">{{ getOptionDisplayValue(value) }}</span>
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
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
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
    const loadingRetries = ref(0)
    const maxRetries = 2
    const fetchError = ref(null)
    
    // Computed
    const product = computed(() => printifyStore.selectedProduct)
    const loading = computed(() => printifyStore.loading.selectedProduct)
    const error = computed(() => {
      // Use local error or fallback to the store error
      return fetchError.value || printifyStore.error.selectedProduct
    })
    
    const currentImage = computed(() => {
      if (product.value && product.value.images && product.value.images.length > 0) {
        return product.value.images[currentImageIndex.value]?.src || '/images/placeholder-product.jpg'
      }
      return '/images/placeholder-product.jpg'
    })
    
    // Find the matching variant based on selected options
    const selectedVariant = computed(() => {
      if (!product.value || !product.value.variants || !Array.isArray(product.value.variants) || 
          product.value.variants.length === 0 || selectedOptions.value.length === 0) {
        return product.value?.variants?.[0] || null
      }
      
      // Find the variant that matches all selected options
      return product.value.variants.find(variant => {
        // Check if every option value in the variant matches the selected options
        if (!variant.title) return false
        
        const variantOptions = variant.title.split(' / ')
        if (variantOptions.length !== selectedOptions.value.length) return false
        
        return variantOptions.every((optValue, index) => 
          optValue === selectedOptions.value[index]
        )
      }) || product.value.variants[0] // Default to first variant if no match
    })
    
    const isVariantAvailable = computed(() => {
      return selectedVariant.value && selectedVariant.value.is_available !== false
    })
    
    // Find related products based on tags or category
    const relatedProducts = computed(() => {
      if (!product.value || !product.value.tags || !Array.isArray(printifyStore.publicProducts)) {
        return []
      }
      
      // Get related products - either by tags or category, but exclude current product
      const relatedByTags = printifyStore.publicProducts
        .filter(p => {
          // Don't include current product
          if (p.id === product.value.id) return false
          
          // Check if product has matching tags
          if (Array.isArray(p.tags) && Array.isArray(product.value.tags)) {
            return p.tags.some(tag => product.value.tags.includes(tag))
          }
          
          // If no tags, check category
          return p.category === product.value.category
        })
        .slice(0, 4) // Limit to 4 related products
      
      return relatedByTags
    })
    
    // New computed property to check if product is a fallback
    const productIsFallback = computed(() => {
      return product.value && product.value._fallback === true
    })
    
    // Methods
    const loadProductData = async () => {
      fetchError.value = null
      try {
        const result = await printifyStore.fetchPublicProductById(productId.value)
        
        // Extra validation to handle null data cases
        if (!result) {
          fetchError.value = 'Product data could not be loaded'
          console.warn('Product data is null or undefined after successful fetch')
        }
        
        // Initialize selected options from product data
        if (product.value && product.value.options && Array.isArray(product.value.options)) {
          selectedOptions.value = product.value.options.map(option => 
            option.values && option.values.length > 0 ? option.values[0] : ''
          )
        }
        
        // Load public products for related items if needed
        if (printifyStore.publicProducts.length === 0) {
          await printifyStore.fetchPublicProducts()
        }
      } catch (err) {
        console.error('Error loading product data:', err)
        fetchError.value = err.message || 'Failed to load product'
        
        // Implement retry logic for network errors
        if (loadingRetries.value < maxRetries && (err.message?.includes('network') || err.message?.includes('timeout'))) {
          loadingRetries.value++
          setTimeout(loadProductData, 1000 * loadingRetries.value) // Exponential backoff
        }
      }
    }
    
    const setCurrentImage = (index) => {
      if (product.value && product.value.images && index >= 0 && index < product.value.images.length) {
        currentImageIndex.value = index
      }
    }
    
    const selectOption = (optionIndex, value) => {
      // Extract the value ID or value itself
      const valueId = value.id || value;
      const displayValue = value.name || value;
      
      // Clone the array to trigger reactivity
      const newOptions = [...selectedOptions.value];
      newOptions[optionIndex] = valueId;
      selectedOptions.value = newOptions;
      
      // Also update the current image if color was selected
      if (product.value?.options?.[optionIndex]?.name?.toLowerCase().includes('color')) {
        // Try to find a matching variant image based on the color
        const variants = product.value.variants || [];
        const colorVariant = variants.find(v => {
          if (v.options && Array.isArray(v.options) && v.options.length > optionIndex) {
            return v.options[optionIndex] === valueId;
          }
          return false;
        });
        
        // If variant has a specific image, use it
        if (colorVariant && colorVariant.image) {
          const imageIndex = product.value.images.findIndex(img => img.src === colorVariant.image.src);
          if (imageIndex !== -1) {
            currentImageIndex.value = imageIndex;
          }
        }
      }
    };
    
    const isOptionSelected = (optionIndex, value) => {
      return selectedOptions.value[optionIndex] === (value.id || value)
    }
    
    const getColorStyle = (option, value) => {
      if (option.name.toLowerCase().includes('color')) {
        // Check if value is an object with hex_color property or has color array
        if (value.hex_color) {
          return {
            backgroundColor: value.hex_color,
            color: isLightColor(value.hex_color) ? '#333' : '#fff'
          };
        } else if (value.colors && value.colors.length > 0) {
          return {
            backgroundColor: value.colors[0],
            color: isLightColor(value.colors[0]) ? '#333' : '#fff'
          };
        }
        return { backgroundColor: '#ccc', color: '#333' };
      }
      return {};
    }
    
    const isLightColor = (hexColor) => {
      // Remove the hash at the start if it exists
      hexColor = hexColor.replace(/^#/, '');
      
      // Parse the r, g, b values
      let r, g, b;
      if (hexColor.length === 3) {
        r = parseInt(hexColor.charAt(0) + hexColor.charAt(0), 16);
        g = parseInt(hexColor.charAt(1) + hexColor.charAt(1), 16);
        b = parseInt(hexColor.charAt(2) + hexColor.charAt(2), 16);
      } else {
        r = parseInt(hexColor.substring(0, 2), 16);
        g = parseInt(hexColor.substring(2, 4), 16);
        b = parseInt(hexColor.substring(4, 6), 16);
      }
      
      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return true if light, false if dark
      return luminance > 0.5;
    }
    
    const getOptionDisplayValue = (value) => {
      // Handle different data structures
      if (!value) return 'N/A';
      
      if (typeof value === 'string') return value;
      
      if (value.name) return value.name;
      
      if (value.title) return value.title;
      
      if (value.id) return `Option ${value.id}`;
      
      return JSON.stringify(value);
    }
    
    const incrementQuantity = () => {
      if (quantity.value < 99) {
        quantity.value++
      }
    }
    
    const decrementQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }
    
    const addToCart = () => {
      if (product.value && selectedVariant.value) {
        printifyStore.addToCart(
          product.value,
          selectedVariant.value,
          quantity.value
        )
        // Provide feedback to user
        // This could be improved with a toast notification
        alert('Product added to cart!')
      }
    }
    
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '$0.00'
      return `$${(parseFloat(price) / 100).toFixed(2)}`
    }
    
    const goBack = () => {
      router.back()
    }
    
    const viewProduct = (id) => {
      router.push({ name: 'product-detail', params: { id } })
    }
    
    const retryFetch = () => {
      loadProductData()
    }
    
    // Lifecycle hooks
    onMounted(() => {
      loadProductData()
      
      // Reset page position
      window.scrollTo(0, 0)
    })
    
    // Clean up when navigating away
    onBeforeUnmount(() => {
      // Reset selected product in store when leaving page
      // This prevents stale data issues when navigating between products
      printifyStore.selectedProduct = null
    })
    
    // Watch for route changes (for handling navigation between product pages)
    watch(() => route.params.id, (newId, oldId) => {
      if (newId && newId !== oldId) {
        productId.value = newId
        loadingRetries.value = 0 // Reset retry counter
        loadProductData()
        currentImageIndex.value = 0 // Reset image index
        window.scrollTo(0, 0) // Scroll back to top
      }
    })
    
    return {
      product,
      loading,
      error,
      currentImageIndex,
      currentImage,
      selectedOptions,
      selectedVariant,
      isVariantAvailable,
      quantity,
      relatedProducts,
      setCurrentImage,
      selectOption,
      isOptionSelected,
      getColorStyle,
      getOptionDisplayValue,
      incrementQuantity,
      decrementQuantity,
      addToCart,
      formatPrice,
      goBack,
      viewProduct,
      productIsFallback,
      retryFetch
    }
  }
}
</script>

<style>
.product-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.error-container,
.product-unavailable-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #3498db;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.product-container {
  margin-top: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
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

.product-detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 768px) {
  .product-detail-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Product Gallery */
.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-image-container {
  width: 100%;
  position: relative;
  padding-top: 100%; /* Creates a 1:1 aspect ratio box */
  overflow: hidden;
  border-radius: 8px;
  background-color: #f7f7f7;
}

.main-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* Maintain aspect ratio without cropping */
  object-position: center;
}

.thumbnail-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.thumbnail {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  height: 70px;
  position: relative;
  background-color: #f0f0f0;
}

.thumbnail.active {
  border-color: #3498db;
}

.thumbnail-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s;
}

.thumbnail:hover img {
  transform: scale(1.05);
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-title {
  font-size: 1.8rem;
  margin: 0;
  color: #333;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.original-price {
  font-size: 1.1rem;
  text-decoration: line-through;
  color: #999;
}

.product-description {
  line-height: 1.6;
  color: #555;
  margin-bottom: 20px;
}

/* Variant Options */
.variant-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.option-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-selector label {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-values.color-options {
  gap: 12px;
}

.option-value-btn {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.option-value-btn.color-option {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid #ccc;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.option-value-btn.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.option-value-btn.color-option.selected {
  transform: scale(1.15);
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3498db;
}

.option-value-btn.color-option .color-name {
  display: none;
}

.option-value-btn:hover {
  border-color: #3498db;
}

.option-value-btn.selected {
  background-color: #e8f5fd;
  border-color: #3498db;
  color: #2980b9;
  font-weight: bold;
}

/* Quantity Selector */
.quantity-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.quantity-selector label {
  font-weight: bold;
  color: #333;
}

.quantity-controls {
  display: flex;
  align-items: center;
  max-width: 120px;
}

.quantity-btn {
  width: 36px;
  height: 36px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.quantity-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.quantity-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#quantity {
  width: 50px;
  height: 36px;
  text-align: center;
  border: 1px solid #ddd;
  border-left: 0;
  border-right: 0;
  font-size: 1rem;
}

/* Add to Cart Button */
.add-to-cart-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 20px;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.add-to-cart-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Product Details */
.product-details {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.product-details h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #333;
}

.product-tags, 
.product-category,
.product-shipping {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.product-tags span:first-child,
.product-category span:first-child,
.product-shipping span:first-child {
  font-weight: bold;
  color: #666;
}

.tag {
  background-color: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

/* Related Products */
.related-products {
  margin-top: 60px;
}

.related-products h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.related-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.related-product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.related-product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.related-product-img {
  height: 200px;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: #f7f7f7;
}

.related-product-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
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
  color: #3498db;
  font-weight: bold;
}

/* Error and fallback styling */
.error-icon {
  font-size: 3rem;
  color: #e74c3c;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.back-button, 
.retry-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.back-button {
  background-color: #ecf0f1;
  color: #34495e;
}

.retry-button {
  background-color: #3498db;
  color: white;
}

@media (max-width: 767px) {
  .product-detail-view {
    padding: 15px;
  }
  
  .product-title {
    font-size: 1.5rem;
  }
  
  .related-products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .option-values {
    justify-content: center;
  }
  
  .option-value-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  
  .add-to-cart-btn {
    width: 100%;
  }
}
</style>
