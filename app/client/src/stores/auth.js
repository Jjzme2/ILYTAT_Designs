import { defineStore } from 'pinia';
import axios from 'axios';
import router from '@/router';
import { useToast } from '@/composables/useToast';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
    hasRole: (state) => (role) => {
      return state.user && state.user.roles && state.user.roles.includes(role);
    }
  },

  actions: {
    setTokens(accessToken, refreshToken) {
      this.token = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    },

    clearTokens() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
    },

    async register(userData) {
      try {
        const response = await axios.post('/api/auth/register', userData);
        if (response.data.success) {
          const { accessToken, refreshToken } = response.data.data;
          this.setTokens(accessToken, refreshToken);
          this.user = response.data.data.user;
        }
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    async login(credentials) {
      try {
        this.loading = true;
        const response = await axios.post('/api/auth/login', credentials);
        
        // Enhanced debugging to see the exact structure of the response
        console.log('Full login response:', {
          status: response.status,
          headers: response.headers,
          data: JSON.stringify(response.data, null, 2)
        });
        
        // Check if login was successful based on response.data.success
        if (response.data && response.data.success) {
          // Debug the response structure
          console.log('Login response structure:', JSON.stringify(response.data, null, 2));
          
          // Extract token data from the response
          // Try multiple possible paths to find tokens since server might have different response formats
          let accessToken, refreshToken, user;
          
          if (response.data.data) {
            // Standard path through response.data.data
            ({ accessToken, refreshToken, user } = response.data.data);
            console.log('Found tokens in response.data.data');
          } 
          else if (response.data.result) {
            // Alternative path through response.data.result
            ({ accessToken, refreshToken, user } = response.data.result);
            console.log('Found tokens in response.data.result');
          }
          
          // Set tokens if they exist
          if (accessToken && refreshToken) {
            console.log('Setting tokens in store');
            this.setTokens(accessToken, refreshToken);
            
            // If user data was included in response, use it
            if (user) {
              console.log('User data found in response:', user);
              this.user = user;
            } else {
              // Otherwise fetch user profile
              console.log('No user data in response, fetching profile');
              await this.fetchUserProfile();
            }
            
            // Show welcome toast notification
            const { showToast } = useToast();
            showToast(`Welcome back, ${this.user?.firstName || 'User'}!`, 'success');
            
            // Redirect to dashboard
            router.push('/dashboard');
          } else {
            // Handle missing tokens
            console.error('Login response missing token data', response.data);
            const { showToast } = useToast();
            showToast('Authentication error. Please try again.', 'error');
          }
        }
        return response.data;
      } catch (error) {
        // If this is a verification error, extract the detailed information
        if (error.response?.status === 403 && 
            error.response?.data?.error?.details?.requiresVerification) {
          
          // Restructure the error to make it more useful to the UI
          throw {
            ...error,
            response: {
              ...error.response,
              data: {
                ...error.response.data,
                details: {
                  requiresVerification: true,
                  email: error.response.data.error.details.email,
                  emailInfo: error.response.data.error.actions.find(a => a.type === 'check_dev_email') 
                    ? { instructions: error.response.data.error.actions.find(a => a.type === 'check_dev_email').message } 
                    : null
                }
              }
            }
          };
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await axios.post('/api/auth/logout');
        this.clearTokens();
        router.push('/login');
      } catch (error) {
        // Still clear tokens on error
        this.clearTokens();
        throw error;
      }
    },

    async refreshAccessToken() {
      try {
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken: this.refreshToken
        });
        if (response.data.success) {
          const { accessToken, refreshToken } = response.data.data;
          this.setTokens(accessToken, refreshToken);
        }
        return response.data;
      } catch (error) {
        this.clearTokens();
        throw error;
      }
    },

    async fetchUserProfile() {
      try {
        // Check if token exists before making the API call
        if (!this.token) {
          console.warn('Attempted to fetch user profile without authentication token');
          return { success: false, message: 'No authentication token' };
        }
        
        const response = await axios.get('/api/auth/me');
        if (response.data.success) {
          this.user = response.data.data;
        }
        return response.data;
      } catch (error) {
        // Don't throw error for 401 responses - just handle them
        if (error.response?.status === 401) {
          console.warn('Session expired or invalid while fetching profile');
          return { success: false, message: 'Authentication failed' };
        }
        throw error;
      }
    },

    async forgotPassword(email) {
      try {
        const response = await axios.post('/api/auth/forgot-password', { email });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    async resetPassword(token, newPassword) {
      try {
        const response = await axios.post('/api/auth/reset-password', { 
          token, 
          newPassword 
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    async resendVerificationEmail(email) {
      try {
        this.loading = true;
        const response = await axios.post('/api/auth/resend-verification', { email });
        
        // Extract development email info if available
        if (response.data.data && response.data.data.devMode) {
          const emailServiceInfo = response.data.data.emailServiceInfo || {};
          return {
            ...response.data,
            emailInfo: {
              mode: emailServiceInfo.mode,
              providerUrl: emailServiceInfo.providerUrl,
              instructions: emailServiceInfo.instructions,
              saveToFile: emailServiceInfo.saveToFile || { enabled: false }
            }
          };
        }
        
        return response.data;
      } catch (error) {
        // If this is a service unavailable error with dev details
        if (error.response?.status === 503 && 
            error.response?.data?.error?.details?.devMode) {
          
          // Restructure the error to make it more useful to the UI
          const actions = error.response.data.error.actions || [];
          const instructions = actions.map(a => a.message).join(' ');
          
          throw {
            ...error,
            response: {
              ...error.response,
              data: {
                message: 'Email service unavailable in development mode',
                details: {
                  emailInfo: {
                    instructions: `${error.response.data.error.message} ${instructions}`
                  }
                }
              }
            }
          };
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async initialize() {
      if (this.token) {
        try {
          // Ensure axios is configured with the token
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          
          // Try to get user profile
          const profileResult = await this.fetchUserProfile();
          
          // If profile fetch fails with 401, try refresh token
          if (!profileResult.success && this.refreshToken) {
            try {
              // Attempt to refresh the token
              const refreshResult = await this.refreshAccessToken();
              if (refreshResult.success) {
                await this.fetchUserProfile();
              } else {
                this.clearTokens();
                router.push('/auth/login');
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.clearTokens();
              router.push('/auth/login');
            }
          }
        } catch (error) {
          console.error('Authentication initialization error:', error);
          this.clearTokens();
          router.push('/auth/login');
        }
      }
    }
  }
});
