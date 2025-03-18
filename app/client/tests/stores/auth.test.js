/**
 * Unit tests for Auth Store
 * 
 * Tests the authentication store's login functionality with a focus on
 * error handling for various API response scenarios.
 * 
 * @module tests/stores/auth
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import router from '@/router';

// Mock dependencies
vi.mock('axios');
vi.mock('@/router', () => ({
  push: vi.fn(),
  currentRoute: { value: { fullPath: '/test-path' } }
}));
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('Auth Store', () => {
  let store;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
    store = useAuthStore();
    
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should handle successful login with tokens', async () => {
      // Setup success response with tokens
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            user: {
              id: '123',
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
              role: 'user'
            }
          }
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Mock methods
      vi.spyOn(store, 'setTokens');
      
      // Execute
      const result = await store.login(validCredentials);
      
      // Verify
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', validCredentials);
      expect(store.setTokens).toHaveBeenCalledWith('test-access-token', 'test-refresh-token');
      expect(store.user).toEqual(mockResponse.data.data.user);
      expect(router.push).toHaveBeenCalledWith('/dashboard');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle success response with alternative data structure', async () => {
      // Setup success response with tokens in result property instead of data
      const mockResponse = {
        data: {
          success: true,
          result: {
            accessToken: 'alt-access-token',
            refreshToken: 'alt-refresh-token',
            user: { id: '456', firstName: 'Alt' }
          }
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Execute
      await store.login(validCredentials);
      
      // Verify tokens were extracted from the alternative path
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toEqual(mockResponse.data.result.user);
    });

    it('should handle login response with missing tokens', async () => {
      // Setup response with success but missing tokens
      const mockResponse = {
        data: {
          success: true,
          data: {
            // No tokens here
            message: 'Operation successful but no tokens provided'
          }
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      // Execute
      await store.login(validCredentials);
      
      // Verify
      expect(store.isAuthenticated).toBe(false);
      expect(router.push).not.toHaveBeenCalled();
    });

    it('should handle verification error response', async () => {
      // Setup verification error response
      const verificationError = {
        response: {
          status: 403,
          data: {
            error: {
              details: {
                requiresVerification: true,
                email: 'test@example.com'
              },
              actions: [
                { type: 'check_dev_email', message: 'Check development email' }
              ]
            }
          }
        }
      };
      axios.post.mockRejectedValueOnce(verificationError);
      
      // Execute & Verify
      await expect(store.login(validCredentials)).rejects.toMatchObject({
        response: {
          data: {
            details: {
              requiresVerification: true,
              email: 'test@example.com',
              emailInfo: { instructions: 'Check development email' }
            }
          }
        }
      });
    });

    it('should handle null response data', async () => {
      // Setup error with null data
      const nullDataError = {
        response: {
          status: 500,
          data: null
        },
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

    it('should handle undefined error response', async () => {
      // This simulates a complete network failure
      const undefinedError = new Error('Failed to fetch');
      undefinedError.response = undefined;
      
      axios.post.mockRejectedValueOnce(undefinedError);
      
      // Execute & Verify
      await expect(store.login(validCredentials)).rejects.toEqual(undefinedError);
      expect(store.loading).toBe(false);
    });

    it('should handle error with actions array but no dev_email action', async () => {
      // Setup error with actions but missing the specific one we look for
      const actionError = {
        response: {
          status: 403,
          data: {
            error: {
              details: {
                requiresVerification: true,
                email: 'test@example.com'
              },
              actions: [
                { type: 'other_action', message: 'Not what we are looking for' }
              ]
            }
          }
        }
      };
      axios.post.mockRejectedValueOnce(actionError);
      
      // Execute & Verify - should not crash when processing actions
      await expect(store.login(validCredentials)).rejects.toMatchObject({
        response: {
          data: {
            details: {
              requiresVerification: true,
              email: 'test@example.com',
              emailInfo: null
            }
          }
        }
      });
    });

    it('should set loading state correctly', async () => {
      // Setup success response
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { accessToken: 'token', refreshToken: 'refresh' }
        }
      });
      
      // Execute
      const loginPromise = store.login(validCredentials);
      
      // Verify loading is true during the request
      expect(store.loading).toBe(true);
      
      // Wait for completion
      await loginPromise;
      
      // Verify loading is false after completion
      expect(store.loading).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      // Setup error
      axios.post.mockRejectedValueOnce(new Error('Test error'));
      
      // Execute
      try {
        await store.login(validCredentials);
      } catch (e) {
        // Expected to throw, ignore
      }
      
      // Verify loading is false after error
      expect(store.loading).toBe(false);
    });
  });
});
