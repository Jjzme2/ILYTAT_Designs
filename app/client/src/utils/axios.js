import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// In production, we use relative URLs which will resolve to the same domain
// This ensures it works with Heroku or any other host without hard-coding domains
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'),
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    // Ensure OPTIONS requests are handled properly
    if (config.method === 'options') {
      config.headers['Access-Control-Request-Method'] = 'POST'
      config.headers['Access-Control-Request-Headers'] = 'content-type'
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const uiStore = useUIStore()
    
    if (error.code === 'ECONNABORTED') {
      uiStore.notifyError('Request timed out. Please try again.')
    } else if (error.code === 'ERR_NETWORK') {
      uiStore.notifyError('Network error. Please check your connection.')
    } else if (error.response?.status === 401) {
      authStore.logout()
      window.location.href = '/auth/login'
    } else if (!error.response) {
      uiStore.notifyError('Unable to connect to server. Please try again.')
    }
    
    return Promise.reject(error)
  }
)

export default instance
