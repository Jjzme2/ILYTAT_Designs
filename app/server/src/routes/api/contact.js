/**
 * Contact Routes
 * Provides API endpoints for accessing organization contact information
 * @module routes/api/contact
 */
const contactInfo = require('../../config/contact');
const { authenticateToken } = require('../../middleware/auth');
const { PERMISSIONS, checkPermission } = require('../../middleware/permissions');
const logger = require('../../utils/logger').createLogger({
  level: 'info',
  service: 'contactRoutes'
});

/**
 * Route definitions for contact endpoints
 * Centralized path constants for maintainability
 */
const ROUTES = {
  ALL: '/',
  COMPANY: '/company',
  SOCIAL: '/social',
  ADMIN: '/admin',
  UPDATE: '/update'
};

/**
 * Contact route handler functions
 */
const contactHandlers = {
  /**
   * Get all contact information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllInfo: (req, res) => {
    try {
      // Filter out sensitive information for public view
      const publicInfo = {
        ...contactInfo,
        contactDetails: {
          ...contactInfo.contactDetails,
          // Remove any sensitive information
          privateContacts: undefined,
          internalNotes: undefined
        }
      };
      return res.status(200).json(publicInfo);
    } catch (error) {
      logger.error('Error serving contact information:', { error });
      return res.status(500).json({ message: 'Error retrieving contact information' });
    }
  },

  /**
   * Get company contact information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCompanyInfo: (req, res) => {
    try {
      return res.status(200).json(contactInfo.contactDetails.company);
    } catch (error) {
      logger.error('Error serving company contact information:', { error });
      return res.status(500).json({ message: 'Error retrieving company information' });
    }
  },

  /**
   * Get social media links
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSocialInfo: (req, res) => {
    try {
      return res.status(200).json(contactInfo.contactDetails.socialMedia);
    } catch (error) {
      logger.error('Error serving social media information:', { error });
      return res.status(500).json({ message: 'Error retrieving social media information' });
    }
  },
  
  /**
   * Get all contact information including sensitive data (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAdminContactInfo: (req, res) => {
    try {
      // Include all information for admin use
      return res.status(200).json(contactInfo);
    } catch (error) {
      logger.error('Error serving admin contact information:', { error });
      return res.status(500).json({ message: 'Error retrieving admin contact information' });
    }
  },
  
  /**
   * Update contact information (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateContactInfo: (req, res) => {
    try {
      // This would typically update a database or file
      // For now, we'll just return the received data as if it was saved
      logger.info('Contact information update requested', { userId: req.user.id });
      return res.status(200).json({
        success: true,
        message: 'Contact information updated',
        data: req.body
      });
    } catch (error) {
      logger.error('Error updating contact information:', { error });
      return res.status(500).json({ message: 'Error updating contact information' });
    }
  }
};

/**
 * Contact routes registration
 * @param {Express.Router} router - Express router instance
 */
const contactRoutes = (router) => {
  // === PUBLIC ROUTES ===
  
  /**
   * @route   GET /api/contact
   * @desc    Get all contact information
   * @access  Public
   * @returns {Object} Contact information
   */
  router.get(ROUTES.ALL, contactHandlers.getAllInfo);

  /**
   * @route   GET /api/contact/company
   * @desc    Get company contact information
   * @access  Public
   * @returns {Object} Company contact information
   */
  router.get(ROUTES.COMPANY, contactHandlers.getCompanyInfo);

  /**
   * @route   GET /api/contact/social
   * @desc    Get social media links
   * @access  Public
   * @returns {Object} Social media links
   */
  router.get(ROUTES.SOCIAL, contactHandlers.getSocialInfo);
  
  // === ADMIN ROUTES ===
  
  /**
   * @route   GET /api/contact/admin
   * @desc    Get all contact information including sensitive data (admin only)
   * @access  Private (requires contact:manage permission)
   * @returns {Object} Complete contact information
   */
  router.get(
    ROUTES.ADMIN,
    authenticateToken,
    checkPermission(PERMISSIONS.CONTACT_MANAGE),
    contactHandlers.getAdminContactInfo
  );
  
  /**
   * @route   PUT /api/contact/update
   * @desc    Update contact information (admin only)
   * @access  Private (requires contact:manage permission)
   * @returns {Object} Updated contact information
   */
  router.put(
    ROUTES.UPDATE,
    authenticateToken,
    checkPermission(PERMISSIONS.CONTACT_MANAGE),
    contactHandlers.updateContactInfo
  );
};

module.exports = contactRoutes;
