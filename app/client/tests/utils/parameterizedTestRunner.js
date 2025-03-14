/**
 * Parameterized Test Runner Utility
 * 
 * This utility allows running tests with command-line parameters
 * Usage: node parameterizedTestRunner.js --functionName=value
 */

// This function extracts arguments from the command line
export function getTestParameters() {
  const args = process.argv.slice(2);
  const params = {};

  // Extract parameters in format --key=value or --key
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value !== undefined ? value : true;
    } else if (arg.startsWith('-')) {
      const key = arg.substring(1);
      params[key] = true;
    } else {
      // Handle positional arguments if needed
      if (!params.positional) {
        params.positional = [];
      }
      params.positional.push(arg);
    }
  });

  return params;
}

// This function checks if a specific test should be run
export function shouldRunTest(testName) {
  const params = getTestParameters();
  
  // If no specific test is requested, run all tests
  if (!params.test && !params.t) {
    return true;
  }
  
  // Check if this test matches the requested test name
  const requestedTest = params.test || params.t;
  return testName === requestedTest;
}

// Extract a specific parameter by name
export function getParameter(name, defaultValue = null) {
  const params = getTestParameters();
  return params[name] !== undefined ? params[name] : defaultValue;
}

// Print current test parameters for debugging
export function printTestParameters() {
  const params = getTestParameters();
  console.log('Running test with parameters:', params);
  return params;
}
