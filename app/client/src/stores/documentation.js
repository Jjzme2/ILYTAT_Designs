import { defineStore } from 'pinia'
import axios from '@/utils/axios'

export const useDocumentationStore = defineStore('documentation', {
  state: () => ({
    documents: [],
    currentDocument: null,
    loading: {
      list: false,
      single: false
    },
    error: {
      list: null,
      single: null
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
        const { data } = await axios.get('/api/documents', {
          params: {
            page: this.pagination.page,
            limit: this.pagination.limit,
            ...this.filters
          }
        })
        
        this.documents = data.data
        this.pagination.total = data.total
      } catch (error) {
        this.error.list = error.response?.data?.message || 'Failed to fetch documents'
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
        const { data } = await axios.get(`/api/documents/${id}`)
        this.currentDocument = data.data
        return data.data
      } catch (error) {
        this.error.single = error.response?.data?.message || 'Failed to fetch document'
        throw error
      } finally {
        this.loading.single = false
      }
    },

    async createDocument(documentData) {
      try {
        const { data } = await axios.post('/api/documents', documentData)
        this.documents.unshift(data.data)
        return data.data
      } catch (error) {
        throw error.response?.data?.message || 'Failed to create document'
      }
    },

    async updateDocument(id, documentData) {
      try {
        const { data } = await axios.put(`/api/documents/${id}`, documentData)
        
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
        throw error.response?.data?.message || 'Failed to update document'
      }
    },

    async deleteDocument(id) {
      try {
        await axios.delete(`/api/documents/${id}`)
        
        // Remove from list
        this.documents = this.documents.filter(doc => doc.id !== id)
        
        // Clear current document if it's the same
        if (this.currentDocument?.id === id) {
          this.currentDocument = null
        }
      } catch (error) {
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
