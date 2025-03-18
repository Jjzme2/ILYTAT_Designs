/**
 * Integration tests for Printify Products API endpoints
 * 
 * Tests the complete flow from API requests through controllers and services
 * with a focus on authentication requirements and error handling.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const printifyService = require('../../src/services/printifyService');

// Mock the printifyService
jest.mock('../../src/services/printifyService');

describe('Printify Products API Integration Tests', () => {
  let authToken;
  
  beforeAll(() => {
    // Create a valid auth token for testing endpoints that require authentication
    const user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    };
    
    authToken = jwt.sign(
      { user },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });
  
  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });
  
  describe('GET /api/printify/upcoming-products', () => {
    it('should require authentication', async () => {
      // Test without auth token
      const response = await request(app)
        .get('/api/printify/upcoming-products');
      
      expect(response.status).toBe(401); // Unauthorized
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    it('should handle null API response', async () => {
      // Mock the printifyService to return null
      printifyService.getProducts.mockResolvedValue(null);
      
      // Test with auth token
      const response = await request(app)
        .get('/api/printify/upcoming-products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toBe('No upcoming products available');
    });
    
    it('should handle empty products array', async () => {
      // Mock the printifyService to return empty array
      printifyService.getProducts.mockResolvedValue([]);
      
      // Test with auth token
      const response = await request(app)
        .get('/api/printify/upcoming-products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toBe('No upcoming products found');
    });
    
    it('should filter out visible products', async () => {
      // Mock the printifyService to return a mix of visible and non-visible products
      printifyService.getProducts.mockResolvedValue([
        { id: '1', title: 'Product 1', visible: true, images: [], variants: [] },
        { id: '2', title: 'Product 2', visible: false, images: [], variants: [] },
        { id: '3', title: 'Product 3', visible: false, images: [], variants: [] }
      ]);
      
      // Test with auth token
      const response = await request(app)
        .get('/api/printify/upcoming-products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      
      // Verify only products with visible=false are included
      const productIds = response.body.data.map(p => p.id);
      expect(productIds).toContain('2');
      expect(productIds).toContain('3');
      expect(productIds).not.toContain('1');
    });
    
    it('should handle malformed products array with null items', async () => {
      // Mock the printifyService to return array with null items
      printifyService.getProducts.mockResolvedValue([
        null,
        { id: '1', title: 'Valid Product', visible: false, images: [], variants: [] },
        undefined,
        { id: '2', visible: false } // Missing title
      ]);
      
      // Test with auth token
      const response = await request(app)
        .get('/api/printify/upcoming-products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      
      // Verify the valid products are included and properly formatted
      expect(response.body.data[0].id).toBe('1');
      expect(response.body.data[0].title).toBe('Valid Product');
      
      expect(response.body.data[1].id).toBe('2');
      // Even with missing title, it should be handled gracefully
    });
    
    it('should handle API service errors', async () => {
      // Mock the printifyService to throw an error
      printifyService.getProducts.mockRejectedValue(new Error('API Connection Error'));
      
      // Test with auth token
      const response = await request(app)
        .get('/api/printify/upcoming-products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Error');
    });
  });
});
