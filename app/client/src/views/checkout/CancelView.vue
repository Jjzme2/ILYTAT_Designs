<template>
  <div class="checkout-cancel">
    <div class="cancel-container">
      <div class="cancel-icon">
        <i class="fa-solid fa-circle-xmark"></i>
      </div>
      
      <h1 class="cancel-title">Payment Cancelled</h1>
      
      <p class="cancel-message">
        Your payment process has been cancelled. Your cart items have been saved.
      </p>
      
      <div class="actions">
        <router-link to="/cart" class="action-btn return">
          Return to Cart
        </router-link>
        
        <router-link to="/printify/products" class="action-btn continue">
          Continue Shopping
        </router-link>
      </div>
      
      <div class="support-section">
        <p class="support-message">
          Having trouble with your payment? Our support team is ready to help.
        </p>
        <button class="support-btn" @click="openSupportModal">
          Contact Support
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useModal } from '@/composables/useModal';

const { openModal } = useModal();

// Function to open support contact modal
const openSupportModal = () => {
  openModal('SupportContactModal', {
    subject: 'Payment Issue',
    message: 'I experienced an issue with my payment...'
  });
};
</script>

<style>
.checkout-cancel {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 2rem 1rem;
  background-color: #f8f9fa;
}

.cancel-container {
  max-width: 600px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.cancel-icon {
  font-size: 5rem;
  color: #e3342f;
  margin-bottom: 1.5rem;
}

.cancel-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.cancel-message {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
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

.action-btn.return {
  background-color: #3490dc;
  color: white;
}

.action-btn.return:hover {
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

.support-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.support-message {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 1rem;
}

.support-btn {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: #3490dc;
  border: 1px solid #3490dc;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.support-btn:hover {
  background-color: #f0f8ff;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .cancel-container {
    padding: 2rem 1rem;
  }
  
  .cancel-title {
    font-size: 1.75rem;
  }
  
  .cancel-message {
    font-size: 1rem;
  }
}
</style>
