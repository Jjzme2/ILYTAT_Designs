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
      if (!data) return;
      
      // Update application info
      if (data.application) {
        this.application = {
          ...this.application,
          ...data.application
        };
      }
      
      // Update company info
      if (data.company) {
        this.company = {
          ...this.company,
          ...data.company,
          address: {
            ...this.company.address,
            ...(data.company.address || {})
          }
        };
      }
      
      // Update brand info
      if (data.brand) {
        this.brand = {
          ...this.brand,
          colors: {
            ...this.brand.colors,
            ...(data.brand.colors || {})
          },
          fonts: {
            ...this.brand.fonts,
            ...(data.brand.fonts || {})
          },
          logo: {
            ...this.brand.logo,
            ...(data.brand.logo || {})
          }
        };
      }
      
      // Update social media links
      if (data.social) {
        this.social = {
          ...this.social,
          ...data.social
        };
      }
      
      // Update contact settings
      if (data.contact) {
        this.contact = {
          ...this.contact,
          ...data.contact
        };
      }
      
      // Update feature flags and settings
      if (data.features) {
        this.features = {
          ...this.features,
          ...data.features,
          shop: {
            ...this.features.shop,
            ...(data.features.shop || {})
          },
          cart: {
            ...this.features.cart,
            ...(data.features.cart || {})
          },
          authentication: {
            ...this.features.authentication,
            ...(data.features.authentication || {})
          }
        };
      }
      
      // Update integration settings
      if (data.integration) {
        this.integration = {
          ...this.integration,
          ...data.integration,
          printify: {
            ...this.integration.printify,
            ...(data.integration.printify || {})
          }
        };
      }
      
      // Update SEO configuration
      if (data.seo) {
        this.seo = {
          ...this.seo,
          ...data.seo
        };
        
        // Update document title if available
        if (this.seo.defaultTitle) {
          document.title = this.seo.defaultTitle;
        }
        
        // Update meta description if available
        this.updateMetaTags();
      }
      
      return data;
    },

    /**
     * Update meta tags based on SEO configuration
     * This helps with search engine optimization
     */
    updateMetaTags() {
      // Update description meta tag
      let descriptionMeta = document.querySelector('meta[name="description"]');
      if (!descriptionMeta && this.seo.defaultDescription) {
        descriptionMeta = document.createElement('meta');
        descriptionMeta.setAttribute('name', 'description');
        document.head.appendChild(descriptionMeta);
      }
      
      if (descriptionMeta && this.seo.defaultDescription) {
        descriptionMeta.setAttribute('content', this.seo.defaultDescription);
      }
      
      // Update keywords meta tag
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta && this.seo.defaultKeywords) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      
      if (keywordsMeta && this.seo.defaultKeywords) {
        keywordsMeta.setAttribute('content', this.seo.defaultKeywords);
      }
      
      // Add Open Graph meta tags
      this.updateOpenGraphTags();
    },
    
    /**
     * Update Open Graph meta tags for better social media sharing
     */
    updateOpenGraphTags() {
      const ogTags = {
        'og:title': this.seo.defaultTitle,
        'og:description': this.seo.defaultDescription,
        'og:type': 'website',
        'og:url': window.location.href,
        'og:image': this.brand.logo?.main ? window.location.origin + this.brand.logo.main : null
      };
      
      Object.entries(ogTags).forEach(([property, content]) => {
        if (!content) return;
        
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', property);
          document.head.appendChild(metaTag);
        }
        
        metaTag.setAttribute('content', content);
      });
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
