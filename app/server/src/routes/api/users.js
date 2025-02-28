const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/UserController');
const { authenticateToken } = require('../../middleware/auth');
const { validateUser } = require('../../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.get('/:id/roles', UserController.getUserRoles);
router.post('/', validateUser, UserController.create);
router.put('/:id', validateUser, UserController.update);
router.delete('/:id', UserController.delete);

module.exports = router;
