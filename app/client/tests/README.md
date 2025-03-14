# ILYTAT Designs Testing Documentation

This directory contains tests for the ILYTAT Designs client application. The test suite uses Jest as the test runner along with Vue Test Utils and Testing Library for testing Vue components.

## Table of Contents

- [Directory Structure](#directory-structure)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mocking](#mocking)
- [Best Practices](#best-practices)

## Directory Structure

```
tests/
├── setup.js               # Global Jest setup file
├── unit/                  # Unit tests directory
│   ├── components/        # Tests for Vue components
│   ├── stores/            # Tests for Pinia stores
│   └── utils/             # Tests for utility functions
├── integration/           # Integration tests
└── README.md              # This documentation
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components, functions, or modules in isolation. They are fast and help identify issues in specific pieces of code.

- **Component Tests**: Test the rendering and behavior of Vue components
- **Store Tests**: Verify Pinia store actions, mutations, and state management
- **Utility Tests**: Check utility/helper functions for correct output given various inputs

### Integration Tests

Integration tests verify that different parts of the application work together correctly. These tests can include:

- Store-to-component integration
- API-to-store integration
- Multi-component workflows

## Running Tests

You can run tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode (run tests impacted by changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### Testing Vue Components

For Vue components, we use a combination of `@vue/test-utils` and `@testing-library/vue`:

```javascript
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MyComponent from '@/components/MyComponent.vue';

describe('MyComponent', () => {
  test('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [createTestingPinia()]
      }
    });
    
    expect(wrapper.find('.my-class').exists()).toBe(true);
    expect(wrapper.text()).toContain('Expected Text');
  });
  
  test('reacts to user input', async () => {
    const wrapper = mount(MyComponent);
    await wrapper.find('button').trigger('click');
    
    expect(wrapper.emitted().click).toBeTruthy();
  });
});
```

### Testing Pinia Stores

For testing Pinia stores, we use the `@pinia/testing` library:

```javascript
import { setActivePinia, createPinia } from 'pinia';
import { useMyStore } from '@/stores/myStore';

describe('MyStore', () => {
  let store;
  
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
    store = useMyStore();
  });
  
  test('initializes with correct state', () => {
    expect(store.someValue).toBe(expectedValue);
  });
  
  test('action updates state correctly', async () => {
    await store.myAction(payload);
    expect(store.someValue).toBe(newExpectedValue);
  });
});
```

### Testing API Calls

When testing code that makes API calls, mock the HTTP client (Axios):

```javascript
import axios from 'axios';
import { useMyStore } from '@/stores/myStore';

// Mock axios
jest.mock('axios');

describe('API Interactions', () => {
  beforeEach(() => {
    // Reset mocks before each test
    axios.get.mockReset();
  });
  
  test('fetches data successfully', async () => {
    // Set up mock response
    axios.get.mockResolvedValue({
      data: { /* mock response data */ }
    });
    
    // Call the function that uses axios
    const result = await myFunction();
    
    // Verify axios was called correctly
    expect(axios.get).toHaveBeenCalledWith('/expected/url');
    
    // Verify the function returned the expected result
    expect(result).toEqual(expected);
  });
});
```

## Mocking

### Mocking Dependencies

Use Jest's mocking capabilities to replace external dependencies:

```javascript
jest.mock('@/services/myService', () => ({
  getSomething: jest.fn().mockResolvedValue('mocked value'),
  doSomethingElse: jest.fn()
}));
```

### Mocking Vue Router

When testing components that use Vue Router:

```javascript
import { createRouter, createWebHistory } from 'vue-router';

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/product/:id', name: 'product-detail' }
  ]
});

// Mock route push or replace if needed
router.push = jest.fn();

// Use the router in a component test
const wrapper = mount(MyComponent, {
  global: {
    plugins: [router]
  }
});
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Use descriptive test names** - Make it clear what you're testing and what outcome is expected
3. **Follow the AAA pattern**:
   - **Arrange** - Set up test conditions
   - **Act** - Perform the action being tested
   - **Assert** - Verify expectations
4. **Keep tests independent** - Tests should not depend on each other
5. **Use beforeEach for setup** - Reset state before each test
6. **Mock external dependencies** - Tests should not rely on external systems
7. **Test edge cases** - Include tests for boundary conditions and error cases
8. **Keep tests fast** - Slow tests discourage running them frequently

## Coverage Reports

After running `npm run test:coverage`, a coverage report will be generated in the `coverage` directory. This report shows how much of your code is covered by tests.

Aim for high coverage, but remember that 100% coverage doesn't guarantee bug-free code. Focus on testing critical paths and edge cases that are most likely to contain bugs.
