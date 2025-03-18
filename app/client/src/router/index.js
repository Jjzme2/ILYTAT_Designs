import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const PublicLayout = () => import('@/layouts/PublicLayout.vue')

// Auth Views
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('@/views/auth/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@/views/auth/ResetPasswordView.vue')

// Main Views
const DashboardView = () => import('@/views/DashboardView.vue')
const ProductsView = () => import('@/views/printify/ProductsView.vue')
const UpcomingProductsView = () => import('@/views/printify/UpcomingProductsView.vue')
const OrdersView = () => import('@/views/printify/OrdersView.vue')
const ProfileView = () => import('@/views/profile/ProfileView.vue')

// Public Views
const HomeView = () => import('@/views/HomeView.vue')
const PublicProductsView = () => import('@/views/ProductsView.vue')
const ProductDetailView = () => import('@/views/ProductDetailView.vue')

// Cart & Checkout Views
const CartView = () => import('@/views/cart/CartView.vue')
const CheckoutSuccessView = () => import('@/views/checkout/SuccessView.vue')
const CheckoutCancelView = () => import('@/views/checkout/CancelView.vue')
const OrderConfirmationView = () => import('@/views/order/ConfirmationView.vue')
const OrderHistoryView = () => import('@/views/order/OrderHistoryView.vue')

// Documentation Views
const DocumentationListView = () => import('@/views/documentation/ListView.vue')
const DocumentationDetailView = () => import('@/views/documentation/DetailView.vue')
const DocumentationBrowserView = () => import('@/views/DocumentationBrowserView.vue')

// System Views
const SystemHealthView = () => import('@/views/system/HealthView.vue')
const SystemLogsView = () => import('@/views/system/LogsView.vue')

const routes = [
  {
    path: '/',
    component: PublicLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: { title: 'Home' }
      },
      {
        path: 'shop',
        name: 'shop',
        component: PublicProductsView,
        meta: { title: 'Shop' }
      },
      {
        path: 'product/:id',
        name: 'product-detail',
        component: ProductDetailView,
        meta: { title: 'Product Details' }
      },
      {
        path: 'cart',
        name: 'cart',
        component: CartView,
        meta: { title: 'Shopping Cart' }
      },
      {
        path: 'checkout/success',
        name: 'checkout-success',
        component: CheckoutSuccessView,
        meta: { title: 'Payment Successful' }
      },
      {
        path: 'checkout/cancel',
        name: 'checkout-cancel',
        component: CheckoutCancelView,
        meta: { title: 'Payment Cancelled' }
      },
    ]
  },
  {
    path: '/dashboard',
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
        name: 'admin-products',
        component: ProductsView,
        meta: { title: 'Products Management' }
      },
      {
        path: 'upcoming-products',
        name: 'upcoming-products',
        component: UpcomingProductsView,
        meta: { 
          title: 'Upcoming Products',
          requiresAuth: true 
        }
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
      // Order management routes
      {
        path: 'order/confirmation',
        name: 'order-confirmation',
        component: OrderConfirmationView,
        meta: { title: 'Order Confirmation' }
      },
      {
        path: 'order/history',
        name: 'order-history',
        component: OrderHistoryView,
        meta: { 
          title: 'Order History',
          requiresAuth: true
        }
      },
      {
        path: 'order/tracking',
        redirect: { name: 'orders' }
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
      {
        path: 'documentation/browser',
        name: 'documentation-browser',
        component: DocumentationBrowserView,
        meta: { 
          title: 'Documentation Browser',
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
        path: 'reset-password',
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
