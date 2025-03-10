<template>
  <div id="app" :class="{ 'dark': uiStore.isDarkMode }">
    <router-view />
    <ModalManager />
  </div>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import ModalManager from '@/components/ModalManager.vue'

export default defineComponent({
  name: 'App',

  components: {
    ModalManager
  },

  setup() {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    onMounted(() => {
      // Initialize authentication state
      authStore.initialize()
      
      // Apply saved theme
      uiStore.applyTheme()
    })

    return {
      uiStore
    }
  }
})
</script>

<style>
/* Import global styles */
@import '@/styles/index.css';
</style>
