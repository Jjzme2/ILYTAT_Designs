<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Contact Support</h2>
        <button class="modal-close" @click="$emit('close')" aria-label="Close modal">
          ✕
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="subject">Subject</label>
          <input
            id="subject"
            v-model="form.subject"
            type="text"
            required
            class="form-input"
            placeholder="How can we help?"
          />
        </div>

        <div class="form-group">
          <label for="message">Message</label>
          <textarea
            id="message"
            v-model="form.message"
            required
            class="form-input"
            rows="5"
            placeholder="Describe your issue or question"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="priority">Priority</label>
          <select
            id="priority"
            v-model="form.priority"
            class="form-input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
          >
            {{ loading ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useUIStore } from '@/stores/ui'

export default defineComponent({
  name: 'SupportContactModal',

  emits: ['close'],

  setup(props, { emit }) {
    const uiStore = useUIStore()
    const loading = ref(false)
    const form = ref({
      subject: '',
      message: '',
      priority: 'medium'
    })

    const handleSubmit = async () => {
      try {
        loading.value = true
        // TODO: Implement support contact API
        await new Promise(resolve => setTimeout(resolve, 1000))
        uiStore.notifySuccess('Message sent successfully')
        emit('close')
      } catch (error) {
        uiStore.notifyError('Failed to send message')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      handleSubmit
    }
  }
})
</script>

<style>
/* Modal styles are imported from @/styles/components/modal.css */
</style>
