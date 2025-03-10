<template>
  <div class="order-confirmation">
    <div class="confirmation-container">
      <div class="confirmation-header">
        <div class="confirmation-icon">
          <i class="fa-solid fa-box"></i>
        </div>
        <h1 class="confirmation-title">Order Confirmation</h1>
        <p class="confirmation-subtitle">Your order has been received and is being processed.</p>
      </div>
      
      <div class="order-details" v-if="isLoading">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Loading order details...</p>
        </div>
      </div>
      
      <div class="order-details" v-else-if="order">
        <div class="detail-section">
          <h3 class="section-title">Order Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <p class="detail-label">Order ID</p>
              <p class="detail-value">{{ orderReference }}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Date</p>
              <p class="detail-value">{{ formatDate(order.created_at || new Date()) }}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Status</p>
              <p class="detail-value status">
                <span class="status-indicator paid"></span>
                {{ orderStatus }}
              </p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Total</p>
              <p class="detail-value">${{ orderTotal }}</p>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3 class="section-title">Shipping Information</h3>
          <div class="shipping-address" v-if="shippingInfo">
            <p>{{ shippingInfo.name }}</p>
            <p>{{ shippingInfo.address1 }}</p>
            <p v-if="shippingInfo.address2">{{ shippingInfo.address2 }}</p>
            <p>{{ shippingInfo.city }}, {{ shippingInfo.state }} {{ shippingInfo.zip }}</p>
            <p>{{ shippingInfo.country }}</p>
          </div>
          <div v-else class="shipping-placeholder">
            <p>Shipping information will be updated soon.</p>
          </div>
        </div>
        
        <div class="fulfillment-status">
          <h3 class="section-title">Fulfillment Status</h3>
          <div class="status-timeline">
            <div class="timeline-step active">
              <div class="step-icon">
                <i class="fa-solid fa-credit-card"></i>
              </div>
              <div class="step-label">Payment Confirmed</div>
            </div>
            <div class="timeline-step" :class="{ active: fulfillmentStatus === 'processing' || fulfillmentStatus === 'shipped' || fulfillmentStatus === 'delivered' }">
              <div class="step-icon">
                <i class="fa-solid fa-gear"></i>
              </div>
              <div class="step-label">Processing</div>
            </div>
            <div class="timeline-step" :class="{ active: fulfillmentStatus === 'shipped' || fulfillmentStatus === 'delivered' }">
              <div class="step-icon">
                <i class="fa-solid fa-truck"></i>
              </div>
              <div class="step-label">Shipped</div>
            </div>
            <div class="timeline-step" :class="{ active: fulfillmentStatus === 'delivered' }">
              <div class="step-icon">
                <i class="fa-solid fa-check"></i>
              </div>
              <div class="step-label">Delivered</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="order-not-found" v-else>
        <p class="not-found-message">
          We couldn't find details for this order. If you believe this is an error, please contact our support team.
        </p>
      </div>
      
      <div class="actions">
        <router-link to="/printify/products" class="action-btn primary">
          Continue Shopping
        </router-link>
        
        <button @click="contactSupport" class="action-btn secondary">
          Need Help?
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePrintifyStore } from '@/stores/printify';
import { useModal } from '@/composables/useModal';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const printifyStore = usePrintifyStore();
const { openModal } = useModal();
const { showToast } = useToast();

const isLoading = computed(() => printifyStore.loading.order);
const order = computed(() => printifyStore.currentOrder);
const orderError = computed(() => printifyStore.error.order);
const orderReference = ref('');

// Computed properties for order details
const orderStatus = computed(() => {
  if (!order.value) return 'Unknown';
  
  if (order.value.status) {
    return order.value.status.charAt(0).toUpperCase() + order.value.status.slice(1);
  }
  
  if (order.value.payment_status) {
    return order.value.payment_status.charAt(0).toUpperCase() + order.value.payment_status.slice(1);
  }
  
  return 'Processing';
});

const orderTotal = computed(() => {
  if (!order.value) return '0.00';
  
  // Handle different order data structures (Stripe vs. our DB)
  if (order.value.amount_total) {
    return (order.value.amount_total / 100).toFixed(2);
  }
  
  if (order.value.totalAmount) {
    return order.value.totalAmount.toFixed(2);
  }
  
  return '0.00';
});

const shippingInfo = computed(() => {
  if (!order.value) return null;
  
  // Handle different order data structures (Stripe vs. our DB)
  if (order.value.shipping) {
    return {
      name: order.value.shipping.name,
      address1: order.value.shipping.address?.line1 || '',
      address2: order.value.shipping.address?.line2 || '',
      city: order.value.shipping.address?.city || '',
      state: order.value.shipping.address?.state || '',
      zip: order.value.shipping.address?.postal_code || '',
      country: order.value.shipping.address?.country || ''
    };
  }
  
  if (order.value.shippingAddress) {
    try {
      const parsedAddress = typeof order.value.shippingAddress === 'string' 
        ? JSON.parse(order.value.shippingAddress)
        : order.value.shippingAddress;
        
      return {
        name: parsedAddress.name || '',
        address1: parsedAddress.address?.line1 || '',
        address2: parsedAddress.address?.line2 || '',
        city: parsedAddress.address?.city || '',
        state: parsedAddress.address?.state || '',
        zip: parsedAddress.address?.postal_code || '',
        country: parsedAddress.address?.country || ''
      };
    } catch (e) {
      console.error('Error parsing shipping address:', e);
      return null;
    }
  }
  
  return null;
});

const fulfillmentStatus = computed(() => {
  if (!order.value) return '';
  
  if (order.value.fulfillmentStatus) {
    return order.value.fulfillmentStatus;
  }
  
  // Default to processing if payment is successful
  if (order.value.status === 'paid' || order.value.payment_status === 'paid') {
    return 'processing';
  }
  
  return '';
});

onMounted(async () => {
  // Get the order ID from the URL query parameters
  orderReference.value = route.query.id || '';
  
  if (orderReference.value) {
    try {
      // Fetch order details using the Printify store
      await printifyStore.fetchOrderBySessionId(orderReference.value);
      
      // Process successful payment if needed
      if (order.value && (order.value.status === 'paid' || order.value.payment_status === 'paid')) {
        printifyStore.processSuccessfulPayment(orderReference.value);
      }
      
      // If there was an error, show a toast notification
      if (orderError.value) {
        showToast(orderError.value, 'error');
      }
    } catch (error) {
      showToast('Could not load order details', 'error');
      console.error('Error fetching order:', error);
    }
  }
});

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Contact support
const contactSupport = () => {
  openModal('SupportContactModal', {
    subject: 'Order Inquiry',
    message: `I have a question about my order ${orderReference.value || ''}`
  });
};
</script>

<style>
.order-confirmation {
  padding: 2rem 1rem;
  background-color: #f8f9fa;
  min-height: calc(100vh - 150px);
  display: flex;
  justify-content: center;
}

.confirmation-container {
  max-width: 900px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.confirmation-header {
  padding: 2.5rem 2rem;
  text-align: center;
  background-color: #f0f7ff;
  border-bottom: 1px solid #e0ecff;
}

.confirmation-icon {
  font-size: 3rem;
  color: #3490dc;
  margin-bottom: 1rem;
}

.confirmation-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.confirmation-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.order-details {
  padding: 2rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.loading-spinner i {
  font-size: 2rem;
  color: #3490dc;
  margin-bottom: 1rem;
}

.detail-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 576px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  margin-bottom: 0.75rem;
}

.detail-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.status {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-indicator.paid {
  background-color: #4CAF50;
}

.status-indicator.pending {
  background-color: #FFC107;
}

.shipping-address p {
  margin-bottom: 0.25rem;
  color: #333;
}

.shipping-placeholder {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  color: #666;
}

.fulfillment-status {
  margin-top: 2rem;
}

.status-timeline {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  position: relative;
}

.status-timeline::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 10%;
  right: 10%;
  height: 3px;
  background-color: #e0e0e0;
  z-index: 1;
}

.timeline-step {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
}

.step-icon {
  width: 60px;
  height: 60px;
  background-color: #f8f9fa;
  border: 3px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  color: #999;
}

.timeline-step.active .step-icon {
  background-color: #e8f5e9;
  border-color: #4CAF50;
  color: #4CAF50;
}

.step-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  text-align: center;
}

.timeline-step.active .step-label {
  color: #4CAF50;
  font-weight: 600;
}

.order-not-found {
  padding: 3rem 2rem;
  text-align: center;
}

.not-found-message {
  font-size: 1.1rem;
  color: #d32f2f;
  max-width: 500px;
  margin: 0 auto;
}

.actions {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.action-btn.primary {
  background-color: #3490dc;
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background-color: #2779bd;
}

.action-btn.secondary {
  background-color: transparent;
  color: #3490dc;
  border: 1px solid #3490dc;
}

.action-btn.secondary:hover {
  background-color: #f0f7ff;
}

@media (max-width: 768px) {
  .confirmation-header {
    padding: 2rem 1.5rem;
  }
  
  .confirmation-title {
    font-size: 1.75rem;
  }
  
  .order-details {
    padding: 1.5rem;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .status-timeline::before {
    left: 15%;
    right: 15%;
  }
  
  .timeline-step {
    width: 70px;
  }
  
  .step-icon {
    width: 50px;
    height: 50px;
    font-size: 1rem;
  }
  
  .step-label {
    font-size: 0.75rem;
  }
}
</style>
