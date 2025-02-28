<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content confirm-modal" @click.stop>
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-actions">
        <button 
          class="btn btn-secondary" 
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleConfirm"
          :class="{ 'btn-danger': type === 'danger' }"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ConfirmModal',
  
  props: {
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    type: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'danger'].includes(value)
    }
  },

  emits: ['close', 'confirm'],

  setup(props, { emit }) {
    const handleConfirm = () => {
      emit('confirm')
      emit('close')
    }

    const handleCancel = () => {
      emit('close')
    }

    const handleOverlayClick = () => {
      emit('close')
    }

    return {
      handleConfirm,
      handleCancel,
      handleOverlayClick
    }
  }
})
</script>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-content {
  background: var(--color-background);
  border-radius: var(--radius);
  padding: var(--spacing-6);
  max-width: 90%;
  width: 400px;
  box-shadow: var(--shadow-lg);
}

.confirm-modal {
  text-align: center;
}

.modal-title {
  margin-bottom: var(--spacing-4);
  color: var(--color-text);
}

.modal-message {
  margin-bottom: var(--spacing-6);
  color: var(--color-text-light);
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-4);
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    padding: var(--spacing-4);
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>
