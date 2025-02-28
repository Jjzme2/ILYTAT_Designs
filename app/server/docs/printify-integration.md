# Printify Integration

This document outlines the integration between our application and the Printify API.

## Overview

The integration is built with modularity and separation of concerns in mind, following these key principles:
- Service layer for API communication
- Controller layer for business logic
- Route layer for API endpoints
- Model layer for data persistence
- Caching system to improve performance

## Architecture

### Components

1. **PrintifyService**: Handles all direct communication with the Printify API
2. **PrintifyController**: Manages business logic and request/response handling
3. **PrintifyCache**: Stores frequently accessed data to reduce API calls
4. **Printify Routes**: Defines API endpoints for Printify functionality

### Security

- All routes are protected with authentication middleware
- API key is stored in environment variables
- Request validation middleware ensures data integrity

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Shops
- `GET /shops` - Get all shops
- `GET /shops/:shopId/products` - Get all products for a shop
- `GET /shops/:shopId/products/:productId` - Get specific product details
- `GET /shops/:shopId/orders` - Get all orders for a shop
- `POST /shops/:shopId/orders` - Create a new order

## Caching

The system implements a caching layer to improve performance and reduce API calls to Printify. Cache entries include:
- Products
- Shops
- Orders

Cache invalidation occurs:
- Automatically after a configurable time period
- When related data is modified
- Manually through admin endpoints

## Error Handling

The integration includes comprehensive error handling:
- API communication errors
- Validation errors
- Authentication errors
- Cache-related errors

## Getting Started

1. Ensure you have a valid Printify API key
2. Add the API key to your `.env` file: `PRINTIFY_API_KEY=your_api_key`
3. Run migrations: `npm run migrate`
4. Start the server: `npm run dev`

## Best Practices

1. Always use the service layer for Printify API communication
2. Implement proper error handling
3. Utilize the caching system for frequently accessed data
4. Follow the established patterns for new features
5. Document any changes or additions to the integration
