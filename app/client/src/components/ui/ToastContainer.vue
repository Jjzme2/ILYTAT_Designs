<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast--${toast.type}`]"
        role="alert"
        aria-live="polite"
      >
        <div class="toast__content">
          {{ toast.message }}
        </div>
        <button
          class="toast__close"
          @click="uiStore.removeToast(toast.id)"
          aria-label="Close notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { useUIStore } from '../../stores/ui'

/**
 * ToastContainer Component
 * 
 * Displays toast notifications in a fixed container at the top-right of the screen.
 * Supports different types of toasts: success, error, warning, and info.
 * 
 * @displayName ToastContainer
 * @example
 * <ToastContainer />
 * 
 * // To show a toast:
 * uiStore.showToast({
 *   message: 'Operation successful',
 *   type: 'success',
 *   duration: 3000
 * })
 */
export default {
  name: 'ToastContainer',
  setup() {
    const uiStore = useUIStore()
    return { uiStore }
  }
}
</script>

<style>
@import '../../styles/components/toast.css';
</style>
