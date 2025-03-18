# Error Handling Testing Guide

> **ILYTAT Designs Development Documentation**
>
> Created: March 17, 2025
> Last Updated: March 17, 2025

## Overview

This guide documents best practices for testing error handling in the ILYTAT Designs application, with practical examples from the recent error handling improvements. It builds upon our existing [Testing Guidelines](../../../_dev/shared/notes/testing_guidelines.md) with specific focus on defensive programming and robust error handling.

## Table of Contents

1. [Introduction](#introduction)
2. [Error Handling Test Scenarios](#error-handling-test-scenarios)
3. [Server-Side Error Testing](#server-side-error-testing)
4. [Client-Side Error Testing](#client-side-error-testing)
5. [Integration Testing for Error Handling](#integration-testing-for-error-handling)
6. [Best Practices](#best-practices)
7. [Examples from Codebase](#examples-from-codebase)

## Introduction

Error handling tests ensure that our application gracefully handles unexpected inputs, network failures, and edge cases without crashing or producing confusing error messages. This becomes especially important in our distributed architecture where we communicate between client and server components.

Recent error handling improvements fixed issues like:
- "Cannot destructure property 'error' of 'object null' as it is null"
- Unclear "[object Object]" error messages in API responses
- Authentication errors lacking clear guidance for users

## Error Handling Test Scenarios

When designing tests for error handling, always consider these scenarios:

| Scenario Type | Description | Example Test Case |
|---------------|-------------|-------------------|
| **Null/Undefined Values** | Test how code handles null or undefined inputs | Testing API response with `data: null` |
| **Malformed Data** | Test with incorrectly structured data | Missing required properties in response objects |
| **Network Failures** | Test complete network disconnections | Axios request timing out or failing |
| **Authentication Issues** | Test behavior when authentication fails | Token expiration or invalid credentials |
| **Empty Collections** | Test with empty arrays or collections | Empty products list from API |
| **Permission Denied** | Test authorization failures | Accessing admin routes as regular user |

## Server-Side Error Testing

### Unit Testing Controllers

When unit testing controllers, use dependency injection and mocking to simulate various error conditions:

```javascript
// Example from PrintifyController tests
it('should handle null API response properly', async () => {
  // Setup
  mockPrintifyService.getProducts.resolves(null);
  
  // Execute
  await controller.getUpcomingProducts(mockRequest, mockResponse);
  
  // Verify
  expect(mockLogger.warn.calledOnce).to.be.true;
  expect(mockResponse.sendSuccess.calledOnce).to.be.true;
  expect(mockResponse.sendSuccess.firstCall.args[0]).to.deep.equal([]);
});
```

### Testing Error Response Format

Always verify that error responses follow our standard format:

```javascript
{
  success: false,
  data: null,
  message: "User-friendly error message",
  error: "Technical error details" // Only in development
}
```

## Client-Side Error Testing

### Testing Store Error Handling

For Pinia stores, test how they handle various API error responses:

```javascript
// Example from auth store tests
it('should handle null response data', async () => {
  // Setup error with null data
  const nullDataError = {
    response: { status: 500, data: null },
    message: 'Network Error'
  };
  axios.post.mockRejectedValueOnce(nullDataError);
  
  // Execute & Verify - should convert to a more usable error format
  await expect(store.login(validCredentials)).rejects.toMatchObject({
    response: {
      data: {
        success: false,
        error: 'Network Error'
      }
    }
  });
});
```

### Testing Component Error States

Always test how components render different error states:

```javascript
// Example from UpcomingProductsView tests
it('should show error state when error occurs', async () => {
  // Create wrapper with error state
  const errorMessage = 'Failed to load upcoming products';
  wrapper = createWrapper(true, {
    error: { upcomingProducts: errorMessage }
  });
  
  // Should show error message
  expect(wrapper.find('.error-state').exists()).toBe(true);
  expect(wrapper.text()).toContain(errorMessage);
});
```

## Integration Testing for Error Handling

Integration tests should verify that the complete request/response cycle handles errors properly:

```javascript
// Example from printify-products.test.js
it('should handle API service errors', async () => {
  // Mock the printifyService to throw an error
  sinon.stub(printifyService, 'getProducts').rejects(new Error('API Connection Error'));
  
  // Test with auth token
  const response = await request(app)
    .get('/api/printify/upcoming-products')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(500);
  
  expect(response.body).to.have.property('success', false);
  expect(response.body).to.have.property('error').that.includes('Error');
});
```

## Best Practices

1. **Defensive Programming**: Always add null/undefined checks before accessing properties:
   ```javascript
   // Bad
   const { error } = response.data;
   
   // Good
   const error = response?.data?.error;
   ```

2. **Default Values**: Use default values or fallbacks for potentially missing data:
   ```javascript
   // With nullish coalescing
   const errorMessage = error?.message ?? 'Unknown error occurred';
   
   // With conditional (ternary) operator
   const formattedData = data ? formatData(data) : [];
   ```

3. **Predictable Error Formats**: Always throw errors in a consistent format:
   ```javascript
   throw {
     ...error,
     response: {
       ...error.response,
       data: {
         success: false,
         message: error.message || 'An unexpected error occurred',
         error: error.message || 'Error processing request'
       }
     }
   };
   ```

4. **Test Boundary Conditions**: Don't just test the happy path, test edge cases:
   - Empty arrays (`[]`)
   - Objects with missing properties
   - Null/undefined values
   - Excessive data (very large arrays)

5. **Graceful Degradation**: Ensure UI components can handle missing data gracefully:
   ```javascript
   // In Vue template
   <span v-if="product.price">{{ formatPrice(product.price) }}</span>
   <span v-else>Pricing TBD</span>
   ```

## Examples from Codebase

### Enhanced PrintifyController with Defensive Programming

```javascript
// Before
const upcomingProducts = products.filter(product => product.visible === false);

// After - with defensive checks
const validProducts = products.filter(product => product && typeof product === 'object');
const upcomingProducts = validProducts.filter(product => product.visible === false);
```

### Auth Store with Improved Error Handling

```javascript
// Before
if (error.response?.status === 403) {
  // Process error details
  const { requiresVerification } = error.response.data.error.details;
}

// After - with null checks and optional chaining
if (error.response?.status === 403 && 
    error.response?.data?.error?.details?.requiresVerification) {
  // Now safely access properties with optional chaining
  const email = error.response?.data?.error?.details?.email;
}
```

### Enhancing Response with Fallbacks

```javascript
// Before
return res.sendError(null, errorMessage, error.statusCode || 401);

// After - with complete null safety
return res.sendError(
  null,
  errorMessage, 
  error ? (error.statusCode || 401) : 500
);
```

---

This guide should be used alongside our other testing documentation to ensure consistent, robust error handling throughout the ILYTAT Designs application. Following these practices will prevent common issues like null reference errors and improve the overall user experience when errors do occur.
