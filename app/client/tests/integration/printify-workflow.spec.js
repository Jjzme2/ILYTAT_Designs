/**
 * Integration tests for the Printify workflow
 * 
 * These tests examine the interaction between stores, components, and API calls
 * to ensure the full product fetching and display workflow functions correctly.
 */
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ProductDetailView from '@/views/ProductDetailView.vue';
import { usePrintifyStore } from '@/stores/printify';
import axios from 'axios';

// Mock axios to simulate API responses
jest.mock('axios');

// Create router for component mounting
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/products', name: 'products' },
    { path: '/product/:id', name: 'product-detail' }
  ]
});

describe('Product Fetching Workflow', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all axios mocks
    axios.get.mockReset();
    
    // Create fresh Pinia instance
    setActivePinia(createPinia());
  });

  test('fetch and display product workflow - happy path', async () => {
    // 1. Mock API response for a successful product fetch
    const mockProduct = {
      id: 'test-product-123',
      title: 'Test Product',
      description: 'This is a test product',
      images: [{ src: 'test-image.jpg' }],
      variants: [{ id: 'v1', title: 'Small / Black', price: '19.99', is_available: true }],
      options: [
        { name: 'Size', values: ['Small', 'Medium', 'Large'] },
        { name: 'Color', values: ['Black', 'White'] }
      ]
    };
    
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockProduct,
        message: 'Product retrieved successfully'
      }
    });

    // 2. Set up route with product ID and mount component
    router.push({ name: 'product-detail', params: { id: 'test-product-123' } });
    
    const wrapper = mount(ProductDetailView, {
      global: {
        plugins: [router, createPinia()]
      }
    });

    // 3. Wait for component to trigger API calls and update
    await router.isReady();
    
    // Initial state should be loading
    expect(wrapper.find('.loading-container').exists()).toBe(true);
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 4. Verify the store contains the right data
    const store = usePrintifyStore();
    expect(store.selectedProduct).toEqual(mockProduct);
    expect(store.loading.selectedProduct).toBe(false);
    
    // 5. Verify component displays the correct product data
    await wrapper.vm.$nextTick();
    
    // Component should now show product details instead of loading state
    expect(wrapper.find('.loading-container').exists()).toBe(false);
    expect(wrapper.find('.product-container').exists()).toBe(true);
    
    // Product title should match mock data
    const productTitle = wrapper.find('.product-title');
    expect(productTitle.exists()).toBe(true);
    expect(productTitle.text()).toBe('Test Product');
    
    // Product description should match mock data
    expect(wrapper.find('.product-description').exists()).toBe(true);
    
    // Options should be displayed
    expect(wrapper.find('.variant-options').exists()).toBe(true);
    
    // Add to cart button should be enabled
    const addToCartBtn = wrapper.find('.add-to-cart-btn');
    expect(addToCartBtn.exists()).toBe(true);
    expect(addToCartBtn.attributes('disabled')).toBeFalsy();
  });

  test('fetch and display product workflow - API error path', async () => {
    // 1. Mock API response for a failed product fetch
    axios.get.mockRejectedValue({
      response: {
        data: {
          success: false,
          message: 'Product not found',
          error: 'NOT_FOUND'
        }
      }
    });

    // 2. Set up route with product ID and mount component
    router.push({ name: 'product-detail', params: { id: 'error-product' } });
    
    const wrapper = mount(ProductDetailView, {
      global: {
        plugins: [router, createPinia()]
      }
    });

    // 3. Wait for component to trigger API calls and update
    await router.isReady();
    
    // Initial state should be loading
    expect(wrapper.find('.loading-container').exists()).toBe(true);
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 4. Verify the store contains error state
    const store = usePrintifyStore();
    expect(store.error.selectedProduct).toBeTruthy();
    expect(store.loading.selectedProduct).toBe(false);
    
    // 5. Verify component displays error state
    await wrapper.vm.$nextTick();
    
    // Component should now show error instead of loading state
    expect(wrapper.find('.loading-container').exists()).toBe(false);
    expect(wrapper.find('.error-container').exists()).toBe(true);
    
    // Retry button should exist
    expect(wrapper.find('.retry-button').exists()).toBe(true);
  });

  test('fetch and display product workflow - null data path', async () => {
    // 1. Mock API response with null data
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: null,
        message: 'Success but null data'
      }
    });

    // 2. Set up route with product ID and mount component
    router.push({ name: 'product-detail', params: { id: 'null-data-product' } });
    
    const wrapper = mount(ProductDetailView, {
      global: {
        plugins: [router, createPinia()]
      }
    });

    // 3. Wait for component to trigger API calls and update
    await router.isReady();
    
    // Initial state should be loading
    expect(wrapper.find('.loading-container').exists()).toBe(true);
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 4. Verify the store contains fallback product
    const store = usePrintifyStore();
    expect(store.selectedProduct).not.toBeNull();
    expect(store.selectedProduct._fallback).toBe(true);
    expect(store.loading.selectedProduct).toBe(false);
    
    // 5. Verify component displays fallback product state
    await wrapper.vm.$nextTick();
    
    // Component should now show fallback product UI
    expect(wrapper.find('.loading-container').exists()).toBe(false);
    expect(wrapper.find('.product-unavailable-container').exists()).toBe(true);
    
    // Should have retry button
    const retryBtn = wrapper.find('.retry-button');
    expect(retryBtn.exists()).toBe(true);
    
    // 6. Test retry functionality
    // First change the mock to return success on retry
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'null-data-product',
          title: 'Found Product',
          description: 'This product was found on retry',
          images: [{ src: 'test-image.jpg' }],
          variants: [{ id: 'v1', title: 'Default', price: '19.99' }]
        },
        message: 'Product retrieved successfully'
      }
    });
    
    // Trigger retry button
    await retryBtn.trigger('click');
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should be in loading state again
    expect(wrapper.find('.loading-container').exists()).toBe(true);
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should now show product details
    expect(wrapper.find('.product-container').exists()).toBe(true);
    expect(wrapper.find('.product-title').text()).toBe('Found Product');
  });
});
