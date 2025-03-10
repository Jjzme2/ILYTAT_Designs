# Factory Pattern in ILYTAT Designs

## Overview

The Factory Pattern is a creational design pattern that provides an interface for creating objects without specifying their concrete classes. This pattern is particularly useful for creating complex objects with many dependencies or configuration options.

## Implementation in ILYTAT Designs

We use the Factory Pattern in several places throughout the application to encapsulate object creation logic and promote code reusability.

### Types of Factories

#### 1. Simple Factory

A simple factory is a basic implementation that creates objects based on parameters.

```javascript
// app/server/src/utils/factories/responseFactory.js
class ResponseFactory {
  static createSuccess(data = null, message = 'Success') {
    return {
      success: true,
      data,
      message,
      error: null
    };
  }
  
  static createError(error, message = 'An error occurred') {
    return {
      success: false,
      data: null,
      message,
      error
    };
  }
}

module.exports = ResponseFactory;
```

Usage:
```javascript
const ResponseFactory = require('../utils/factories/responseFactory');

router.get('/products', async (req, res) => {
  try {
    const products = await ProductService.getAllProducts();
    res.json(ResponseFactory.createSuccess(products, 'Products retrieved successfully'));
  } catch (error) {
    res.status(500).json(ResponseFactory.createError(error, 'Failed to retrieve products'));
  }
});
```

#### 2. Factory Method Pattern

The Factory Method Pattern defines an interface for creating objects but allows subclasses to alter the type of objects that will be created.

```javascript
// app/server/src/utils/factories/notificationFactory.js
class NotificationFactory {
  createNotification(type, user, data) {
    throw new Error('createNotification method must be implemented by subclasses');
  }
  
  send(notification) {
    throw new Error('send method must be implemented by subclasses');
  }
}

class EmailNotificationFactory extends NotificationFactory {
  createNotification(type, user, data) {
    const templates = {
      'welcome': {
        subject: 'Welcome to ILYTAT Designs',
        template: 'welcome-email'
      },
      'order-confirmation': {
        subject: 'Your Order Confirmation',
        template: 'order-confirmation'
      },
      'password-reset': {
        subject: 'Password Reset Request',
        template: 'password-reset'
      }
    };
    
    const template = templates[type] || {
      subject: 'Notification from ILYTAT Designs',
      template: 'generic'
    };
    
    return {
      to: user.email,
      subject: template.subject,
      template: template.template,
      data: { ...data, user }
    };
  }
  
  async send(notification) {
    // Implementation of email sending logic
    return await emailService.send(notification);
  }
}

class SMSNotificationFactory extends NotificationFactory {
  createNotification(type, user, data) {
    const templates = {
      'order-confirmation': 'Your order {orderId} has been confirmed. Thank you for shopping with ILYTAT Designs!',
      'shipping-update': 'Your order {orderId} has been shipped and will arrive on {deliveryDate}.'
    };
    
    const template = templates[type] || 'Notification from ILYTAT Designs: {message}';
    
    // Replace placeholders in template
    let message = template;
    Object.keys(data).forEach(key => {
      message = message.replace(`{${key}}`, data[key]);
    });
    
    return {
      to: user.phoneNumber,
      message
    };
  }
  
  async send(notification) {
    // Implementation of SMS sending logic
    return await smsService.send(notification);
  }
}

module.exports = {
  EmailNotificationFactory,
  SMSNotificationFactory
};
```

Usage:
```javascript
const { EmailNotificationFactory, SMSNotificationFactory } = require('../utils/factories/notificationFactory');

async function sendOrderConfirmation(order, user) {
  const emailFactory = new EmailNotificationFactory();
  const emailNotification = emailFactory.createNotification('order-confirmation', user, { 
    orderId: order.id,
    items: order.items,
    total: order.total
  });
  await emailFactory.send(emailNotification);
  
  // If user has phone number, also send SMS
  if (user.phoneNumber) {
    const smsFactory = new SMSNotificationFactory();
    const smsNotification = smsFactory.createNotification('order-confirmation', user, { 
      orderId: order.id
    });
    await smsFactory.send(smsNotification);
  }
}
```

#### 3. Abstract Factory Pattern

The Abstract Factory Pattern provides an interface for creating families of related or dependent objects without specifying their concrete classes.

```javascript
// app/server/src/utils/factories/reportFactory.js
class ReportFactory {
  createReport() {
    throw new Error('createReport method must be implemented by subclasses');
  }
  
  createDataSource() {
    throw new Error('createDataSource method must be implemented by subclasses');
  }
  
  createFormatter() {
    throw new Error('createFormatter method must be implemented by subclasses');
  }
}

class SalesReportFactory extends ReportFactory {
  createReport(options) {
    const dataSource = this.createDataSource(options);
    const formatter = this.createFormatter(options);
    
    return {
      title: 'Sales Report',
      generate: async () => {
        const data = await dataSource.fetchData();
        return formatter.format(data);
      }
    };
  }
  
  createDataSource(options) {
    return {
      fetchData: async () => {
        // Implementation to fetch sales data from database
        return await SalesModel.findAll({
          where: {
            createdAt: {
              [Op.between]: [options.startDate, options.endDate]
            }
          },
          include: [
            { model: ProductModel },
            { model: CustomerModel }
          ]
        });
      }
    };
  }
  
  createFormatter(options) {
    if (options.format === 'pdf') {
      return {
        format: (data) => {
          // Implementation to format data for PDF
          return pdfService.generateReport(data, 'sales-report-template');
        }
      };
    } else if (options.format === 'csv') {
      return {
        format: (data) => {
          // Implementation to format data for CSV
          return csvService.generateReport(data);
        }
      };
    } else {
      return {
        format: (data) => {
          // Default JSON format
          return JSON.stringify(data);
        }
      };
    }
  }
}

class InventoryReportFactory extends ReportFactory {
  // Similar implementation for inventory reports
  // ...
}

module.exports = {
  SalesReportFactory,
  InventoryReportFactory
};
```

Usage:
```javascript
const { SalesReportFactory } = require('../utils/factories/reportFactory');

router.get('/reports/sales', async (req, res) => {
  try {
    const factory = new SalesReportFactory();
    const report = factory.createReport({
      startDate: new Date(req.query.startDate),
      endDate: new Date(req.query.endDate),
      format: req.query.format || 'json'
    });
    
    const result = await report.generate();
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});
```

## Benefits of Using the Factory Pattern

1. **Encapsulation of creation logic**: The implementation details of object creation are encapsulated in the factory.

2. **Code reusability**: Factory methods can be reused throughout the application.

3. **Flexibility**: New product types can be added without changing existing code.

4. **Testability**: Factory methods can be mocked for testing.

5. **Single Responsibility Principle**: Separates object creation from object use.

## When to Use Factory Patterns

Use Factory patterns when:

1. The creation of an object involves complex logic beyond simple instantiation.

2. You need to create objects based on certain conditions or configurations.

3. You want to decouple object creation from object use.

4. You need to create families of related objects.

5. You want to provide a consistent interface for creating different types of objects.

## When Not to Use Factory Patterns

Avoid Factory patterns when:

1. Object creation is simple and doesn't require additional logic.

2. It adds unnecessary complexity for simple object creation.

3. There are no variations in the objects being created.

## Factory Pattern in Testing

Factories are particularly useful for creating test fixtures:

```javascript
// app/tests/utils/factories/testUserFactory.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class TestUserFactory {
  static async createOne(overrides = {}) {
    // Create a user for testing
    return {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      password: await bcrypt.hash('Password123!', 10),
      isVerified: true,
      role: 'user',
      ...overrides
    };
  }
  
  static async createInDatabase(overrides = {}) {
    const userData = await this.createOne(overrides);
    return await User.create(userData);
  }
}

module.exports = TestUserFactory;
```

Usage in tests:
```javascript
const TestUserFactory = require('../utils/factories/testUserFactory');

describe('User Authentication', () => {
  let testUser;
  
  beforeEach(async () => {
    testUser = await TestUserFactory.createInDatabase();
  });
  
  it('should allow a user to login with valid credentials', async () => {
    // Test implementation
  });
});
```
