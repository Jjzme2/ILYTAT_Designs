import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { Toast, options } from './plugins/toast'

// Import Font Awesome configuration
import { registerFontAwesome } from './utils/fontawesome'

// Import global styles
import './styles/index.css'
import 'vue-toastification/dist/index.css'

// Create Vue app
const app = createApp(App)

// Initialize Pinia
const pinia = createPinia()
app.use(pinia)

// Initialize Router
app.use(router)

// Initialize Toast
app.use(Toast, options)

// Register Font Awesome
registerFontAwesome(app)

// Mount app
app.mount('#app')
