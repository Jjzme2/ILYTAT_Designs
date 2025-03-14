/**
 * Configuration Store
 * Manages application configuration and settings state
 */
import { defineStore } from 'pinia';
import axios from '@/utils/axios';

export const useConfigStore = defineStore('config', {
  state: () => ({
    // Application info
    application: {
      name: null,
      version: null,
      environment: null,
      description: null,
      lastUpdated: null
    },

    // Company info
    company: {
      name: null,
      website: null,
      supportEmail: null,
      commonEmail: null,
      phone: null,
      tagline: null,
      address: {
        street: null,
        unit: null,
        city: null,
        state: null,
        zip: null,
        country: null
      }
    },

    // Brand info
    brand: {
      colors: {
        primary: null,
        secondary: null,
        accent: null,
        light: null,
        dark: null
      },
      fonts: {
        heading: null,
        body: null
      },
      logo: {
        main: null,
        favicon: null,
        alt: null
      }
    },

    // Social media links
    social: {
      tiktok: null,
      facebook: null,
      instagram: null,
      twitter: null,
      pinterest: null,
      youtube: null
    },

    // Contact settings
    contact: {
      hours: null,
      supportResponseTime: null,
      additionalNotes: null
    },

    // Feature flags and settings
    features: {
      shop: {
        enabled: true,
        defaultCurrency: null,
        defaultLanguage: null,
        itemsPerPage: null
      },
      cart: {
        abandonedCartTimeout: null,
        guestCheckoutEnabled: null
      },
      authentication: {
        sessionTimeout: null,
        requireEmailVerification: null
      }
    },

    // Integration settings
    integration: {
      printify: {
        enabled: true,
        apiEndpoint: null
      }
    },

    // SEO configuration
    seo: {
      defaultTitle: null,
      defaultDescription: null,
      defaultKeywords: null
    },

    // UI state
    loading: {
      config: false,
      adminConfig: false,
      updateConfig: false
    },
    error: {
      config: null,
      adminConfig: null,
      updateConfig: null
    }
  }),

  getters: {
    /**
     * Get formatted full address
     * @returns {string} Full formatted address
     */
    getFormattedAddress: (state) => {
      const parts = [];
      
      if (state.company.address.street) {
        parts.push(state.company.address.street);
      }
      
      if (state.company.address.unit) {
        parts.push(state.company.address.unit);
      }
      
      const cityStateZip = [];
      if (state.company.address.city) {
        cityStateZip.push(state.company.address.city);
      }
      
      if (state.company.address.state) {
        cityStateZip.push(state.company.address.state);
      }
      
      if (state.company.address.zip) {
        cityStateZip.push(state.company.address.zip);
      }
      
      if (cityStateZip.length > 0) {
        parts.push(cityStateZip.join(', '));
      }
      
      if (state.company.address.country) {
        parts.push(state.company.address.country);
      }
      
      return parts.join('\n');
    },
    
    /**
     * Get formatted phone number
     * @returns {string} Formatted phone number
     */
    getFormattedPhone: (state) => {
      if (!state.company.phone) return '';
      
      // Format as (XXX) XXX-XXXX if it's a 10-digit number
      if (state.company.phone.replace(/\D/g, '').length === 10) {
        const cleaned = state.company.phone.replace(/\D/g, '');
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
      }
      
      return state.company.phone;
    },

    /**
     * Get project/application name
     * @returns {string} Project name
     */
    projectName: (state) => {
      return state.application.name;
    },

    /**
     * Get all active social media links
     * @returns {Object} Object containing only non-empty social media links
     */
    activeSocialLinks: (state) => {
      return Object.entries(state.social)
        .filter(([_, value]) => value && value.trim() !== '')
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },

    /**
     * Get application meta data for SEO
     * @returns {Object} Object containing title, description and keywords
     */
    metaData: (state) => {
      return {
        title: state.seo.defaultTitle,
        description: state.seo.defaultDescription,
        keywords: state.seo.defaultKeywords
      };
    }
  },

  actions: {
    /**
     * Set configuration from response data
     * @param {Object} data - Configuration data from API
     */
    setConfig(data) {
      // Application info
      if (data.application) {
        this.application = { ...this.application, ...data.application };
      }
      
      // Company info
      if (data.company) {
        const company = data.company;
        
        // Handle nested address object
        if (company.address) {
          this.company.address = { ...this.company.address, ...company.address };
          // Remove address to avoid duplication in the spread below
          const { address, ...companyWithoutAddress } = company;
          this.company = { ...this.company, ...companyWithoutAddress };
        } else {
          this.company = { ...this.company, ...company };
        }
      }
      
      // Brand info
      if (data.brand) {
        const brand = data.brand;
        
        // Handle nested objects
        if (brand.colors) {
          this.brand.colors = { ...this.brand.colors, ...brand.colors };
        }
        
        if (brand.fonts) {
          this.brand.fonts = { ...this.brand.fonts, ...brand.fonts };
        }
        
        if (brand.logo) {
          this.brand.logo = { ...this.brand.logo, ...brand.logo };
        }

        // Remove nested objects to avoid duplication
        const { colors, fonts, logo, ...brandWithoutNested } = brand;
        this.brand = { ...this.brand, ...brandWithoutNested };
      }
      
      // Social Media
      if (data.social) {
        this.social = { ...this.social, ...data.social };
      }
      
      // Contact info
      if (data.contact) {
        this.contact = { ...this.contact, ...data.contact };
      }

      // Features
      if (data.features) {
        const features = data.features;
        
        // Handle nested objects
        if (features.shop) {
          this.features.shop = { ...this.features.shop, ...features.shop };
        }
        
        if (features.cart) {
          this.features.cart = { ...this.features.cart, ...features.cart };
        }
        
        if (features.authentication) {
          this.features.authentication = { ...this.features.authentication, ...features.authentication };
        }
      }

      // Integration
      if (data.integration) {
        const integration = data.integration;
        
        if (integration.printify) {
          this.integration.printify = { ...this.integration.printify, ...integration.printify };
        }
      }

      // SEO
      if (data.seo) {
        this.seo = { ...this.seo, ...data.seo };
      }
    },
    
    /**
     * Fetch all public configuration information
     * No authentication required
     */
    async fetchConfig() {
      if (this.loading.config) return;
      
      this.loading.config = true;
      this.error.config = null;
      
      try {
        const { data } = await axios.get('/api/config');
        this.setConfig(data);
        return data;
      } catch (error) {
        this.error.config = error.response?.data?.message || 'Error fetching configuration';
        console.error('Error fetching configuration:', error);
        throw error;
      } finally {
        this.loading.config = false;
      }
    },

    /**
     * Fetch all configuration information including sensitive data (admin only)
     * Requires authentication with appropriate permissions
     */
    async fetchAdminConfig() {
      if (this.loading.adminConfig) return;
      
      this.loading.adminConfig = true;
      this.error.adminConfig = null;
      
      try {
        const { data } = await axios.get('/api/admin/config', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.setConfig(data);
        return data;
      } catch (error) {
        this.error.adminConfig = error.response?.data?.message || 'Error fetching admin configuration';
        console.error('Error fetching admin configuration:', error);
        throw error;
      } finally {
        this.loading.adminConfig = false;
      }
    },

    /**
     * Update configuration information (admin only)
     * Requires authentication with appropriate permissions
     * @param {Object} configData - Updated configuration
     */
    async updateConfig(configData) {
      if (this.loading.updateConfig) return;
      
      this.loading.updateConfig = true;
      this.error.updateConfig = null;
      
      try {
        const { data } = await axios.put('/api/admin/config', configData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.setConfig(data);
        return data;
      } catch (error) {
        this.error.updateConfig = error.response?.data?.message || 'Error updating configuration';
        console.error('Error updating configuration:', error);
        throw error;
      } finally {
        this.loading.updateConfig = false;
      }
    },

    /**
     * Exports the current configuration for backup or migration purposes
     * @returns {Object} The current configuration state
     */
    exportConfig() {
      return {
        application: this.application,
        company: this.company,
        brand: this.brand,
        social: this.social,
        contact: this.contact,
        features: this.features,
        integration: this.integration,
        seo: this.seo
      };
    }
  }
});
