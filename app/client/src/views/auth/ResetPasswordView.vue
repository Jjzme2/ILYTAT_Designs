<template>
  <div class="reset-password-container">
    <div class="reset-password-form">
      <h2>Reset Password</h2>
      <p class="description">
        Please enter your new password
      </p>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="password">New Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            required
            placeholder="Enter your new password"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-control"
            required
            placeholder="Confirm your new password"
          />
          <div v-if="passwordMismatch" class="password-feedback">
            Passwords do not match
          </div>
          <div v-if="passwordTooShort" class="password-feedback">
            Password must be at least 8 characters
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success">
          {{ success }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading || !isValid"
        >
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
        
        <div class="login-link">
          <router-link to="/auth/login">Back to Login</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'ResetPasswordView',
  setup() {
    const auth = useAuthStore()
    const route = useRoute()
    const router = useRouter()
    
    const password = ref('')
    const confirmPassword = ref('')
    const loading = ref(false)
    const error = ref('')
    const success = ref('')
    
    const passwordMismatch = computed(() => {
      return confirmPassword.value && password.value !== confirmPassword.value
    })
    
    const passwordTooShort = computed(() => {
      return password.value && password.value.length < 8
    })
    
    const isValid = computed(() => {
      return password.value.length >= 8 && password.value === confirmPassword.value
    })
    
    const handleSubmit = async () => {
      if (!isValid.value) {
        error.value = 'Passwords must match and be at least 8 characters long'
        return
      }
    
      try {
        loading.value = true
        error.value = ''
        success.value = ''
        
        const token = route.query.token
        if (!token) {
          throw new Error('Reset token is missing')
        }
    
        await auth.resetPassword(token, password.value)
        success.value = 'Password has been reset successfully'
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } catch (err) {
        error.value = err.response?.data?.message || 'An error occurred while resetting your password'
      } finally {
        loading.value = false
      }
    }
    
    return {
      password,
      confirmPassword,
      loading,
      error,
      success,
      passwordMismatch,
      passwordTooShort,
      isValid,
      handleSubmit
    }
  }
}
</script>

<style>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
}

.reset-password-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
}

.description {
  text-align: center;
  margin-bottom: 2rem;
  color: #6c757d;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #007bff;
  outline: none;
}

.password-feedback {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.alert {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  transition: background-color 0.2s;
  position: relative;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Mobile responsiveness */
@media (max-width: 576px) {
  .reset-password-form {
    padding: 1.5rem;
  }
}
</style>
