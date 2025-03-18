/**
 * Jest Setup File
 * 
 * This file runs before each test file to set up the test environment.
 * It loads environment variables and performs any necessary global setup.
 */

// Load environment variables
try {
  require('dotenv').config({ path: '.env.test' });
} catch (error) {
  console.log('No .env.test file found, using default test values');
}

// Set test environment
process.env.NODE_ENV = 'test';

// Set default test environment variables if not present
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret';
}

if (!process.env.DEFAULT_PRINTIFY_SHOP_ID) {
  process.env.DEFAULT_PRINTIFY_SHOP_ID = 'test-shop-id';
}

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Uncomment to suppress specific console methods during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn() // Keep error messages but mock them for assertions
};

// Global beforeAll hook
beforeAll(() => {
  // Any setup needed before all tests run
});

// Global afterAll hook
afterAll(() => {
  // Any cleanup needed after all tests complete
});
