<template>
  <div class="register-container">
    <div class="register-form">
      <h2>Create Account</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            class="form-control"
            :class="{ 'error': errors.firstName }"
            required
          />
          <div v-if="errors.firstName" class="form-error">
            {{ errors.firstName }}
          </div>
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            class="form-control"
            :class="{ 'error': errors.lastName }"
            required
          />
          <div v-if="errors.lastName" class="form-error">
            {{ errors.lastName }}
          </div>
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-control"
            :class="{ 'error': errors.username }"
            required
            minlength="3"
            maxlength="30"
            pattern="[a-zA-Z0-9]+"
            title="Username must be 3-30 characters long and contain only letters and numbers"
          />
          <div v-if="errors.username" class="form-error">
            {{ errors.username }}
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            :class="{ 'error': errors.email }"
            required
          />
          <div v-if="errors.email" class="form-error">
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group">
          <PasswordInput
            id="password"
            v-model="form.password"
            label="Password"
            :required="true"
            :min-length="8"
            autocomplete="new-password"
            :error="errors.password"
            :show-password-by-default="false"
          />
        </div>

        <div class="form-group">
          <PasswordInput
            id="confirmPassword"
            v-model="form.confirmPassword"
            label="Confirm Password"
            :required="true"
            :min-length="8"
            autocomplete="new-password"
            :error="errors.confirmPassword"
            :show-password-by-default="false"
          />
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="form.acceptTerms"
              :class="{ 'form-input--error': errors.acceptTerms }"
            />
            <span>I accept the Terms of Service and Privacy Policy</span>
          </label>
          <div v-if="errors.acceptTerms" class="form-error">
            {{ errors.acceptTerms }}
          </div>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          Register
        </button>
        
        <div class="login-link">
          Already have an account? <router-link to="/auth/login">Login here</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PasswordInput from '@/components/common/PasswordInput.vue'
import { useNotification } from '@/utils/notificationHandler'

export default {
  name: 'RegisterView',
  components: {
    PasswordInput
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const notification = useNotification()

    const form = reactive({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    })

    const errors = reactive({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: ''
    })

    const loading = ref(false)

    const clearErrors = () => {
      Object.keys(errors).forEach(key => {
        errors[key] = ''
      })
    }

    const validateForm = () => {
      clearErrors()
      let isValid = true

      if (!form.firstName.trim()) {
        errors.firstName = 'First name is required'
        isValid = false
      }

      if (!form.lastName.trim()) {
        errors.lastName = 'Last name is required'
        isValid = false
      }

      if (!form.username.trim()) {
        errors.username = 'Username is required'
        isValid = false
      } else if (!/^[a-zA-Z0-9]+$/.test(form.username)) {
        errors.username = 'Username can only contain letters and numbers'
        isValid = false
      }

      if (!form.email.trim()) {
        errors.email = 'Email is required'
        isValid = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Please enter a valid email address'
        isValid = false
      }

      if (!form.password) {
        errors.password = 'Password is required'
        isValid = false
      } else if (form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
        isValid = false
      }

      if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
        isValid = false
      }

      if (!form.acceptTerms) {
        errors.acceptTerms = 'You must accept the Terms of Service'
        isValid = false
      }

      return isValid
    }

    const handleRegister = async () => {
      if (!validateForm()) {
        notification.showWarning('Please fix the form errors')
        return
      }

      loading.value = true
      clearErrors()

      try {
        const result = await authStore.register({
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          email: form.email,
          password: form.password
        })

        if (result.success) {
          notification.showSuccess('Registration successful!')
          router.push('/dashboard')
        }
      } catch (error) {
        if (error.response?.data?.validationErrors) {
          const serverErrors = error.response.data.validationErrors
          Object.keys(serverErrors).forEach(key => {
            if (errors.hasOwnProperty(key)) {
              errors[key] = serverErrors[key]
            }
          })
        }
        notification.showError(error)
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      errors,
      loading,
      handleRegister
    }
  }
}
</script>

<style>
.register-container {
  @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8;
}

.register-form {
  @apply max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md;
}

.form-group {
  @apply space-y-2 mb-6;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700;
}

.form-control {
  @apply appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
         focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm;
}

.form-control.error {
  @apply border-red-500;
}

.form-error {
  @apply text-sm text-red-600 mt-1;
}

.checkbox-label {
  @apply flex items-center space-x-2 text-sm text-gray-600;
}

.checkbox-label input[type="checkbox"] {
  @apply h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer;
}

button[type="submit"] {
  @apply w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
         text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
         focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

@media (max-width: 640px) {
  .register-form {
    @apply p-6;
  }

  .form-group {
    @apply mb-4;
  }
}
</style>
