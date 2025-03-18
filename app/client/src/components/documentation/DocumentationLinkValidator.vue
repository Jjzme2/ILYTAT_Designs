<template>
  <div class="documentation-link-validator">
    <div v-if="isValidating" class="validation-loading">
      <div class="spinner"></div>
      <span>Validating documentation links...</span>
    </div>
    
    <div v-else-if="validationResults" :class="['validation-summary', `link-validation-${validationResults.status}`]">
      <div class="validation-header">
        <h4>Link Validation</h4>
        <span class="validation-stats">
          {{ validationResults.validLinks }}/{{ validationResults.totalLinks }} links valid
        </span>
      </div>
      
      <p class="validation-message">{{ validationResults.statusMessage }}</p>
      
      <div v-if="expanded || validationResults.invalidLinks > 0" class="validation-details">
        <div class="validation-controls">
          <button @click="expanded = !expanded" class="toggle-details-btn">
            {{ expanded ? 'Hide Details' : 'Show Details' }}
          </button>
          <button v-if="canRevalidate" @click="validateLinks" class="revalidate-btn">
            Revalidate
          </button>
        </div>
        
        <div v-if="expanded" class="validation-links">
          <div v-if="validationResults.links.invalid && validationResults.links.invalid.length > 0" class="invalid-links">
            <h5>Invalid Links ({{ validationResults.links.invalid.length }})</h5>
            <ul>
              <li v-for="(link, index) in validationResults.links.invalid" :key="`invalid-${index}`" class="invalid-link-item">
                <div class="link-text">{{ link.text }}</div>
                <div class="link-url">{{ link.url }}</div>
                <div class="link-error">{{ link.message }}</div>
              </li>
            </ul>
          </div>
          
          <div v-if="validationResults.links.valid && validationResults.links.valid.length > 0" class="valid-links">
            <h5>Valid Links ({{ validationResults.links.valid.length }})</h5>
            <ul>
              <li v-for="(link, index) in validationResults.links.valid" :key="`valid-${index}`" class="valid-link-item">
                <div class="link-text">{{ link.text }}</div>
                <div class="link-url">{{ link.url }}</div>
                <div class="link-type">{{ link.type }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { validateDocumentationLinks, formatLinkValidation } from '@/utils/documentationLinkValidator';

export default {
  name: 'DocumentationLinkValidator',
  
  props: {
    /**
     * Path to the documentation file to validate
     */
    documentPath: {
      type: String,
      required: true
    },
    
    /**
     * Whether to validate automatically when the component is mounted
     */
    autoValidate: {
      type: Boolean,
      default: true
    },
    
    /**
     * Whether to automatically expand details when there are invalid links
     */
    autoExpandOnInvalid: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      validationResults: null,
      isValidating: false,
      expanded: false,
      error: null,
      canRevalidate: true
    };
  },
  
  computed: {
    /**
     * Whether there are any invalid links
     */
    hasInvalidLinks() {
      return this.validationResults && 
             this.validationResults.invalidLinks > 0;
    }
  },
  
  mounted() {
    if (this.autoValidate) {
      this.validateLinks();
    }
  },
  
  watch: {
    /**
     * Watch for changes to documentPath and revalidate if necessary
     */
    documentPath() {
      if (this.autoValidate) {
        this.validateLinks();
      }
    }
  },
  
  methods: {
    /**
     * Validate links in the documentation file
     */
    async validateLinks() {
      if (!this.documentPath || this.isValidating) {
        return;
      }
      
      this.isValidating = true;
      this.error = null;
      this.canRevalidate = false;
      
      try {
        const results = await validateDocumentationLinks(this.documentPath);
        
        this.validationResults = formatLinkValidation(results);
        
        // Auto-expand details if there are invalid links and autoExpandOnInvalid is true
        if (this.autoExpandOnInvalid && this.hasInvalidLinks) {
          this.expanded = true;
        }
        
        // Emit validation complete event
        this.$emit('validation-complete', this.validationResults);
      } catch (err) {
        this.error = err.message || 'Error validating documentation links';
        this.$emit('validation-error', this.error);
      } finally {
        this.isValidating = false;
        
        // Allow revalidation after a short delay
        setTimeout(() => {
          this.canRevalidate = true;
        }, 2000);
      }
    },
    
    /**
     * Force expanded state
     * @param {boolean} state - Expanded state
     */
    setExpanded(state) {
      this.expanded = !!state;
    }
  }
};
</script>

<style>
.documentation-link-validator {
  margin: 1.5rem 0;
  font-family: var(--font-family-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
}

.validation-loading {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #666;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.validation-summary {
  padding: 1.25rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.validation-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.validation-stats {
  font-size: 0.875rem;
  font-weight: 500;
}

.validation-message {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.link-validation-success {
  background-color: #e8f5e9;
  border: 1px solid #388e3c;
  color: #2e7d32;
}

.link-validation-warning {
  background-color: #fff8e1;
  border: 1px solid #ffa000;
  color: #ff8f00;
}

.link-validation-error {
  background-color: #ffebee;
  border: 1px solid #d32f2f;
  color: #c62828;
}

.validation-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.toggle-details-btn,
.revalidate-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.toggle-details-btn:hover,
.revalidate-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.validation-links {
  margin-top: 1rem;
}

.invalid-links,
.valid-links {
  margin-bottom: 1.5rem;
}

.invalid-links h5,
.valid-links h5 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.invalid-links ul,
.valid-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.invalid-link-item,
.valid-link-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: rgba(0, 0, 0, 0.025);
  border-radius: 0.25rem;
}

.link-text {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.link-url {
  font-family: monospace;
  word-break: break-all;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.link-error {
  color: #d32f2f;
  font-size: 0.875rem;
  font-style: italic;
}

.link-type {
  font-size: 0.875rem;
  color: #546e7a;
}
</style>
