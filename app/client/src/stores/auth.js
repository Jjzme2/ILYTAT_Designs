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
    getUser: (state) => state.user
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
        const response = await axios.post('/api/auth/login', credentials);
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
