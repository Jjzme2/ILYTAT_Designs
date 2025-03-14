/**
 * Contact Store (COMPATIBILITY LAYER)
 * Provides backward compatibility with the new configStore
 * This file maintains the same API as the original contactStore
 * but internally uses the configStore for data access
 */
import { defineStore } from 'pinia';
import { useConfigStore } from './configStore';

export const useContactStore = defineStore('contact', {
  state: () => ({
    // Company info
    companyName: null,
    companyWebsite: null,
    companySupportEmail: null,
    companyCommonEmail: null,
    companyPhone: null,
    companyAddressStreet: null,
    companyAddressUnit: null,
    companyAddressCity: null,
    companyAddressState: null,
    companyAddressZip: null,
    companyAddressCountry: null,
    companyTagline: null,
    socialsTikTok: null,
    socialsFacebook: null,
    companyAdditionalNotes: null,
    projectName: null,

    // UI state
    loading: {
      contactInfo: false,
      companyInfo: false,
      socialInfo: false,
      adminContactInfo: false,
      updateContact: false
    },
    error: {
      contactInfo: null,
      companyInfo: null,
      socialInfo: null,
      adminContactInfo: null,
      updateContact: null
    }
  }),

  getters: {
    /**
     * Get formatted full address
     * @returns {string} Full formatted address
     */
    getFormattedAddress() {
      const configStore = useConfigStore();
      return configStore.getFormattedAddress;
    },
    
    /**
     * Get formatted phone number
     * @returns {string} Formatted phone number
     */
    getFormattedPhone() {
      const configStore = useConfigStore();
      return configStore.getFormattedPhone;
    }
  },

  actions: {
    /**
     * Sync state from configStore to maintain backward compatibility
     * @private
     */
    _syncFromConfigStore() {
      const configStore = useConfigStore();
      
      // Company info
      this.companyName = configStore.company.name;
      this.companyWebsite = configStore.company.website;
      this.companySupportEmail = configStore.company.supportEmail;
      this.companyCommonEmail = configStore.company.commonEmail;
      this.companyPhone = configStore.company.phone;
      this.companyTagline = configStore.company.tagline;
      
      // Address
      this.companyAddressStreet = configStore.company.address.street;
      this.companyAddressUnit = configStore.company.address.unit;
      this.companyAddressCity = configStore.company.address.city;
      this.companyAddressState = configStore.company.address.state;
      this.companyAddressZip = configStore.company.address.zip;
      this.companyAddressCountry = configStore.company.address.country;
      
      // Social media
      this.socialsTikTok = configStore.social.tiktok;
      this.socialsFacebook = configStore.social.facebook;
      
      // Additional info
      this.companyAdditionalNotes = configStore.contact.additionalNotes;
      this.projectName = configStore.application.name;
    },
    
    /**
     * Set contact info from response data
     * @param {Object} data - Contact data from API
     */
    setContactInfo(data) {
      const configStore = useConfigStore();
      configStore.setConfig(data);
      this._syncFromConfigStore();
    },
    
    /**
     * Fetch all public contact information
     * No authentication required
     */
    async fetchContactInfo() {
      if (this.loading.contactInfo) return;
      
      this.loading.contactInfo = true;
      this.error.contactInfo = null;
      
      try {
        const configStore = useConfigStore();
        await configStore.fetchConfig();
        this._syncFromConfigStore();
        return configStore.exportConfig();
      } catch (error) {
        this.error.contactInfo = error.response?.data?.message || 'Error fetching contact information';
        console.error('Error fetching contact information:', error);
        throw error;
      } finally {
        this.loading.contactInfo = false;
      }
    },

    /**
     * Fetch company contact information
     * No authentication required
     */
    async fetchCompanyInfo() {
      if (this.loading.companyInfo) return;
      
      this.loading.companyInfo = true;
      this.error.companyInfo = null;
      
      try {
        const configStore = useConfigStore();
        await configStore.fetchConfig();
        this._syncFromConfigStore();
        return configStore.company;
      } catch (error) {
        this.error.companyInfo = error.response?.data?.message || 'Error fetching company contact information';
        console.error('Error fetching company contact information:', error);
        throw error;
      } finally {
        this.loading.companyInfo = false;
      }
    },

    /**
     * Fetch social media information
     * No authentication required
     */
    async fetchSocialInfo() {
      if (this.loading.socialInfo) return;
      
      this.loading.socialInfo = true;
      this.error.socialInfo = null;
      
      try {
        const configStore = useConfigStore();
        await configStore.fetchConfig();
        this._syncFromConfigStore();
        return configStore.social;
      } catch (error) {
        this.error.socialInfo = error.response?.data?.message || 'Error fetching social media information';
        console.error('Error fetching social media information:', error);
        throw error;
      } finally {
        this.loading.socialInfo = false;
      }
    },

    /**
     * Fetch all contact information including sensitive data (admin only)
     * Requires authentication with appropriate permissions
     */
    async fetchAdminContactInfo() {
      if (this.loading.adminContactInfo) return;
      
      this.loading.adminContactInfo = true;
      this.error.adminContactInfo = null;
      
      try {
        const configStore = useConfigStore();
        await configStore.fetchAdminConfig();
        this._syncFromConfigStore();
        return configStore.exportConfig();
      } catch (error) {
        this.error.adminContactInfo = error.response?.data?.message || 'Error fetching admin contact information';
        console.error('Error fetching admin contact information:', error);
        throw error;
      } finally {
        this.loading.adminContactInfo = false;
      }
    },

    /**
     * Update contact information (admin only)
     * Requires authentication with appropriate permissions
     * @param {Object} contactData - Updated contact information
     */
    async updateContactInfo(contactData) {
      if (this.loading.updateContact) return;
      
      this.loading.updateContact = true;
      this.error.updateContact = null;
      
      try {
        const configStore = useConfigStore();
        await configStore.updateConfig(contactData);
        this._syncFromConfigStore();
        return configStore.exportConfig();
      } catch (error) {
        this.error.updateContact = error.response?.data?.message || 'Error updating contact information';
        console.error('Error updating contact information:', error);
        throw error;
      } finally {
        this.loading.updateContact = false;
      }
    }
  }
});
