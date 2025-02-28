<template>
  <Teleport to="body">
    <div class="modal-container">
      <template v-for="modal in uiStore.modals" :key="modal.id">
        <Transition name="modal">
          <div v-if="modal.isActive" class="modal-wrapper">
            <component
              :is="getModalComponent(modal.name)"
              v-bind="modal.props"
              @close="uiStore.closeModal(modal.id)"
            />
          </div>
        </Transition>
      </template>
    </div>
  </Teleport>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue'
import { useUIStore } from '@/stores/ui'

// Lazy load modals
const modalComponents = {
  'support-contact': defineAsyncComponent(() => import('./modals/SupportContactModal.vue')),
  'confirm': defineAsyncComponent(() => import('./modals/ConfirmModal.vue')),
  'product-create': defineAsyncComponent(() => import('./modals/ProductCreateModal.vue')),
  'product-edit': defineAsyncComponent(() => import('./modals/ProductEditModal.vue'))
}

export default defineComponent({
  name: 'ModalManager',

  setup() {
    const uiStore = useUIStore()

    const getModalComponent = (modalName) => {
      const component = modalComponents[modalName]
      if (!component) {
        console.error(`Modal component not found: ${modalName}`)
        return null
      }
      return component
    }

    return {
      uiStore,
      getModalComponent
    }
  }
})
</script>

<style>
.modal-container {
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
  pointer-events: auto;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
