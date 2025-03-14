/**
 * Configuration Routes
 * Provides API endpoints for accessing application-wide configuration
 * @module routes/api/config
 */
const applicationConfig = require('../../../config/application');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');
const logger = require('../../utils/logger').createLogger({
  level: 'info',
  service: 'configRoutes'
});
const fs = require('fs');
const path = require('path');

/**
 * Route definitions for configuration endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  ALL: '/',
  COMPANY: '/company',
  BRAND: '/brand',
  SOCIAL: '/social',
  FEATURES: '/features',
  ADMIN: '/admin',
  UPDATE: '/admin/update'
};

/**
 * Configuration route handler functions
 */
const configHandlers = {
  /**
   * Get all public configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllConfig: (req, res) => {
    try {
      // Filter out sensitive information for public view
      const publicConfig = {
        ...applicationConfig,
        // Remove sensitive information like API keys or internal settings
        integration: {
          ...applicationConfig.integration,
          printify: {
            ...applicationConfig.integration.printify,
            apiKey: undefined
          }
        }
      };
      
      return res.status(200).json(publicConfig);
    } catch (error) {
      logger.error('Error serving configuration:', { error });
      return res.status(500).json({ message: 'Error retrieving configuration information' });
    }
  },

  /**
   * Get company information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCompanyInfo: (req, res) => {
    try {
      return res.status(200).json(applicationConfig.company);
    } catch (error) {
      logger.error('Error serving company information:', { error });
      return res.status(500).json({ message: 'Error retrieving company information' });
    }
  },

  /**
   * Get brand information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getBrandInfo: (req, res) => {
    try {
      return res.status(200).json(applicationConfig.brand);
    } catch (error) {
      logger.error('Error serving brand information:', { error });
      return res.status(500).json({ message: 'Error retrieving brand information' });
    }
  },

  /**
   * Get social media links
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSocialInfo: (req, res) => {
    try {
      return res.status(200).json(applicationConfig.social);
    } catch (error) {
      logger.error('Error serving social media information:', { error });
      return res.status(500).json({ message: 'Error retrieving social media information' });
    }
  },

  /**
   * Get feature configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFeaturesInfo: (req, res) => {
    try {
      return res.status(200).json(applicationConfig.features);
    } catch (error) {
      logger.error('Error serving features information:', { error });
      return res.status(500).json({ message: 'Error retrieving features information' });
    }
  },
  
  /**
   * Get all configuration including sensitive data (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAdminConfig: (req, res) => {
    try {
      // Include all information for admin use
      return res.status(200).json(applicationConfig);
    } catch (error) {
      logger.error('Error serving admin configuration:', { error });
      return res.status(500).json({ message: 'Error retrieving admin configuration' });
    }
  },
  
  /**
   * Update configuration (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateConfig: (req, res) => {
    try {
      const configFilePath = path.resolve(__dirname, '../../config/application.json');
      
      // In a production environment, you would validate the input data more thoroughly
      const updatedConfig = {
        ...applicationConfig,
        ...req.body,
        // Automatically update the lastUpdated date
        application: {
          ...applicationConfig.application,
          ...req.body.application,
          lastUpdated: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        }
      };
      
      // This will actually update the file in a development environment
      // In production, you might want to implement a different strategy
      fs.writeFileSync(configFilePath, JSON.stringify(updatedConfig, null, 2), 'utf8');
      
      logger.info('Configuration update requested', { userId: req.user.id });
      
      return res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: updatedConfig
      });
    } catch (error) {
      logger.error('Error updating configuration:', { error });
      return res.status(500).json({ message: 'Error updating configuration' });
    }
  }
};

/**
 * Configuration routes registration
 * @param {Express.Router} router - Express router instance
 */
const configRoutes = (router) => {
  // === PUBLIC ROUTES ===
  
  /**
   * @route   GET /api/config
   * @desc    Get all public configuration
   * @access  Public
   * @returns {Object} Configuration information
   */
  router.get(ROUTES.ALL, configHandlers.getAllConfig);

  /**
   * @route   GET /api/config/company
   * @desc    Get company information
   * @access  Public
   * @returns {Object} Company information
   */
  router.get(ROUTES.COMPANY, configHandlers.getCompanyInfo);

  /**
   * @route   GET /api/config/brand
   * @desc    Get brand information
   * @access  Public
   * @returns {Object} Brand information
   */
  router.get(ROUTES.BRAND, configHandlers.getBrandInfo);

  /**
   * @route   GET /api/config/social
   * @desc    Get social media links
   * @access  Public
   * @returns {Object} Social media links
   */
  router.get(ROUTES.SOCIAL, configHandlers.getSocialInfo);

  /**
   * @route   GET /api/config/features
   * @desc    Get feature configuration
   * @access  Public
   * @returns {Object} Features configuration
   */
  router.get(ROUTES.FEATURES, configHandlers.getFeaturesInfo);
  
  // === ADMIN ROUTES ===
  
  /**
   * @route   GET /api/config/admin
   * @desc    Get all configuration including sensitive data (admin only)
   * @access  Private (requires config:manage permission)
   * @returns {Object} Complete configuration
   */
  router.get(
    ROUTES.ADMIN,
    authenticateToken,
    checkPermission(PERMISSIONS.CONFIG_MANAGE || PERMISSIONS.CONTACT_MANAGE), // Fallback for backward compatibility
    configHandlers.getAdminConfig
  );
  
  /**
   * @route   PUT /api/config/admin/update
   * @desc    Update configuration (admin only)
   * @access  Private (requires config:manage permission)
   * @returns {Object} Updated configuration
   */
  router.put(
    ROUTES.UPDATE,
    authenticateToken,
    checkPermission(PERMISSIONS.CONFIG_MANAGE || PERMISSIONS.CONTACT_MANAGE), // Fallback for backward compatibility
    configHandlers.updateConfig
  );
};

module.exports = configRoutes;
