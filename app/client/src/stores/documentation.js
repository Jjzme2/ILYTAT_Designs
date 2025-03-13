import { defineStore } from 'pinia'
import axios from '@/utils/axios'

export const useDocumentationStore = defineStore('documentation', {
  state: () => ({
    documents: [],
    currentDocument: null,
    developerDocs: [],
    userDocs: [],
    adminDocs: [],
    categoryDocs: {},
    roleDocs: {},
    markdownFiles: [],
    currentMarkdownContent: null,
    loading: {
      list: false,
      single: false,
      developer: false,
      user: false,
      admin: false,
      category: false,
      role: false,
      markdownFiles: false,
      markdownContent: false,
      save: false
    },
    error: {
      list: null,
      single: null,
      developer: null,
      user: null,
      admin: null,
      category: null,
      role: null,
      markdownFiles: null,
      markdownContent: null,
      save: null
    },
    filters: {
      search: '',
      category: null,
      status: null
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  }),

  getters: {
    filteredDocuments: (state) => {
      let docs = [...state.documents]
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        docs = docs.filter(doc => 
          doc.title.toLowerCase().includes(search) ||
          doc.description.toLowerCase().includes(search)
        )
      }
      
      if (state.filters.category) {
        docs = docs.filter(doc => doc.category === state.filters.category)
      }
      
      if (state.filters.status) {
        docs = docs.filter(doc => doc.status === state.filters.status)
      }
      
      return docs
    },

    paginatedDocuments: (state) => {
      const start = (state.pagination.page - 1) * state.pagination.limit
      const end = start + state.pagination.limit
      return state.filteredDocuments.slice(start, end)
    },

    totalPages: (state) => {
      return Math.ceil(state.filteredDocuments.length / state.pagination.limit)
    }
  },

  actions: {
    async fetchDocuments() {
      if (this.loading.list) return
      
      this.loading.list = true
      this.error.list = null
      
      try {
        const { data } = await axios.get('/api/documentations', {
          params: {
            page: this.pagination.page,
            limit: this.pagination.limit,
            ...this.filters
          }
        })
        
        this.documents = data.data || []
        this.pagination.total = data.total || 0
        return this.documents
      } catch (error) {
        this.error.list = error.response?.data?.message || 'Failed to fetch documents'
        console.error('Error fetching documents:', error)
        throw error
      } finally {
        this.loading.list = false
      }
    },

    async fetchDocument(id) {
      if (this.loading.single) return
      
      this.loading.single = true
      this.error.single = null
      
      try {
        const { data } = await axios.get(`/api/documentations/${id}`)
        this.currentDocument = data.data
        return data.data
      } catch (error) {
        this.error.single = error.response?.data?.message || 'Failed to fetch document'
        console.error(`Error fetching document ${id}:`, error)
        throw error
      } finally {
        this.loading.single = false
      }
    },

    /**
     * Fetch role-specific documentation
     * @param {string} roleId - Role ID to fetch documentation for
     */
    async fetchDocumentsByRole(roleId) {
      if (this.loading.role) return
      
      this.loading.role = true
      this.error.role = null
      
      try {
        const { data } = await axios.get(`/api/documentations/role/${roleId}`)
        this.roleDocs = {
          ...this.roleDocs,
          [roleId]: data.data || []
        }
        return this.roleDocs[roleId]
      } catch (error) {
        this.error.role = error.response?.data?.message || `Failed to fetch documents for role ${roleId}`
        console.error(`Error fetching documents for role ${roleId}:`, error)
        throw error
      } finally {
        this.loading.role = false
      }
    },

    /**
     * Fetch documentation by category
     * @param {string} category - Category to fetch documentation for
     */
    async fetchDocumentsByCategory(category) {
      if (this.loading.category) return
      
      this.loading.category = true
      this.error.category = null
      
      try {
        const { data } = await axios.get(`/api/documentations/category/${category}`)
        this.categoryDocs = {
          ...this.categoryDocs,
          [category]: data.data || []
        }
        return this.categoryDocs[category]
      } catch (error) {
        this.error.category = error.response?.data?.message || `Failed to fetch documents for category ${category}`
        console.error(`Error fetching documents for category ${category}:`, error)
        throw error
      } finally {
        this.loading.category = false
      }
    },

    /**
     * Fetch developer documentation
     */
    async fetchDeveloperDocs() {
      if (this.loading.developer) return
      
      this.loading.developer = true
      this.error.developer = null
      
      try {
        const { data } = await axios.get('/api/documentations/developer')
        this.developerDocs = data.data || []
        return this.developerDocs
      } catch (error) {
        this.error.developer = error.response?.data?.message || 'Failed to fetch developer documentation'
        console.error('Error fetching developer documentation:', error)
        throw error
      } finally {
        this.loading.developer = false
      }
    },

    /**
     * Fetch user documentation
     */
    async fetchUserDocs() {
      if (this.loading.user) return
      
      this.loading.user = true
      this.error.user = null
      
      try {
        const { data } = await axios.get('/api/documentations/user')
        this.userDocs = data.data || []
        return this.userDocs
      } catch (error) {
        this.error.user = error.response?.data?.message || 'Failed to fetch user documentation'
        console.error('Error fetching user documentation:', error)
        throw error
      } finally {
        this.loading.user = false
      }
    },

    /**
     * Fetch admin documentation
     */
    async fetchAdminDocs() {
      if (this.loading.admin) return
      
      this.loading.admin = true
      this.error.admin = null
      
      try {
        const { data } = await axios.get('/api/documentations/admin')
        this.adminDocs = data.data || []
        return this.adminDocs
      } catch (error) {
        this.error.admin = error.response?.data?.message || 'Failed to fetch admin documentation'
        console.error('Error fetching admin documentation:', error)
        throw error
      } finally {
        this.loading.admin = false
      }
    },

    /**
     * Get all markdown files available in the codebase
     */
    async fetchMarkdownFiles() {
      if (this.loading.markdownFiles) return
      
      this.loading.markdownFiles = true
      this.error.markdownFiles = null
      
      try {
        const { data } = await axios.get('/api/documentations/files')
        this.markdownFiles = data.data || []
        return this.markdownFiles
      } catch (error) {
        this.error.markdownFiles = error.response?.data?.message || 'Failed to fetch markdown files'
        console.error('Error fetching markdown files:', error)
        throw error
      } finally {
        this.loading.markdownFiles = false
      }
    },

    /**
     * Get content of a specific markdown file
     * @param {string} filePath - Path to the markdown file
     */
    async fetchMarkdownFileContent(filePath) {
      if (this.loading.markdownContent) return
      
      this.loading.markdownContent = true
      this.error.markdownContent = null
      
      try {
        const { data } = await axios.get(`/api/documentations/files/${filePath}`)
        this.currentMarkdownContent = {
          filePath,
          content: data.data
        }
        return this.currentMarkdownContent
      } catch (error) {
        this.error.markdownContent = error.response?.data?.message || `Failed to fetch content for ${filePath}`
        console.error(`Error fetching content for ${filePath}:`, error)
        throw error
      } finally {
        this.loading.markdownContent = false
      }
    },

    /**
     * Save content to a markdown file
     * @param {string} filePath - Path to the markdown file
     * @param {string} content - Content to save
     */
    async saveMarkdownFile(filePath, content) {
      if (this.loading.save) return
      
      this.loading.save = true
      this.error.save = null
      
      try {
        const { data } = await axios.post(`/api/documentations/files/${filePath}/save`, { content })
        
        // Update current content if this is the file we're viewing
        if (this.currentMarkdownContent && this.currentMarkdownContent.filePath === filePath) {
          this.currentMarkdownContent.content = content
        }
        
        return data
      } catch (error) {
        this.error.save = error.response?.data?.message || `Failed to save content for ${filePath}`
        console.error(`Error saving content for ${filePath}:`, error)
        throw error
      } finally {
        this.loading.save = false
      }
    },

    async createDocument(documentData) {
      try {
        const { data } = await axios.post('/api/documentations', documentData)
        this.documents.unshift(data.data)
        return data.data
      } catch (error) {
        console.error('Error creating document:', error)
        throw error.response?.data?.message || 'Failed to create document'
      }
    },

    async updateDocument(id, documentData) {
      try {
        const { data } = await axios.put(`/api/documentations/${id}`, documentData)
        
        // Update in list
        const index = this.documents.findIndex(doc => doc.id === id)
        if (index !== -1) {
          this.documents[index] = data.data
        }
        
        // Update current document if it's the same
        if (this.currentDocument?.id === id) {
          this.currentDocument = data.data
        }
        
        return data.data
      } catch (error) {
        console.error(`Error updating document ${id}:`, error)
        throw error.response?.data?.message || 'Failed to update document'
      }
    },

    async deleteDocument(id) {
      try {
        await axios.delete(`/api/documentations/${id}`)
        
        // Remove from list
        this.documents = this.documents.filter(doc => doc.id !== id)
        
        // Clear current document if it's the same
        if (this.currentDocument?.id === id) {
          this.currentDocument = null
        }
      } catch (error) {
        console.error(`Error deleting document ${id}:`, error)
        throw error.response?.data?.message || 'Failed to delete document'
      }
    },

    // Filter and pagination actions
    setFilter(filter, value) {
      this.filters[filter] = value
      this.pagination.page = 1  // Reset to first page when filtering
    },

    setPage(page) {
      this.pagination.page = page
    },

    setLimit(limit) {
      this.pagination.limit = limit
      this.pagination.page = 1  // Reset to first page when changing limit
    },

    clearFilters() {
      this.filters = {
        search: '',
        category: null,
        status: null
      }
      this.pagination.page = 1
    }
  }
})
