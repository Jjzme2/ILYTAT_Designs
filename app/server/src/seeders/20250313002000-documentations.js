'use strict';

/**
 * Documentation Seeder
 * 
 * This seeder creates initial documentation records for the ILYTAT Designs application.
 * These documents provide useful information for both users and administrators.
 * 
 * @module seeders/documentations
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const loggerInstance = logger.child({ component: 'DocumentationsSeeder' });
    loggerInstance.info('Starting documentations seeder');

    try {
      // Define timestamp for consistency
      const now = new Date();
      
      // ===== DOCUMENTATION CATEGORIES =====
      loggerInstance.info('Creating documentation categories');
      
      const docCategories = [
        {
          id: uuidv4(),
          name: 'user_guides',
          displayName: 'User Guides',
          description: 'Guides and tutorials for using the application',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'admin_guides',
          displayName: 'Admin Guides',
          description: 'Guides for administrative users',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'api_docs',
          displayName: 'API Documentation',
          description: 'Documentation for the application APIs',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'developer_docs',
          displayName: 'Developer Documentation',
          description: 'Technical documentation for developers',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'faqs',
          displayName: 'FAQs',
          description: 'Frequently Asked Questions',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      await queryInterface.bulkInsert('documentation_categories', docCategories);
      
      // Get category IDs for reference
      const [categoryRecords] = await queryInterface.sequelize.query(
        'SELECT id, name FROM documentation_categories'
      );
      
      // Create category map for easier access
      const categoryMap = categoryRecords.reduce((map, category) => {
        map[category.name] = category.id;
        return map;
      }, {});
      
      // ===== DOCUMENTATION RECORDS =====
      loggerInstance.info('Creating documentation records');
      
      const documentations = [
        // User Guides
        {
          id: uuidv4(),
          categoryId: categoryMap.user_guides,
          title: 'Getting Started',
          slug: 'getting-started',
          content: `# Getting Started with ILYTAT Designs

Welcome to ILYTAT Designs! This guide will help you navigate our platform and make the most of your shopping experience.

## Creating an Account

1. Click on the "Sign Up" button in the top-right corner
2. Fill in your details in the registration form
3. Verify your email address
4. Log in with your new credentials

## Browsing Products

Our products are organized by categories. You can:
- Browse the featured products on our homepage
- Use the search bar to find specific products
- Use the category menu to browse by product type

## Making a Purchase

1. Select a product you'd like to purchase
2. Choose your preferred options (size, color, etc.)
3. Add the item to your cart
4. Proceed to checkout
5. Fill in your shipping and payment details
6. Complete your order

## Managing Your Account

From your account dashboard, you can:
- View your order history
- Update your profile information
- Manage your shipping addresses
- Track your current orders

If you need any assistance, don't hesitate to contact our customer support team!`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          categoryId: categoryMap.user_guides,
          title: 'Account Management',
          slug: 'account-management',
          content: `# Managing Your Account

This guide covers everything you need to know about managing your ILYTAT Designs account.

## Profile Settings

Access your profile settings by clicking on your username in the top-right corner and selecting "Profile." Here, you can:
- Update your name, email, and password
- Add a profile picture
- Set your communication preferences

## Address Book

Manage your shipping and billing addresses for faster checkout:
1. Go to "My Account" > "Address Book"
2. Add new addresses or edit existing ones
3. Set your default shipping and billing addresses

## Order History

View and manage your past orders:
1. Go to "My Account" > "Order History"
2. Click on any order to view its details
3. Track shipments or request returns if needed

## Payment Methods

Securely store payment methods for future purchases:
1. Go to "My Account" > "Payment Methods"
2. Add new payment methods
3. Set your default payment method

## Security

We take your account security seriously. You can:
- Enable two-factor authentication
- View login history
- Manage connected devices

If you notice any suspicious activity, please contact us immediately.`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        },
        
        // Admin Guides
        {
          id: uuidv4(),
          categoryId: categoryMap.admin_guides,
          title: 'Admin Dashboard Overview',
          slug: 'admin-dashboard-overview',
          content: `# Admin Dashboard Overview

This guide provides an overview of the ILYTAT Designs admin dashboard and its key features.

## Accessing the Dashboard

1. Log in with your admin credentials
2. You will automatically be redirected to the admin dashboard
3. If not, click on your username and select "Admin Dashboard"

## Dashboard Components

The dashboard is divided into several sections:

### Overview
- Summary of recent activity
- Key metrics (sales, orders, customers)
- Quick access to common tasks

### Orders Management
- View and process orders
- Update order status
- Handle returns and refunds

### Product Management
- Add, edit, or remove products
- Manage product categories
- Set featured and bestselling products

### Customer Management
- View customer information
- Manage customer accounts
- Review customer feedback

### Content Management
- Update website content
- Manage blog posts
- Edit static pages

### Reports
- Sales reports
- Inventory reports
- Customer analytics

### Settings
- System configuration
- User and permission management
- Integration settings

## Customizing Your Dashboard

You can customize your dashboard view:
1. Click on "Customize Dashboard" in the top-right corner
2. Drag and drop widgets to rearrange them
3. Add or remove widgets based on your preferences
4. Save your layout

Remember, different admin roles may have access to different dashboard features based on their permissions.`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          categoryId: categoryMap.admin_guides,
          title: 'Managing Featured Products',
          slug: 'managing-featured-products',
          content: `# Managing Featured Products

This guide explains how to manage featured and bestselling products on the ILYTAT Designs storefront.

## Understanding Featured Products

Featured products appear prominently on the homepage and category pages. They can help:
- Highlight new arrivals
- Promote seasonal items
- Showcase popular products
- Drive sales for specific items

**Note:** We recommend limiting featured products to no more than 10 at any given time to maintain impact and ensure optimal page loading times.

## Setting a Product as Featured

1. Go to "Products" > "All Products"
2. Find the product you want to feature
3. Click "Edit"
4. In the "Visibility" section, check "Featured Product"
5. Set a display order (lower numbers appear first)
6. Click "Save"

Alternatively, use the bulk actions:
1. Select multiple products from the product list
2. Open the "Bulk Actions" dropdown
3. Select "Mark as Featured"
4. Set display order (will be applied sequentially)
5. Click "Apply"

## Managing Bestselling Products

Bestselling products can be:
- Automatically determined based on sales data
- Manually set by administrators

To manually set bestsellers:
1. Go to "Products" > "All Products"
2. Find the product to mark as bestseller
3. Click "Edit"
4. In the "Visibility" section, check "Bestseller"
5. Set a display order
6. Click "Save"

## Viewing and Managing All Featured Products

For a dedicated interface to manage all featured products:
1. Go to "Products" > "Featured Products"
2. This view shows all current featured and bestselling products
3. Drag and drop to reorder products
4. Toggle featured/bestseller status directly from this screen
5. Remove products from the lists as needed

## Best Practices

- Regularly update featured products to keep content fresh
- Align featured products with current marketing campaigns
- Balance between bestsellers and new/seasonal items
- Use high-quality images for featured products
- Keep the number of featured products between 4-10
- Consider mobile viewing experience when selecting products

Remember, featuring too many products dilutes their impact. Focus on quality over quantity.`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        },
        
        // Developer Docs
        {
          id: uuidv4(),
          categoryId: categoryMap.developer_docs,
          title: 'Database Seeding Guide',
          slug: 'database-seeding-guide',
          content: `# Database Seeding Guide

This guide explains how to use and create database seeders for the ILYTAT Designs application.

## Introduction to Seeders

Seeders allow us to populate our database with initial or test data. We use Sequelize seeders to accomplish this.

## Running Existing Seeders

To run all pending seeders:
\`\`\`bash
npx sequelize-cli db:seed:all
\`\`\`

To run a specific seeder:
\`\`\`bash
npx sequelize-cli db:seed --seed name-of-seed-file
\`\`\`

To undo all seeders:
\`\`\`bash
npx sequelize-cli db:seed:undo:all
\`\`\`

## Creating a New Seeder

Generate a new seeder file:
\`\`\`bash
npx sequelize-cli seed:generate --name example-seed
\`\`\`

This creates a new file in the \`seeders/\` directory with a timestamp prefix.

## Seeder Structure

A basic seeder template:

\`\`\`javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add seed data here
    await queryInterface.bulkInsert('TableName', [
      {
        field1: 'value1',
        field2: 'value2',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // More records...
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove seed data here
    await queryInterface.bulkDelete('TableName', null, {});
  }
};
\`\`\`

## Factory Pattern for Test Data

For generating larger datasets, we use a factory pattern:

\`\`\`javascript
const createUser = (index) => ({
  username: \`user\${index}\`,
  email: \`user\${index}@example.com\`,
  password: 'hashedPassword',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Generate 100 users
const users = Array.from({ length: 100 }, (_, i) => createUser(i + 1));
await queryInterface.bulkInsert('Users', users);
\`\`\`

## Handling Relationships

For seeders with relationships, ensure you create parent records first and fetch their IDs:

\`\`\`javascript
// Create categories first
await queryInterface.bulkInsert('Categories', categories);

// Get category IDs
const [categoryRecords] = await queryInterface.sequelize.query(
  'SELECT id FROM Categories'
);

// Create products with category references
const products = productData.map((product, index) => ({
  ...product,
  categoryId: categoryRecords[index % categoryRecords.length].id
}));

await queryInterface.bulkInsert('Products', products);
\`\`\`

## Best Practices

1. Always include both \`up\` and \`down\` migrations
2. Use consistent date formats
3. Add error handling
4. Use UUIDs or incremental IDs consistently
5. Keep seeders organized by entity
6. Add descriptive comments

## Production vs. Development Seeders

- Development seeders can include more test data
- Production seeders should focus on essential initial data
- Use environment variables to conditionally run certain seeders:

\`\`\`javascript
if (process.env.NODE_ENV !== 'production') {
  // Add extensive test data
}
\`\`\`

## Troubleshooting Common Issues

- **Constraint violations**: Ensure related records exist before creating dependent records
- **Duplicate keys**: Check for unique constraints
- **Missing required fields**: Ensure all non-nullable fields have values
- **Date format issues**: Use JavaScript Date objects consistently

Need help? Contact the development team or check the documentation repository for more examples.`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          categoryId: categoryMap.developer_docs,
          title: 'Factory Pattern Implementation',
          slug: 'factory-pattern-implementation',
          content: `# Factory Pattern Implementation Guide

This guide details how we implement the Factory Pattern in the ILYTAT Designs application.

## What is the Factory Pattern?

The Factory Pattern is a creational design pattern that provides an interface for creating objects without specifying their concrete classes. It encapsulates object creation logic, making the system more maintainable and decoupled.

## Types of Factories Used in Our Codebase

### 1. Simple Factory

A simple factory creates objects without exposing instantiation logic:

\`\`\`javascript
// services/factories/paymentProcessorFactory.js
class PaymentProcessorFactory {
  static create(type) {
    switch (type) {
      case 'stripe':
        return new StripeProcessor();
      case 'paypal':
        return new PayPalProcessor();
      default:
        throw new Error(\`Unsupported payment processor: \${type}\`);
    }
  }
}

module.exports = PaymentProcessorFactory;
\`\`\`

Usage:
\`\`\`javascript
const processor = PaymentProcessorFactory.create('stripe');
await processor.processPayment(order);
\`\`\`

### 2. Factory Method Pattern

The Factory Method defines an interface for creating objects, but lets subclasses decide which classes to instantiate:

\`\`\`javascript
// Base class with factory method
class ReportGenerator {
  generate(data) {
    const formatter = this.createFormatter();
    return formatter.format(data);
  }
  
  createFormatter() {
    throw new Error('Subclasses must implement createFormatter()');
  }
}

// Concrete implementations
class PDFReportGenerator extends ReportGenerator {
  createFormatter() {
    return new PDFFormatter();
  }
}

class CSVReportGenerator extends ReportGenerator {
  createFormatter() {
    return new CSVFormatter();
  }
}
\`\`\`

### 3. Abstract Factory Pattern

Abstract Factory provides an interface for creating families of related objects:

\`\`\`javascript
// Abstract Factory interface
class UIFactory {
  createButton() { throw new Error('Not implemented'); }
  createForm() { throw new Error('Not implemented'); }
  createNavigation() { throw new Error('Not implemented'); }
}

// Concrete factories
class MobileUIFactory extends UIFactory {
  createButton() { return new MobileButton(); }
  createForm() { return new MobileForm(); }
  createNavigation() { return new MobileNavigation(); }
}

class DesktopUIFactory extends UIFactory {
  createButton() { return new DesktopButton(); }
  createForm() { return new DesktopForm(); }
  createNavigation() { return new DesktopNavigation(); }
}
\`\`\`

## Test Data Factories

We use factories to generate test data for both testing and development:

\`\`\`javascript
// Test data factory for users
const userFactory = {
  build(overrides = {}) {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  },
  
  buildList(count, overrides = {}) {
    return Array.from({ length: count }, () => this.build(overrides));
  },
  
  async create(overrides = {}) {
    const userData = this.build(overrides);
    return await User.create(userData);
  },
  
  async createList(count, overrides = {}) {
    const usersData = this.buildList(count, overrides);
    return await User.bulkCreate(usersData);
  }
};
\`\`\`

## Dependency Injection with Factories

We combine factories with dependency injection for flexible component creation:

\`\`\`javascript
class ServiceFactory {
  constructor(container) {
    this.container = container;
  }
  
  createUserService() {
    const userRepository = this.container.get('userRepository');
    const emailService = this.container.get('emailService');
    return new UserService(userRepository, emailService);
  }
  
  createOrderService() {
    const orderRepository = this.container.get('orderRepository');
    const paymentService = this.container.get('paymentService');
    const inventoryService = this.container.get('inventoryService');
    return new OrderService(orderRepository, paymentService, inventoryService);
  }
}
\`\`\`

## Best Practices

1. Use factories when object creation logic is complex
2. Keep factories focused on a single responsibility
3. Consider using dependency injection with factories
4. Document factory methods and their parameters
5. Use meaningful names for factory methods
6. Implement robust error handling for invalid inputs
7. Consider using a registry pattern for dynamic factory types

## Example Implementation

Review our implementation in:
- \`utils/factories/\` for application factories
- \`tests/factories/\` for test data factories

For further assistance, contact the development team.`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        },
        
        // FAQs
        {
          id: uuidv4(),
          categoryId: categoryMap.faqs,
          title: 'Shopping FAQs',
          slug: 'shopping-faqs',
          content: `# Shopping FAQs

## General Shopping Questions

### How do I create an account?
Click on the "Sign Up" button in the top-right corner of our website. Fill in your details, verify your email address, and you're ready to shop!

### Do I need an account to make a purchase?
While you can browse our products without an account, you'll need to create one to complete a purchase. This allows you to track your orders and manage your shopping preferences.

### How can I find specific products?
You can search for products using the search bar at the top of our website. You can also browse by category using the navigation menu.

### Are the product images accurate?
Yes, we strive to provide accurate representations of our products. However, slight variations in color may occur due to different monitor settings.

## Orders & Payments

### What payment methods do you accept?
We accept credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay.

### Is my payment information secure?
Absolutely. We use industry-standard encryption and secure payment processors to protect your financial information.

### How can I track my order?
Once your order ships, you'll receive a tracking number via email. You can also view your order status in your account dashboard.

### Can I modify or cancel my order?
You can modify or cancel your order within 1 hour of placing it. After that, please contact our customer service team for assistance.

### Do you offer gift wrapping?
Yes, you can select gift wrapping during checkout for a small additional fee.

## Shipping & Returns

### What are your shipping options?
We offer standard shipping (5-7 business days), expedited shipping (2-3 business days), and express shipping (1 business day).

### Do you ship internationally?
Yes, we ship to most countries worldwide. Shipping times and fees vary by location.

### What is your return policy?
We accept returns within 30 days of purchase for unused items in their original packaging. Some items, like personalized products, cannot be returned.

### How do I return a product?
To initiate a return, go to your order history, select the order containing the item you wish to return, and follow the return instructions.

### Who pays for return shipping?
For returns due to our error (wrong item, defective product), we cover return shipping. For other returns, the customer is responsible for return shipping costs.

## Product-Specific Questions

### Are your products handmade?
Many of our products are handcrafted or feature handmade elements. Product descriptions specify whether an item is handmade.

### Do you offer customization?
Yes, many of our products can be customized. Look for the "Customize" option on product pages.

### How do I care for my purchases?
Care instructions are included with each product and can also be found on the product page.

### Are your products eco-friendly?
We strive to offer eco-friendly options whenever possible. Look for our "Eco-Friendly" badge on qualifying products.

### Do you have a product warranty?
Yes, our products come with a 1-year warranty against manufacturing defects. Certain restrictions apply; please see our warranty page for details.

If you have additional questions not answered here, please contact our customer support team at support@ilytatdesigns.com or call us at (555) 123-4567 during business hours.`,
          isPublished: true,
          publishedAt: now,
          createdBy: 1, // Admin user
          updatedBy: 1,
          createdAt: now,
          updatedAt: now
        }
      ];
      
      await queryInterface.bulkInsert('documentations', documentations);
      
      loggerInstance.info(`Successfully seeded ${docCategories.length} documentation categories and ${documentations.length} documentation records`);
      
    } catch (error) {
      loggerInstance.error('Error in documentations seeder', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const loggerInstance = logger.child({ component: 'DocumentationsSeeder' });
    loggerInstance.info('Reverting documentations seeder');
    
    try {
      // Remove all seeded records in reverse order
      await queryInterface.bulkDelete('documentations', null, {});
      await queryInterface.bulkDelete('documentation_categories', null, {});
      
      loggerInstance.info('Successfully reverted documentations seeder');
    } catch (error) {
      loggerInstance.error('Error reverting documentations seeder', { error: error.message });
      throw error;
    }
  }
};
