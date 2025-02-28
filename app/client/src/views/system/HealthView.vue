<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          System Health
        </h3>
        <div class="mt-5">
          <div class="rounded-md bg-gray-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    health.status === 'healthy'
                      ? 'bg-green-100'
                      : health.status === 'degraded'
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                  ]"
                >
                  <svg
                    class="h-6 w-6"
                    :class="[
                      health.status === 'healthy'
                        ? 'text-green-600'
                        : health.status === 'degraded'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    ]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      v-if="health.status === 'healthy'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                    <path
                      v-else-if="health.status === 'degraded'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-3">
                <h3
                  :class="[
                    'text-sm font-medium',
                    health.status === 'healthy'
                      ? 'text-green-800'
                      : health.status === 'degraded'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  ]"
                >
                  System Status: {{ health.status }}
                </h3>
                <div class="mt-2 text-sm text-gray-700">
                  <p>{{ health.message }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 border-t border-gray-200">
            <dl class="divide-y divide-gray-200">
              <div
                v-for="(metric, key) in health.metrics"
                :key="key"
                class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4"
              >
                <dt class="text-sm font-medium text-gray-500">{{ key }}</dt>
                <dd class="mt-1 flex text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span class="flex-grow">{{ metric.value }}</span>
                  <span
                    class="ml-4 flex-shrink-0"
                    :class="{
                      'text-green-600': metric.status === 'healthy',
                      'text-yellow-600': metric.status === 'degraded',
                      'text-red-600': metric.status === 'unhealthy'
                    }"
                  >
                    {{ metric.status }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div v-if="detailedHealth" class="mt-5 border-t border-gray-200">
            <div class="py-4">
              <h4 class="text-sm font-medium text-gray-900">Environment Details</h4>
              <pre class="mt-2 text-sm text-gray-700 overflow-auto">{{ JSON.stringify(detailedHealth, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const health = ref({
  status: 'loading',
  message: 'Checking system health...',
  metrics: {}
})

const detailedHealth = ref(null)

const fetchHealth = async () => {
  try {
    const [basicResponse, detailedResponse] = await Promise.all([
      axios.get('/api/system/health'),
      axios.get('/api/system/health/detailed')
    ])
    
    health.value = basicResponse.data
    detailedHealth.value = detailedResponse.data
  } catch (error) {
    health.value = {
      status: 'unhealthy',
      message: 'Failed to fetch system health',
      metrics: {}
    }
    console.error('Health check error:', error)
  }
}

onMounted(() => {
  fetchHealth()
  // Refresh health status every minute
  const interval = setInterval(fetchHealth, 60000)
  onUnmounted(() => clearInterval(interval))
})
</script>
