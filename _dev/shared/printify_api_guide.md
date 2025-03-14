# Printify API Response Guide

This document provides a human-readable guide to the Printify API responses and how they are formatted in our application.

## Product Response Structure

### Sample Printify API Response
When we receive products from the Printify API, they come in the following format (based on actual response):

```javascript
{
  "success": true,
  "data": [{
    "id": "671fc57dbdfd4ec6b00c6757",            // Unique product ID
    "title": "Car Magnet - Positive Quote Sunny Picture", // Product title
    "description": "Spread positivity on the go...",  // Product description (HTML formatted)
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
  "requestId": "b69c8e50-970d-457f-909f-03a63abc8b6b"
}
```

### Important Notes About Printify API Data

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

4. **Image position values**:
   - Note that many images may have `position` set to "other" with a `camera_label` parameter in the URL
   - When using the first image, we don't need to worry about position values

## Our Front-End Product Rendering

Our frontend uses a simplified approach to handle the product data:

1. **Image Selection**:
   - We simply use the first available image in the `images` array
   - A placeholder image is shown if no images are available

2. **Price Display**:
   - We use the pre-formatted `priceRange` property when available
   - Fallback to formatting the first variant's price when needed

### Code Example - Image Display:

```javascript
// Simple, reliable image selection
const productImage = computed(() => {
  if (product.images && product.images.length > 0) {
    return product.images[0].src;
  }
  return '/images/placeholder-product.jpg';
});
```

### Code Example - Price Display:

```javascript
// Using the pre-formatted price range
const formattedPrice = computed(() => {
  if (product.priceRange) {
    return product.priceRange;
  }
  
  // Fallback to formatting the first variant price
  const price = product.variants && product.variants.length > 0
    ? product.variants[0].price
    : 0;
  return `$${parseFloat(price).toFixed(2)}`;
});
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

## References

- [Official Printify API Documentation](https://developers.printify.com/)
- [Printify Help Center - API Section](https://help.printify.com/hc/en-us/sections/4471760080657-Printify-API)
