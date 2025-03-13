# API Response Standards

## Standard Response Format

All API responses in ILYTAT Designs SHOULD follow this consistent format:

```json
{
  "success": boolean,                // Required: Indicates if the request was successful
  "message": string,                 // Required: Short message describing the result
  "data": object | array | null,     // Required: Response data (can be null for some operations)
  "error": object | null,            // Required: Error details when success is false
  "requestId": string                // Required: Unique identifier for the request
}
```

## Detailed Structure

### Success field
- **Type**: Boolean
- **Required**: Yes
- **Description**: Indicates if the request was successful or not
- **Default**: `false`

### Message field
- **Type**: String
- **Required**: Yes
- **Description**: A user-friendly message describing the result
- **Examples**: "Login successful", "User profile updated", "Invalid credentials"

### Data field
- **Type**: Object, Array, or null
- **Required**: Yes (can be null)
- **Description**: Contains the actual response data
- **Usage**:
  - For GET requests: The requested resource(s)
  - For POST/PUT: The created/updated resource
  - For DELETE: Can be null or contain metadata about the deletion
  - For authentication endpoints: Should contain tokens and user information

### Error field
- **Type**: Object or null
- **Required**: Yes (null when success is true)
- **Description**: Contains error details when the request fails
- **Structure**:
  ```json
  {
    "message": string,         // Developer-facing error message
    "code": string,            // Error code (optional)
    "details": object,         // Additional error details (optional)
    "validationErrors": object // Field-level validation errors (optional)
  }
  ```

### RequestId field
- **Type**: String
- **Required**: Yes
- **Description**: A unique identifier for the request, useful for debugging and tracing

## Client-Side Handling

When consuming API responses:

1. Always check the `success` field first
2. For successful responses, use the `data` field to access response data
3. For error responses, check the `error` object for detailed information
4. Never assume the structure of `data` - always check for null or undefined values

### Example:

```javascript
async function makeApiRequest() {
  try {
    const response = await axios.post('/api/endpoint');
    
    if (response.data && response.data.success) {
      // Handle successful response
      const responseData = response.data.data || {}; // Handle null data
      // Process responseData
    } else {
      // Handle error response
      const errorMessage = response.data?.error?.message || response.data?.message || 'Unknown error';
      // Display error message
    }
  } catch (error) {
    // Handle network errors or exceptions
  }
}
```

## Implementation Notes

1. All API endpoints must use response middleware to ensure format consistency
2. The response format should remain consistent across all API versions
3. Never return different structures for the same endpoint based on conditions
4. Include appropriate HTTP status codes along with the JSON response
5. Maintain backward compatibility when evolving the response structure

## Common HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters or validation error
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

By following these standards, we ensure a consistent experience for API consumers and simplify error handling across the application.
