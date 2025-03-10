import { defineStore } from 'pinia';
import axios from 'axios';
import router from '@/router';

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
        if (response.success) {
          const { accessToken, refreshToken } = response.data.data;
          this.setTokens(accessToken, refreshToken);
          this.user = response.data.data.user;
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
        const response = await axios.get('/api/auth/profile');
        if (response.data.success) {
          this.user = response.data.data;
        }
        return response.data;
      } catch (error) {
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
          await this.fetchUserProfile();
        } catch (error) {
          if (error.response?.status === 401 && this.refreshToken) {
            try {
              await this.refreshAccessToken();
              await this.fetchUserProfile();
            } catch (refreshError) {
              this.clearTokens();
              router.push('/login');
            }
          } else {
            this.clearTokens();
            router.push('/login');
          }
        }
      }
    }
  }
});
