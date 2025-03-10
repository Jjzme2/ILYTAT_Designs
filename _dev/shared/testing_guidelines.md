# Testing Guidelines for ILYTAT Designs

## Overview

This document outlines the testing approach, tools, and best practices for the ILYTAT Designs application. Following these guidelines will help ensure consistent, maintainable, and effective tests.

## Testing Approach

ILYTAT Designs implements a comprehensive testing strategy that includes:

1. **Unit Tests**: Testing individual functions, methods, or components in isolation
2. **Integration Tests**: Testing interactions between modules
3. **API Tests**: Testing API endpoints
4. **End-to-End Tests**: Testing complete user workflows

## Testing Tools

### Server-Side Testing

- **Test Framework**: Mocha
- **Assertion Library**: Chai
- **Mocking Library**: Sinon
- **Test Database**: SQLite in-memory for tests
- **API Testing**: Supertest

### Client-Side Testing

- **Test Framework**: Vitest
- **Component Testing**: Vue Test Utils
- **End-to-End Testing**: Cypress

## Test Directory Structure

```
app/
├── server/
│   ├── src/
│   └── tests/
│       ├── unit/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── utils/
│       ├── integration/
│       │   ├── api/
│       │   └── db/
│       ├── fixtures/
│       ├── helpers/
│       └── setup.js
├── client/
│   ├── src/
│   └── tests/
│       ├── unit/
│       │   ├── components/
│       │   ├── views/
│       │   ├── store/
│       │   └── utils/
│       ├── e2e/
│       ├── fixtures/
│       └── setup.js
```

## Server-Side Testing Guidelines

### Unit Tests

Each unit test should:

1. Test a single unit of functionality
2. Be independent of other tests
3. Mock external dependencies
4. Cover both success and error cases

Example:

```javascript
// app/server/tests/unit/services/authService.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const AuthService = require('../../../src/services/authService');

describe('AuthService', () => {
  let authService;
  let userServiceMock;
  let tokenServiceMock;
  let loggerMock;
  
  beforeEach(() => {
    // Setup mocks
    userServiceMock = {
      findByEmail: sinon.stub(),
      createUser: sinon.stub()
    };
    
    tokenServiceMock = {
      generateToken: sinon.stub(),
      verifyToken: sinon.stub()
    };
    
    loggerMock = {
      info: sinon.stub(),
      error: sinon.stub()
    };
    
    // Create service with mocks
    authService = new AuthService(userServiceMock, tokenServiceMock, loggerMock);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('login', () => {
    it('should return a token when credentials are valid', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$MmfcMf.MmfcMf...',
        role: 'user'
      };
      
      const mockToken = 'jwt.token.here';
      
      userServiceMock.findByEmail.resolves(mockUser);
      
      // Use real bcrypt here to avoid having to mock it
      const bcrypt = require('bcryptjs');
      const compare = sinon.stub(bcrypt, 'compare');
      compare.resolves(true);
      
      tokenServiceMock.generateToken.returns(mockToken);
      
      // Act
      const result = await authService.login('test@example.com', 'password123');
      
      // Assert
      expect(result).to.deep.equal({
        token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        }
      });
      
      expect(userServiceMock.findByEmail.calledWith('test@example.com')).to.be.true;
      expect(compare.calledWith('password123', mockUser.password)).to.be.true;
      expect(tokenServiceMock.generateToken.calledOnce).to.be.true;
    });
    
    it('should throw an error when user is not found', async () => {
      // Arrange
      userServiceMock.findByEmail.resolves(null);
      
      // Act & Assert
      try {
        await authService.login('nonexistent@example.com', 'password123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Invalid email or password');
      }
    });
    
    // More test cases...
  });
  
  // More test suites...
});
```

### Integration Tests

Integration tests should:

1. Test interactions between multiple components
2. Use a test database (in-memory SQLite)
3. Properly set up and tear down test data
4. Test realistic scenarios

Example:

```javascript
// app/server/tests/integration/api/auth.test.js
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../src/app');
const db = require('../../../src/models');
const { User } = db;
const bcrypt = require('bcryptjs');

describe('Authentication API', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.sequelize.sync({ force: true });
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await User.create({
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: hashedPassword,
      isVerified: true,
      role: 'user'
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('token');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('email', 'test@example.com');
    });
    
    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
    });
    
    // More test cases...
  });
  
  // More test suites...
});
```

### Test Hooks

Use Mocha's hooks effectively:

```javascript
before(() => {
  // Run once before all tests in the block
});

beforeEach(() => {
  // Run before each test in the block
});

afterEach(() => {
  // Run after each test in the block
});

after(() => {
  // Run once after all tests in the block
});
```

### Test Database Setup

Use a test-specific configuration:

```javascript
// app/server/tests/setup.js
process.env.NODE_ENV = 'test';

// Use in-memory SQLite for tests
const config = require('../src/config/database');
config.test = {
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
};

// Force tests to use test config
process.env.DB_ENV = 'test';
```

## Client-Side Testing Guidelines

### Unit Tests

Client-side unit tests should:

1. Test components in isolation
2. Mock dependencies and API calls
3. Test component props, events, and behavior

Example:

```javascript
// app/client/tests/unit/components/LoginForm.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import LoginForm from '@/components/LoginForm.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('LoginForm.vue', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })
  
  it('renders correctly', () => {
    const wrapper = mount(LoginForm)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })
  
  it('validates input fields', async () => {
    const wrapper = mount(LoginForm)
    
    // Submit form without input
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check for validation messages
    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
    
    // Fill email field
    await wrapper.find('input[type="email"]').setValue('test@example')
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check for email format validation
    expect(wrapper.text()).toContain('Please enter a valid email address')
    
    // Fill valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password')
    
    // Mock auth store
    const authStore = {
      login: vi.fn().mockResolvedValue({ success: true })
    }
    
    // Override component's auth store
    wrapper.vm.authStore = authStore
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check if login was called with correct parameters
    expect(authStore.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })
  
  // More test cases...
})
```

### End-to-End Tests

E2E tests should:

1. Test complete user workflows
2. Run in a real browser
3. Use test data fixtures
4. Test critical business flows

Example:

```javascript
// app/client/tests/e2e/login.spec.js
describe('Login Flow', () => {
  beforeEach(() => {
    // Reset database and seed test data through API/backend
    cy.request('POST', '/api/test/reset')
    cy.request('POST', '/api/test/seed')
  })
  
  it('should login successfully with valid credentials', () => {
    cy.visit('/login')
    
    // Fill the form
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('Password123!')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Verify redirection to dashboard
    cy.url().should('include', '/dashboard')
    
    // Verify user is logged in
    cy.get('.user-menu').should('contain', 'Test User')
  })
  
  it('should show error with invalid credentials', () => {
    cy.visit('/login')
    
    // Fill the form with invalid credentials
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Verify error message
    cy.get('.alert-error').should('be.visible')
    cy.get('.alert-error').should('contain', 'Invalid email or password')
    
    // Verify URL is still login page
    cy.url().should('include', '/login')
  })
  
  // More test cases...
})
```

## Test Coverage

### Coverage Goals

Aim for the following coverage targets:

- Server-side: At least 80% line coverage
- Client-side: At least 70% line coverage
- Critical business logic: 100% coverage

### Measuring Coverage

For server-side:

```bash
npm run test:coverage
```

This will use NYC (Istanbul) to generate coverage reports in the `coverage` directory.

For client-side:

```bash
npm run test:unit:coverage
```

This will use Vitest's built-in coverage reporter to generate coverage reports.

## Test Performance

1. Keep tests fast by minimizing external dependencies
2. Use in-memory databases for tests
3. Mock external services
4. Use proper test isolation

## Mock Services and Data

### Mock Services

Create reusable mock services:

```javascript
// app/server/tests/helpers/mocks.js
const sinon = require('sinon');

module.exports = {
  createLoggerMock() {
    return {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    };
  },
  
  createMailServiceMock() {
    return {
      sendMail: sinon.stub().resolves({ messageId: 'mock-id' })
    };
  },
  
  // More mock factories...
};
```

### Test Fixtures

Create reusable test data:

```javascript
// app/server/tests/fixtures/users.js
module.exports = {
  validUser: {
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: 'Password123!',
    role: 'user'
  },
  
  adminUser: {
    email: 'admin@example.com',
    username: 'adminuser',
    firstName: 'Admin',
    lastName: 'User',
    password: 'AdminPassword123!',
    role: 'admin'
  },
  
  // More test fixtures...
};
```

## Continuous Integration

Set up CI to run tests automatically:

1. Run linting
2. Run unit tests
3. Run integration tests
4. Run E2E tests (on critical paths)
5. Generate and check coverage reports

## Best Practices

1. **Write tests first** (TDD) when possible to ensure testable code
2. **Keep tests simple** and focused on a single aspect
3. **Use descriptive test names** that explain what's being tested
4. **Test edge cases** and error conditions
5. **Avoid testing implementation details** and focus on behavior
6. **Separate test logic from test data** using fixtures and factories
7. **Don't test external libraries** but do test your integration with them
8. **Clean up after tests** to keep the test environment pristine
9. **Avoid test interdependence** as it leads to brittle tests
10. **Maintain your tests** along with your code and refactor when needed

## Additional Resources

- Mocha documentation: [https://mochajs.org/](https://mochajs.org/)
- Chai documentation: [https://www.chaijs.com/](https://www.chaijs.com/)
- Sinon documentation: [https://sinonjs.org/](https://sinonjs.org/)
- Vitest documentation: [https://vitest.dev/](https://vitest.dev/)
- Vue Test Utils documentation: [https://test-utils.vuejs.org/](https://test-utils.vuejs.org/)
- Cypress documentation: [https://docs.cypress.io/](https://docs.cypress.io/)
