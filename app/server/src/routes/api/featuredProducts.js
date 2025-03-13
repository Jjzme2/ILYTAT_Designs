/**
 * Featured Products API Routes
 * @module routes/api/featuredProducts
 * 
 * This module provides endpoints for managing featured and best-selling products
 * These are admin-only routes that require authentication and proper permissions
 */
const featuredProductController = require('../../controllers/featuredProductController');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');

/**
 * Route definitions for Featured Products API endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  // Public routes
  GET_PUBLIC_FEATURED: '/public',
  GET_PUBLIC_BESTSELLERS: '/public/bestsellers',
  
  // Admin routes (requires elevated permissions)
  GET_FEATURED_PRODUCTS: '/',
  UPDATE_FEATURED_PRODUCTS: '/',
  TOGGLE_PRODUCT_STATUS: '/:productId'
};

/**
 * Register Featured Products API routes with role-based permissions
 * @param {Express.Router} router - Express router instance
 */
const featuredProductRoutes = (router) => {
  // === PUBLIC ROUTES (No Authentication Required) ===
  
  // Get featured products for public display
  router.get(
    ROUTES.GET_PUBLIC_FEATURED,
    featuredProductController.getPublicFeaturedProducts
  );
  
  // Get bestselling products for public display
  router.get(
    ROUTES.GET_PUBLIC_BESTSELLERS,
    featuredProductController.getPublicBestSellerProducts
  );
  
  // === ADMIN ROUTES (Elevated Permissions Required) ===
  
  // Get all featured or bestselling products
  router.get(
    ROUTES.GET_FEATURED_PRODUCTS,
    authenticateToken,
    checkPermission(PERMISSIONS.PRODUCT_MANAGE),
    featuredProductController.getFeaturedProducts
  );
  
  // Update featured or bestselling products (bulk update)
  router.post(
    ROUTES.UPDATE_FEATURED_PRODUCTS,
    authenticateToken,
    checkPermission(PERMISSIONS.PRODUCT_MANAGE),
    featuredProductController.updateFeaturedProducts
  );
  
  // Toggle a product's featured/bestselling status
  router.put(
    ROUTES.TOGGLE_PRODUCT_STATUS,
    authenticateToken,
    checkPermission(PERMISSIONS.PRODUCT_MANAGE),
    featuredProductController.toggleProductStatus
  );
};

module.exports = featuredProductRoutes;
