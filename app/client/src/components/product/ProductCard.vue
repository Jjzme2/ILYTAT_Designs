<template>
  <div class="product-card" @click="navigateToProduct">
    <div class="product-image-container">
      <div v-if="isImageLoading" class="image-loading-container">
        <div class="loading-spinner"></div>
      </div>
      <img 
        :src="productImage" 
        :alt="product.title" 
        class="product-image"
        loading="lazy"
        @load="handleImageLoaded"
        @error="handleImageError"
        :class="{ 'image-loaded': !isImageLoading }"
      />
      <div v-if="isDiscounted" class="discount-badge">Sale</div>
      <div v-if="!isInStock" class="out-of-stock-badge">Out of Stock</div>
    </div>
    
    <div class="product-info">
      <h3 class="product-title">{{ product.title }}</h3>
      
      <div class="product-price">
        <span class="current-price">{{ formattedPrice }}</span>
        <span v-if="isDiscounted" class="original-price">{{ formattedComparePrice }}</span>
      </div>
      
      <div class="product-metadata">
        <span v-if="product.category" class="product-category">{{ product.category }}</span>
      </div>
      
      <button 
        class="quick-view-btn" 
        @click.stop="$emit('quickView', product.id)"
      >
        Quick View
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ProductCard',
  
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  
  emits: ['quickView'],
  
  setup(props) {
    const router = useRouter()
    const isImageLoading = ref(true)
    
    // Computed properties
    const productImage = computed(() => {
      // Simply use the first available image
      if (props.product.images && props.product.images.length > 0) {
        return props.product.images[0].src;
      }
      console.log('No images available for product:', props.product.title)
      // If no images available, use placeholder
      return '/images/placeholder-product.jpg'
    })
    
    const formattedPrice = computed(() => {
      // Use the priceRange property if available (our new format)
      if (props.product.priceRange) {
        return props.product.priceRange;
      }
      
      // Fallback to the old format
      const price = props.product.variants && props.product.variants.length > 0
        ? props.product.variants[0].price
        : 0
      return `$${parseFloat(price).toFixed(2)}`
    })
    
    const formattedComparePrice = computed(() => {
      const comparePrice = props.product.variants && props.product.variants.length > 0
        ? props.product.variants[0].compare_at
        : 0
      return comparePrice ? `$${parseFloat(comparePrice).toFixed(2)}` : ''
    })
    
    const isDiscounted = computed(() => {
      if (!props.product.variants || props.product.variants.length === 0) return false
      
      const variant = props.product.variants[0]
      return variant.compare_at && parseFloat(variant.compare_at) > parseFloat(variant.price)
    })
    
    const isInStock = computed(() => {
      if (!props.product.variants || props.product.variants.length === 0) return false
      
      // Check if at least one variant is in stock
      return props.product.variants.some(variant => variant.is_available !== false)
    })
    
    // Methods
    const navigateToProduct = () => {
      router.push({ 
        name: 'product-detail', 
        params: { id: props.product.id } 
      })
    }
    
    const handleImageLoaded = () => {
      isImageLoading.value = false
    }
    
    const handleImageError = () => {
      isImageLoading.value = false
      console.error(`Error loading image for product: ${props.product.title}`)
    }
    
    return {
      productImage,
      formattedPrice,
      formattedComparePrice,
      isDiscounted,
      isInStock,
      navigateToProduct,
      isImageLoading,
      handleImageLoaded,
      handleImageError
    }
  }
}
</script>

<style>
.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  cursor: pointer;
  border: 1px solid #eee;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image-container {
  position: relative;
  padding-top: 100%; /* 1:1 Aspect Ratio */
  overflow: hidden;
  background-color: #f9f9f9;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.image-loaded {
  opacity: 1;
}

.image-loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.discount-badge, .out-of-stock-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1;
}

.discount-badge {
  background-color: #e74c3c;
  color: white;
}

.out-of-stock-badge {
  background-color: #7f8c8d;
  color: white;
}

.product-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
}

.product-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.current-price {
  font-weight: 600;
  color: #333;
}

.original-price {
  color: #999;
  text-decoration: line-through;
  font-size: 0.85rem;
}

.product-metadata {
  margin-top: auto;
  font-size: 0.8rem;
  color: #666;
}

.product-category {
  display: inline-block;
  padding: 2px 6px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 4px;
}

.quick-view-btn {
  width: 100%;
  padding: 8px 0;
  margin-top: 12px;
  background-color: transparent;
  border: 1px solid #3498db;
  color: #3498db;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
}

.quick-view-btn:hover {
  background-color: #3498db;
  color: white;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .product-title {
    font-size: 0.9rem;
  }
  
  .product-info {
    padding: 12px;
  }
  
  .quick-view-btn {
    padding: 6px 0;
    font-size: 0.8rem;
  }
}
</style>
