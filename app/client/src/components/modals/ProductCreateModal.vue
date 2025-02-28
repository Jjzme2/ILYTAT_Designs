<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content modal-lg" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Create New Product</h2>
        <button class="modal-close" @click="$emit('close')" aria-label="Close modal">
          ✕
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label for="title">Product Title</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              class="form-input"
              placeholder="Enter product title"
            />
          </div>

          <div class="form-group">
            <label for="price">Price</label>
            <input
              id="price"
              v-model="form.price"
              type="number"
              step="0.01"
              required
              class="form-input"
              placeholder="0.00"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            required
            class="form-input"
            rows="4"
            placeholder="Describe your product"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">Category</label>
            <select
              id="category"
              v-model="form.category"
              required
              class="form-input"
            >
              <option value="">Select a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select
              id="status"
              v-model="form.status"
              required
              class="form-input"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Images</label>
          <div class="image-upload-area">
            <div 
              v-for="(image, index) in form.images" 
              :key="index"
              class="image-preview"
            >
              <img :src="image.url" :alt="'Product image ' + (index + 1)" />
              <button 
                type="button" 
                class="image-remove" 
                @click="removeImage(index)"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
            <label class="image-upload-button" v-if="form.images.length < 5">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="handleImageUpload"
                class="hidden"
              />
              <span>+ Add Image</span>
            </label>
          </div>
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
            {{ loading ? 'Creating...' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { usePrintifyStore } from '@/stores/printify'
import { useUIStore } from '@/stores/ui'

export default defineComponent({
  name: 'ProductCreateModal',

  emits: ['close'],

  setup(props, { emit }) {
    const printifyStore = usePrintifyStore()
    const uiStore = useUIStore()
    const loading = ref(false)

    const categories = ref([
      { id: 1, name: 'T-Shirts' },
      { id: 2, name: 'Hoodies' },
      { id: 3, name: 'Mugs' },
      { id: 4, name: 'Phone Cases' }
    ])

    const form = ref({
      title: '',
      description: '',
      price: '',
      category: '',
      status: 'draft',
      images: []
    })

    const handleImageUpload = (event) => {
      const files = Array.from(event.target.files)
      files.forEach(file => {
        if (form.value.images.length >= 5) return

        const reader = new FileReader()
        reader.onload = (e) => {
          form.value.images.push({
            file,
            url: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
    }

    const removeImage = (index) => {
      form.value.images.splice(index, 1)
    }

    const handleSubmit = async () => {
      try {
        loading.value = true
        const formData = new FormData()
        
        // Append basic product data
        Object.keys(form.value).forEach(key => {
          if (key !== 'images') {
            formData.append(key, form.value[key])
          }
        })

        // Append images
        form.value.images.forEach((image, index) => {
          formData.append(`image${index}`, image.file)
        })

        await printifyStore.createProduct(formData)
        uiStore.notifySuccess('Product created successfully')
        emit('close')
      } catch (error) {
        uiStore.notifyError('Failed to create product')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      categories,
      handleImageUpload,
      removeImage,
      handleSubmit
    }
  }
})
</script>

<style>
/* Modal styles are imported from @/styles/components/modal.css */

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.image-upload-area {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius);
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-remove:hover {
  background: rgba(0, 0, 0, 0.7);
}

.image-upload-button {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-upload-button:hover {
  border-color: var(--color-primary);
}

.hidden {
  display: none;
}
</style>
