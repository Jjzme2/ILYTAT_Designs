/**
 * Unit tests for PrintifyController
 * 
 * Tests the error handling and data processing functionality
 * of the PrintifyController, with a focus on robust handling
 * of null/undefined values and API responses.
 */
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mocks
const mockLogger = {
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  child: () => mockLogger,
  response: {
    business: () => ({
      withRequestDetails: () => ({}),
      withPerformanceMetrics: () => ({})
    })
  }
};

const mockPrintifyService = {
  getProducts: sinon.stub(),
  getOrders: sinon.stub()
};

// Response mocks
const mockResponse = {
  sendSuccess: sinon.stub().returns({}),
  sendError: sinon.stub().returns({}),
  sendNotFound: sinon.stub().returns({})
};

// Request mock
const mockRequest = {
  user: { id: 'test-user-id' },
  params: {},
  query: {}
};

// Error handler mock
const mockCreateNotFoundError = sinon.stub();

// Import controller with dependencies injected
const PrintifyController = proxyquire('../../src/controllers/printifyController', {
  '../services/printifyService': mockPrintifyService,
  '../utils/logger': mockLogger,
  '../utils/errorHandler': {
    createNotFoundError: mockCreateNotFoundError,
    catchAsync: (fn) => fn
  }
});

describe('PrintifyController', () => {
  let controller;
  
  beforeEach(() => {
    // Reset all stubs before each test
    sinon.reset();
    
    // Set environment variables for testing
    process.env.DEFAULT_PRINTIFY_SHOP_ID = 'test-shop-id';
    
    // Create a new instance for each test
    controller = new PrintifyController();
    
    // Configure default response behavior
    mockResponse.sendSuccess.returns({});
    mockResponse.sendError.returns({});
    mockPrintifyService.getProducts.resolves([]);
  });
  
  afterEach(() => {
    // Restore original behavior
    sinon.restore();
  });
  
  describe('getUpcomingProducts', () => {
    it('should handle null API response properly', async () => {
      // Setup
      mockPrintifyService.getProducts.resolves(null);
      
      // Execute
      await controller.getUpcomingProducts(mockRequest, mockResponse);
      
      // Verify
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockResponse.sendSuccess.calledOnce).to.be.true;
      expect(mockResponse.sendSuccess.firstCall.args[0]).to.deep.equal([]);
      expect(mockResponse.sendSuccess.firstCall.args[1]).to.equal('No upcoming products available');
    });
    
    it('should handle empty array API response', async () => {
      // Setup
      mockPrintifyService.getProducts.resolves([]);
      
      // Execute
      await controller.getUpcomingProducts(mockRequest, mockResponse);
      
      // Verify
      expect(mockResponse.sendSuccess.calledOnce).to.be.true;
      expect(mockResponse.sendSuccess.firstCall.args[0]).to.deep.equal([]);
    });
    
    it('should filter out null products before processing', async () => {
      // Setup - array with some null entries
      mockPrintifyService.getProducts.resolves([
        { id: '1', title: 'Product 1', visible: false },
        null,
        { id: '2', title: 'Product 2', visible: true },
        undefined,
        { id: '3', title: 'Product 3', visible: false }
      ]);
      
      // Mock the _formatProduct method
      const formatProductStub = sinon.stub(controller, '_formatProduct').callsFake(
        product => ({ id: product.id, formatted: true })
      );
      
      // Execute
      await controller.getUpcomingProducts(mockRequest, mockResponse);
      
      // Verify
      expect(formatProductStub.calledTwice).to.be.true; // Should be called only for valid products
      expect(mockResponse.sendSuccess.calledOnce).to.be.true;
      
      // Should only include formatted products that were visible: false
      const responseData = mockResponse.sendSuccess.firstCall.args[0];
      expect(responseData.length).to.equal(2);
      expect(responseData).to.deep.equal([
        { id: '1', formatted: true },
        { id: '3', formatted: true }
      ]);
    });
    
    it('should handle products with missing visibility property', async () => {
      // Setup - products with missing visible property
      mockPrintifyService.getProducts.resolves([
        { id: '1', title: 'Product 1' }, // No visible property
        { id: '2', title: 'Product 2', visible: false },
        { id: '3', title: 'Product 3', visible: true }
      ]);
      
      // Execute
      await controller.getUpcomingProducts(mockRequest, mockResponse);
      
      // Verify - should only process products with visible: false
      expect(mockResponse.sendSuccess.calledOnce).to.be.true;
      expect(mockResponse.sendSuccess.firstCall.args[0].length).to.equal(1);
    });
    
    it('should return non-empty array for successful response', async () => {
      // Setup
      const mockProducts = [
        { id: '1', title: 'Product 1', visible: false, images: [], variants: [] },
        { id: '2', title: 'Product 2', visible: false, images: [], variants: [] }
      ];
      mockPrintifyService.getProducts.resolves(mockProducts);
      
      // Execute
      await controller.getUpcomingProducts(mockRequest, mockResponse);
      
      // Verify
      expect(mockResponse.sendSuccess.calledOnce).to.be.true;
      expect(mockResponse.sendSuccess.firstCall.args[0].length).to.equal(2);
      expect(mockResponse.sendSuccess.firstCall.args[1]).to.equal('Upcoming products retrieved successfully');
    });
  });
  
  describe('_formatProduct', () => {
    it('should handle null product gracefully', () => {
      // Execute
      const result = controller._formatProduct(null);
      
      // Verify
      expect(result).to.have.property('id', 'unknown');
      expect(result).to.have.property('title', 'Unknown Product');
      expect(result).to.have.property('images').that.is.an('array').that.is.empty;
      expect(result).to.have.property('variants').that.is.an('array').that.is.empty;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should handle undefined product gracefully', () => {
      // Execute
      const result = controller._formatProduct(undefined);
      
      // Verify
      expect(result).to.have.property('id', 'unknown');
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should handle product with missing properties', () => {
      // Setup - minimal product
      const minimalProduct = { id: 'test-id', title: 'Test Product' };
      
      // Execute
      const result = controller._formatProduct(minimalProduct);
      
      // Verify
      expect(result).to.have.property('id', 'test-id');
      expect(result).to.have.property('title', 'Test Product');
      expect(result).to.have.property('images').that.is.an('array');
      expect(result).to.have.property('variants').that.is.an('array');
    });
    
    it('should process product images correctly', () => {
      // Setup
      const productWithImages = {
        id: 'test-id',
        title: 'Test Product',
        images: [
          { src: 'image1.jpg', position: 'front', is_default: true, variant_ids: [1, 2] },
          { src: 'image2.jpg' } // Minimal image
        ]
      };
      
      // Execute
      const result = controller._formatProduct(productWithImages);
      
      // Verify
      expect(result.images).to.be.an('array').with.lengthOf(2);
      expect(result.images[0]).to.deep.include({
        src: 'image1.jpg',
        position: 'front',
        isDefault: true
      });
      expect(result.images[0].variantIds).to.deep.equal([1, 2]);
      
      // Check defaults for minimal image
      expect(result.images[1]).to.deep.include({
        src: 'image2.jpg',
        position: 'front', // Default
        isDefault: false   // Default
      });
      expect(result.images[1].variantIds).to.be.an('array').that.is.empty;
    });
  });
});
