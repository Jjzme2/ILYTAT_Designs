/**
 * Jest setup file that runs before tests
 */

// Import jest-dom for DOM element matchers
import '@testing-library/jest-dom';

// Mock Vite environment variables
globalThis.import = {
  meta: {
    env: {
      MODE: 'test',
      VITE_API_URL: 'http://localhost:3000',
      VITE_PRINTIFY_BASE_URL: 'https://api.printify.com/v1',
      VITE_PRINTIFY_PUBLIC_ENDPOINT: '/api/printifyApi/public',
      VITE_PRINTIFY_ADMIN_ENDPOINT: '/api/printifyApi/admin',
      // Add any other environment variables used in your application
    }
  }
};

// This sets up console mocks to make test output cleaner
// You can comment these out if you want to see console messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Silence console during tests but save errors for review
global.consoleErrors = [];
global.consoleWarnings = [];

console.error = (...args) => {
  global.consoleErrors.push(args);
};

console.warn = (...args) => {
  global.consoleWarnings.push(args);
};

console.log = (...args) => {
  // Uncomment if you need to debug something specific
  // originalConsoleLog(...args);
};

// Restore console when tests finish
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
