/**
 * Jest configuration for ILYTAT_Designs client application
 * 
 * This configuration is designed for testing Vue 3 components with Pinia stores
 * Reference: https://jestjs.io/docs/configuration
 */

// Export Jest configuration
export default {
  // Use jsdom environment for browser-like features
  testEnvironment: 'jest-environment-jsdom',
  
  // The test match pattern
  testMatch: ['**/tests/**/*.spec.js'],
  
  // Ignore transformations for node_modules except Vue-related packages
  transformIgnorePatterns: [
    'node_modules/(?!(.+/)?@vue|vue-demi|@vueuse|vue-router|pinia)'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'vue'],
  
  // Path mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    // Handle static assets
    '\\.(jpg|jpeg|png|gif|svg|css|less|scss)$': '<rootDir>/tests/mocks/fileMock.js'
  },
  
  // Transform with babel for JS and Vue files
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },
  
  // Global setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Code coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/**/*.spec.js',
    '!**/node_modules/**'
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true
}
