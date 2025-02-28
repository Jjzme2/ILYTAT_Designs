const express = require('express');
const router = express.Router();
const RoleController = require('../../controllers/RoleController');
const { authenticateToken, authorize } = require('../../middleware/auth');
const { validateRole } = require('../../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Only admin can manage roles
router.use(authorize({
  roles: ['admin'],
  permissions: ['manage:roles'],
  requireAll: true
}));

router.get('/', RoleController.getAll);
router.get('/:id', RoleController.getById);
router.get('/:id/permissions', RoleController.getRolePermissions);
router.post('/', validateRole, RoleController.create);
router.put('/:id', validateRole, RoleController.update);
router.put('/:id/permissions', RoleController.updateRolePermissions);
router.delete('/:id', RoleController.delete);

module.exports = router;
