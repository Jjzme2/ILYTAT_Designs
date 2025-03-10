/**
 * Test Setup for Email Service Testing
 * Initializes the testing environment for email service tests
 */

// Configure test environment with mocha
process.env.NODE_ENV = 'test';

// Dependencies
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// Use sinon-chai for expressive assertions
chai.use(sinonChai);

// Export common testing utilities
module.exports = {
  chai,
  expect: chai.expect,
  sinon,
  // Mock environment variables for testing
  mockEnv: (variables) => {
    const originalEnv = { ...process.env };
    
    beforeEach(() => {
      Object.entries(variables).forEach(([key, value]) => {
        process.env[key] = value;
      });
    });
    
    afterEach(() => {
      // Restore original environment variables
      Object.keys(variables).forEach(key => {
        if (key in originalEnv) {
          process.env[key] = originalEnv[key];
        } else {
          delete process.env[key];
        }
      });
    });
  }
};
