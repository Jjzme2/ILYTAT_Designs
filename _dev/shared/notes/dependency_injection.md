---
title: Dependency Injection Guide
createdAt: 2025-03-13
updatedAt: 2025-03-13
category: developer_docs
isPublic: true
author: ILYTAT Development Team
---

# Dependency Injection in ILYTAT Designs

## Overview

This guide explains how Dependency Injection (DI) is implemented and used throughout the ILYTAT Designs codebase. DI is a design pattern that helps manage dependencies between components, making code more modular, testable, and maintainable.

## Core Concepts

Dependency Injection involves:

1. **Declaring dependencies**: Components explicitly declare what they need
2. **Providing dependencies**: Dependencies are provided to components from outside
3. **Resolving dependencies**: A DI container manages the creation and provision of dependencies

## Implementation in ILYTAT Designs

We've implemented a lightweight Dependency Injection system that doesn't rely on heavy frameworks but provides the essential functionality needed.

### The DI Container

The core of our DI system is a simple container that manages services:

```javascript
// app/server/src/utils/di/container.js
class DIContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }
  
  // Register a service instance
  register(name, instance) {
    this.services.set(name, instance);
    return this;
  }
  
  // Register a factory function that creates a service
  registerFactory(name, factory) {
    this.factories.set(name, factory);
    return this;
  }
  
  // Get a service by name
  get(name) {
    // If service exists, return it
    if (this.services.has(name)) {
      return this.services.get(name);
    }
    
    // If factory exists, create service and cache it
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory(this);
      this.services.set(name, instance);
      return instance;
    }
    
    throw new Error(`Service not found: ${name}`);
  }
  
  // Create a new child container that inherits from this one
  createChild() {
    const child = new DIContainer();
    child.parent = this;
    return child;
  }
}

module.exports = DIContainer;
```

### Service Registration

Services are registered in a central service registry:

```javascript
// app/server/src/utils/di/serviceRegistry.js
const DIContainer = require('./container');
const UserService = require('../../services/userService');
const ProductService = require('../../services/productService');
const OrderService = require('../../services/orderService');
const db = require('../../models');
const logger = require('../logger');

function registerServices(container = new DIContainer()) {
  // Register core dependencies
  container.register('db', db);
  container.register('logger', logger);
  
  // Register factories for services
  container.registerFactory('userService', (c) => {
    return new UserService({
      db: c.get('db'),
      logger: c.get('logger')
    });
  });
  
  container.registerFactory('productService', (c) => {
    return new ProductService({
      db: c.get('db'),
      logger: c.get('logger')
    });
  });
  
  container.registerFactory('orderService', (c) => {
    return new OrderService({
      db: c.get('db'),
      logger: c.get('logger'),
      userService: c.get('userService')
    });
  });
  
  return container;
}

// Create and export a pre-configured container
const container = registerServices();
module.exports = {
  container,
  registerServices
};
```

### Using the DI Container

Services can request dependencies through their constructors:

```javascript
// app/server/src/services/orderService.js
class OrderService {
  constructor(deps = {}) {
    this.db = deps.db || require('../models');
    this.logger = deps.logger || require('../utils/logger');
    this.userService = deps.userService;
  }
  
  async createOrder(orderData, userId) {
    this.logger.info('Creating new order', { userId });
    
    // Use the User Service dependency
    const user = await this.userService.getUserById(userId);
    
    // Create the order
    const order = await this.db.Order.create({
      user_id: userId,
      status: 'pending',
      items: orderData.items,
      shipping_address: user.default_shipping_address,
      total: orderData.total
    });
    
    return order;
  }
}

module.exports = OrderService;
```

### In API Controllers

Controllers get services from the DI container:

```javascript
// app/server/src/controllers/orderController.js
const { container } = require('../utils/di/serviceRegistry');
const { catchAsync } = require('../utils/errorHandler');

class OrderController {
  constructor() {
    this.orderService = container.get('orderService');
    this.logger = container.get('logger');
  }
  
  createOrder = catchAsync(async (req, res) => {
    const { user } = req;
    const orderData = req.body;
    
    const order = await this.orderService.createOrder(orderData, user.id);
    
    return res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  });
}

module.exports = new OrderController();
```

## Testing with DI

One of the main benefits of DI is improved testability through mocking:

```javascript
// tests/unit/services/orderService.test.js
const OrderService = require('../../../src/services/orderService');
const { expect } = require('chai');
const sinon = require('sinon');

describe('OrderService', () => {
  let orderService;
  let mockDb;
  let mockLogger;
  let mockUserService;
  
  beforeEach(() => {
    // Create mocks
    mockDb = {
      Order: {
        create: sinon.stub().resolves({ id: '123', status: 'pending' })
      }
    };
    
    mockLogger = {
      info: sinon.spy(),
      error: sinon.spy()
    };
    
    mockUserService = {
      getUserById: sinon.stub().resolves({
        id: '456',
        name: 'Test User',
        default_shipping_address: '123 Test St'
      })
    };
    
    // Inject mocks into service
    orderService = new OrderService({
      db: mockDb,
      logger: mockLogger,
      userService: mockUserService
    });
  });
  
  describe('createOrder', () => {
    it('should create an order with correct data', async () => {
      // Arrange
      const orderData = {
        items: [{ id: '789', quantity: 2 }],
        total: 99.99
      };
      const userId = '456';
      
      // Act
      const result = await orderService.createOrder(orderData, userId);
      
      // Assert
      expect(mockUserService.getUserById.calledWith(userId)).to.be.true;
      expect(mockDb.Order.create.calledOnce).to.be.true;
      expect(mockDb.Order.create.firstCall.args[0]).to.deep.include({
        user_id: userId,
        status: 'pending',
        total: 99.99
      });
      expect(result).to.deep.equal({ id: '123', status: 'pending' });
    });
  });
});
```

## Best Practices

1. **Constructor Injection**: Always use constructor injection for required dependencies
2. **Default Dependencies**: Provide sensible defaults for non-critical dependencies
3. **Interface Segregation**: Inject only the dependencies that are actually needed
4. **Service Registration**: Register all services in the central service registry
5. **Testing**: Create mocks for dependencies when unit testing

## Scope Management

Our DI system supports different scopes for dependencies:

1. **Singleton**: One instance shared application-wide (default)
2. **Request**: New instance for each HTTP request
3. **Transient**: New instance each time it's requested

Example for request-scoped services:

```javascript
// app/server/src/middleware/diMiddleware.js
const { registerServices } = require('../utils/di/serviceRegistry');

module.exports = (req, res, next) => {
  // Create a request-scoped container
  const container = registerServices();
  
  // Add request-specific services
  container.register('currentUser', req.user);
  container.register('requestId', req.id);
  
  // Attach to request object
  req.container = container;
  
  next();
};
```

## Additional Resources

- [Our Factory Pattern Guide](./patterns/factory_pattern.md) for creating objects with complex dependencies
- [Our Testing Guidelines](./testing_guidelines.md) for effectively testing with mocked dependencies
- [Our Seeding Guide](./seeding_guide.md) for setting up test data
