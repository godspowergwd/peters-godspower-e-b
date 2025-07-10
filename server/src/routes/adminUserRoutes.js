const express = require('express');
const adminUserController = require('../controllers/adminUserController');
const { adminProtect, authorizeAdminRoles } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// All routes in this file are protected by adminProtect (must be a logged-in admin)
router.use(adminProtect);

// GET /api/admin/users - List all regular users
// Example: Allow 'superadmin' and 'admin_manager' roles
router.get('/', authorizeAdminRoles('superadmin', 'admin_manager', 'admin'), adminUserController.listUsers);

// GET /api/admin/users/:userId - Get details of a specific regular user
router.get('/:userId', authorizeAdminRoles('superadmin', 'admin_manager', 'admin'), adminUserController.getUserById);

// PUT /api/admin/users/:userId - Update a regular user's details
router.put('/:userId', authorizeAdminRoles('superadmin', 'admin_manager'), adminUserController.updateUser);

// DELETE /api/admin/users/:userId - Delete a regular user
// Make deletion superadmin only for safety in this example
router.delete('/:userId', authorizeAdminRoles('superadmin'), adminUserController.deleteUser);

module.exports = router;
