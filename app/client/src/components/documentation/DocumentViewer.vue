<template>
  <div class="documentation-viewer">
    <div v-if="loading" class="loader-container">
      <div class="loader"></div>
      <p>Loading documentation...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h3>Error Loading Documentation</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="btn btn-primary">Try Again</button>
    </div>

    <div v-else class="documentation-content">
      <div class="documentation-header">
        <h1>{{ document.title || document.name }}</h1>
        <div class="documentation-meta">
          <span class="meta-item">
            <i class="fas fa-file"></i> {{ document.relativePath }}
          </span>
          <span class="meta-item">
            <i class="fas fa-clock"></i> Last modified: {{ formatDate(document.modifiedAt) }}
          </span>
        </div>
      </div>

      <div v-if="fileSelector" class="documentation-file-selector">
        <label for="file-select">Select Documentation:</label>
        <select 
          id="file-select" 
          v-model="selectedFile" 
          @change="loadSelectedFile"
          class="form-control"
        >
          <option value="">-- Select a document --</option>
          <optgroup 
            v-for="(group, key) in groupedFiles" 
            :key="key" 
            :label="key"
          >
            <option 
              v-for="file in group" 
              :key="file.relativePath" 
              :value="file.relativePath"
            >
              {{ file.name }}
            </option>
          </optgroup>
        </select>
      </div>

      <div v-if="document.renderedContent" class="markdown-content">
        <vue-markdown-render :source="document.content"></vue-markdown-render>
      </div>
      <div v-else class="no-content">
        <p>No content available.</p>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdownRender from 'vue-markdown-render';
import { fetchDocumentFiles, fetchDocumentContent } from '@/services/documentationService';

export default {
  name: 'DocumentViewer',
  components: {
    VueMarkdownRender
  },
  props: {
    /**
     * Path of specific document to load
     */
    documentPath: {
      type: String,
      default: null
    },
    /**
     * Whether to show the file selector
     */
    fileSelector: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      document: {},
      documentFiles: [],
      selectedFile: '',
      loading: false,
      error: null
    };
  },
  computed: {
    /**
     * Group files by directory for better organization in the selector
     */
    groupedFiles() {
      const groups = {};
      
      this.documentFiles.forEach(file => {
        const dir = file.directory || 'Root';
        if (!groups[dir]) {
          groups[dir] = [];
        }
        groups[dir].push(file);
      });
      
      return groups;
    }
  },
  watch: {
    /**
     * Watch for changes to the documentPath prop
     */
    documentPath(newPath) {
      if (newPath) {
        this.loadDocument(newPath);
      }
    }
  },
  async created() {
    if (this.fileSelector) {
      await this.loadDocumentFiles();
    }
    
    if (this.documentPath) {
      await this.loadDocument(this.documentPath);
    }
  },
  methods: {
    /**
     * Format date for display
     */
    formatDate(date) {
      if (!date) return 'Unknown';
      
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    },
    
    /**
     * Load the list of available documentation files
     */
    async loadDocumentFiles() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetchDocumentFiles();
        this.documentFiles = response.data;
      } catch (err) {
        this.error = err.message || 'Failed to load documentation files';
        console.error('Error loading documentation files:', err);
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Load document content by path
     */
    async loadDocument(path) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetchDocumentContent(path);
        this.document = response.data;
        this.selectedFile = path;
        
        // Emit event when document is loaded
        this.$emit('document-loaded', this.document);
      } catch (err) {
        this.error = err.message || 'Failed to load documentation';
        console.error('Error loading documentation:', err);
        
        // Emit error event
        this.$emit('document-error', err);
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Load the selected document from the dropdown
     */
    loadSelectedFile() {
      if (this.selectedFile) {
        this.loadDocument(this.selectedFile);
      }
    },
    
    /**
     * Retry loading after an error
     */
    retry() {
      if (this.documentPath) {
        this.loadDocument(this.documentPath);
      } else if (this.selectedFile) {
        this.loadDocument(this.selectedFile);
      } else if (this.fileSelector) {
        this.loadDocumentFiles();
      }
    }
  }
};
</script>
