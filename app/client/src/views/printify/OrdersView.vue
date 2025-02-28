<template>
  <div class="orders-view">
    <header class="view-header">
      <h1>Orders</h1>
      <div class="header-filters">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search orders..."
          class="filter-input"
        />
        <select v-model="filters.status" class="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="btn btn-secondary" @click="refreshOrders">
          Refresh
        </button>
      </div>
    </header>

    <div class="orders-table-container">
      <table v-if="!loading && filteredOrders.length > 0" class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Products</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>
              <div class="customer-info">
                <span>{{ order.customer.name }}</span>
                <small>{{ order.customer.email }}</small>
              </div>
            </td>
            <td>
              <div class="products-preview">
                {{ order.products.length }} items
                <button class="btn-link" @click="viewOrderDetails(order)">
                  View Details
                </button>
              </div>
            </td>
            <td>{{ formatPrice(order.total) }}</td>
            <td>
              <span class="status-badge" :class="order.status">
                {{ order.status }}
              </span>
            </td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-secondary btn-sm"
                  @click="handleUpdateStatus(order)"
                >
                  Update Status
                </button>
                <button
                  class="btn btn-primary btn-sm"
                  @click="handlePrintLabel(order)"
                >
                  Print Label
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="loading" class="loading-state">
        Loading orders...
      </div>

      <div v-else class="empty-state">
        No orders found
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
        class="btn btn-secondary"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
        class="btn btn-secondary"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePrintifyStore } from '@/stores/printify'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'OrdersView',
  setup() {
    const route = useRoute()
    const printifyStore = usePrintifyStore()
    const uiStore = useUIStore()
    const loading = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = 10

    const filters = ref({
      search: '',
      status: ''
    })

    const loadOrders = async () => {
      try {
        loading.value = true
        await printifyStore.fetchOrders(route.params.shopId)
      } catch (error) {
        uiStore.notifyError('Failed to load orders')
      } finally {
        loading.value = false
      }
    }

    const filteredOrders = computed(() => {
      let orders = printifyStore.orders

      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        orders = orders.filter(o => 
          o.id.toLowerCase().includes(search) ||
          o.customer.name.toLowerCase().includes(search) ||
          o.customer.email.toLowerCase().includes(search)
        )
      }

      if (filters.value.status) {
        orders = orders.filter(o => o.status === filters.value.status)
      }

      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return orders.slice(start, end)
    })

    const totalPages = computed(() => 
      Math.ceil(printifyStore.orders.length / itemsPerPage)
    )

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const changePage = (page) => {
      currentPage.value = page
      window.scrollTo(0, 0)
    }

    const refreshOrders = () => {
      loadOrders()
    }

    const viewOrderDetails = (order) => {
      // Implement order details view logic
    }

    const handleUpdateStatus = (order) => {
      // Implement status update logic
    }

    const handlePrintLabel = async (order) => {
      try {
        await printifyStore.printShippingLabel(order.id)
        uiStore.notifySuccess('Shipping label generated successfully')
      } catch (error) {
        uiStore.notifyError('Failed to generate shipping label')
      }
    }

    watch(filters, () => {
      currentPage.value = 1
    })

    onMounted(() => {
      loadOrders()
    })

    return {
      loading,
      filters,
      filteredOrders,
      currentPage,
      totalPages,
      formatPrice,
      formatDate,
      changePage,
      refreshOrders,
      viewOrderDetails,
      handleUpdateStatus,
      handlePrintLabel
    }
  }
}
</script>

<style>
.orders-view {
  padding: var(--spacing-4);
}

.view-header {
  margin-bottom: var(--spacing-6);
}

.header-filters {
  display: flex;
  gap: var(--spacing-4);
  margin-top: var(--spacing-4);
}

.filter-input,
.filter-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-background);
  color: var(--color-text);
}

.orders-table-container {
  background: var(--color-background-alt);
  border-radius: var(--radius);
  overflow: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.orders-table th {
  background: var(--color-background);
  font-weight: 600;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-info small {
  color: var(--color-text-light);
}

.products-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.status-badge {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius);
  font-size: 0.875rem;
  text-transform: capitalize;
}

.status-badge.pending {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.status-badge.processing {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}

.status-badge.shipped {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.status-badge.delivered {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.status-badge.cancelled {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: 0.875rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-6);
}

.page-info {
  color: var(--color-text-light);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-text-light);
}

@media (max-width: 1024px) {
  .header-filters {
    flex-direction: column;
  }

  .orders-table th:nth-child(2),
  .orders-table td:nth-child(2),
  .orders-table th:nth-child(6),
  .orders-table td:nth-child(6) {
    display: none;
  }
}
</style>
