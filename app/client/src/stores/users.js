/**
 * Users Store
 * Manages user data and profile information
 */
import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import { useAuthStore } from './auth';

export const useUsersStore = defineStore('users', {
  state: () => ({
    // User data
    users: [],
    selectedUser: null,
    userRoles: {},
    userPermissions: {},
    currentUserProfile: null,
    userPreferences: null,
    
    // UI state
    loading: {
      users: false,
      selectedUser: false,
      userRoles: false,
      userPermissions: false,
      profile: false,
      preferences: false,
      createUser: false,
      updateUser: false,
      deleteUser: false
    },
    error: {
      users: null,
      selectedUser: null,
      userRoles: null,
      userPermissions: null,
      profile: null,
      preferences: null,
      createUser: null,
      updateUser: null,
      deleteUser: null
    }
  }),

  getters: {
    getUserById: (state) => (id) => {
      return state.users.find(user => user.id === id);
    },
    getUserRoles: (state) => (userId) => {
      return state.userRoles[userId] || [];
    },
    getUserPermissions: (state) => (userId) => {
      return state.userPermissions[userId] || [];
    },
    hasRole: (state) => (userId, roleName) => {
      const roles = state.userRoles[userId] || [];
      return roles.some(role => role.name === roleName);
    }
  },

  actions: {
    // === USER PROFILE ACTIONS ===
    
    /**
     * Fetch the current user's profile
     * Requires authentication
     */
    async fetchProfile() {
      if (this.loading.profile) return;
      
      this.loading.profile = true;
      this.error.profile = null;
      
      try {
        const { data } = await axios.get('/api/users/profile');
        if (data.success) {
          this.currentUserProfile = data.data;
        }
        return this.currentUserProfile;
      } catch (error) {
        this.error.profile = error.response?.data?.message || 'Error fetching user profile';
        console.error('Error fetching user profile:', error);
        throw error;
      } finally {
        this.loading.profile = false;
      }
    },
    
    /**
     * Update user preferences
     * Requires authentication
     * @param {Object} preferences - User preferences to update
     */
    async updatePreferences(preferences) {
      if (this.loading.preferences) return;
      
      this.loading.preferences = true;
      this.error.preferences = null;
      
      try {
        const { data } = await axios.put('/api/users/preferences', preferences);
        if (data.success) {
          this.userPreferences = data.data;
        }
        return this.userPreferences;
      } catch (error) {
        this.error.preferences = error.response?.data?.message || 'Error updating user preferences';
        console.error('Error updating user preferences:', error);
        throw error;
      } finally {
        this.loading.preferences = false;
      }
    },
    
    // === USER MANAGEMENT ACTIONS (Admin/Manager only) ===
    
    /**
     * Fetch all users
     * Requires authentication with user:read permission
     */
    async fetchAllUsers() {
      if (this.loading.users) return;
      
      this.loading.users = true;
      this.error.users = null;
      
      try {
        const { data } = await axios.get('/api/users');
        if (data.success) {
          this.users = data.data;
        }
        return this.users;
      } catch (error) {
        this.error.users = error.response?.data?.message || 'Error fetching users';
        console.error('Error fetching users:', error);
        throw error;
      } finally {
        this.loading.users = false;
      }
    },
    
    /**
     * Fetch a specific user by ID
     * Requires authentication with user:read permission or ownership
     * @param {string} userId - User ID to fetch
     */
    async fetchUserById(userId) {
      if (this.loading.selectedUser) return;
      
      this.loading.selectedUser = true;
      this.error.selectedUser = null;
      
      try {
        const { data } = await axios.get(`/api/users/${userId}`);
        if (data.success) {
          this.selectedUser = data.data;
        }
        return this.selectedUser;
      } catch (error) {
        this.error.selectedUser = error.response?.data?.message || `Error fetching user ${userId}`;
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
      } finally {
        this.loading.selectedUser = false;
      }
    },
    
    /**
     * Fetch roles for a specific user
     * Requires authentication with user:read permission or ownership
     * @param {string} userId - User ID to fetch roles for
     */
    async fetchUserRoles(userId) {
      if (this.loading.userRoles) return;
      
      this.loading.userRoles = true;
      this.error.userRoles = null;
      
      try {
        const { data } = await axios.get(`/api/users/${userId}/roles`);
        if (data.success) {
          this.userRoles = {
            ...this.userRoles,
            [userId]: data.data
          };
        }
        return this.userRoles[userId];
      } catch (error) {
        this.error.userRoles = error.response?.data?.message || `Error fetching roles for user ${userId}`;
        console.error(`Error fetching roles for user ${userId}:`, error);
        throw error;
      } finally {
        this.loading.userRoles = false;
      }
    },
    
    /**
     * Fetch permissions for a specific user
     * Requires authentication with user:read permission or ownership
     * @param {string} userId - User ID to fetch permissions for
     */
    async fetchUserPermissions(userId) {
      if (this.loading.userPermissions) return;
      
      this.loading.userPermissions = true;
      this.error.userPermissions = null;
      
      try {
        const { data } = await axios.get(`/api/users/${userId}/permissions`);
        if (data.success) {
          this.userPermissions = {
            ...this.userPermissions,
            [userId]: data.data
          };
        }
        return this.userPermissions[userId];
      } catch (error) {
        this.error.userPermissions = error.response?.data?.message || `Error fetching permissions for user ${userId}`;
        console.error(`Error fetching permissions for user ${userId}:`, error);
        throw error;
      } finally {
        this.loading.userPermissions = false;
      }
    },
    
    /**
     * Create a new user
     * Requires authentication with user:create permission
     * @param {Object} userData - User data for creation
     */
    async createUser(userData) {
      if (this.loading.createUser) return;
      
      this.loading.createUser = true;
      this.error.createUser = null;
      
      try {
        const { data } = await axios.post('/api/users', userData);
        if (data.success) {
          // Refresh the users list
          await this.fetchAllUsers();
        }
        return data;
      } catch (error) {
        this.error.createUser = error.response?.data?.message || 'Error creating user';
        console.error('Error creating user:', error);
        throw error;
      } finally {
        this.loading.createUser = false;
      }
    },
    
    /**
     * Update an existing user
     * Requires authentication with user:update permission or ownership
     * @param {string} userId - User ID to update
     * @param {Object} userData - Updated user data
     */
    async updateUser(userId, userData) {
      if (this.loading.updateUser) return;
      
      this.loading.updateUser = true;
      this.error.updateUser = null;
      
      try {
        const { data } = await axios.put(`/api/users/${userId}`, userData);
        if (data.success) {
          // Check if this is the current user and update accordingly
          const authStore = useAuthStore();
          if (authStore.user && authStore.user.id === userId) {
            authStore.user = data.data;
          }
          
          // Update in the users list if it exists
          const userIndex = this.users.findIndex(u => u.id === userId);
          if (userIndex >= 0) {
            this.users[userIndex] = data.data;
          }
          
          // Update selected user if it matches
          if (this.selectedUser && this.selectedUser.id === userId) {
            this.selectedUser = data.data;
          }
        }
        return data;
      } catch (error) {
        this.error.updateUser = error.response?.data?.message || `Error updating user ${userId}`;
        console.error(`Error updating user ${userId}:`, error);
        throw error;
      } finally {
        this.loading.updateUser = false;
      }
    },
    
    /**
     * Delete a user
     * Requires authentication with user:delete permission
     * @param {string} userId - User ID to delete
     */
    async deleteUser(userId) {
      if (this.loading.deleteUser) return;
      
      this.loading.deleteUser = true;
      this.error.deleteUser = null;
      
      try {
        const { data } = await axios.delete(`/api/users/${userId}`);
        if (data.success) {
          // Remove from the users list
          this.users = this.users.filter(u => u.id !== userId);
          
          // Clear selected user if it matches
          if (this.selectedUser && this.selectedUser.id === userId) {
            this.selectedUser = null;
          }
        }
        return data;
      } catch (error) {
        this.error.deleteUser = error.response?.data?.message || `Error deleting user ${userId}`;
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
      } finally {
        this.loading.deleteUser = false;
      }
    }
  }
});
