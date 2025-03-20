<template>
    <div class="health-indicator" :title="healthStatus">
      <div class="indicator-dot" :class="statusClass"></div>
      <span v-if="showLabel" class="indicator-label">{{ labelText }}</span>
    </div>
  </template>
  
  <script>
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useSystemStore } from '@/stores/system';
  
  export default {
    name: 'HealthIndicator',
    props: {
      showLabel: {
        type: Boolean,
        default: false
      }
    },
    setup(props) {
      const systemStore = useSystemStore();
      const refreshInterval = ref(null);
      
      // Fetch health status when component mounts
      onMounted(() => {
        systemStore.fetchHealthStatus();
        systemStore.fetchStripeStatus();
        
        // Check health every 60 seconds
        refreshInterval.value = setInterval(() => {
          systemStore.fetchHealthStatus();
          systemStore.fetchStripeStatus();
        }, 60000);
      });
      
      // Clean up interval when component unmounts
      onUnmounted(() => {
        if (refreshInterval.value) {
          clearInterval(refreshInterval.value);
        }
      });
      
      const statusClass = computed(() => {
        if (!systemStore.isHealthy) return 'status-red';
        if (!systemStore.isStripeHealthy) return 'status-yellow';
        return 'status-green';
      });
      
      const healthStatus = computed(() => {
        if (!systemStore.isHealthy) return 'System is experiencing issues';
        if (!systemStore.isStripeHealthy) return 'Payments system needs attention';
        return 'All systems operational';
      });
      
      const labelText = computed(() => {
        if (!systemStore.isHealthy) return 'System Down';
        if (!systemStore.isStripeHealthy) return 'Payment Issue';
        return 'Healthy';
      });
      
      return {
        statusClass,
        healthStatus,
        labelText
      };
    }
  };
  </script>
  
  <style>
  .health-indicator {
    display: flex;
    align-items: center;
    margin-right: 12px;
    cursor: help;
  }
  
  .indicator-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
  }
  
  .indicator-label {
    font-size: 12px;
    white-space: nowrap;
  }
  
  .status-green {
    background-color: #10b981;
    box-shadow: 0 0 5px #10b981;
  }
  
  .status-yellow {
    background-color: #f59e0b;
    box-shadow: 0 0 5px #f59e0b;
  }
  
  .status-red {
    background-color: #ef4444;
    box-shadow: 0 0 5px #ef4444;
  }
  </style>