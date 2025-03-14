/**
 * Mock data and helpers for getProductById tests
 */
import { jest } from '@jest/globals';

// Mock product data
export const mockProduct = {
  id: 'test-product-id',
  title: 'Mocked Product',
  description: 'This is a mocked product for testing',
  images: [{ src: 'https://example.com/image.jpg' }],
  variants: []
};

// Mock axios module used by our application
export const mockAxios = {
  get: jest.fn(() => {
    return Promise.resolve({
      data: {
        success: true,
        data: mockProduct
      }
    });
  })
};

// Mock Pinia store for Printify
export const mockPrintifyStore = {
  selectedProduct: null,
  products: [],
  shops: [],
  recentOrders: [],
  totalProducts: 0,
  loading: {
    products: false,
    selectedProduct: false,
    shops: false,
    orders: false
  },
  error: {
    products: null,
    selectedProduct: null,
    shops: null,
    orders: null
  },
  fetchPublicProductById: jest.fn(async (productId) => {
    if (!productId) {
      mockPrintifyStore.error.selectedProduct = 'No product ID provided';
      return;
    }
    
    mockPrintifyStore.loading.selectedProduct = true;
    mockPrintifyStore.error.selectedProduct = null;
    
    try {
      const response = await mockAxios.get(`/api/printifyApi/public/products/${productId}`);
      if (response.data && response.data.success) {
        mockPrintifyStore.selectedProduct = response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      mockPrintifyStore.error.selectedProduct = error.message;
      mockPrintifyStore.selectedProduct = {
        id: productId,
        title: 'Product Not Found',
        description: 'Unable to load this product',
        _fallback: true,
        _reason: error.message || 'Unknown error'
      };
    } finally {
      mockPrintifyStore.loading.selectedProduct = false;
    }
  })
};
