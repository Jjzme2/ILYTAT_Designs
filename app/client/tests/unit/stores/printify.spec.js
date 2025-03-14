/**
 * Tests for the Printify Store
 * 
 * These tests focus on verifying the store's actions, state management,
 * and error handling capabilities.
 */
import { setActivePinia, createPinia } from 'pinia';
import { usePrintifyStore } from '@/stores/printify';
import axios from 'axios';

// Mock axios to avoid actual API calls during tests
jest.mock('axios');

describe('PrintifyStore', () => {
  let store;

  // Before each test, set up a fresh pinia instance and store
  beforeEach(() => {
    // Create and activate a fresh Pinia instance
    setActivePinia(createPinia());
    
    // Create a fresh store instance
    store = usePrintifyStore();
    
    // Reset all axios mocks before each test
    axios.get.mockReset();
  });

  describe('Store Initialization', () => {
    // Test initial state values
    test('should have correct initial state', () => {
      // Verify each important piece of initial state
      expect(store.publicProducts).toEqual([]);
      expect(store.featuredProducts).toEqual([]);
      expect(store.selectedProduct).toBeNull();
      expect(store.error.selectedProduct).toBeNull();
      expect(store.loading.selectedProduct).toBe(false);
      
      // Check for cart initialization
      expect(store.cart).toEqual([]);
      
      // For completeness, you could check other state properties
      expect(store.shops).toEqual([]);
      expect(store.recentOrders).toEqual([]);
    });
  });

  describe('fetchPublicProductById', () => {
    // Test normal successful response
    test('should fetch a product successfully and update state', async () => {
      // Arrange - Set up mock response for successful API call
      const mockProduct = {
        id: 'test-product-123',
        title: 'Test Product',
        description: 'This is a test product',
        images: [{ src: 'test-image.jpg' }],
        variants: [{ id: 'v1', title: 'Variant 1', price: '19.99' }]
      };
      
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockProduct,
          message: 'Product retrieved successfully'
        }
      });

      // Act - Call the method we're testing
      await store.fetchPublicProductById('test-product-123');

      // Assert - Verify state was updated correctly
      expect(store.selectedProduct).toEqual(mockProduct);
      expect(store.loading.selectedProduct).toBe(false);
      expect(store.error.selectedProduct).toBeNull();
      
      // Verify axios was called with the correct URL
      expect(axios.get).toHaveBeenCalledWith('/api/printify/products/test-product-123');
    });

    // Test handling of empty object response
    test('should handle empty object response gracefully', async () => {
      // Arrange - Mock an API response with an empty object
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: {},
          message: 'Product not found'
        }
      });

      // Act
      await store.fetchPublicProductById('nonexistent-id');

      // Assert - Verify a fallback product was created
      expect(store.selectedProduct).not.toBeNull();
      expect(store.selectedProduct._fallback).toBe(true);
      expect(store.error.selectedProduct).toBeDefined();
      expect(store.loading.selectedProduct).toBe(false);
    });

    // Test API error handling
    test('should handle API error responses', async () => {
      // Arrange - Mock an API error response
      axios.get.mockRejectedValue({
        response: {
          data: {
            success: false,
            message: 'API Error'
          }
        }
      });

      // Act
      await store.fetchPublicProductById('error-product');

      // Assert - Verify error was handled properly
      expect(store.selectedProduct).not.toBeNull();
      expect(store.selectedProduct._fallback).toBe(true);
      expect(store.error.selectedProduct).toBeDefined();
      expect(store.loading.selectedProduct).toBe(false);
    });

    // Test null data handling - exactly the bug we fixed
    test('should handle null data in success response', async () => {
      // Arrange - Mock a response with success:true but null data
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: null,
          message: 'Success but no data'
        }
      });

      // Act
      await store.fetchPublicProductById('null-data-product');

      // Assert - Verify fallback product was created
      expect(store.selectedProduct).not.toBeNull();
      expect(store.selectedProduct._fallback).toBe(true);
      expect(store.error.selectedProduct).toBe('data_unavailable');
      expect(store.loading.selectedProduct).toBe(false);
    });
  });

  describe('_createFallbackProduct', () => {
    test('should create a properly formatted fallback product', () => {
      // Act
      const fallbackProduct = store._createFallbackProduct('test-id', 'Test reason');
      
      // Assert
      expect(fallbackProduct).toEqual({
        id: 'test-id',
        title: 'Product Unavailable',
        description: 'This product cannot be displayed at this time. Test reason',
        images: [],
        variants: [],
        priceRange: 'N/A',
        _fallback: true,
        _reason: 'Test reason'
      });
    });
  });

  // Additional tests could be written for other store actions like:
  // - addToCart
  // - updateCartItem
  // - fetchPublicProducts
  // - etc.
});
