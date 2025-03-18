/**
 * Documentation API Routes
 * 
 * These routes provide API access to the project documentation,
 * allowing both server and client applications to access documentation content.
 */

const express = require('express');
const router = express.Router();
const fileDocumentationController = require('../controllers/fileDocumentationController');

// Get central documentation content
router.get('/central', fileDocumentationController.getCentralDocumentation);

// Get application-specific documentation content
router.get('/app-specific', fileDocumentationController.getAppSpecificDocumentation);

// List available documentation by category
router.get('/list', fileDocumentationController.listDocumentationByCategory);

// Search documentation
router.get('/search', fileDocumentationController.searchDocumentation);

// Validate links in a documentation file
router.get('/validate-links', fileDocumentationController.validateDocumentationLinks);

module.exports = router;
