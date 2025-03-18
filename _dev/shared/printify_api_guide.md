# Printify API Response Guide

This document provides a human-readable guide to the Printify API responses and how they are formatted in our application.

## Product Response Structure

> **Note**: This section documents both the direct responses from the Printify API and how our server transforms these responses before sending them to the frontend.

### Our Server's Response Format

When our frontend receives data from our server's API, it comes in the following format:

```javascript
{
  "success": true,
  "data": [{
    "id": "671fc57dbdfd4ec6b00c6757",            // Unique product ID
    "title": "Car Magnet - Positive Quote Sunny Picture", // Product title
    "description": "Spread positivity on the go with this Sunny picture car magnet featuring a positive quote...",  // Product description (HTML formatted)
    "images": [
      {
        "src": "https://images-api.printify.com/mockup/671fc57dbdfd4ec6b00c6757/105489/102252/car-magnet-positive-quote-sunny-picture.jpg?camera_label=front",
        "position": "other",                     // Position value can be "front", "back", "other"
        "isDefault": true,                       // Note: uses isDefault, not is_default
        "variantIds": [105489]                   // Note: uses variantIds, not variant_ids
      },
      // Additional images...
    ],
    "variants": [
      {
        "id": 105489,
        "title": "5'' × 5'' / Rectangle / 1 pc",
        "price": "4.99",                         // Already formatted as a string with dollars
        "originalPrice": 499,                    // Original price in cents
        "sku": "20358617705059253442",
        "is_available": true,
        "is_enabled": true
      },
      // Additional variants...
    ],
    "priceRange": "$4.99 - $6.52",              // Pre-formatted price range as a string
    "tags": ["Accessories", "Car Accessories", "Home & Living", "Magnets & Stickers", "Magnets", "Sublimation", "US Elections Season", "Halloween"],
    "created_at": "2024-10-28 17:10:21+00:00",   // Creation timestamp
    "blueprint_id": 1464,                        // ID of the product blueprint (template)
    "print_provider_id": 28                      // ID of the print provider
  }],
  "message": "Best-seller products retrieved successfully",
  "error": null,
  "requestId": "072e7ffe-f6d7-4c6c-856f-f13cd96fa68e"
}
```

### Direct Printify API Response Format

The direct response from the Printify API (before our server processes it) has a more complex structure:

```javascript
{
    "id": "67c24cb6529701dc660ceffa",            // Unique product ID
    "title": "Fashion Hoodie (AOP)",             // Product title
    "description": "Hoodies are cool by default, but a personalized hoodie that can sport your own all-over-print design is leagues ahead...",  // Product description (HTML formatted)
    "tags": [],                                  // Product tags (empty in this example)
    "options": [                                 // Available product options (e.g., sizes, colors)
        {
            "name": "Sizes",
            "type": "size",
            "values": [
                {
                    "id": 1546,
                    "title": "S"
                },
                // More sizes...
            ],
            "display_in_preview": false
        },
        // More options...
    ],
    "variants": [                                // Available product variants
        {
            "id": 74644,                         // Unique variant ID
            "sku": "31475635732521897058",       // Stock keeping unit
            "cost": 3047,                        // Cost in cents
            "price": 4688,                       // Price in cents
            "title": "S / Seam thread color automatically matched to design",
            "grams": 600,                        // Weight in grams
            "is_enabled": true,                  // If variant is enabled
            "is_default": false,                 // If this is the default variant
            "is_available": true,                // If variant is available for purchase
            "is_printify_express_eligible": false,
            "options": [                         // Option IDs that this variant uses
                1546,
                2669
            ],
            "quantity": 1                        // Default quantity
        },
        // Additional variants with similar structure...
    ],
    "images": [                                  // Product images
        {
            "src": "https://images-api.printify.com/mockup/67c24cb6529701dc660ceffa/74646/19527/fashion-hoodie-aop.jpg?camera_label=front",
            "variant_ids": [                     // Note: uses variant_ids, not variantIds
                74644,
                74645,
                74646,
                74647,
                74648
            ],
            "position": "other",                 // Position value: "front", "back", "other"
            "is_default": true,                  // Note: uses is_default
            "is_selected_for_publishing": true,
            "order": null
        },
        // Additional images...
    ],
    // Additional fields including print_areas, views, etc.
}

## API Endpoints

### Authentication Requirements

ILYTAT Designs uses a role-based access control system with the following user types:

- **Anonymous Users**: No authentication required
- **Authenticated Users**: Standard users who have registered and logged in
- **Developers/Admins**: Users with elevated permissions

#### Access Levels

| User Type | Can Access |
|-----------|------------|
| Anonymous Users | Public product list, product details, featured/bestselling products |
| Authenticated Users | Everything above + upcoming products, order management, checkout/payment |
| Developers/Admins | Everything above + dashboard, technical documentation, product IDs, etc. |

### Product Endpoints

1. **Get All Products** (No authentication required)
   ```
   GET /api/printify/products
   ```
   Returns all published products (products with `visible: true`).
   
   **Query Parameters:**
   - `featured`: Set to `true` to get only featured products
   - `bestSelling`: Set to `true` to get only best-selling products
   - `includeHidden`: Set to `true` to include hidden/unpublished products (Admin only)

2. **Get Single Product** (No authentication required)
   ```
   GET /api/printify/products/:productId
   ```
   Returns details for a specific product if it is published (`visible: true`).
   
   **Query Parameters:**
   - `allowHidden`: Set to `true` to view a product even if it's not visible (Admin only)

3. **Get Upcoming Products** (Authentication required)
   ```
   GET /api/printify/upcoming-products
   ```
   Returns products that are marked as not visible (`visible: false`). These are typically products in development or upcoming releases that aren't ready for general purchase.
   
   **Authentication:** Requires a valid JWT token from a logged-in user.
   
   Use this endpoint to create a "Coming Soon" or "Sneak Peek" section in your application.

### Order & Payment Endpoints (Authentication Required)

All of the following endpoints require authentication:

1. **Create Checkout Session**
   ```
   POST /api/printify/payment/create-checkout
   ```
   Creates a Stripe checkout session for the user's cart.

2. **Get Customer Orders**
   ```
   GET /api/printify/customer/orders
   ```
   Returns all orders for the authenticated user.

### Admin Endpoints (Admin/Developer Authentication Required)

1. **Admin Shop Management**
   ```
   GET /api/printify/admin/shops
   ```
   Get all shops connected to the Printify account.

2. **Admin Product Management**
   ```
   GET /api/printify/admin/products
   POST /api/printify/admin/products
   ```
   Manage products, including creating new products.

## Implementing Role-Based Access

When implementing UI components, consider the user's authentication status:

```javascript
// Vue component example
<template>
  <div>
    <!-- Public content available to all users -->
    <product-list :products="products" />
    
    <!-- Content only for authenticated users -->
    <div v-if="isAuthenticated">
      <h2>Upcoming Products</h2>
      <upcoming-product-list :products="upcomingProducts" />
      <order-history :orders="orders" />
    </div>
    
    <!-- Content only for admins/developers -->
    <div v-if="isAdmin">
      <admin-dashboard />
      <technical-documentation />
      <product-id-lookup />
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    isAdmin() {
      return this.$store.getters.hasRole('admin') || this.$store.getters.hasRole('developer');
    }
  }
}
</script>
```

## Security Considerations

- Always validate authentication server-side, never rely solely on client-side checks
- Use HTTPS for all API communications
- Implement proper CSRF protection for authenticated endpoints
- Set appropriate Cache-Control headers to prevent sensitive data caching
- Use the principle of least privilege - only grant the permissions necessary for each user role

## Key Differences Between Response Formats

Our server transforms the Printify API response to make it more convenient for frontend use:

1. **Structure Simplification**:
   - Our server wraps the response in a standard format with `success`, `data`, `message`, and `error` fields
   - Many complex fields from the Printify API are omitted for simplicity (e.g., `print_areas`, `views`, `options`)

2. **Price Formatting**:
   - Direct API: Prices are in cents as integers (`price`: 4688)
   - Our Server: Prices are formatted as dollar strings (`price`: "4.99")
   - Our Server: Adds a pre-calculated `priceRange` field for convenience

3. **Image & Variant Properties**:
   - Direct API: Uses `variant_ids` and `is_default`
   - Our Server: Renamed to `variantIds` and `isDefault` for consistency with our camelCase conventions

4. **Data Reduction**:
   - Our server removes unnecessary fields to reduce payload size
   - Complex customization data like `print_areas` is omitted unless specifically needed

### Working with Both Formats

If you're developing features that interact directly with the Printify API, refer to the direct response format.
For frontend development using our server API, refer to the server response format.

### Important Notes About Our Server's Response

1. **Prices in API response**: 
   - The `variants` array includes both the formatted price in dollars (`price`: "4.99") and 
   - The original price in cents (`originalPrice`: 499)
   - A pre-formatted `priceRange` field is also provided for displaying price ranges

2. **Images format**: 
   - Each image has a `src` URL to the image
   - `position` can be "front", "back", or "other"
   - `isDefault` (boolean) indicates if it's the default image
   - `variantIds` array links images to specific variants

3. **Products filtering**:
   - Only published products are returned from our API endpoints
   - Additional filtering may be applied at the frontend level

## Our Front-End Product Rendering

Our frontend uses a simplified approach to handle the product data:

1. **Image Selection**:
   - We use the default image (where `isDefault` is true) from the `images` array when available
   - Fallback to the first image in the array if no default is explicitly marked
   - A placeholder image is shown if no images are available

2. **Price Display**:
   - We convert the price from cents to dollars for display (prices are stored in cents in the API)
   - We can generate a price range by finding the minimum and maximum prices across all variants

### Code Example - Image Display:

```javascript
// Get the default image or first available image
const productImage = computed(() => {
  if (!product.images || product.images.length === 0) {
    return '/images/placeholder-product.jpg';
  }
  
  // Try to find the default image first
  const defaultImage = product.images.find(img => img.isDefault);
  if (defaultImage) {
    return defaultImage.src;
  }
  
  // Fallback to the first image
  return product.images[0].src;
});
```

### Code Example - Price Display:

```javascript
// Work with pre-formatted prices from server response
const priceDisplay = computed(() => {
  // If priceRange is available, use it directly
  if (product.priceRange) {
    return product.priceRange;
  }
  
  // Fallback: Use the first variant's price if available
  if (product.variants && product.variants.length > 0) {
    // Price is already a formatted string with dollar sign
    return product.variants[0].price;
  }
  
  // Default fallback
  return 'Price unavailable';
});

// If you need to work with the numeric value (for calculations)
const numericPrice = computed(() => {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }
  
  // Find the first available variant
  const variant = product.variants.find(v => v.is_available && v.is_enabled);
  if (!variant) {
    return 0;
  }
  
  // Use originalPrice (in cents) and convert to dollars
  return variant.originalPrice / 100;
});

// Example: Calculate discount from original price
const calculateDiscount = (variant) => {
  if (!variant) return 0;
  
  // Convert string price to number by removing '$' and parsing
  const currentPrice = parseFloat(variant.price);
  
  // Original price is in cents, convert to dollars
  const originalPrice = variant.originalPrice / 100;
  
  if (originalPrice <= currentPrice) return 0;
  
  // Calculate discount percentage
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};
```

### Code Example - Working with Options and Variants:

```javascript
// Get all available size options
const sizeOptions = computed(() => {
  if (!product.options) return [];
  
  // Find the size option group
  const sizeOption = product.options.find(option => option.type === 'size');
  if (!sizeOption) return [];
  
  // Return all size values
  return sizeOption.values.map(value => ({
    id: value.id,
    title: value.title
  }));
});

// Get all available color options
const colorOptions = computed(() => {
  if (!product.options) return [];
  
  // Find the color option group
  const colorOption = product.options.find(option => option.type === 'color');
  if (!colorOption) return [];
  
  // Return all color values with their hex codes
  return colorOption.values.map(value => ({
    id: value.id,
    title: value.title,
    colors: value.colors || []
  }));
});

// Find variant by selected options
const findVariantByOptions = (selectedOptions) => {
  if (!product.variants) return null;
  
  return product.variants.find(variant => {
    // Check if all selected options match this variant's options
    return Object.keys(selectedOptions).every(optionId => {
      return variant.options.includes(selectedOptions[optionId]);
    });
  });
};
```

## Common Issues and Solutions

### 1. Image Display Issues

**Problem**: Images not displaying correctly or placeholder showing when images exist  
**Solution**: 
- Use a simple approach - always use the first image in the array
- Ensure proper error handling with placeholders
- Log image URLs in the console for debugging if needed

### 2. Price Formatting

**Problem**: Inconsistent price display across the application  
**Solution**: 
- Use the pre-formatted `priceRange` property when available
- Ensure consistent dollar formatting with 2 decimal places

### 3. Variant Selection

**Problem**: Users unable to select product variants properly  
**Solution**:
- Ensure variant IDs match between selection controls and the API data
- Maintain proper state management for selected variants

## Best Practices for Handling Printify API Data

### Defensive Programming

To avoid errors similar to the `o.printifyStore.shops is undefined` bug encountered in the dashboard view, always implement defensive programming techniques:

```javascript
// BAD: May cause runtime errors if any property in the chain is undefined
const shopName = printifyStore.shops[0].name;

// GOOD: Use optional chaining to safely access nested properties
const shopName = printifyStore?.shops?.[0]?.name || 'No shop name available';

// BETTER: Add explicit validation before accessing properties
function getShopName(printifyStore) {
  if (!printifyStore || !printifyStore.shops || !printifyStore.shops.length) {
    return 'No shop name available';
  }
  return printifyStore.shops[0].name;
}
```

### State Management

When storing Printify API data in your application state (Vuex, Pinia, etc.):

1. **Initialize all properties**: Always define default values for all properties in your initial state:

```javascript
// In your Printify store
const state = {
  shops: [],              // Not undefined, but an empty array
  products: [],           // Not undefined, but an empty array
  orders: [],             // Not undefined, but an empty array
  isLoading: false,       // Loading state flag
  error: null,            // Error state
  lastFetched: null       // Timestamp for caching
};
```

2. **Use loading indicators**: Always track loading state to show appropriate UI elements:

```javascript
// In component template
<template>
  <div v-if="isLoading" class="loading-spinner"></div>
  <div v-else-if="error" class="error-message">{{ error }}</div>
  <div v-else-if="products.length === 0" class="no-products-message">
    No products found
  </div>
  <div v-else>
    <!-- Products list -->
  </div>
</template>
```

### Error Handling

Implement proper error handling when working with the Printify API:

```javascript
async function fetchPrintifyProducts() {
  try {
    // Set loading state
    this.isLoading = true;
    
    // Make API request
    const response = await axios.get('/api/printifyApi/products');
    
    // Validate response structure
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format');
    }
    
    // Process data
    this.products = response.data;
    this.lastFetched = new Date();
    
  } catch (error) {
    // Log error for debugging
    console.error('Failed to fetch Printify products:', error);
    
    // Set user-friendly error message
    this.error = 'Unable to load products at this time. Please try again later.';
    
    // Optionally report to error monitoring service
    // errorReportingService.report(error);
    
  } finally {
    // Always reset loading state
    this.isLoading = false;
  }
}
```

### Data Transformation

Consider implementing adapter functions to transform Printify API responses into more convenient formats for your frontend:

```javascript
/**
 * Transforms a raw Printify product into a simplified format for our UI
 * @param {Object} rawProduct - Raw product from Printify API
 * @return {Object} Simplified product object
 */
function transformPrintifyProduct(rawProduct) {
  if (!rawProduct) return null;
  
  // Get default image or first available
  const defaultImage = rawProduct.images?.find(img => img.isDefault);
  const imageUrl = defaultImage?.src || 
                  rawProduct.images?.[0]?.src || 
                  '/images/placeholder-product.jpg';
  
  // Calculate price range
  const availablePrices = (rawProduct.variants || [])
    .filter(v => v.is_enabled && v.is_available)
    .map(v => v.price);
  
  const minPrice = availablePrices.length ? Math.min(...availablePrices) : 0;
  const maxPrice = availablePrices.length ? Math.max(...availablePrices) : 0;
  const priceString = minPrice === maxPrice 
    ? `$${(minPrice / 100).toFixed(2)}` 
    : `$${(minPrice / 100).toFixed(2)} - $${(maxPrice / 100).toFixed(2)}`;
  
  // Return transformed product
  return {
    id: rawProduct.id,
    title: rawProduct.title,
    description: rawProduct.description,
    imageUrl,
    price: minPrice,
    priceString,
    isAvailable: (rawProduct.variants || []).some(v => v.is_available && v.is_enabled),
    variants: rawProduct.variants || [],
    options: rawProduct.options || [],
    createdAt: rawProduct.created_at,
    updatedAt: rawProduct.updated_at
  };
}
```

By following these best practices, you'll create more robust code that can handle the complexities and potential inconsistencies in Printify API responses.

## Working with the Printify API

### Authentication

All requests to the Printify API require an API key, which should be set in the environment variables:

```
PRINTIFY_API_KEY=your_api_key_here
DEFAULT_PRINTIFY_SHOP_ID=your_shop_id_here
```

### Rate Limiting

Be aware that the Printify API has rate limits. If you receive a 429 error, you should implement backoff strategies.

### Image Optimization

Consider implementing image optimization or caching strategies for production to improve performance.

## Case Study: Dashboard Bug Fix

### Issue Description

Our dashboard view previously encountered a critical runtime error: `o.printifyStore.shops is undefined`. This occurred because:

1. The component was attempting to access properties before the data was loaded
2. State properties weren't properly initialized in the Printify store
3. Proper error handling and loading states weren't implemented

### Solution Implementation

We fixed this issue with several key improvements that serve as excellent examples of defensive programming:

#### 1. Initialize All State Properties

```javascript
// Before: Incomplete state initialization
const state = {
  // shops property was missing entirely
  // No default values for critical properties
};

// After: Complete state initialization
const state = {
  shops: [],              // Empty array instead of undefined
  recentOrders: [],       // Empty array instead of undefined
  totalProducts: 0,       // Numeric default
  isLoading: false,
  error: null
};
```

#### 2. Correct API Endpoint Paths

```javascript
// Before: Incorrect API paths
const fetchShops = async () => {
  await axios.get('/api/printifyApi/shops');  // Wrong path
};

// After: Correct admin API paths
const fetchShops = async () => {
  await axios.get('/api/printifyApi/admin/shops');  // Correct path
};

const fetchOrders = async (shopId) => {
  await axios.get(`/api/printifyApi/admin/shops/${shopId}/orders`);  // Correct path with parameter
};
```

#### 3. Defensive Programming in Components

```javascript
// Before: Unsafe property access
<div>
  <h3>{{ printifyStore.shops[0].name }}</h3>
  <p>Total Products: {{ printifyStore.totalProducts }}</p>
</div>

// After: Safe property access with optional chaining and fallbacks
<div>
  <div v-if="isLoading" class="loading-spinner">Loading...</div>
  <div v-else-if="error" class="error-message">{{ error }}</div>
  <div v-else>
    <h3>{{ printifyStore?.shops?.[0]?.name || 'No shop available' }}</h3>
    <p>Total Products: {{ printifyStore?.totalProducts ?? 0 }}</p>
  </div>
</div>
```

#### 4. Improved Error Handling

```javascript
// Before: Minimal error handling
try {
  const response = await axios.get('/api/printifyApi/admin/shops');
  this.shops = response.data;
} catch (error) {
  console.error(error);
}

// After: Comprehensive error handling
try {
  this.isLoading = true;
  const response = await axios.get('/api/printifyApi/admin/shops');
  
  // Validate response
  if (!response.data || !Array.isArray(response.data)) {
    throw new Error('Invalid response format');
  }
  
  this.shops = response.data;
} catch (error) {
  console.error('Failed to fetch Printify shops:', error);
  this.error = 'Unable to load shop data. Please try again later.';
  // Optionally report to monitoring service
} finally {
  this.isLoading = false;
}
```

### Key Lessons Learned

1. **Always initialize state properties** with appropriate empty values (empty arrays, empty objects, nulls, etc.)
2. **Use correct API endpoints** with proper path structures
3. **Implement defensive programming techniques** like optional chaining and nullish coalescing
4. **Add proper loading states and error handling** for all asynchronous operations
5. **Validate API responses** before using them
6. **Provide meaningful fallback content** when data isn't available

These improvements ensure that the dashboard loads properly even when data might not be immediately available, preventing runtime errors and providing a better user experience.

## References

- [Official Printify API Documentation](https://developers.printify.com/)
- [Printify Help Center - API Section](https://help.printify.com/hc/en-us/sections/4471760080657-Printify-API)
