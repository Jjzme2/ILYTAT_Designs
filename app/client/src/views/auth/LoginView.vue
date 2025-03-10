<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Login</h2>
      
      <!-- Email verification alert -->
      <div v-if="verificationAlert" class="alert alert-warning">
        <p>{{ verificationAlert.message }}</p>
        <div v-if="verificationAlert.emailInfo" class="dev-info">
          <p><strong>Development Email Information:</strong></p>
          <p>{{ verificationAlert.emailInfo.instructions }}</p>
          <p v-if="verificationAlert.emailInfo.saveToFile.enabled">
            Email files saved to: {{ verificationAlert.emailInfo.saveToFile.location }}
          </p>
        </div>
        <div class="alert-actions">
          <button 
            class="btn btn-secondary btn-sm" 
            @click="resendVerificationEmail(verificationAlert.email)"
            :disabled="resendingEmail"
          >
            {{ resendingEmail ? 'Sending...' : 'Resend Verification Email' }}
          </button>
        </div>
      </div>

      <!-- General error alert -->
      <div v-if="errorMessage" class="alert alert-danger">
        <p>{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <PasswordInput
            id="password"
            v-model="form.password"
            label="Password"
            :required="true"
            :min-length="8"
            autocomplete="current-password"
            :error="passwordError"
            :show-password-by-default="false"
          />
        </div>

        <div class="forgot-password-link">
          <router-link to="/auth/forgot-password">Forgot your password?</router-link>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <div class="register-link">
          Don't have an account? <router-link to="/auth/register">Register here</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PasswordInput from '@/components/common/PasswordInput.vue'

export default {
  name: 'LoginView',
  components: {
    PasswordInput
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref({
      email: '',
      password: ''
    })
    
    const passwordError = ref('')
    const loading = ref(false)
    const verificationAlert = ref(null)
    const resendingEmail = ref(false)
    const errorMessage = ref('')

    const handleLogin = async () => {
      try {
        loading.value = true
        verificationAlert.value = null
        passwordError.value = ''
        errorMessage.value = ''
        
        await authStore.login(form.value)
        router.push('/dashboard')
      } catch (error) {
        console.error('Login error:', error)
        
        // Check for email verification error
        if (error.response?.status === 403 && 
            error.response?.data?.details?.requiresVerification) {
          const details = error.response.data.details
          verificationAlert.value = {
            message: 'Your email has not been verified. Please check your inbox for the verification email or click the button below to resend it.',
            email: details.email || form.value.email,
            emailInfo: details.emailInfo
          }
        } else {
          passwordError.value = 'Invalid email or password'
        }
      } finally {
        loading.value = false
      }
    }

    const resendVerificationEmail = async (email) => {
      try {
        resendingEmail.value = true
        const result = await authStore.resendVerificationEmail(email || form.value.email)
        verificationAlert.value = {
          message: 'Verification email sent successfully! Please check your inbox.',
          email: email || form.value.email
        }
      } catch (error) {
        console.error('Failed to resend verification email:', error)
        verificationAlert.value = {
          message: 'Failed to resend verification email. Please try again later.',
          email: email || form.value.email
        }
      } finally {
        resendingEmail.value = false
      }
    }

    return {
      form,
      passwordError,
      loading,
      verificationAlert,
      resendingEmail,
      errorMessage,
      handleLogin,
      resendVerificationEmail
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
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

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #8abfff;
  cursor: not-allowed;
}

.alert {
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffecb5;
  color: #856404;
}

.alert-actions {
  margin-top: 0.75rem;
  text-align: right;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-secondary:disabled {
  background-color: #a1a8ae;
  cursor: not-allowed;
}

.forgot-password-link {
  text-align: right;
  margin-bottom: 1.5rem;
}

.forgot-password-link a {
  color: #6c757d;
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-password-link a:hover {
  color: #007bff;
  text-decoration: underline;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.dev-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dev-info p {
  margin-bottom: 0.5rem;
}

.dev-info strong {
  font-weight: 600;
}
</style>
