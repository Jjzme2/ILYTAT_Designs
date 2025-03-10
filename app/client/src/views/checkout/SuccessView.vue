<template>
  <div class="checkout-success">
    <div class="success-container">
      <div class="success-icon">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      
      <h1 class="success-title">Payment Successful!</h1>
      
      <p class="success-message">
        Thank you for your order. Your payment has been successfully processed.
      </p>
      
      <div class="order-details" v-if="sessionId">
        <p class="detail-label">Order Reference:</p>
        <p class="detail-value">{{ sessionId }}</p>
      </div>
      
      <p class="email-notice">
        A confirmation email has been sent to your email address.
      </p>
      
      <div class="actions">
        <router-link to="/order/tracking" class="action-btn tracking">
          Track Your Order
        </router-link>
        
        <router-link to="/printify/products" class="action-btn continue">
          Continue Shopping
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePrintifyStore } from '@/stores/printify';

const route = useRoute();
const printifyStore = usePrintifyStore();
const sessionId = ref('');

onMounted(() => {
  // Get the session ID from the URL query parameters
  sessionId.value = route.query.id || '';
  
  // Clear the cart since the payment was successful
  printifyStore.clearCart();
});
</script>

<style>
.checkout-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 2rem 1rem;
  background-color: #f8f9fa;
}

.success-container {
  max-width: 600px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.success-icon {
  font-size: 5rem;
  color: #38c172;
  margin-bottom: 1.5rem;
}

.success-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.success-message {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}

.order-details {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.detail-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  word-break: break-all;
}

.email-notice {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

@media (min-width: 500px) {
  .actions {
    flex-direction: row;
    justify-content: center;
  }
}

.action-btn {
  display: inline-block;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-btn.tracking {
  background-color: #3490dc;
  color: white;
}

.action-btn.tracking:hover {
  background-color: #2779bd;
}

.action-btn.continue {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.action-btn.continue:hover {
  background-color: #e9ecef;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .success-container {
    padding: 2rem 1rem;
  }
  
  .success-title {
    font-size: 1.75rem;
  }
  
  .success-message {
    font-size: 1rem;
  }
}
</style>
