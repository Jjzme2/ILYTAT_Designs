/**
 * Tests for the ProductDetailView component
 * 
 * These tests focus on verifying the component's rendering,
 * user interactions, and state handling.
 */
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';
import ProductDetailView from '@/views/ProductDetailView.vue';
import { usePrintifyStore } from '@/stores/printify';

// Mock router since our component uses it
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/products', name: 'products' },
    { path: '/product/:id', name: 'product-detail' }
  ]
});

// Helper function to create a wrapper with various configurations
function createWrapper(options = {}) {
  const {
    initialState = {},
    storePlugins = [],
    routeParams = { id: 'test-product-123' }
  } = options;

  // Setup router with correct params
  router.push({ name: 'product-detail', params: routeParams });

  // Create wrapper with necessary plugins
  return mount(ProductDetailView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: jest.fn,
          initialState,
          stubActions: false,
          plugins: storePlugins
        }),
      ],
    }
  });
}

describe('ProductDetailView', () => {
  beforeEach(() => {
    // Reset route before each test
    router.push('/');
  });

  test('displays loading state initially', async () => {
    // Create wrapper with loading state
    const wrapper = createWrapper({
      initialState: {
        printify: {
          loading: { selectedProduct: true },
          selectedProduct: null,
          error: { selectedProduct: null }
        }
      }
    });

    // Verify loading UI is shown
    expect(wrapper.find('.loading-container').exists()).toBe(true);
    expect(wrapper.find('.spinner').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading product details');
  });

  test('displays error state when product fetch fails', async () => {
    // Create wrapper with error state
    const wrapper = createWrapper({
      initialState: {
        printify: {
          loading: { selectedProduct: false },
          selectedProduct: null,
          error: { selectedProduct: 'Failed to load product' }
        }
      }
    });

    // Verify error UI is shown
    expect(wrapper.find('.error-container').exists()).toBe(true);
    expect(wrapper.text()).toContain('Failed to load product');
    expect(wrapper.find('.back-button').exists()).toBe(true);
    expect(wrapper.find('.retry-button').exists()).toBe(true);
  });

  test('displays fallback product state when product is a fallback', async () => {
    // Create wrapper with fallback product state
    const wrapper = createWrapper({
      initialState: {
        printify: {
          loading: { selectedProduct: false },
          selectedProduct: {
            id: 'test-product-123',
            title: 'Product Unavailable',
            description: 'This product cannot be displayed',
            _fallback: true,
            images: [],
            variants: []
          },
          error: { selectedProduct: 'product_not_found' }
        }
      }
    });

    // Verify fallback product UI is shown
    expect(wrapper.find('.product-unavailable-container').exists()).toBe(true);
    expect(wrapper.text()).toContain('Product Unavailable');
    expect(wrapper.text()).toContain('This product cannot be displayed');
    expect(wrapper.find('.action-buttons').exists()).toBe(true);
  });

  test('displays product details when product successfully loads', async () => {
    // Create wrapper with successful product load
    const wrapper = createWrapper({
      initialState: {
        printify: {
          loading: { selectedProduct: false },
          selectedProduct: {
            id: 'test-product-123',
            title: 'Test Product',
            description: 'This is a test product',
            images: [{ src: 'test-image.jpg', position: 'front' }],
            variants: [{ 
              id: 'variant-1', 
              title: 'Small / Black',
              price: '19.99',
              is_available: true
            }],
            priceRange: '$19.99',
            options: [
              { name: 'Size', values: ['Small', 'Medium', 'Large'] },
              { name: 'Color', values: ['Black', 'White'] }
            ],
            tags: ['clothing', 'shirts']
          },
          error: { selectedProduct: null }
        }
      }
    });

    // Verify product UI is shown
    expect(wrapper.find('.product-container').exists()).toBe(true);
    expect(wrapper.find('.product-title').text()).toBe('Test Product');
    expect(wrapper.find('.main-image').exists()).toBe(true);
    expect(wrapper.find('.product-price').exists()).toBe(true);
    expect(wrapper.find('.variant-options').exists()).toBe(true);
  });

  test('clicking back button navigates to previous page', async () => {
    // Mock the router and history
    const mockRouter = {
      go: jest.fn()
    };
    
    // Create wrapper with error state
    const wrapper = createWrapper({
      initialState: {
        printify: {
          loading: { selectedProduct: false },
          selectedProduct: null,
          error: { selectedProduct: 'Failed to load product' }
        }
      }
    });

    // Replace the actual route.go method with our mock
    router.go = mockRouter.go;

    // Trigger back button click
    await wrapper.find('.back-button').trigger('click');

    // Verify router.go was called with -1
    expect(mockRouter.go).toHaveBeenCalledWith(-1);
  });

  test('calls fetchPublicProductById when mounted', async () => {
    // Initialize the store
    const wrapper = createWrapper();
    
    // Get the store
    const store = usePrintifyStore();
    
    // Verify the action was called with the correct ID
    expect(store.fetchPublicProductById).toHaveBeenCalledWith('test-product-123');
  });

  // Additional tests could be written for:
  // - Testing variant selection
  // - Testing quantity adjustments
  // - Testing add to cart functionality
  // - Testing image gallery navigation
});
