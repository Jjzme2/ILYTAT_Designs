/**
 * Contact Information Module
 * 
 * Provides access to organization contact information throughout the application.
 * This module imports the contact.json data and exports it for use in other server files.
 */

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger').createLogger({ 
  level: 'info',
  service: 'contactConfig'
});

// Load contact information from JSON file
let contactInfo;

try {
  const contactFilePath = path.resolve(__dirname, '../../config/contact.json');
  const contactData = fs.readFileSync(contactFilePath, 'utf8');
  contactInfo = JSON.parse(contactData);
  logger.info('Contact information loaded successfully');
} catch (error) {
  logger.error('Failed to load contact information:', { error });
  // Provide fallback data in case of failure
  contactInfo = {
    contactDetails: {
      company: {
        name: 'ILYTAT Designs',
        supportEmail: 'support@ilytat.com',
        // Add minimal fallback data
      }
    }
  };
}

module.exports = contactInfo;
