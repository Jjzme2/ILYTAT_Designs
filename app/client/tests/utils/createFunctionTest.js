/**
 * Test Generator Utility
 * 
 * This utility helps create new function-specific test files
 * Usage: node createFunctionTest.js functionName
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const functionName = process.argv[2];

if (!functionName) {
  console.error('Please provide a function name as an argument');
  process.exit(1);
}

const testFilePath = path.join(__dirname, '..', 'unit', 'functions', `${functionName}.spec.js`);
const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');

// Test file template
const testFileTemplate = `/**
 * Tests for ${functionName} function
 * 
 * This test allows testing the ${functionName} functionality
 * Run with: npm run test:${functionName} -- --param=value
 */
import { setActivePinia, createPinia } from 'pinia';
import { usePrintifyStore } from '@/stores/printify';
import axios from 'axios';
import { getParameter, printTestParameters } from '../../utils/parameterizedTestRunner';

// Print the test parameters for debugging
const params = printTestParameters();

describe('${functionName} functionality', () => {
  let store;

  // Create fresh store instance before each test
  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePrintifyStore();
    
    // Clear mocks if using them
    if (process.env.USE_MOCKS === 'true') {
      jest.spyOn(axios, 'get').mockClear();
    }
  });

  it('executes ${functionName} successfully', async () => {
    // Get parameters from command line
    const param1 = getParameter('param1');
    console.log(\`Testing ${functionName} with param1: \${param1 || 'not provided'}\`);

    // Optional mocking
    if (process.env.USE_MOCKS === 'true') {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          success: true,
          data: { result: 'mocked data' }
        }
      });
    }

    // Test the actual function if it exists
    if (typeof store.${functionName} === 'function') {
      // Execute the function (modify as needed for your function's parameters)
      await store.${functionName}(param1);
      
      // Output results for debugging
      console.log('\\nFunction result:', JSON.stringify(store.someRelevantState, null, 2));
      
      // Add your assertions here
      expect(true).toBe(true);
    } else {
      console.log(\`⚠️ ${functionName} function not found in the store\`);
    }
  }, 10000); // Longer timeout for API calls
});
`;

// Create the test file
try {
  // Ensure the directory exists
  const dir = path.dirname(testFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the test file
  fs.writeFileSync(testFilePath, testFileTemplate);
  console.log(`Created test file: ${testFilePath}`);

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Only add the script if it doesn't exist
  if (!packageJson.scripts[`test:${functionName}`]) {
    packageJson.scripts[`test:${functionName}`] = `node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/functions/${functionName}.spec.js`;
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Added test:${functionName} script to package.json`);
  } else {
    console.log(`Script test:${functionName} already exists in package.json`);
  }

  console.log(`\nTo run the test, use: npm run test:${functionName} -- --param1=value`);
} catch (error) {
  console.error('Error creating test file:', error);
  process.exit(1);
}
