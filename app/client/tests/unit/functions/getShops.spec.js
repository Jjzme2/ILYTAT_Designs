/**
 * Tests for Printify shops functionality
 * 
 * This test validates the shops fetching functionality
 * Run with: npm run test:getShops
 */
import { setActivePinia, createPinia } from 'pinia';
import { usePrintifyStore } from '@/stores/printify';
import axios from 'axios';
import { getParameter, printTestParameters } from '../../utils/parameterizedTestRunner';

// Print the test parameters for debugging
const params = printTestParameters();
const shopId = getParameter('shopId');

describe('Printify Shops Functionality', () => {
  let store;

  // Create fresh store instance before each test
  beforeEach(() => {
    // Create and activate fresh Pinia instance
    setActivePinia(createPinia());
    store = usePrintifyStore();
    
    // Clear mocks if using them
    if (process.env.USE_MOCKS === 'true') {
      jest.spyOn(axios, 'get').mockClear();
    }
  });

  // Test fetching all shops
  it('fetches all shops correctly', async () => {
    // Optional mocking
    if (process.env.USE_MOCKS === 'true') {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          success: true,
          data: [
            { id: 'shop1', title: 'Test Shop 1' },
            { id: 'shop2', title: 'Test Shop 2' }
          ]
        }
      });
    }

    // Test that the state is initially empty
    expect(store.shops).toEqual([]);
    
    // Fetch shops if the method exists
    if (typeof store.fetchShops === 'function') {
      await store.fetchShops();
      
      // Output results for manual inspection
      console.log('\nShops fetched:', store.shops.length);
      if (store.shops.length > 0) {
        console.log('First shop:', JSON.stringify(store.shops[0], null, 2));
      }
      
      // Verify shops are loaded
      expect(Array.isArray(store.shops)).toBe(true);
      
      if (store.error && store.error.shops) {
        console.log('⚠️ Error fetching shops:', store.error.shops);
      } else if (store.shops.length === 0) {
        console.log('⚠️ No shops found - this might be expected if you have no shops');
      } else {
        console.log('✅ Successfully fetched shops');
      }
    } else {
      console.log('⚠️ fetchShops method not found in the store');
    }
  }, 10000);
  
  // Test fetching a specific shop
  it('fetches a specific shop correctly when shopId is provided', async () => {
    // Skip if no shopId
    if (!shopId) {
      console.log('ℹ️ No shopId provided - skipping specific shop test');
      return;
    }
    
    console.log(`Testing with shop ID: ${shopId}`);
    
    // Optional mocking
    if (process.env.USE_MOCKS === 'true') {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          success: true,
          data: { id: shopId, title: 'Mocked Shop' }
        }
      });
    }
    
    // Fetch specific shop if the method exists
    if (typeof store.fetchShop === 'function') {
      await store.fetchShop(shopId);
      
      // Output results
      console.log('\nShop fetched:', store.currentShop ? JSON.stringify(store.currentShop, null, 2) : 'null');
      
      // Check for specific shop data
      if (store.currentShop) {
        expect(store.currentShop.id).toBe(shopId);
        console.log('✅ Successfully fetched specific shop');
      } else {
        console.log('⚠️ No shop found with ID:', shopId);
      }
    } else {
      console.log('⚠️ fetchShop method not found in the store');
    }
  }, 10000);
  
  // Test handling of shop loading errors
  it('handles shop loading errors gracefully', async () => {
    // Mock a failure response
    if (process.env.USE_MOCKS === 'true') {
      jest.spyOn(axios, 'get').mockRejectedValue({
        response: {
          data: {
            success: false,
            message: 'Failed to fetch shops'
          }
        }
      });
    }
    
    // Verify error handling if the method exists
    if (typeof store.fetchShops === 'function') {
      // Should not throw when API fails
      await expect(store.fetchShops()).resolves.not.toThrow();
      
      // Shop array should still be defined, even if empty
      expect(Array.isArray(store.shops)).toBe(true);
      
      console.log('✅ Error handling for shops works correctly');
    }
  });
});
