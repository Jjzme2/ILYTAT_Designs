# Function-Specific Testing Guide

This document explains how to use the function-specific testing tools we've implemented.

## Available Test Scripts

The following scripts are available to test specific functions:

| Script | Description | Usage |
|--------|-------------|-------|
| `test:getProductById` | Test product fetching by ID | `npm run test:getProductById -- --productId=671fc57dbdfd4ec6b00c6757` |
| `test:getShops` | Test shops fetching | `npm run test:getShops` or with ID: `npm run test:getShops -- --shopId=123456` |

## Creating Tests for New Functions

We've created a utility to make it easy to generate tests for any function:

```bash
# From app/client directory
node tests/utils/createFunctionTest.js functionName
```

This will:
1. Create a new test file in `tests/unit/functions/functionName.spec.js`
2. Add a `test:functionName` script to package.json

## Passing Parameters to Tests

All function tests can accept parameters using the `--paramName=value` syntax. For example:

```bash
# Test getProductById with a specific product ID
npm run test:getProductById -- --productId=671fc57dbdfd4ec6b00c6757

# Test with multiple parameters
npm run test:someFunction -- --param1=value1 --param2=value2
```

The double dash (`--`) is important as it separates npm script arguments from the arguments passed to the test.

## Available Parameters

Different test files accept different parameters. Here are some common ones:

| Test | Parameter | Description | Example |
|------|-----------|-------------|---------|
| getProductById | `productId` | Printify product ID to test | `--productId=671fc57dbdfd4ec6b00c6757` |
| getShops | `shopId` | Optional shop ID for specific shop | `--shopId=123456` |

## Understanding Test Output

The tests are designed to provide detailed output in the console:

1. Test parameters will be displayed at the start
2. Function results will be logged as JSON for inspection
3. Success/failure messages with ✅/⚠️ indicators 
4. Error details when errors occur

## Extending Tests

To extend or modify existing tests:

1. Edit the corresponding test file in `tests/unit/functions/`
2. Add new assertions or test scenarios as needed
3. Remember to test error cases and edge cases

## Creating More Complex Tests

For complex scenarios, you can:

1. Add more parameters using the parameterized test runner
2. Create multi-step tests that verify several operations
3. Add data validation and business logic verification

Example of adding a new parameter to a test:

```javascript
// In your test file
const newParam = getParameter('newParam');
console.log(`Using new parameter: ${newParam}`);

// Then run with:
// npm run test:myFunction -- --newParam=someValue
```
