import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    sidebar: {
      isOpen: true,
      isMobile: false
    },
    theme: localStorage.getItem('theme') || 'light',
    toasts: [],
    modals: [],
    loading: {
      global: false,
      overlay: false
    }
  }),

  getters: {
    isDarkMode: (state) => state.theme === 'dark'
  },

  actions: {
    // Sidebar management
    toggleSidebar() {
      this.sidebar.isOpen = !this.sidebar.isOpen
    },

    setSidebarMobile(isMobile) {
      this.sidebar.isMobile = isMobile
      if (isMobile) {
        this.sidebar.isOpen = false
      }
    },

    // Theme management
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', this.theme)
      this.applyTheme()
    },

    applyTheme() {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(this.theme)
    },

    // Toast notifications
    showToast({ message, type = 'info', duration = 5000 }) {
      const id = Date.now()
      
      this.toasts.push({
        id,
        message,
        type,
        duration
      })

      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, duration)
      }

      return id
    },

    removeToast(id) {
      const index = this.toasts.findIndex(toast => toast.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },

    // Modal management
    openModal(name, props = {}) {
      const modalId = Date.now().toString()
      this.modals.push({
        id: modalId,
        name,
        props,
        isActive: true
      })
      return modalId
    },

    closeModal(modalId) {
      const index = this.modals.findIndex(modal => modal.id === modalId)
      if (index !== -1) {
        this.modals.splice(index, 1)
      }
    },

    // Loading states
    startLoading(overlay = false) {
      this.loading.global = true
      if (overlay) {
        this.loading.overlay = true
      }
    },

    stopLoading() {
      this.loading.global = false
      this.loading.overlay = false
    },

    // Utility methods for common notifications
    notifySuccess(message) {
      this.showToast({
        message,
        type: 'success',
        duration: 3000
      })
    },

    notifyError(message) {
      this.showToast({
        message,
        type: 'error',
        duration: 5000
      })
    },

    notifyWarning(message) {
      this.showToast({
        message,
        type: 'warning',
        duration: 4000
      })
    },

    notifyInfo(message) {
      this.showToast({
        message,
        type: 'info',
        duration: 3000
      })
    }
  }
})
