import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

// Auth Views
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('@/views/auth/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@/views/auth/ResetPasswordView.vue')

// Main Views
const DashboardView = () => import('@/views/DashboardView.vue')
const ProductsView = () => import('@/views/printify/ProductsView.vue')
const OrdersView = () => import('@/views/printify/OrdersView.vue')
const ProfileView = () => import('@/views/profile/ProfileView.vue')

// Documentation Views
const DocumentationListView = () => import('@/views/documentation/ListView.vue')
const DocumentationDetailView = () => import('@/views/documentation/DetailView.vue')

// System Views
const SystemHealthView = () => import('@/views/system/HealthView.vue')
const SystemLogsView = () => import('@/views/system/LogsView.vue')

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'products',
        name: 'products',
        component: ProductsView,
        meta: { title: 'Products' }
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
        meta: { title: 'Orders' }
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
        meta: { title: 'Profile' }
      },
      // Documentation routes
      {
        path: 'documentation',
        name: 'documentation',
        component: DocumentationListView,
        meta: { 
          title: 'Documentation',
          roles: ['admin', 'developer', 'support']
        }
      },
      {
        path: 'documentation/:id',
        name: 'documentation-detail',
        component: DocumentationDetailView,
        meta: { 
          title: 'Documentation Details',
          roles: ['admin', 'developer', 'support']
        }
      },
      // System routes (developer only)
      {
        path: 'system',
        meta: { roles: ['developer', 'admin'] },
        children: [
          {
            path: 'health',
            name: 'system-health',
            component: SystemHealthView,
            meta: { 
              title: 'System Health',
              roles: ['developer', 'admin']
            }
          },
          {
            path: 'logs',
            name: 'system-logs',
            component: SystemLogsView,
            meta: { 
              title: 'System Logs',
              roles: ['developer', 'admin']
            }
          }
        ]
      }
    ]
  },
  {
    path: '/auth',
    component: AuthLayout,
    meta: { requiresGuest: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: LoginView,
        meta: { title: 'Login' }
      },
      {
        path: 'register',
        name: 'register',
        component: RegisterView,
        meta: { title: 'Register' }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: ForgotPasswordView,
        meta: { title: 'Forgot Password' }
      },
      {
        path: 'reset-password/:token',
        name: 'reset-password',
        component: ResetPasswordView,
        meta: { title: 'Reset Password' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication and role-based access
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRoles = to.matched.reduce((roles, record) => {
    if (record.meta.roles) {
      roles.push(...record.meta.roles)
    }
    return roles
  }, [])

  // Handle authentication
  if (requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Handle role-based access
  if (requiredRoles.length > 0 && !requiredRoles.some(role => auth.hasRole(role))) {
    next({ name: 'dashboard' })
    return
  }

  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} | ILYTAT Designs`
  }

  next()
})

export default router
