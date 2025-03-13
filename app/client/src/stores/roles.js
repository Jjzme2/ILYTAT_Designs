/**
 * Roles Store
 * Manages role-based access control data
 */
import { defineStore } from 'pinia';
import axios from '@/utils/axios';

export const useRolesStore = defineStore('roles', {
  state: () => ({
    // Role data
    roles: [],
    selectedRole: null,
    rolePermissions: {},
    availablePermissions: [],
    
    // UI state
    loading: {
      roles: false,
      selectedRole: false,
      rolePermissions: false,
      availablePermissions: false,
      createRole: false,
      updateRole: false,
      updatePermissions: false,
      deleteRole: false
    },
    error: {
      roles: null,
      selectedRole: null,
      rolePermissions: null,
      availablePermissions: null,
      createRole: null,
      updateRole: null,
      updatePermissions: null,
      deleteRole: null
    }
  }),

  getters: {
    /**
     * Get a role by ID
     * @param {string} id - Role ID
     * @returns {Object|null} Role object or null if not found
     */
    getRoleById: (state) => (id) => {
      return state.roles.find(role => role.id === id);
    },
    
    /**
     * Get permissions for a role by ID
     * @param {string} roleId - Role ID
     * @returns {Array} Array of permissions
     */
    getPermissionsByRoleId: (state) => (roleId) => {
      return state.rolePermissions[roleId] || [];
    },
    
    /**
     * Check if a role has a specific permission
     * @param {string} roleId - Role ID
     * @param {string} permission - Permission to check
     * @returns {boolean} True if the role has the permission
     */
    hasPermission: (state) => (roleId, permission) => {
      const permissions = state.rolePermissions[roleId] || [];
      return permissions.some(p => p.name === permission);
    }
  },

  actions: {
    /**
     * Fetch all roles
     * Requires authentication with role:read permission
     */
    async fetchRoles() {
      if (this.loading.roles) return;
      
      this.loading.roles = true;
      this.error.roles = null;
      
      try {
        const { data } = await axios.get('/api/roles');
        if (data.success) {
          this.roles = data.data || [];
        }
        return this.roles;
      } catch (error) {
        this.error.roles = error.response?.data?.message || 'Error fetching roles';
        console.error('Error fetching roles:', error);
        throw error;
      } finally {
        this.loading.roles = false;
      }
    },
    
    /**
     * Fetch a specific role by ID
     * Requires authentication with role:read permission
     * @param {string} roleId - Role ID to fetch
     */
    async fetchRoleById(roleId) {
      if (this.loading.selectedRole) return;
      
      this.loading.selectedRole = true;
      this.error.selectedRole = null;
      
      try {
        const { data } = await axios.get(`/api/roles/${roleId}`);
        if (data.success) {
          this.selectedRole = data.data;
        }
        return this.selectedRole;
      } catch (error) {
        this.error.selectedRole = error.response?.data?.message || `Error fetching role ${roleId}`;
        console.error(`Error fetching role ${roleId}:`, error);
        throw error;
      } finally {
        this.loading.selectedRole = false;
      }
    },
    
    /**
     * Fetch permissions for a specific role
     * Requires authentication with role:read permission
     * @param {string} roleId - Role ID to fetch permissions for
     */
    async fetchRolePermissions(roleId) {
      if (this.loading.rolePermissions) return;
      
      this.loading.rolePermissions = true;
      this.error.rolePermissions = null;
      
      try {
        const { data } = await axios.get(`/api/roles/${roleId}/permissions`);
        if (data.success) {
          this.rolePermissions = {
            ...this.rolePermissions,
            [roleId]: data.data || []
          };
        }
        return this.rolePermissions[roleId];
      } catch (error) {
        this.error.rolePermissions = error.response?.data?.message || `Error fetching permissions for role ${roleId}`;
        console.error(`Error fetching permissions for role ${roleId}:`, error);
        throw error;
      } finally {
        this.loading.rolePermissions = false;
      }
    },
    
    /**
     * Fetch all available permissions for role management
     * Requires authentication with role:read permission
     */
    async fetchAvailablePermissions() {
      if (this.loading.availablePermissions) return;
      
      this.loading.availablePermissions = true;
      this.error.availablePermissions = null;
      
      try {
        const { data } = await axios.get('/api/roles/available-permissions');
        if (data.success) {
          this.availablePermissions = data.data || [];
        }
        return this.availablePermissions;
      } catch (error) {
        this.error.availablePermissions = error.response?.data?.message || 'Error fetching available permissions';
        console.error('Error fetching available permissions:', error);
        throw error;
      } finally {
        this.loading.availablePermissions = false;
      }
    },
    
    /**
     * Create a new role
     * Requires authentication with role:create permission
     * @param {Object} roleData - Role data for creation
     */
    async createRole(roleData) {
      if (this.loading.createRole) return;
      
      this.loading.createRole = true;
      this.error.createRole = null;
      
      try {
        const { data } = await axios.post('/api/roles', roleData);
        if (data.success) {
          this.roles.push(data.data);
        }
        return data.data;
      } catch (error) {
        this.error.createRole = error.response?.data?.message || 'Error creating role';
        console.error('Error creating role:', error);
        throw error;
      } finally {
        this.loading.createRole = false;
      }
    },
    
    /**
     * Update an existing role
     * Requires authentication with role:update permission
     * @param {string} roleId - Role ID to update
     * @param {Object} roleData - Updated role data
     */
    async updateRole(roleId, roleData) {
      if (this.loading.updateRole) return;
      
      this.loading.updateRole = true;
      this.error.updateRole = null;
      
      try {
        const { data } = await axios.put(`/api/roles/${roleId}`, roleData);
        if (data.success) {
          // Update in roles list
          const roleIndex = this.roles.findIndex(r => r.id === roleId);
          if (roleIndex >= 0) {
            this.roles[roleIndex] = data.data;
          }
          
          // Update selected role if it matches
          if (this.selectedRole && this.selectedRole.id === roleId) {
            this.selectedRole = data.data;
          }
        }
        return data.data;
      } catch (error) {
        this.error.updateRole = error.response?.data?.message || `Error updating role ${roleId}`;
        console.error(`Error updating role ${roleId}:`, error);
        throw error;
      } finally {
        this.loading.updateRole = false;
      }
    },
    
    /**
     * Update permissions for a role
     * Requires authentication with role:update permission
     * @param {string} roleId - Role ID to update permissions for
     * @param {Array} permissions - Array of permission IDs to assign
     */
    async updateRolePermissions(roleId, permissions) {
      if (this.loading.updatePermissions) return;
      
      this.loading.updatePermissions = true;
      this.error.updatePermissions = null;
      
      try {
        const { data } = await axios.put(`/api/roles/${roleId}/permissions`, { permissions });
        if (data.success) {
          // Update cached permissions
          this.rolePermissions = {
            ...this.rolePermissions,
            [roleId]: data.data || []
          };
        }
        return data.data;
      } catch (error) {
        this.error.updatePermissions = error.response?.data?.message || `Error updating permissions for role ${roleId}`;
        console.error(`Error updating permissions for role ${roleId}:`, error);
        throw error;
      } finally {
        this.loading.updatePermissions = false;
      }
    },
    
    /**
     * Delete a role
     * Requires authentication with role:delete permission
     * @param {string} roleId - Role ID to delete
     */
    async deleteRole(roleId) {
      if (this.loading.deleteRole) return;
      
      this.loading.deleteRole = true;
      this.error.deleteRole = null;
      
      try {
        const { data } = await axios.delete(`/api/roles/${roleId}`);
        if (data.success) {
          // Remove from roles list
          this.roles = this.roles.filter(r => r.id !== roleId);
          
          // Clear selected role if it matches
          if (this.selectedRole && this.selectedRole.id === roleId) {
            this.selectedRole = null;
          }
          
          // Remove cached permissions
          if (this.rolePermissions[roleId]) {
            const { [roleId]: removed, ...rest } = this.rolePermissions;
            this.rolePermissions = rest;
          }
        }
        return data;
      } catch (error) {
        this.error.deleteRole = error.response?.data?.message || `Error deleting role ${roleId}`;
        console.error(`Error deleting role ${roleId}:`, error);
        throw error;
      } finally {
        this.loading.deleteRole = false;
      }
    }
  }
});
