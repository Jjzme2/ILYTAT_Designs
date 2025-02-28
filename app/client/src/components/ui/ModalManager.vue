<template>
  <div class="modal-manager">
    <div
      v-for="modal in uiStore.modals"
      :key="modal.id"
      class="modal-wrapper"
      :class="{ 'modal-wrapper--active': modal.isActive }"
    >
      <component
        :is="modal.component"
        v-bind="modal.props"
        @close="uiStore.closeModal(modal.id)"
      />
    </div>
  </div>
</template>

<script>
import { useUIStore } from '../../stores/ui'

/**
 * ModalManager Component
 * 
 * Manages the display and state of modal components throughout the application.
 * Works in conjunction with the UI store to handle modal stacking and transitions.
 * 
 * @displayName ModalManager
 * @example
 * <ModalManager />
 */
export default {
  name: 'ModalManager',
  setup() {
    const uiStore = useUIStore()
    return { uiStore }
  }
}
</script>

<style>
.modal-manager {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: var(--z-modal);
}

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-out;
}

.modal-wrapper--active {
  opacity: 1;
  pointer-events: auto;
}
</style>
