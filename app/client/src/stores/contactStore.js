/**
 * Contact Store
 * Manages contact information state
 */
import { defineStore } from 'pinia';
import axios from '@/utils/axios';

export const useContactStore = defineStore('contact', {
  state: () => ({
    // Contact data
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
    getFormattedAddress: (state) => {
      const parts = [];
      
      if (state.companyAddressStreet) {
        parts.push(state.companyAddressStreet);
      }
      
      if (state.companyAddressUnit) {
        parts.push(state.companyAddressUnit);
      }
      
      const cityStateZip = [];
      if (state.companyAddressCity) {
        cityStateZip.push(state.companyAddressCity);
      }
      
      if (state.companyAddressState) {
        cityStateZip.push(state.companyAddressState);
      }
      
      if (state.companyAddressZip) {
        cityStateZip.push(state.companyAddressZip);
      }
      
      if (cityStateZip.length > 0) {
        parts.push(cityStateZip.join(', '));
      }
      
      if (state.companyAddressCountry) {
        parts.push(state.companyAddressCountry);
      }
      
      return parts.join('\n');
    },
    
    /**
     * Get formatted phone number
     * @returns {string} Formatted phone number
     */
    getFormattedPhone: (state) => {
      if (!state.companyPhone) return '';
      
      // Format as (XXX) XXX-XXXX if it's a 10-digit number
      if (state.companyPhone.replace(/\D/g, '').length === 10) {
        const cleaned = state.companyPhone.replace(/\D/g, '');
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
      }
      
      return state.companyPhone;
    }
  },

  actions: {
    /**
     * Set contact info from response data
     * @param {Object} data - Contact data from API
     */
    setContactInfo(data) {
      // Company info
      if (data.contactDetails?.company) {
        const company = data.contactDetails.company;
        this.companyName = company.name;
        this.companyWebsite = company.website;
        this.companySupportEmail = company.supportEmail;
        this.companyCommonEmail = company.commonEmail;
        this.companyPhone = company.phone;
        this.companyTagline = company.tagline;
        
        // Address
        if (company.address) {
          this.companyAddressStreet = company.address.street;
          this.companyAddressUnit = company.address.unit;
          this.companyAddressCity = company.address.city;
          this.companyAddressState = company.address.state;
          this.companyAddressZip = company.address.zip;
          this.companyAddressCountry = company.address.country;
        }
      }
      
      // Social Media
      if (data.contactDetails?.socialMedia) {
        const social = data.contactDetails.socialMedia;
        this.socialsTikTok = social.tiktok;
        this.socialsFacebook = social.facebook;
      }
      
      // Additional Notes
      this.companyAdditionalNotes = data.contactDetails?.additionalNotes;
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
        const { data } = await axios.get('/api/contact');
        this.setContactInfo(data);
        return data;
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
        const { data } = await axios.get('/api/contact/company');
        
        // Set company data
        if (data) {
          this.companyName = data.name;
          this.companyWebsite = data.website;
          this.companySupportEmail = data.supportEmail;
          this.companyCommonEmail = data.commonEmail;
          this.companyPhone = data.phone;
          this.companyTagline = data.tagline;
          
          // Address
          if (data.address) {
            this.companyAddressStreet = data.address.street;
            this.companyAddressUnit = data.address.unit;
            this.companyAddressCity = data.address.city;
            this.companyAddressState = data.address.state;
            this.companyAddressZip = data.address.zip;
            this.companyAddressCountry = data.address.country;
          }
        }
        
        return data;
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
        const { data } = await axios.get('/api/contact/social');
        
        // Set social media data
        if (data) {
          this.socialsTikTok = data.tiktok;
          this.socialsFacebook = data.facebook;
        }
        
        return data;
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
        const { data } = await axios.get('/api/contact/admin');
        this.setContactInfo(data);
        return data;
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
        // Prepare the data to match the backend structure
        const updateData = {
          contactDetails: {
            company: {
              name: this.companyName,
              website: this.companyWebsite,
              supportEmail: this.companySupportEmail,
              commonEmail: this.companyCommonEmail,
              phone: this.companyPhone,
              tagline: this.companyTagline,
              address: {
                street: this.companyAddressStreet,
                unit: this.companyAddressUnit,
                city: this.companyAddressCity,
                state: this.companyAddressState,
                zip: this.companyAddressZip,
                country: this.companyAddressCountry
              }
            },
            socialMedia: {
              tiktok: this.socialsTikTok,
              facebook: this.socialsFacebook
            },
            additionalNotes: this.companyAdditionalNotes
          }
        };
        
        // Merge with any provided updates
        const mergedData = contactData ? { ...updateData, ...contactData } : updateData;
        
        const { data } = await axios.put('/api/contact/update', mergedData);
        
        // Refresh contact data
        await this.fetchContactInfo();
        
        return data;
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
