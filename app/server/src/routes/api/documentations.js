const express = require('express');
const router = express.Router();
const documentationController = require('../../controllers/documentationController');
const { authenticateToken, authorize } = require('../../middleware/auth');

/**
 * Documentation routes
 * @module routes/api/documentations
 */

// Get documentation by role
router.get('/role/:roleId', 
  authenticateToken,
  documentationController.getByRole
);

// Get documentation by category
router.get('/category/:category',
  authenticateToken,
  documentationController.getByCategory
);

// Create new documentation
router.post('/',
  authenticateToken,
  authorize(['admin']),
  documentationController.create
);

// Update documentation
router.put('/:id',
  authenticateToken,
  authorize(['admin']),
  documentationController.update
);

// Delete documentation
router.delete('/:id',
    authenticateToken,
  authorize(['admin']),
  documentationController.delete
);

module.exports = router;