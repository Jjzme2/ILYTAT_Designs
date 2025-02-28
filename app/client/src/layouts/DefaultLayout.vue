<template>
  <div class="layout layout--default">
    <nav class="navbar">
      <div class="navbar__brand">
        <router-link to="/" class="navbar__logo">
          ILYTAT Designs
        </router-link>
      </div>
      <div class="navbar__menu">
        <router-link to="/" class="navbar__link">Dashboard</router-link>
        <router-link to="/printify/shops" class="navbar__link">Shops</router-link>
        <router-link to="/documentation" class="navbar__link">Documentation</router-link>
      </div>
      <div class="navbar__actions">
        <button @click="uiStore.toggleTheme()" class="navbar__theme-toggle">
          {{ uiStore.isDarkMode ? '🌞' : '🌙' }}
        </button>
        <button @click="handleLogout" class="navbar__logout">
          Logout
        </button>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'DefaultLayout',
  setup() {
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const router = useRouter()

    const handleLogout = async () => {
      await authStore.logout()
      router.push('/auth/login')
    }

    return {
      uiStore,
      handleLogout
    }
  }
}
</script>

<style>
.layout--default {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  background: var(--color-background-alt);
  border-bottom: 1px solid var(--color-border);
}

.navbar__brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.navbar__logo {
  color: var(--color-primary);
  text-decoration: none;
}

.navbar__menu {
  display: flex;
  gap: var(--spacing-4);
}

.navbar__link {
  color: var(--color-text);
  text-decoration: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius);
  transition: background-color 0.2s;
}

.navbar__link:hover,
.navbar__link.router-link-active {
  background: var(--color-background-hover);
}

.navbar__actions {
  display: flex;
  gap: var(--spacing-2);
}

.navbar__theme-toggle,
.navbar__logout {
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius);
  background: var(--color-background-hover);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.2s;
}

.navbar__theme-toggle:hover,
.navbar__logout:hover {
  background: var(--color-background-active);
}

.main-content {
  flex: 1;
  padding: var(--spacing-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-4) var(--spacing-2);
  }

  .navbar__menu {
    flex-direction: column;
    width: 100%;
    text-align: center;
  }

  .navbar__actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
