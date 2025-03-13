# API Route Migration Guide

## Overview
This document outlines the mismatches between client-side API calls and our newly standardized server routes. It provides recommendations for updating client-side code to align with the server routes.

## Current Server API Routes (After Standardization)
- `/api/auth`: Authentication routes
- `/api/users`: User management routes
- `/api/roles`: Role management routes
- `/api/documents`: Documentation routes
- `/api/printify`: Printify API routes
- `/api/payment`: Payment routes
- `/api/contact`: Contact information routes
- `/api/audit`: Audit trail routes
- `/api/debug`: Debug routes (dev environment only)

## Client-Side API Calls That Need Updates

### 1. Printify API Routes
**Issue**: In the client code, some calls use `/api/printify/products` but the server route is registered as `/api/printify`.

**Affected Files**:
- `stores/printify.js`: 
  - Line 67: `axios.get('/api/printify/products')`
  - Line 84: `axios.get('/api/printify/products/${productId}')`

**Recommendation**:
Update these calls to use the correct route prefix:
```javascript
// Before
const { data } = await axios.get('/api/printify/products')
const { data } = await axios.get(`/api/printify/products/${productId}`)

// After
const { data } = await axios.get('/api/printify/products')
const { data } = await axios.get(`/api/printify/products/${productId}`)
```

### 2. System Routes
**Issue**: The client code makes calls to `/api/system/logs` and `/api/system/health`, but there's no corresponding route file in the backend.

**Affected Files**:
- `views/system/LogsView.vue`: Line 189
- `views/system/HealthView.vue`: Lines 132-133

**Recommendation**:
1. Create a standardized `system.js` route file with proper controllers for logs and health endpoints.
2. Register it in `index.js` with the pattern established for other routes.

### 3. Payment/Order Routes
**Issue**: The payment routes appear to be correctly configured, but there might be inconsistencies in how order-related endpoints are structured.

**Affected Files**:
- `stores/printify.js`: 
  - Line 155: `axios.post('/api/payment/create-checkout', ...)`
  - Line 180: `axios.get('/api/payment/order/${sessionId}')`
  - Line 204: `axios.get('/api/payment/orders')`

**Recommendation**:
Ensure these endpoints are properly defined in the `payments.js` route file with a consistent structure:
```javascript
const ROUTES = {
  CREATE_CHECKOUT: '/create-checkout',
  ORDER_BY_SESSION: '/order/:sessionId',
  ORDERS: '/orders'
};
```

## Additional Routes to Consider

### System Health and Logs Routes
It's recommended to create a new standardized route file for system monitoring:

```javascript
/**
 * System monitoring routes
 * @module routes/api/system
 */
const systemController = require('../../controllers/systemController');
const { authenticateToken, authorize } = require('../../middleware/auth');

const ROUTES = {
  HEALTH: '/health',
  HEALTH_DETAILED: '/health/detailed',
  LOGS: '/logs'
};

const systemRoutes = (router) => {
  // System health check (basic)
  router.get(ROUTES.HEALTH, systemController.getHealthStatus);
  
  // System health check (detailed)
  router.get(
    ROUTES.HEALTH_DETAILED, 
    authenticateToken,
    authorize(['admin']),
    systemController.getDetailedHealth
  );
  
  // System logs
  router.get(
    ROUTES.LOGS,
    authenticateToken,
    authorize(['admin']),
    systemController.getLogs
  );
};

module.exports = systemRoutes;
```

## Implementation Plan
1. Update client-side API calls to match standardized server routes.
2. Create missing route files (e.g., system.js) for any endpoints currently being used by the client.
3. Test all API interactions to ensure proper functionality.
4. Document any new patterns or conventions in the standards.md file.

## Tracking Progress
| Route File | Standardized | Client Code Updated |
|------------|--------------|---------------------|
| auth.js    | ✅           | ⬜                  |
| users.js   | ✅           | ⬜                  |
| roles.js   | ✅           | ⬜                  |
| documentations.js | ✅     | ⬜                  |
| printify.js | ✅          | ⬜                  |
| payments.js | ✅          | ⬜                  |
| contact.js  | ✅          | ⬜                  |
| debug.js    | ✅          | ⬜                  |
| audit.js    | ✅          | ⬜                  |
| system.js   | ⬜           | ⬜                  |

## Printify API Route Migration

## Overview

This document tracks the migration of Printify API routes to align with the overall application architecture and ensure proper permission handling. The changes ensure that regular users can access necessary shop and order data for the dashboard without requiring admin permissions.

## Route Alignment

| Client Route (Frontend) | Server Route (Backend) | Authentication | Permission Required | Purpose |
|-------------------------|------------------------|----------------|---------------------|---------|
| `/api/printify/shops` | `/shops` | Required | None (Auth Only) | Fetch available shops |
| `/api/printify/shops/:shopId/orders` | `/shops/:shopId/orders` | Required | None (Auth Only) | Fetch orders for a specific shop |
| `/api/printify/products` | `/products` | None | None | Browse public products |
| `/api/printify/products/:productId` | `/products/:productId` | None | None | View specific product details |
| `/api/printify/payment/create-checkout` | `/payment/create-checkout` | Required | None (Auth Only) | Create checkout session |
| `/api/printify/customer/orders` | `/customer/orders` | Required | None (Auth Only) | View own orders as a customer |

## Admin Routes

The following routes require `PRINTIFY_MANAGE` permission and should only be used in admin interfaces:

| Admin Route (Frontend) | Server Route (Backend) | Authentication | Permission Required |
|------------------------|------------------------|----------------|---------------------|
| `/api/printify/admin/shops` | `/admin/shops` | Required | `PRINTIFY_MANAGE` |
| `/api/printify/admin/shops/:shopId` | `/admin/shops/:shopId` | Required | `PRINTIFY_MANAGE` |
| `/api/printify/admin/shops/:shopId/orders` | `/admin/shops/:shopId/orders` | Required | `PRINTIFY_MANAGE` |
| `/api/printify/admin/products` | `/admin/products` | Required | `PRINTIFY_MANAGE` |
| `/api/printify/admin/products/:productId` | `/admin/products/:productId` | Required | `PRINTIFY_MANAGE` |
| `/api/printify/admin/orders/:orderId` | `/admin/orders/:orderId` | Required | `PRINTIFY_MANAGE` |

## Recent Changes

1. **Renamed API Base Path**:
   - Changed from `/api/printifyApi/*` to `/api/printify/*` for consistency with other API endpoints

2. **Added User-Level Shop Access**:
   - Created routes that allow authenticated users (without admin permissions) to access shop and order data
   - Implemented proper error handling and defensive programming to handle null/undefined values

3. **Permission Structure**:
   - Public routes: No authentication required (product browsing)
   - Customer routes: Require authentication but no special permissions
   - Admin routes: Require authentication and `PRINTIFY_MANAGE` permission

## Alignment with Business Requirements

These changes support the core functionality described in the project overview:

- **Product Creation & Sales**: Public product routes enable customers to browse and purchase products
- **User Management & Roles**: Role-based permissions ensure proper access control
- **Design Interaction**: Authentication-based routes enable personalized customer experiences

## Next Steps

1. **Review all admin routes** to ensure they're properly secured
2. **Add pagination** to product and order listing endpoints
3. **Implement caching** for frequently accessed data (products, categories)
4. **Add comprehensive error handling** for all routes
