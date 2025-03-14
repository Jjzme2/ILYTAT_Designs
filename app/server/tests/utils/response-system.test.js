/**
 * Response System Tests
 * Comprehensive tests for the enhanced response system
 */
const { expect } = require('chai');
const sinon = require('sinon');
const { ResponseBase } = require('../../src/utils/response/ResponseBase');
const { ResponseFactory } = require('../../src/utils/response/ResponseFactory');
const { DataEncoder } = require('../../src/utils/security/dataEncoder');

describe('Response System', () => {
  describe('ResponseBase', () => {
    it('should handle null data safely for collections', () => {
      // Given
      const response = new ResponseBase(
        true,
        'Retrieved items',
        'Items retrieved successfully',
        null,
        { resourceType: 'collection' }
      );
      
      // Then
      expect(response.data).to.be.an('array');
      expect(response.data).to.be.empty;
    });
    
    it('should handle null data safely for single resources', () => {
      // Given
      const response = new ResponseBase(
        true,
        'Retrieved item',
        'Item retrieved successfully',
        null,
        { resourceType: 'single' }
      );
      
      // Then
      expect(response.data).to.be.an('object');
      expect(Object.keys(response.data)).to.have.lengthOf(0);
    });
    
    it('should detect resource type from message if not specified', () => {
      // Given
      const collectionResponse = new ResponseBase(
        true,
        'Retrieved users',
        'Users retrieved successfully',
        null
      );
      
      const singleResponse = new ResponseBase(
        true,
        'Retrieved user',
        'User retrieved successfully',
        null
      );
      
      // Then
      expect(collectionResponse.data).to.be.an('array');
      expect(singleResponse.data).to.be.an('object');
    });
    
    it('should add pagination information', () => {
      // Given
      const response = new ResponseBase(
        true,
        'Retrieved items',
        'Items retrieved successfully',
        [{ id: 1 }, { id: 2 }],
        { resourceType: 'collection' }
      );
      
      // When
      response.withPagination({
        page: 1,
        limit: 10,
        total: 50
      });
      
      // Then
      expect(response.metadata).to.have.property('pagination');
      expect(response.metadata.pagination.page).to.equal(1);
      expect(response.metadata.pagination.limit).to.equal(10);
      expect(response.metadata.pagination.total).to.equal(50);
      expect(response.metadata.pagination.totalPages).to.equal(5);
    });
    
    it('should add performance metrics', () => {
      // Given
      const response = new ResponseBase(
        true,
        'Operation completed',
        'Operation was successful',
        { id: 1 }
      );
      
      // When
      response.withPerformanceMetrics({
        duration: 120,
        memory: {
          rss: 50
        }
      });
      
      // Then
      expect(response.metadata).to.have.property('performance');
      expect(response.metadata.performance.duration).to.equal(120);
      expect(response.metadata.performance.memory.rss).to.equal(50);
    });
  });
  
  describe('ResponseFactory', () => {
    let factory;
    let loggerStub;
    
    beforeEach(() => {
      loggerStub = {
        info: sinon.stub(),
        error: sinon.stub(),
        debug: sinon.stub()
      };
      
      factory = new ResponseFactory({
        logger: loggerStub
      });
    });
    
    it('should create success response', () => {
      // When
      const response = factory.success({
        message: 'Operation succeeded',
        data: { id: 1 }
      });
      
      // Then
      expect(response.success).to.be.true;
      expect(response.message).to.equal('Operation succeeded');
      expect(response.data).to.deep.equal({ id: 1 });
      expect(loggerStub.info.calledOnce).to.be.true;
    });
    
    it('should create error response', () => {
      // Given
      const error = new Error('Something went wrong');
      
      // When
      const response = factory.error({
        error,
        message: 'Operation failed',
        statusCode: 500
      });
      
      // Then
      expect(response.success).to.be.false;
      expect(response.message).to.equal('Operation failed');
      expect(response.statusCode).to.equal(500);
      expect(response.error).to.equal(error.message);
      expect(loggerStub.error.calledOnce).to.be.true;
    });
    
    it('should create not found response', () => {
      // When
      const response = factory.notFound({
        resource: 'User',
        identifier: '123'
      });
      
      // Then
      expect(response.success).to.be.false;
      expect(response.message).to.contain('User');
      expect(response.message).to.contain('123');
      expect(response.statusCode).to.equal(404);
    });
    
    it('should create created response', () => {
      // When
      const response = factory.created({
        message: 'User created',
        data: { id: 1, name: 'John' }
      });
      
      // Then
      expect(response.success).to.be.true;
      expect(response.message).to.equal('User created');
      expect(response.statusCode).to.equal(201);
      expect(response.data).to.deep.equal({ id: 1, name: 'John' });
    });
    
    it('should create no content response', () => {
      // When
      const response = factory.noContent({
        message: 'Resource deleted'
      });
      
      // Then
      expect(response.success).to.be.true;
      expect(response.message).to.equal('Resource deleted');
      expect(response.statusCode).to.equal(204);
      expect(response.data).to.deep.equal({});
    });
    
    it('should create validation error response', () => {
      // Given
      const validationErrors = {
        email: ['Email is required', 'Must be a valid email format'],
        password: ['Password must be at least 8 characters']
      };
      
      // When
      const response = factory.validationError({
        message: 'Validation failed',
        errors: validationErrors
      });
      
      // Then
      expect(response.success).to.be.false;
      expect(response.message).to.equal('Validation failed');
      expect(response.statusCode).to.equal(400);
      expect(response.errors).to.deep.equal(validationErrors);
    });
    
    it('should create middleware that adds response methods to res object', () => {
      // Given
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };
      const req = {};
      const next = sinon.stub();
      
      // When
      const middleware = factory.createMiddleware();
      middleware(req, res, next);
      
      // Then
      expect(res).to.have.property('sendSuccess');
      expect(res).to.have.property('sendError');
      expect(res).to.have.property('sendNotFound');
      expect(res).to.have.property('sendCreated');
      expect(res).to.have.property('sendNoContent');
      expect(res).to.have.property('sendSensitiveData');
      expect(next.calledOnce).to.be.true;
    });
  });
  
  describe('DataEncoder Integration', () => {
    let dataEncoder;
    let responseFactory;
    
    beforeEach(() => {
      // Setup with test environment
      process.env.NODE_ENV = 'test';
      process.env.DATA_ENCRYPTION_KEY = 'test-encryption-key-for-unit-testing';
      
      dataEncoder = new DataEncoder();
      responseFactory = new ResponseFactory({
        logger: { info: () => {}, error: () => {}, debug: () => {} },
        dataEncoder
      });
    });
    
    afterEach(() => {
      delete process.env.DATA_ENCRYPTION_KEY;
    });
    
    it('should encode sensitive data in response', () => {
      // Given
      const sensitiveData = {
        id: 1,
        email: 'user@example.com',
        password: 'hashed_password',
        ssn: '123-45-6789'
      };
      
      // When
      const response = responseFactory.success({
        message: 'User retrieved',
        data: sensitiveData,
        encodeSensitiveData: true
      });
      
      // Then
      expect(response.data).to.not.deep.equal(sensitiveData);
      expect(response.metadata).to.have.property('encoded');
      expect(response.metadata.encoded).to.be.true;
      
      // When using the decode method (simulating client-side)
      const decodedData = dataEncoder.decode(response.data, response.metadata);
      
      // Then
      expect(decodedData).to.deep.equal(sensitiveData);
    });
    
    it('should selectively encode sensitive fields', () => {
      // Given
      const userData = {
        id: 1,
        name: 'John Doe', // Not sensitive
        email: 'user@example.com', // Sensitive
        preferences: { darkMode: true } // Not sensitive
      };
      
      // When
      const { data, metadata } = dataEncoder.encode(userData, {
        sensitive: true, 
        sensitiveFields: ['email']
      });
      
      // Then
      expect(data.id).to.equal(1);
      expect(data.name).to.equal('John Doe');
      expect(data.email).to.not.equal('user@example.com');
      expect(data.preferences).to.deep.equal({ darkMode: true });
      
      // When decoding
      const decodedData = dataEncoder.decode(data, metadata);
      
      // Then
      expect(decodedData).to.deep.equal(userData);
    });
    
    it('should safely handle null values in sensitive data encoding', () => {
      // Given
      const nullData = null;
      
      // When
      const { data, metadata } = dataEncoder.encode(nullData, { sensitive: true });
      
      // Then - should not throw an error
      expect(data).to.not.be.null;
      expect(metadata.encoded).to.be.true;
      
      // When decoding
      const decodedData = dataEncoder.decode(data, metadata);
      
      // Then
      expect(decodedData).to.be.null;
    });
    
    it('should safely handle undefined values in sensitive data encoding', () => {
      // Given
      const undefinedData = undefined;
      
      // When
      const { data, metadata } = dataEncoder.encode(undefinedData, { sensitive: true });
      
      // Then - should not throw an error
      expect(data).to.not.be.undefined;
      expect(metadata.encoded).to.be.true;
      
      // When decoding
      const decodedData = dataEncoder.decode(data, metadata);
      
      // Then
      expect(decodedData).to.be.undefined;
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle circular references in data', () => {
      // Given
      const circularObj = {};
      circularObj.self = circularObj;
      
      // When/Then - should not throw an error
      const response = new ResponseBase(
        true,
        'Operation completed',
        'Success',
        circularObj
      );
      
      // Serializing to JSON should also not throw
      expect(() => JSON.stringify(response)).to.not.throw();
    });
    
    it('should handle extremely large data payloads gracefully', () => {
      // Given
      const largeArray = Array(10000).fill().map((_, i) => ({ id: i, name: `Item ${i}` }));
      
      // When
      const response = new ResponseBase(
        true,
        'Retrieved items',
        'Items retrieved successfully',
        largeArray,
        { resourceType: 'collection' }
      );
      
      // Then
      expect(response.data.length).to.equal(largeArray.length);
      
      // Serializing to JSON should not throw
      expect(() => JSON.stringify(response)).to.not.throw();
    });
    
    it('should handle errors in middleware without breaking the application', () => {
      // Given
      const factory = new ResponseFactory({
        logger: { error: sinon.stub(), info: sinon.stub() }
      });
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
      
      const req = {};
      const next = sinon.stub();
      
      // When
      const middleware = factory.createMiddleware();
      middleware(req, res, next);
      
      // Then - using the methods should not throw errors
      expect(() => res.sendSuccess(null)).to.not.throw();
      expect(() => res.sendError(new Error())).to.not.throw();
      
      // Error handling test - deliberately cause an error in the middleware
      res.status = null; // This will cause the sendSuccess to fail
      
      // Should fail gracefully and call next with the error
      res.sendSuccess({});
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
    });
  });
});
