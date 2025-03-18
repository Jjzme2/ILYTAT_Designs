/**
 * Unit tests for UpcomingProductsView Component
 * 
 * Tests the UpcomingProductsView component with a focus on:
 * - Authentication requirements
 * - Loading states
 * - Error handling
 * - Empty state handling
 * - Data display
 * 
 * @module tests/views/UpcomingProductsView
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UpcomingProductsView from '@/views/printify/UpcomingProductsView.vue';
import { usePrintifyStore } from '@/stores/printify';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    currentRoute: { value: { fullPath: '/test' } }
  })
}));

// Mock the router instance used by the component
vi.mock('@/router', () => ({
  push: vi.fn()
}));

describe('UpcomingProductsView.vue', () => {
  let wrapper;
  let printifyStore;
  let authStore;
  
  // Helper function to create the wrapper with specific store state
  const createWrapper = (authAuthenticated = true, printifyState = {}) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: { 
          user: authAuthenticated ? { id: '123', firstName: 'Test' } : null,
          isAuthenticated: authAuthenticated
        },
        printify: {
          upcomingProducts: [],
          loading: { upcomingProducts: false },
          error: { upcomingProducts: null },
          ...printifyState
        }
      }
    });
    
    // Get store instances
    authStore = useAuthStore(pinia);
    printifyStore = usePrintifyStore(pinia);
    
    // Create the component wrapper
    return mount(UpcomingProductsView, {
      global: {
        plugins: [pinia],
        stubs: ['router-link'] // Stub router-link component
      }
    });
  };
  
  afterEach(() => {
    vi.clearAllMocks();
    if (wrapper) {
      wrapper.unmount();
    }
  });
  
  it('should redirect to login if user is not authenticated', async () => {
    // Create wrapper with unauthenticated user
    wrapper = createWrapper(false);
    await flushPromises();
    
    // Should redirect to login
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'login'
      })
    );
    
    // Should not fetch upcoming products
    expect(printifyStore.fetchUpcomingProducts).not.toHaveBeenCalled();
  });
  
  it('should fetch upcoming products when authenticated', async () => {
    // Create wrapper with authenticated user
    wrapper = createWrapper(true);
    await flushPromises();
    
    // Should fetch upcoming products
    expect(printifyStore.fetchUpcomingProducts).toHaveBeenCalled();
  });
  
  it('should show loading state when loading', async () => {
    // Create wrapper with loading state
    wrapper = createWrapper(true, {
      loading: { upcomingProducts: true }
    });
    
    // Should show loading indicator
    expect(wrapper.find('.loading-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading upcoming products');
  });
  
  it('should show error state when error occurs', async () => {
    // Create wrapper with error state
    const errorMessage = 'Failed to load upcoming products';
    wrapper = createWrapper(true, {
      error: { upcomingProducts: errorMessage }
    });
    
    // Should show error message
    expect(wrapper.find('.error-state').exists()).toBe(true);
    expect(wrapper.text()).toContain(errorMessage);
    
    // Should have retry button
    const retryButton = wrapper.find('.error-state button');
    expect(retryButton.exists()).toBe(true);
    
    // Click retry button
    await retryButton.trigger('click');
    
    // Should attempt to fetch products again
    expect(printifyStore.fetchUpcomingProducts).toHaveBeenCalled();
  });
  
  it('should show empty state when no products found', async () => {
    // Create wrapper with empty products array
    wrapper = createWrapper(true, {
      upcomingProducts: []
    });
    
    // Should show empty state
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('No upcoming products found');
  });
  
  it('should render products grid when products are available', async () => {
    // Create wrapper with sample products
    const sampleProducts = [
      {
        id: '1',
        title: 'Test Product 1',
        description: 'Description 1',
        price: 29.99,
        status: 'draft',
        thumbnail: 'image1.jpg',
        releaseDate: '2025-06-01'
      },
      {
        id: '2',
        title: 'Test Product 2',
        description: 'Description 2',
        price: null, // Missing price
        status: 'active',
        thumbnail: null, // Missing image
        releaseDate: null // Missing release date
      }
    ];
    
    wrapper = createWrapper(true, {
      upcomingProducts: sampleProducts
    });
    
    // Should show products grid
    expect(wrapper.find('.products-grid').exists()).toBe(true);
    
    // Should render correct number of product cards
    const productCards = wrapper.findAll('.product-card');
    expect(productCards.length).toBe(2);
    
    // Check first product rendering
    expect(productCards[0].text()).toContain('Test Product 1');
    expect(productCards[0].text()).toContain('Description 1');
    expect(productCards[0].text()).toContain('$29.99'); // Formatted price
    
    // Check second product has fallbacks for missing data
    expect(productCards[1].text()).toContain('Test Product 2');
    expect(productCards[1].text()).toContain('Pricing TBD'); // Fallback for null price
    expect(productCards[1].text()).toContain('Coming Soon'); // Fallback for missing date
  });
  
  it('should handle image loading errors', async () => {
    // Create wrapper with sample product
    wrapper = createWrapper(true, {
      upcomingProducts: [{
        id: '1',
        title: 'Test Product',
        thumbnail: 'invalid-image.jpg'
      }]
    });
    
    // Get product image
    const productImage = wrapper.find('.product-image');
    
    // Trigger error event on the image
    await productImage.trigger('error');
    
    // Image source should be updated to placeholder
    expect(productImage.attributes('src')).toBe('/images/placeholder-product.png');
  });
  
  it('should format prices correctly', async () => {
    // Create wrapper with products with different price formats
    wrapper = createWrapper(true, {
      upcomingProducts: [
        { id: '1', title: 'Product 1', price: 10 },
        { id: '2', title: 'Product 2', price: 10.5 },
        { id: '3', title: 'Product 3', price: null },
        { id: '4', title: 'Product 4' } // undefined price
      ]
    });
    
    // Get all price elements
    const prices = wrapper.findAll('.product-price');
    
    // Check price formatting
    expect(prices[0].text()).toContain('$10.00');
    expect(prices[1].text()).toContain('$10.50');
    expect(prices[2].text()).toContain('Pricing TBD');
    expect(prices[3].text()).toContain('Pricing TBD');
  });
});
