/**
 * Enhanced Logging and Response System - Usage Examples
 * 
 * This file demonstrates how to use the integrated logging and response system
 * in various scenarios and API endpoints. It showcases best practices for
 * working with the system and provides reusable patterns.
 */

// Import the integrated logger
const logger = require('../../app/server/src/utils/logger');
const express = require('express');
const router = express.Router();

/**
 * Example 1: Basic API Route with Response Integration
 * Demonstrates using the response system in a standard CRUD endpoint
 */
router.get('/products', async (req, res) => {
  try {
    // Log the request with context
    logger.info('Fetching products', { 
      query: req.query,
      userId: req.user?.id
    });
    
    // Sample pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Mock product service call
    const products = await productService.findAll({ 
      page, 
      limit,
      // other filters from query params
    });
    
    // Create a success response with pagination
    return res.sendSuccessWithPagination(
      products.items,
      {
        page,
        limit,
        total: products.total,
        totalPages: Math.ceil(products.total / limit)
      },
      'Products retrieved successfully'
    );
  } catch (error) {
    // Log the error with full context
    logger.error('Failed to retrieve products', { 
      error,
      query: req.query
    });
    
    // Send appropriate error response to client
    return res.sendError(
      error,
      'Unable to retrieve products at this time',
      error.statusCode || 500
    );
  }
});

/**
 * Example 2: Validation with Response System
 * Shows how to handle validation errors with the response system
 */
router.post('/products', async (req, res) => {
  try {
    // Log incoming request
    logger.info('Creating new product', { 
      body: req.body,
      userId: req.user?.id
    });
    
    // Mock validation
    const validationResult = validateProduct(req.body);
    if (!validationResult.isValid) {
      // Send validation error response
      return res.sendValidationError(
        validationResult.errors,
        'Please correct the errors and try again'
      );
    }
    
    // Create product
    const product = await productService.create(req.body);
    
    // Log business event with the new response system
    logger.businessResponse({
      success: true,
      message: 'Product created successfully',
      userMessage: 'Your product has been created',
      data: { productId: product.id }
    }).withAuditTrail({
      operation: 'CREATE',
      entityType: 'Product',
      entityId: product.id,
      userId: req.user?.id,
      changes: {
        before: null,
        after: product
      }
    });
    
    // Return success to client
    return res.sendSuccess(product, 'Product created successfully', 201);
  } catch (error) {
    // Special handling for duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.sendValidationError(
        { name: 'Product with this name already exists' },
        'A product with this name already exists'
      );
    }
    
    // Log the error
    logger.error('Failed to create product', { 
      error,
      body: req.body
    });
    
    // Return generic error
    return res.sendError(
      error,
      'Unable to create product at this time',
      500
    );
  }
});

/**
 * Example 3: Authentication with Response System
 * Demonstrates auth response handling
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.sendValidationError(
        {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        },
        'Email and password are required'
      );
    }
    
    // Mock authentication
    const authResult = await authService.authenticate(email, password);
    
    // Handle failed authentication
    if (!authResult.success) {
      // Use auth response for failed login attempts
      return res.sendUnauthorized('Invalid email or password');
    }
    
    // Create specialized auth response with token
    const response = logger.authResponse({
      success: true,
      message: 'User authenticated successfully',
      userMessage: 'Welcome back!',
      data: {
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role
        }
      }
    }).withAuthTokens({
      accessToken: authResult.tokens.accessToken,
      refreshToken: authResult.tokens.refreshToken,
      expiresIn: authResult.tokens.expiresIn
    });
    
    // Log the successful login using the enhanced logger
    logger.info(response);
    
    // Send auth response to client
    return res.sendAuthResponse({
      success: true,
      userMessage: 'Login successful',
      data: {
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role
        },
        tokens: {
          accessToken: authResult.tokens.accessToken,
          refreshToken: authResult.tokens.refreshToken,
          expiresIn: authResult.tokens.expiresIn
        }
      }
    });
  } catch (error) {
    logger.error('Login error', { error });
    return res.sendError(error, 'An error occurred during login');
  }
});

/**
 * Example 4: Error Handler Middleware
 * Demonstrates using the response system for global error handling
 */
function createErrorHandler(logger) {
  return (err, req, res, next) => {
    // Determine if this is a known error type
    const statusCode = err.statusCode || 500;
    const userMessage = statusCode < 500
      ? err.userMessage || 'The request could not be processed'
      : 'An unexpected error occurred';
    
    // Log the error with full context
    logger.error('Unhandled error', {
      error: err,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user?.id,
    });
    
    // Send appropriate response based on error type
    return res.sendError(err, userMessage, statusCode);
  };
}

// Usage in app setup
// app.use(createErrorHandler(logger));

/**
 * Example 5: Network Request Logging with Response System
 * Demonstrates using the NetworkResponse for external API calls
 */
async function makeExternalApiCall(endpoint, data) {
  const startTime = Date.now();
  
  try {
    // Log the outgoing request
    logger.info(`Making API request to ${endpoint}`, {
      endpoint,
      data
    });
    
    // Mock API call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Create network response
    const responseData = await response.json();
    const networkResponse = logger.networkResponse({
      success: response.ok,
      message: `${endpoint} API call completed`,
      userMessage: response.ok ? 'Operation completed' : 'Error from external service',
      data: responseData
    }).withLatency({
      requestDuration: duration,
      ttfb: duration / 3 // Mock time to first byte
    }).withRequestDetails({
      url: endpoint,
      method: 'POST',
      requestBody: data,
      responseStatus: response.status,
      responseBody: responseData
    });
    
    // Log the response with our enhanced logger
    logger.info(networkResponse);
    
    return {
      success: response.ok,
      data: responseData,
      status: response.status
    };
  } catch (error) {
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Create failed network response
    const networkResponse = logger.networkResponse({
      success: false,
      message: `${endpoint} API call failed`,
      userMessage: 'Unable to communicate with external service',
      error
    }).withLatency({
      requestDuration: duration
    }).withRequestDetails({
      url: endpoint,
      method: 'POST',
      requestBody: data
    });
    
    // Log the error with our enhanced logger
    logger.error(networkResponse);
    
    // Rethrow with additional context
    throw error;
  }
}

/**
 * Example 6: Dependency Injection with Custom Logger
 * Demonstrates creating service with injected logger
 */
class OrderService {
  constructor(logger) {
    this.logger = logger;
  }
  
  async createOrder(orderData, userId) {
    this.logger.info('Creating new order', { orderData, userId });
    
    try {
      // Process order logic here
      const order = await db.Order.create(orderData);
      
      // Log business event with response
      this.logger.businessResponse({
        success: true,
        message: 'Order created successfully',
        userMessage: 'Your order has been placed',
        data: { orderId: order.id }
      }).withAuditTrail({
        operation: 'CREATE',
        entityType: 'Order',
        entityId: order.id,
        userId: userId,
        changes: {
          before: null,
          after: order
        }
      }).withWorkflow({
        processId: order.id,
        step: 'order_placed',
        nextSteps: ['payment_processing', 'order_fulfillment']
      });
      
      return order;
    } catch (error) {
      this.logger.error('Failed to create order', { error, orderData });
      throw error;
    }
  }
}

// Example of service instantiation with injected logger
// const ordersLogger = logger.createLogger({ appName: 'orders-service' });
// const orderService = new OrderService(ordersLogger);

module.exports = {
  router,
  createErrorHandler,
  makeExternalApiCall,
  OrderService
};
