/**
 * Jest configuration for ILYTAT_Designs client application
 * 
 * This configuration is designed for testing Vue 3 components with Pinia stores
 * Reference: https://jestjs.io/docs/configuration
 */

export default {
  // The root directory for Jest to find files
  rootDir: '.',
  
  // Jest will only consider files matching these patterns for testing
  testMatch: ['**/tests/**/*.spec.js'],
  
  // These file extensions will be handled as ESM
  extensionsToTreatAsEsm: ['.vue'],
  
  // The test environment (jsdom simulates a browser-like environment)
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files to run before tests - order matters here
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Use babel.config.cjs for transformation
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
    '.+\\.(css|scss|png|jpg|svg|webp)$': 'jest-transform-stub'
  },
  
  // Don't transform these packages (they're already compatible with the test environment)
  transformIgnorePatterns: [
    'node_modules/(?!(.+/)?@vue|vue-demi|@vueuse|vue-router|pinia)'
  ],
  
  // Map module names to file paths, including mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    // Use explicit mocks for these modules
    '^@/utils/axios$': '<rootDir>/tests/mocks/axios.js'
  },
  
  // Configure which directories Jest should search for mocks
  moduleDirectories: ['node_modules', '<rootDir>/tests/__mocks__'],
  
  // Allow these file extensions to be imported without specifying the extension
  moduleFileExtensions: ['vue', 'js', 'json'],
  
  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/**/*.spec.js',
    '!**/node_modules/**'
  ],
  
  // Display individual test results with the specified verbosity
  verbose: true,
  
  // Global variables that should be available in all test files
  globals: {
    'vue-jest': {
      experimentalCSSCompile: true
    }
  },
  
  // Configure testEnvironment for ESM compatibility
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Don't try to find tests in these directories
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Automatically mock these modules
  automock: false,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Maximum number of concurrent workers running tests
  maxWorkers: '50%'
}
