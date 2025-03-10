# Dependency Injection in ILYTAT Designs

## Overview

Dependency Injection (DI) is a design pattern that implements Inversion of Control (IoC) for resolving dependencies. Instead of hard-coding dependencies within the component, dependencies are injected into the component from outside.

## Implementation in ILYTAT Designs

We've adopted Dependency Injection to improve modularity, testability, and maintainability in the ILYTAT Designs codebase.

### Core Principles

1. **Dependency Inversion Principle**: High-level modules should not depend on low-level modules; both should depend on abstractions.

2. **Inversion of Control**: Control of object creation and lifecycle is inverted, moving from the component to a container or framework.

3. **Interface Segregation**: Clients should not be forced to depend on methods they do not use.

4. **Single Responsibility**: Each class should have one responsibility and one reason to change.

### DI Container

We use a lightweight DI container to manage dependencies:

```javascript
// app/server/src/utils/di/container.js
class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  // Register a service factory
  register(name, factory, singleton = false) {
    this.services.set(name, { factory, singleton });
    return this;
  }

  // Get a service
  get(name, ...args) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in the container`);
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this, ...args));
      }
      return this.singletons.get(name);
    }

    return service.factory(this, ...args);
  }

  // Check if a service exists
  has(name) {
    return this.services.has(name);
  }

  // Create an instance with automatic dependency resolution
  createInstance(Constructor) {
    // Get constructor parameter names
    const paramNames = this.getParamNames(Constructor);
    
    // Resolve dependencies
    const dependencies = paramNames.map(name => this.get(name));
    
    // Create and return instance
    return new Constructor(...dependencies);
  }

  // Helper method to extract parameter names from a function
  getParamNames(func) {
    const fnStr = func.toString();
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    return result || [];
  }

  // Clear all services
  clear() {
    this.services.clear();
    this.singletons.clear();
    return this;
  }
}

// Create and export a global container instance
const container = new DIContainer();
module.exports = container;
```

### Configuring Dependencies

We initialize our container in a central configuration file:

```javascript
// app/server/src/config/di.js
const container = require('../utils/di/container');
const UserService = require('../services/userService');
const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
const ProductService = require('../services/productService');
const OrderService = require('../services/orderService');
const PaymentService = require('../services/paymentService');
const NotificationService = require('../services/notificationService');
const StripeGateway = require('../services/payment/stripeGateway');
const SendGridClient = require('../services/email/sendGridClient');
const CacheService = require('../utils/cacheService');
const Logger = require('../utils/logger');

// Register services
container
  // Core utilities (singletons)
  .register('logger', () => new Logger(), true)
  .register('cache', () => new CacheService(), true)
  
  // External service clients (singletons)
  .register('emailClient', () => new SendGridClient(process.env.SENDGRID_API_KEY), true)
  .register('paymentGateway', () => new StripeGateway(process.env.STRIPE_SECRET_KEY), true)
  
  // Application services
  .register('emailService', (container) => new EmailService(
    container.get('emailClient'),
    container.get('logger')
  ), true)
  
  .register('paymentService', (container) => new PaymentService(
    container.get('paymentGateway'),
    container.get('logger')
  ), true)
  
  .register('notificationService', (container) => new NotificationService(
    container.get('emailService'),
    container.get('logger')
  ), true)
  
  .register('userService', (container) => new UserService(
    container.get('notificationService'),
    container.get('cache'),
    container.get('logger')
  ), true)
  
  .register('authService', (container) => new AuthService(
    container.get('userService'),
    container.get('notificationService'),
    container.get('logger')
  ), true)
  
  .register('productService', (container) => new ProductService(
    container.get('cache'),
    container.get('logger')
  ), true)
  
  .register('orderService', (container) => new OrderService(
    container.get('productService'),
    container.get('userService'),
    container.get('paymentService'),
    container.get('notificationService'),
    container.get('logger')
  ), true);

module.exports = container;
```

### Using the DI Container

#### In Services

```javascript
// app/server/src/services/orderService.js
class OrderService {
  constructor(productService, userService, paymentService, notificationService, logger) {
    this.productService = productService;
    this.userService = userService;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async createOrder(userId, items, shippingInfo) {
    this.logger.info('Creating new order', { userId });
    
    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate products and calculate total
    const orderItems = [];
    let total = 0;
    
    for (const item of items) {
      const product = await this.productService.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      
      orderItems.push({
        product,
        quantity: item.quantity,
        price: product.price
      });
      
      total += product.price * item.quantity;
    }
    
    // Create order in database
    const order = await Order.create({
      userId,
      items: orderItems,
      total,
      shippingInfo,
      status: 'pending'
    });
    
    // Process payment
    const paymentResult = await this.paymentService.processPayment(user, total, order.id);
    
    // Update order with payment information
    await order.update({
      paymentId: paymentResult.id,
      status: paymentResult.status === 'succeeded' ? 'paid' : 'payment_pending'
    });
    
    // Send notification
    await this.notificationService.sendOrderConfirmation(user, order);
    
    // Update inventory
    for (const item of orderItems) {
      await this.productService.decreaseStock(item.product.id, item.quantity);
    }
    
    return order;
  }
  
  // Other methods...
}

module.exports = OrderService;
```

#### In Controllers

```javascript
// app/server/src/controllers/orderController.js
const container = require('../config/di');

const orderController = {
  async createOrder(req, res) {
    try {
      const orderService = container.get('orderService');
      const order = await orderService.createOrder(
        req.user.id,
        req.body.items,
        req.body.shippingInfo
      );
      
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Other controller methods...
};

module.exports = orderController;
```

### Advanced Usage: Automatic Dependency Resolution

We can also use the container to automatically resolve dependencies based on constructor parameter names:

```javascript
// app/server/src/utils/di/injectable.js
const container = require('./container');

// Decorator-like function for automatic dependency injection
function injectable(target) {
  return function(...args) {
    // If arguments are provided, use them
    if (args.length > 0) {
      return new target(...args);
    }
    
    // Otherwise, resolve dependencies automatically
    return container.createInstance(target);
  };
}

module.exports = injectable;
```

Usage:

```javascript
// app/server/src/services/reportService.js
const injectable = require('../utils/di/injectable');

class ReportService {
  constructor(orderService, userService, logger) {
    this.orderService = orderService;
    this.userService = userService;
    this.logger = logger;
  }
  
  async generateSalesReport(startDate, endDate) {
    this.logger.info('Generating sales report', { startDate, endDate });
    
    // Implementation...
  }
}

// Export an injectable version of the service
module.exports = injectable(ReportService);
```

Then use it:

```javascript
const ReportService = require('../services/reportService');

// Dependencies are automatically resolved
const reportService = new ReportService();
```

## Testing with Dependency Injection

One of the main benefits of DI is improved testability through easy mocking of dependencies:

```javascript
// app/tests/services/orderService.test.js
const OrderService = require('../../services/orderService');
const { expect } = require('chai');
const sinon = require('sinon');

describe('OrderService', () => {
  let orderService;
  let mockProductService;
  let mockUserService;
  let mockPaymentService;
  let mockNotificationService;
  let mockLogger;
  
  beforeEach(() => {
    // Create mock dependencies
    mockProductService = {
      findById: sinon.stub(),
      decreaseStock: sinon.stub()
    };
    
    mockUserService = {
      findById: sinon.stub()
    };
    
    mockPaymentService = {
      processPayment: sinon.stub()
    };
    
    mockNotificationService = {
      sendOrderConfirmation: sinon.stub()
    };
    
    mockLogger = {
      info: sinon.stub(),
      error: sinon.stub()
    };
    
    // Create service with mock dependencies
    orderService = new OrderService(
      mockProductService,
      mockUserService,
      mockPaymentService,
      mockNotificationService,
      mockLogger
    );
  });
  
  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      // Setup mocks
      mockUserService.findById.resolves({ id: 'user1', email: 'user@example.com' });
      mockProductService.findById.resolves({ id: 'product1', name: 'Test Product', price: 100, stock: 10 });
      mockPaymentService.processPayment.resolves({ id: 'payment1', status: 'succeeded' });
      mockNotificationService.sendOrderConfirmation.resolves();
      mockProductService.decreaseStock.resolves();
      
      // Stub Order.create and order.update
      const orderStub = {
        id: 'order1',
        update: sinon.stub().resolves()
      };
      global.Order = {
        create: sinon.stub().resolves(orderStub)
      };
      
      // Call method
      const result = await orderService.createOrder(
        'user1',
        [{ productId: 'product1', quantity: 2 }],
        { address: '123 Test St' }
      );
      
      // Assertions
      expect(result).to.equal(orderStub);
      expect(mockUserService.findById.calledWith('user1')).to.be.true;
      expect(mockProductService.findById.calledWith('product1')).to.be.true;
      expect(mockPaymentService.processPayment.called).to.be.true;
      expect(mockNotificationService.sendOrderConfirmation.called).to.be.true;
      expect(mockProductService.decreaseStock.calledWith('product1', 2)).to.be.true;
    });
    
    // More tests...
  });
});
```

## Benefits of Dependency Injection

1. **Testability**: Dependencies can be easily mocked or stubbed for unit testing.

2. **Maintainability**: Components are more modular and have reduced dependencies.

3. **Flexibility**: Implementation details can be swapped without changing the dependent code.

4. **Reusability**: Components can be reused in different contexts with different dependencies.

5. **Decoupling**: Reduced tight coupling between components makes the system more robust.

## Best Practices

1. **Prefer constructor injection**: Use constructor injection for required dependencies and setter injection for optional ones.

2. **Register dependencies in one place**: Keep all dependency configuration in a central location.

3. **Design for interfaces**: Define clear interfaces that services should implement.

4. **Don't overuse**: Not everything needs to be injected; use DI where it provides clear benefits.

5. **Keep services focused**: Each service should have a single responsibility.

6. **Use meaningful names**: Name services to clearly indicate their purpose.

7. **Document dependencies**: Make it clear what dependencies a component requires.

8. **Consider performance**: For performance-critical paths, be aware of the overhead of dependency resolution.
