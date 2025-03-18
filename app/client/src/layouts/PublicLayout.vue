<template>
  <div class="public-layout">
    <header class="header">
      <div class="header-container">
        <div class="brand">
          <router-link to="/" class="brand-link">
            <img src="/images/logo.png" :alt="configStore.application.name || 'Custom Brand'" class="logo" />
            <span class="brand-name">{{ configStore.application.name || 'Custom Brand' }}</span>
          </router-link>
        </div>
        
        <nav class="main-nav" :class="{ 'nav-open': isMobileMenuOpen }">
          <ul class="nav-links">
            <li><router-link to="/" class="nav-link">Home</router-link></li>
            <li><router-link to="/shop" class="nav-link">Shop</router-link></li>
            <!-- Conditionally show Admin link only for authenticated users -->
            <li v-if="authStore.isAuthenticated">
              <router-link to="/dashboard" class="nav-link admin-link">Admin</router-link>
            </li>
          </ul>
        </nav>
        
        <div class="header-actions">
          <!-- User authentication links -->
          <div class="auth-links">
            <template v-if="authStore.isAuthenticated">
              <span class="welcome-text" v-if="authStore.user">{{ authStore.user.firstName || 'User' }}</span>
              <button @click="handleLogout" class="auth-btn logout-btn">
                <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
                <span class="btn-text">Logout</span>
              </button>
            </template>
            <template v-else>
              <router-link to="/auth/login" class="auth-btn login-btn">
                <font-awesome-icon :icon="['fas', 'sign-in-alt']" />
                <span class="btn-text">Login</span>
              </router-link>
            </template>
          </div>
        
          <button 
            class="cart-btn" 
            aria-label="View Cart"
            @click="goToCart"
          >
            <font-awesome-icon :icon="['fas', 'shopping-cart']" />
            <span class="cart-count" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
          </button>
          
          <button 
            class="mobile-menu-btn" 
            aria-label="Toggle Menu"
            @click="toggleMobileMenu"
          >
            <font-awesome-icon :icon="['fas', isMobileMenuOpen ? 'times' : 'bars']" />
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-container">
        <div class="footer-section">
          <h3 class="footer-title">{{ configStore.application.name || 'ILYTAT Designs' }}</h3>
          <p class="footer-text">{{ configStore.company.tagline || 'Custom designs for everyone. Trendy, stylish, and unique items for your everyday life.' }}</p>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">Quick Links</h3>
          <ul class="footer-links">
            <li><router-link to="/" class="footer-link">Home</router-link></li>
            <li><router-link to="/shop" class="footer-link">Shop</router-link></li>
            <li><router-link to="/cart" class="footer-link">Cart</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">Contact</h3>
          <ul class="footer-contact">
            <li>
              <font-awesome-icon :icon="['fas', 'envelope']" />
              <a :href="`mailto:${configStore.company.commonEmail || 'info@ilytatdesigns.com'}`" class="footer-link">
                {{ configStore.company.commonEmail || 'info@ilytatdesigns.com' }}
              </a>
            </li>
            <li>
              <font-awesome-icon :icon="['fas', 'phone']" />
              <a :href="`tel:${configStore.company.phone || '+1234567890'}`" class="footer-link">
                {{ configStore.getFormattedPhone || '(123) 456-7890' }}
              </a>
            </li>
            <li v-if="configStore.company.address.street">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
              <span class="footer-text address">
                {{ configStore.getFormattedAddress }}
              </span>
            </li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">Stay Connected</h3>
          <div class="social-links">
            <a :href="configStore.social.facebook || '#'" target="_blank" rel="noopener noreferrer" class="social-link" :class="{ 'inactive-social': !configStore.social.facebook }" aria-label="Facebook">
              <font-awesome-icon :icon="['fab', 'facebook-f']" />
            </a>
            <a :href="configStore.social.tiktok || '#'" target="_blank" rel="noopener noreferrer" class="social-link" :class="{ 'inactive-social': !configStore.social.tiktok }" aria-label="TikTok">
              <font-awesome-icon :icon="['fab', 'tiktok']" />
            </a>
            <a :href="configStore.social.instagram || '#'" target="_blank" rel="noopener noreferrer" class="social-link" :class="{ 'inactive-social': !configStore.social.instagram }" aria-label="Instagram">
              <font-awesome-icon :icon="['fab', 'instagram']" />
            </a>
            <a :href="configStore.social.twitter || '#'" target="_blank" rel="noopener noreferrer" class="social-link" :class="{ 'inactive-social': !configStore.social.twitter }" aria-label="Twitter">
              <font-awesome-icon :icon="['fab', 'twitter']" />
            </a>
            <a :href="configStore.social.pinterest || '#'" target="_blank" rel="noopener noreferrer" class="social-link" :class="{ 'inactive-social': !configStore.social.pinterest }" aria-label="Pinterest">
              <font-awesome-icon :icon="['fab', 'pinterest-p']" />
            </a>
            <a :href="configStore.social.youtube || '#'" target="_blank" rel="noopener noreferrer" class="social-link" :class="{ 'inactive-social': !configStore.social.youtube }" aria-label="YouTube">
              <font-awesome-icon :icon="['fab', 'youtube']" />
            </a>
          </div>
        </div>
      </div>
      
      <div class="copyright">
        <p>&copy; {{ currentYear }} {{ configStore.company.name || 'Company Name' }}. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'
import { useConfigStore } from '@/stores/configStore'
import { useAuthStore } from '@/stores/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  name: 'PublicLayout',
  components: {
    FontAwesomeIcon
  },
  
  setup() {
    const router = useRouter()
    const printifyStore = usePrintifyStore()
    const configStore = useConfigStore()
    const authStore = useAuthStore()
    
    // Mobile menu state
    const isMobileMenuOpen = ref(false)
    
    // Current year for copyright
    const currentYear = new Date().getFullYear()
    
    // Cart items count
    const cartItemCount = computed(() => printifyStore.cartItemCount)
    
    // Close mobile menu on route change
    router.afterEach(() => {
      isMobileMenuOpen.value = false
    })
    
    // Close mobile menu on click outside
    const handleClickOutside = (event) => {
      const nav = document.querySelector('.main-nav')
      const menuBtn = document.querySelector('.mobile-menu-btn')
      
      if (
        isMobileMenuOpen.value && 
        nav && 
        !nav.contains(event.target) && 
        menuBtn && 
        !menuBtn.contains(event.target)
      ) {
        isMobileMenuOpen.value = false
      }
    }
    
    // Toggle mobile menu
    const toggleMobileMenu = () => {
      isMobileMenuOpen.value = !isMobileMenuOpen.value
    }
    
    // Go to cart page
    const goToCart = () => {
      router.push({ name: 'cart' })
    }
    
    // Handle logout
    const handleLogout = async () => {
      await authStore.logout()
      router.push({ name: 'home' })
    }
    
    // Load data on component mount
    onMounted(async () => {
      // Load cart from localStorage
      printifyStore.loadCart()
      
      // Fetch configuration information
      try {
        await configStore.fetchConfig()
      } catch (error) {
        console.error('Failed to load configuration information:', error)
      }
      
      // Add click outside listener
      document.addEventListener('click', handleClickOutside)
    })
    
    // Remove click outside listener on component unmount
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      isMobileMenuOpen,
      currentYear,
      cartItemCount,
      configStore,
      authStore,
      toggleMobileMenu,
      goToCart,
      handleLogout
    }
  }
}
</script>

<style>
/* Public Layout Styles */
.public-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header Styles */
.header {
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #333;
}

.logo {
  height: 40px;
  width: auto;
  margin-right: 0.5rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
}

.main-nav {
  display: flex;
}

.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: block;
  padding: 0.5rem 1rem;
  color: #333;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #3498db;
}

.admin-link {
  color: #9b59b6;
}

.admin-link:hover {
  color: #8e44ad;
}

.header-actions {
  display: flex;
  align-items: center;
}

.auth-links {
  margin-right: 1rem;
}

.auth-btn {
  background: none;
  border: none;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.auth-btn i {
  margin-right: 0.5rem;
}

.logout-btn {
  color: #e74c3c;
}

.logout-btn:hover {
  color: #c0392b;
}

.login-btn {
  color: #2ecc71;
}

.login-btn:hover {
  color: #27ae60;
}

.cart-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #333;
  padding: 0.5rem;
  position: relative;
  cursor: pointer;
}

.cart-count {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #e74c3c;
  color: white;
  font-size: 0.75rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.25rem;
  padding: 0.5rem;
  margin-left: 0.5rem;
  cursor: pointer;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  margin-top: 1rem;
  margin-bottom: 3rem;
}

/* Footer Styles */
.footer {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 3rem 1rem 1rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
}

.footer-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #ffffff;
}

.footer-text {
  line-height: 1.6;
  margin-top: 0;
}

.footer-links,
.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li,
.footer-contact li {
  margin-bottom: 0.75rem;
}

.footer-link {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #ffffff;
}

.footer-contact li {
  display: flex;
  align-items: flex-start;
}

.footer-contact i {
  color: var(--secondary-color);
  margin-right: 0.5rem;
  margin-top: 0.25rem;
}

.footer-text.address {
  white-space: pre-line;
  display: inline-block;
}

.social-links {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #333;
  color: #fff;
  transition: all 0.3s ease;
}

.social-link:hover {
  background-color: var(--color-primary);
  transform: translateY(-3px);
}

.inactive-social {
  opacity: 0.5;
  cursor: not-allowed;
}

.inactive-social:hover {
  background-color: #333;
  transform: none;
  opacity: 0.6;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
  
  .main-nav {
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ffffff;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 99;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .main-nav.nav-open {
    transform: translateX(0);
  }
  
  .nav-links {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-link {
    padding: 0.75rem 0;
    font-size: 1.1rem;
  }
  
  .footer-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .footer-contact li {
    justify-content: center;
  }
  
  .social-links {
    justify-content: center;
  }
}
</style>
