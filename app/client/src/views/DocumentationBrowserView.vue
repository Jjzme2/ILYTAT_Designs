<template>
  <div class="documentation-browser">
    <h1 class="page-title">Documentation Browser</h1>
    
    <div class="browser-container">
      <!-- Sidebar with file tree -->
      <div class="browser-sidebar">
        <div class="sidebar-header">
          <h3>Documentation Files</h3>
          <button class="refresh-btn" @click="loadFiles">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        
        <div v-if="loading" class="sidebar-loading">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
        
        <div v-else-if="error" class="sidebar-error">
          <p>{{ error }}</p>
          <button @click="loadFiles" class="btn btn-sm btn-primary">Retry</button>
        </div>
        
        <div v-else-if="!hasFiles" class="sidebar-empty">
          <p>No documentation files found.</p>
        </div>
        
        <div v-else class="file-tree">
          <div v-for="(group, directory) in groupedFiles" :key="directory" class="directory-group">
            <div 
              class="directory-header" 
              @click="toggleDirectory(directory)"
              :class="{ 'collapsed': collapsedDirectories[directory] }"
            >
              <i class="fas" :class="collapsedDirectories[directory] ? 'fa-folder' : 'fa-folder-open'"></i>
              <span>{{ formatDirectoryName(directory) }}</span>
              <span class="file-count">({{ group.length }})</span>
            </div>
            
            <ul v-if="!collapsedDirectories[directory]" class="file-list">
              <li 
                v-for="file in group" 
                :key="file.relativePath" 
                @click="selectFile(file)"
                :class="{ 'active': selectedFilePath === file.relativePath }"
              >
                <i class="fas fa-file-alt"></i>
                <span>{{ file.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Main content area -->
      <div class="browser-content">
        <document-viewer 
          :documentPath="selectedFilePath"
          @document-loaded="onDocumentLoaded"
          @document-error="onDocumentError"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DocumentViewer from '@/components/documentation/DocumentViewer.vue';
import { fetchDocumentFiles } from '@/services/documentationService';

export default {
  name: 'DocumentationBrowserView',
  components: {
    DocumentViewer
  },
  data() {
    return {
      files: [],
      selectedFilePath: null,
      currentDocument: null,
      loading: true,
      error: null,
      collapsedDirectories: {}
    };
  },
  computed: {
    /**
     * Check if there are any files
     */
    hasFiles() {
      return this.files.length > 0;
    },
    
    /**
     * Group files by directory for the file tree
     */
    groupedFiles() {
      const groups = {};
      
      this.files.forEach(file => {
        // Use the directory name or 'Root' if at the top level
        const dirName = file.directory || 'Root';
        
        if (!groups[dirName]) {
          groups[dirName] = [];
        }
        
        groups[dirName].push(file);
      });
      
      // Sort each group alphabetically by name
      Object.keys(groups).forEach(dir => {
        groups[dir].sort((a, b) => a.name.localeCompare(b.name));
      });
      
      return groups;
    }
  },
  created() {
    this.loadFiles();
    
    // Check if a file path is specified in the route
    if (this.$route.query.path) {
      this.selectedFilePath = decodeURIComponent(this.$route.query.path);
    }
  },
  methods: {
    /**
     * Load all documentation files
     */
    async loadFiles() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetchDocumentFiles();
        this.files = response.data;
        
        // Initialize collapsed state for directories
        const directories = [...new Set(this.files.map(file => file.directory || 'Root'))];
        directories.forEach(dir => {
          if (this.collapsedDirectories[dir] === undefined) {
            this.collapsedDirectories[dir] = false;
          }
        });
        
        // If we have a path in the URL but haven't selected a file yet, select it
        if (this.$route.query.path && !this.currentDocument) {
          this.selectedFilePath = decodeURIComponent(this.$route.query.path);
        }
        // Otherwise if no file is selected and we have files, select the first one
        else if (!this.selectedFilePath && this.files.length > 0) {
          this.selectFile(this.files[0]);
        }
      } catch (err) {
        this.error = err.message || 'Failed to load documentation files';
        console.error('Error loading documentation files:', err);
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Select a file to view
     */
    selectFile(file) {
      this.selectedFilePath = file.relativePath;
      
      // Update URL without reloading the page
      this.$router.replace({ 
        query: { ...this.$route.query, path: encodeURIComponent(file.relativePath) }
      });
    },
    
    /**
     * Toggle the collapsed state of a directory
     */
    toggleDirectory(directory) {
      this.$set(this.collapsedDirectories, directory, !this.collapsedDirectories[directory]);
    },
    
    /**
     * Format directory name for display
     */
    formatDirectoryName(directory) {
      if (directory === 'Root') return 'Root';
      
      // Convert path separators to '/' for display
      const normalizedDir = directory.replace(/\\/g, '/');
      
      // Get the last part of the path for display
      const parts = normalizedDir.split('/');
      const lastPart = parts[parts.length - 1];
      
      // If it's a deeply nested path, show an abbreviated version
      if (parts.length > 2) {
        return `.../${parts[parts.length - 2]}/${lastPart}`;
      }
      
      return lastPart;
    },
    
    /**
     * Handle document loaded event
     */
    onDocumentLoaded(document) {
      this.currentDocument = document;
      
      // Set page title
      document.title = document.title ? 
        `${document.title} - Documentation` : 
        'Documentation Browser';
    },
    
    /**
     * Handle document error event
     */
    onDocumentError(error) {
      console.error('Error loading document:', error);
    }
  }
};
</script>
