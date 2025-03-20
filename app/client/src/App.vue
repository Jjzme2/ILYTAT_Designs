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
import { useSystemStore } from '@/stores/system'
import ModalManager from '@/components/ModalManager.vue'

export default defineComponent({
  name: 'App',

  components: {
    ModalManager
  },

  setup() {
    const authStore = useAuthStore()
    const uiStore = useUIStore()
    const systemStore = useSystemStore()

    onMounted(() => {
      // Initialize authentication state
      authStore.initialize()
      
      // Apply saved theme
      uiStore.applyTheme()
        
      // Initialize system state
      systemStore.initialize()
    })

    return {
      uiStore,
      systemStore
    }
  }
})
</script>

<style>
/* Import global styles */
@import '@/styles/index.css';
</style>
