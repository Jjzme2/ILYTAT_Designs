<template>
  <div class="cart-page">
    <h1 class="cart-title">Your Shopping Cart</h1>
    
    <div v-if="cartStore.cart.length === 0" class="empty-cart">
      <div class="empty-cart-content">
        <i class="fa-solid fa-cart-shopping empty-cart-icon"></i>
        <p>Your cart is empty</p>
        <router-link to="/shop" class="continue-shopping-btn">
          Continue Shopping
        </router-link>
      </div>
    </div>
    
    <div v-else class="cart-container">
      <div class="cart-items">
        <div class="cart-headers">
          <span class="header-product">Product</span>
          <span class="header-price">Price</span>
          <span class="header-quantity">Quantity</span>
          <span class="header-total">Total</span>
          <span class="header-actions"></span>
        </div>
        
        <div v-for="(item, index) in cartStore.cart" :key="index" class="cart-item">
          <div class="item-product">
            <img :src="item.image" :alt="item.title" class="item-image" />
            <div class="item-details">
              <h3 class="item-title">{{ item.title }}</h3>
              <p class="item-variant">{{ item.variantTitle }}</p>
            </div>
          </div>
          
          <div class="item-price">${{ item.price.toFixed(2) }}</div>
          
          <div class="item-quantity">
            <button 
              class="quantity-btn" 
              @click="updateQuantity(index, item.quantity - 1)"
              :disabled="item.quantity <= 1"
            >
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="quantity-value">{{ item.quantity }}</span>
            <button 
              class="quantity-btn" 
              @click="updateQuantity(index, item.quantity + 1)"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          
          <div class="item-total">${{ (item.price * item.quantity).toFixed(2) }}</div>
          
          <div class="item-actions">
            <button class="remove-btn" @click="removeItem(index)">
              <i class="fa-solid fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div class="cart-summary">
        <h2 class="summary-title">Order Summary</h2>
        
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${{ cartStore.cartTotal.toFixed(2) }}</span>
        </div>
        
        <div class="summary-row">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        
        <div class="summary-row total">
          <span>Total</span>
          <span>${{ cartStore.cartTotal.toFixed(2) }}</span>
        </div>
        
        <button 
          class="checkout-btn" 
          @click="checkout"
          :disabled="isProcessing || cartStore.cart.length === 0"
        >
          <span v-if="isProcessing">
            <i class="fa-solid fa-spinner fa-spin"></i> Processing...
          </span>
          <span v-else>
            Proceed to Checkout
          </span>
        </button>
        
        <router-link to="/shop" class="continue-shopping-link">
          Continue Shopping
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePrintifyStore } from '@/stores/printify';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

const cartStore = usePrintifyStore();
const authStore = useAuthStore();
const router = useRouter();
const { showToast } = useToast();
const isProcessing = ref(false);

// Update item quantity
const updateQuantity = (index, newQuantity) => {
  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or less
    removeItem(index);
  } else {
    cartStore.updateCartItem(index, newQuantity);
  }
};

// Remove item from cart
const removeItem = (index) => {
  cartStore.removeFromCart(index);
  showToast('Item removed from cart', 'success');
};

// Proceed to checkout
const checkout = async () => {
  if (cartStore.cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  
  // If user is not authenticated, redirect to login first
  if (!authStore.isAuthenticated) {
    // Save current path to redirect back after login
    localStorage.setItem('checkout-redirect', 'true');
    router.push({ name: 'login', query: { redirect: 'checkout' } });
    return;
  }
  
  isProcessing.value = true;
  
  try {
    // Here you would initiate your checkout process
    // For example, redirect to a checkout page or initiate Stripe checkout
    router.push({ name: 'checkout' });
  } catch (error) {
    showToast(error.message || 'There was a problem with checkout', 'error');
    isProcessing.value = false;
  }
};

// Load cart data when component mounts
onMounted(() => {
  cartStore.loadCart();
});
</script>

<style>
.cart-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.cart-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
}

/* Empty cart */
.empty-cart {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.empty-cart-content {
  text-align: center;
  padding: 2rem;
}

.empty-cart-icon {
  font-size: 4rem;
  color: #999;
  margin-bottom: 1rem;
}

.empty-cart-content p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.continue-shopping-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #3490dc;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.continue-shopping-btn:hover {
  background-color: #2779bd;
}

/* Cart with items */
.cart-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .cart-container {
    grid-template-columns: 2fr 1fr;
  }
}

.cart-items {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.cart-headers {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  padding: 1rem;
  background-color: #f5f5f5;
  font-weight: 600;
  border-bottom: 1px solid #e5e5e5;
}

.cart-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
  align-items: center;
}

.item-product {
  display: flex;
  align-items: center;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
}

.item-details {
  flex: 1;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.item-variant {
  font-size: 0.875rem;
  color: #666;
}

.item-price, .item-total {
  font-weight: 500;
}

.item-quantity {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #e5e5e5;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-value {
  width: 40px;
  text-align: center;
  font-weight: 500;
}

.remove-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  color: #dc3545;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: #ffeaea;
}

/* Summary */
.cart-summary {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e5e5;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.summary-row.total {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
  font-size: 1.1rem;
  font-weight: 600;
}

.checkout-btn {
  width: 100%;
  padding: 0.875rem;
  background-color: #38c172;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #2d995b;
}

.checkout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.continue-shopping-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: #3490dc;
  text-decoration: none;
}

.continue-shopping-link:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .cart-headers {
    display: none;
  }
  
  .cart-item {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 0.75rem;
  }
  
  .item-product {
    grid-column: 1 / -1;
  }
  
  .item-price, .item-quantity, .item-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .item-price::before {
    content: 'Price:';
    font-weight: 500;
  }
  
  .item-quantity::before {
    content: 'Quantity:';
    font-weight: 500;
  }
  
  .item-total::before {
    content: 'Total:';
    font-weight: 500;
  }
  
  .item-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
