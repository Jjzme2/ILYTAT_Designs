<template>
  <div class="home-view">
    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Unique Designs for Unique People</h1>
        <p>Discover our collection of handcrafted items designed with passion and style</p>
        <router-link to="/shop" class="cta-button">Shop Now</router-link>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="featured-section container">
      <div class="section-header">
        <h2>Featured Products</h2>
        <p>Our handpicked selection of exceptional items</p>
      </div>

      <div v-if="loading.featuredProducts" class="loading-container">
        <div class="spinner"></div>
        <p>Loading featured products...</p>
      </div>

      <div v-else-if="error.featuredProducts" class="error-container">
        <p>{{ error.featuredProducts }}</p>
      </div>

      <div v-else-if="featuredProducts.length === 0" class="empty-state">
        <p>No featured products available at the moment.</p>
        <router-link to="/shop" class="link-button">Browse All Products</router-link>
      </div>

      <div v-else class="products-grid">
        <product-card 
          v-for="product in featuredProducts" 
          :key="product.id" 
          :product="product"
          @click="viewProductDetails(product.id)" 
        />
      </div>

      <div class="view-all-container">
        <router-link to="/shop" class="view-all-link">View All Products</router-link>
      </div>
    </section>

    <!-- Best Sellers Section -->
    <section class="bestsellers-section">
      <div class="container">
        <div class="section-header">
          <h2>Customer Favorites</h2>
          <p>Our top-selling products that customers love</p>
        </div>

        <div v-if="loading.bestSellerProducts" class="loading-container">
          <div class="spinner"></div>
          <p>Loading bestsellers...</p>
        </div>

        <div v-else-if="error.bestSellerProducts" class="error-container">
          <p>{{ error.bestSellerProducts }}</p>
        </div>

        <div v-else-if="bestSellerProducts.length === 0" class="empty-state">
          <p>No bestsellers available at the moment.</p>
        </div>

        <div v-else class="products-grid">
          <product-card 
            v-for="product in bestSellerProducts" 
            :key="product.id" 
            :product="product"
            @click="viewProductDetails(product.id)" 
          />
        </div>
      </div>
    </section>

    <!-- About/Story Section -->
    <section class="about-section container">
      <div class="about-grid">
        <div class="about-image">
          <img src="/images/svg/about-placeholder.svg" alt="About ILYTAT Designs" />
        </div>
        <div class="about-content">
          <h2>Our Story</h2>
          <p>At ILYTAT Designs, we believe that every item tells a story. Our passion is creating unique, high-quality products that bring joy and personality to your everyday life.</p>
          <p>Started in 2020, our small team of dedicated designers works tirelessly to craft items that stand out from the crowd. We take pride in our attention to detail and commitment to quality.</p>
          <p>Every purchase supports our mission to create sustainable, beautiful designs while providing exceptional customer service.</p>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="categories-section container">
      <div class="section-header">
        <h2>Shop by Category</h2>
        <p>Explore our diverse collection of products</p>
      </div>

      <div class="categories-grid">
        <div 
          v-for="(category, index) in categories" 
          :key="index" 
          class="category-card"
          @click="navigateToCategory(category.slug)"
        >
          <div class="category-image">
            <img :src="category.image" :alt="category.name" />
          </div>
          <div class="category-overlay">
            <h3>{{ category.name }}</h3>
            <span class="category-link">Shop Now</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="newsletter-section">
      <div class="container">
        <div class="newsletter-container">
          <div class="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter for the latest products, exclusive offers, and design inspiration.</p>
          </div>
          <form class="newsletter-form" @submit.prevent="subscribeToNewsletter">
            <div class="input-group">
              <input 
                type="email" 
                v-model="newsletterEmail" 
                placeholder="Your email address" 
                required
              />
              <button type="submit" class="submit-btn">Subscribe</button>
            </div>
            <p class="form-note">We respect your privacy and will never share your information.</p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'
import ProductCard from '@/components/product/ProductCard.vue'

export default {
  name: 'HomeView',
  components: {
    ProductCard
  },
  
  setup() {
    const router = useRouter()
    const printifyStore = usePrintifyStore()
    const newsletterEmail = ref('')
    
    // Example categories - these would typically come from your API
    const categories = ref([
      {
        name: 'Apparel',
        slug: 'apparel',
        image: '/images/categories/apparel.svg'
      },
      {
        name: 'Home Decor',
        slug: 'home-decor',
        image: '/images/categories/home-decor.svg'
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        image: '/images/categories/accessories.svg'
      },
      {
        name: 'Gifts',
        slug: 'gifts',
        image: '/images/categories/gifts.svg'
      }
    ])
    
    // Computed properties
    const featuredProducts = computed(() => {
      return printifyStore.featuredProducts.slice(0, 4)
    })
    
    const bestSellerProducts = computed(() => {
      return printifyStore.bestSellerProducts.slice(0, 4)
    })
    
    const loading = computed(() => ({
      featuredProducts: printifyStore.loading.featuredProducts,
      bestSellerProducts: printifyStore.loading.bestSellerProducts
    }))
    
    const error = computed(() => ({
      featuredProducts: printifyStore.error.featuredProducts,
      bestSellerProducts: printifyStore.error.bestSellerProducts
    }))
    
    // Methods
    const loadProducts = async () => {
      try {
        await Promise.all([
          printifyStore.fetchFeaturedProducts(),
          printifyStore.fetchBestSellerProducts()
        ])
      } catch (error) {
        console.error('Error loading home page products:', error)
      }
    }
    
    const viewProductDetails = (productId) => {
      router.push({ name: 'product-detail', params: { id: productId } })
    }
    
    const navigateToCategory = (categorySlug) => {
      router.push({ 
        name: 'shop', 
        query: { category: categorySlug } 
      })
    }
    
    const subscribeToNewsletter = () => {
      // This would typically make an API call to your backend
      alert(`Thank you for subscribing with ${newsletterEmail.value}!`)
      newsletterEmail.value = ''
    }
    
    // Load data on component mount
    onMounted(() => {
      loadProducts()
      
      // Load cart from localStorage if available
      printifyStore.loadCart()
    })
    
    return {
      featuredProducts,
      bestSellerProducts,
      categories,
      loading,
      error,
      newsletterEmail,
      viewProductDetails,
      navigateToCategory,
      subscribeToNewsletter
    }
  }
}
</script>

<style>
/* Container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero-section {
  height: 600px;
  background: linear-gradient(135deg, #6e45e2 0%, #88d3ce 50%, #d88771 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  margin-bottom: 4rem;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.4));
  z-index: 1;
}

.hero-section::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  animation: animatePattern 40s linear infinite;
  z-index: 0;
  opacity: 0.5;
}

.hero-content {
  max-width: 800px;
  padding: 0 2rem;
  position: relative;
  z-index: 2;
  animation: fadeInUp 1s ease-out;
}

.hero-content h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hero-content p {
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  line-height: 1.5;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}

.cta-button {
  display: inline-block;
  padding: 1.2rem 2.5rem;
  background-color: #ffffff;
  color: #6e45e2;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.25rem;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.cta-button:hover {
  background-color: #f8f9fa;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.cta-button:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4));
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.cta-button:hover:after {
  transform: translateX(100%);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes animatePattern {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Section Headers */
.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-header h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.section-header p {
  font-size: 1.125rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

/* Featured Section */
.featured-section {
  margin-bottom: 5rem;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

/* View All Link */
.view-all-container {
  text-align: center;
  margin-top: 2rem;
}

.view-all-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  color: #333;
  text-decoration: none;
  border: 2px solid #333;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s;
}

.view-all-link:hover {
  background-color: #333;
  color: white;
}

/* Best Sellers Section */
.bestsellers-section {
  background-color: #f8f9fa;
  padding: 5rem 0;
  margin-bottom: 5rem;
}

/* About Section */
.about-section {
  margin-bottom: 5rem;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3rem;
  align-items: center;
}

.about-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.about-content h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.about-content p {
  font-size: 1.125rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 1.5rem;
}

/* Categories Section */
.categories-section {
  margin-bottom: 5rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.category-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  height: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.category-image {
  width: 100%;
  height: 100%;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.category-card:hover .category-image img {
  transform: scale(1.1);
}

.category-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.3));
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem;
}

.category-overlay h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.category-link {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

/* Newsletter Section */
.newsletter-section {
  background-color: #34495e;
  padding: 5rem 0;
  color: white;
}

.newsletter-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.newsletter-content {
  max-width: 600px;
  margin-bottom: 2rem;
}

.newsletter-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.newsletter-content p {
  font-size: 1.125rem;
  opacity: 0.9;
}

.newsletter-form {
  width: 100%;
  max-width: 500px;
}

.input-group {
  display: flex;
  margin-bottom: 0.5rem;
}

.input-group input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.input-group .submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.input-group .submit-btn:hover {
  background-color: #2980b9;
}

.form-note {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Loading and Error States */
.loading-container, .error-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #e74c3c;
}

.empty-state {
  color: #666;
}

.link-button {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.link-button:hover {
  background-color: #2980b9;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .about-image {
    order: 1;
  }
  
  .about-content {
    order: 2;
  }
}

@media (max-width: 768px) {
  .hero-section {
    height: 500px;
  }
  
  .hero-content h1 {
    font-size: 2.5rem;
  }
  
  .hero-content p {
    font-size: 1.2rem;
  }
  
  .cta-button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
  
  .section-header h2 {
    font-size: 1.75rem;
  }
  
  .newsletter-container {
    padding: 0 1rem;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .input-group input,
  .input-group .submit-btn {
    width: 100%;
    border-radius: 4px;
  }
  
  .input-group input {
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    height: 450px;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .hero-content p {
    font-size: 1rem;
    margin-bottom: 2rem;
  }
  
  .cta-button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }
  
  .products-grid,
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
