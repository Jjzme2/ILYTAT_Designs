<template>
  <div class="order-history">
    <div class="order-history-container">
      <div class="order-history-header">
        <div class="header-icon">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <h1 class="header-title">Order History</h1>
        <p class="header-subtitle">View and track all your previous orders</p>
      </div>
      
      <div class="order-list" v-if="isLoading">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Loading your orders...</p>
        </div>
      </div>
      
      <div class="order-list" v-else-if="orders.length > 0">
        <div 
          v-for="order in orders" 
          :key="order.id || order.stripeSessionId" 
          class="order-card"
          @click="viewOrderDetails(order)"
        >
          <div class="order-header">
            <div class="order-date">{{ formatDate(order.createdAt || order.created_at) }}</div>
            <div :class="['order-status', getStatusClass(order)]">
              <span class="status-dot"></span>
              {{ getOrderStatus(order) }}
            </div>
          </div>
          
          <div class="order-details">
            <div class="order-id">
              <p class="detail-label">Order ID</p>
              <p class="detail-value">{{ order.stripeSessionId || order.id }}</p>
            </div>
            <div class="order-total">
              <p class="detail-label">Total</p>
              <p class="detail-value">${{ getOrderTotal(order) }}</p>
            </div>
          </div>
          
          <div class="order-items">
            <p class="items-label">Items</p>
            <div class="items-count">
              {{ getItemsCount(order) }} items
            </div>
          </div>
          
          <div class="order-actions">
            <button class="action-btn view-details">
              View Details <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <i class="fa-solid fa-shopping-basket"></i>
        </div>
        <h3 class="empty-title">No Orders Yet</h3>
        <p class="empty-message">
          You haven't placed any orders yet. Start shopping to see your order history here.
        </p>
        <router-link to="/printify/products" class="shop-now-btn">
          Shop Now
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePrintifyStore } from '@/stores/printify';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const printifyStore = usePrintifyStore();
const { showToast } = useToast();

// Use computed properties to reactively access store state
const isLoading = computed(() => printifyStore.loading.orderHistory);
const orders = computed(() => printifyStore.orderHistory);
const orderError = computed(() => printifyStore.error.orderHistory);

/**
 * Fetch order history on component mount
 */
onMounted(async () => {
  try {
    await printifyStore.fetchOrderHistory();
    
    if (orderError.value) {
      showToast(orderError.value, 'error');
    }
  } catch (error) {
    showToast('Could not load order history', 'error');
    console.error('Error fetching order history:', error);
  }
});

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get formatted order status
 * @param {Object} order - Order object
 * @returns {string} Formatted status string
 */
const getOrderStatus = (order) => {
  if (order.status) {
    return order.status.charAt(0).toUpperCase() + order.status.slice(1);
  }
  
  if (order.payment_status) {
    return order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1);
  }
  
  return 'Processing';
};

/**
 * Get CSS class for order status styling
 * @param {Object} order - Order object
 * @returns {string} CSS class name
 */
const getStatusClass = (order) => {
  const status = order.status || order.payment_status || '';
  
  if (status.includes('paid') || status.includes('completed')) {
    return 'status-paid';
  }
  
  if (status.includes('shipped')) {
    return 'status-shipped';
  }
  
  if (status.includes('delivered')) {
    return 'status-delivered';
  }
  
  if (status.includes('canceled') || status.includes('failed')) {
    return 'status-canceled';
  }
  
  return 'status-processing';
};

/**
 * Calculate and format order total
 * @param {Object} order - Order object 
 * @returns {string} Formatted total price
 */
const getOrderTotal = (order) => {
  if (order.amount_total) {
    return (order.amount_total / 100).toFixed(2);
  }
  
  if (order.totalAmount) {
    return order.totalAmount.toFixed(2);
  }
  
  // Calculate from items if total is not directly available
  if (order.items && order.items.length) {
    const total = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    return total.toFixed(2);
  }
  
  return '0.00';
};

/**
 * Get total number of items in the order
 * @param {Object} order - Order object
 * @returns {number} Total item count
 */
const getItemsCount = (order) => {
  if (order.items && order.items.length) {
    return order.items.reduce((count, item) => count + item.quantity, 0);
  }
  
  if (order.line_items && order.line_items.data) {
    return order.line_items.data.reduce((count, item) => count + item.quantity, 0);
  }
  
  return 0;
};

/**
 * Navigate to order details page
 * @param {Object} order - Order to view
 */
const viewOrderDetails = (order) => {
  const sessionId = order.stripeSessionId || order.id;
  router.push(`/order/confirmation?id=${sessionId}`);
};
</script>

<style>
.order-history {
  padding: 2rem 1rem;
  background-color: #f8f9fa;
  min-height: calc(100vh - 150px);
  display: flex;
  justify-content: center;
}

.order-history-container {
  max-width: 900px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.order-history-header {
  padding: 2.5rem 2rem;
  text-align: center;
  background-color: #f0f7ff;
  border-bottom: 1px solid #e0ecff;
}

.header-icon {
  font-size: 3rem;
  color: #3490dc;
  margin-bottom: 1rem;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.header-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.order-list {
  padding: 1.5rem;
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

.order-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border-color: #cce5ff;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.order-date {
  font-size: 0.9rem;
  color: #666;
}

.order-status {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-paid {
  background-color: #e8f5e9;
  color: #4CAF50;
}

.status-paid .status-dot {
  background-color: #4CAF50;
}

.status-shipped {
  background-color: #e3f2fd;
  color: #2196F3;
}

.status-shipped .status-dot {
  background-color: #2196F3;
}

.status-delivered {
  background-color: #f3e5f5;
  color: #9c27b0;
}

.status-delivered .status-dot {
  background-color: #9c27b0;
}

.status-canceled {
  background-color: #ffebee;
  color: #f44336;
}

.status-canceled .status-dot {
  background-color: #f44336;
}

.status-processing {
  background-color: #fff8e1;
  color: #ffa000;
}

.status-processing .status-dot {
  background-color: #ffa000;
}

.order-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  word-break: break-word;
}

.order-items {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.items-label {
  font-size: 0.9rem;
  color: #666;
  margin-right: 0.5rem;
}

.items-count {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  background-color: transparent;
  color: #3490dc;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.action-btn i {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.action-btn:hover {
  background-color: #f0f7ff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3.5rem;
  color: #e0e0e0;
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.empty-message {
  color: #666;
  max-width: 400px;
  margin: 0 auto 2rem;
}

.shop-now-btn {
  background-color: #3490dc;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.shop-now-btn:hover {
  background-color: #2779bd;
}

/* Responsive styles */
@media (max-width: 768px) {
  .order-history-header {
    padding: 2rem 1.5rem;
  }
  
  .header-title {
    font-size: 1.75rem;
  }
  
  .order-list {
    padding: 1rem;
  }
  
  .order-card {
    padding: 1.25rem;
  }
  
  .order-details {
    grid-template-columns: 1fr;
  }
}
</style>
