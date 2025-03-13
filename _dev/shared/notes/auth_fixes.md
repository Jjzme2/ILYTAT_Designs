# Authentication System Fixes

## Current Issues

1. **Profile Access Error**: Receiving `{"error":"API endpoint not found"}` when trying to access the profile after login
2. **Login Error Message**: Despite a successful 200 response, an invalid email/password error is still shown

## Root Causes

1. The client-side auth store is trying to fetch the user profile from `/api/auth/profile`, but the actual server-side endpoint is `/api/auth/me`
2. The login error handling might be triggering even on successful responses due to how the response is processed

## Required Code Changes

### 1. Fix the Profile Endpoint

In `app/client/src/stores/auth.js`, update the `fetchUserProfile` method:

```javascript
async fetchUserProfile() {
  try {
    // Changed from '/api/auth/profile' to '/api/auth/me' to match the server endpoint
    const response = await axios.get('/api/auth/me');
    if (response.data.success) {
      this.user = response.data.data;
    }
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

### 2. Improve Login Error Handling

In `app/client/src/stores/auth.js`, update the `login` method:

```javascript
async login(credentials) {
  try {
    this.loading = true;
    const response = await axios.post('/api/auth/login', credentials);
    
    // Check if login was successful based on response.data.success
    if (response.data && response.data.success) {
      // Try to fetch user profile
      try {
        await this.fetchUserProfile();
        
        // Show welcome toast notification only if we have user data
        if (this.user) {
          const { showToast } = useToast();
          showToast(`Welcome back, ${this.user.firstName || 'User'}!`, 'success');
        }
        
        // Redirect to dashboard regardless of profile fetch success
        router.push('/dashboard');
      } catch (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        // Still redirect to dashboard since login was successful
        router.push('/dashboard');
      }
    }
    return response.data;
  } catch (error) {
    // Only handle and throw error if it's not already been handled
    throw error;
  } finally {
    this.loading = false;
  }
}
```

## Implementation Steps

1. Open `app/client/src/stores/auth.js`
2. Find the `fetchUserProfile` method and replace the endpoint `/api/auth/profile` with `/api/auth/me`
3. Update the login method to include better error handling and ensure the toast only shows if we have user data
4. Save the file and test the login flow again

## Additional Recommendations

1. **Server-Side Consistency**: Ensure all API endpoints follow the standard response format defined in `_dev/shared/notes/rules_and_standards.md`
2. **Error Responses**: Capture detailed error messages from failed requests and display them to the user
3. **Graceful Degradation**: Implement fallback behavior when profile fetch fails after login

## Testing

After implementing these changes, test the following scenarios:

1. Successful login followed by profile access
2. Invalid credentials login
3. Login when profile service is unavailable

These adjustments should resolve both issues while maintaining a consistent user experience.
