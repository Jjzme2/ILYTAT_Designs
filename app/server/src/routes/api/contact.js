/**
 * Contact Routes
 * Provides API endpoints for accessing organization contact information
 */

const express = require('express');
const router = express.Router();
const contactInfo = require('../../config/contact');
const logger = require('../../utils/logger').createLogger({
  level: 'info',
  service: 'contactRoutes'
});

/**
 * @route   GET /api/contact
 * @desc    Get all contact information
 * @access  Public
 * @returns {Object} Contact information
 */
router.get('/', (req, res) => {
  try {
    return res.status(200).json(contactInfo);
  } catch (error) {
    logger.error('Error serving contact information:', { error });
    return res.status(500).json({ message: 'Error retrieving contact information' });
  }
});

/**
 * @route   GET /api/contact/company
 * @desc    Get company contact information
 * @access  Public
 * @returns {Object} Company contact information
 */
router.get('/company', (req, res) => {
  try {
    return res.status(200).json(contactInfo.contactDetails.company);
  } catch (error) {
    logger.error('Error serving company contact information:', { error });
    return res.status(500).json({ message: 'Error retrieving company information' });
  }
});

/**
 * @route   GET /api/contact/social
 * @desc    Get social media links
 * @access  Public
 * @returns {Object} Social media links
 */
router.get('/social', (req, res) => {
  try {
    return res.status(200).json(contactInfo.contactDetails.socialMedia);
  } catch (error) {
    logger.error('Error serving social media information:', { error });
    return res.status(500).json({ message: 'Error retrieving social media information' });
  }
});

module.exports = router;
