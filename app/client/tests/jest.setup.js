/**
 * Jest setup file for advanced mocking and configuration
 */

// Mock Vite's import.meta.env
globalThis.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3000',
      VITE_PRINTIFY_BASE_URL: 'https://api.printify.com/v1',
      VITE_PRINTIFY_PUBLIC_ENDPOINT: '/api/printifyApi/public',
      VITE_PRINTIFY_ADMIN_ENDPOINT: '/api/printifyApi/admin',
      MODE: 'test'
    }
  }
};

// Set global test environment variables
process.env.USE_MOCKS = 'true';

// We'll handle mocking in individual test files using dynamic imports
// This avoids the CommonJS/ESM mismatch issues
