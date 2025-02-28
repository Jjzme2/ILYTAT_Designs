<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences.</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="border-t border-gray-200">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700">First name</label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                v-model="form.firstName"
                class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700">Last name</label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                v-model="form.lastName"
                class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                v-model="form.email"
                disabled
                class="mt-1 bg-gray-50 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Phone number</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                v-model="form.phone"
                class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div class="mt-6">
            <h4 class="text-sm font-medium text-gray-900">Change Password</h4>
            <p class="mt-1 text-sm text-gray-500">Leave blank if you don't want to change it.</p>
            
            <div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label for="currentPassword" class="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  v-model="form.currentPassword"
                  class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  v-model="form.newPassword"
                  class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div class="mt-6">
            <h4 class="text-sm font-medium text-gray-900">Notifications</h4>
            <div class="mt-4">
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    v-model="form.emailNotifications"
                    class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="emailNotifications" class="font-medium text-gray-700">Email notifications</label>
                  <p class="text-gray-500">Receive email notifications about your account and orders.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <div v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</div>
          <div v-if="success" class="text-green-500 text-sm mb-4">{{ success }}</div>
          
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUIStore()

const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  firstName: auth.user?.firstName || '',
  lastName: auth.user?.lastName || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  currentPassword: '',
  newPassword: '',
  emailNotifications: auth.user?.emailNotifications || false
})

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = ''

    // Only include password update if both fields are filled
    const updateData = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      emailNotifications: form.emailNotifications
    }

    if (form.currentPassword && form.newPassword) {
      updateData.currentPassword = form.currentPassword
      updateData.newPassword = form.newPassword
    }

    await auth.updateProfile(updateData)
    success.value = 'Profile updated successfully'
    
    // Clear password fields
    form.currentPassword = ''
    form.newPassword = ''
    
    // Show success toast
    ui.showToast({
      type: 'success',
      message: 'Profile updated successfully'
    })
  } catch (err) {
    error.value = err.message || 'An error occurred while updating your profile'
    ui.showToast({
      type: 'error',
      message: error.value
    })
  } finally {
    loading.value = false
  }
}
</script>
