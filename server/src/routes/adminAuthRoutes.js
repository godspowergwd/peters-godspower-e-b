const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const { adminProtect } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// POST /api/admin/auth/login - Admin login
router.post('/login', adminAuthController.adminLogin);

// GET /api/admin/auth/me - Get current logged-in admin's profile
router.get('/me', adminProtect, adminAuthController.getAdminMe);

// POST /api/admin/auth/logout - Admin logout (conceptual for JWT)
router.post('/logout', adminProtect, adminAuthController.adminLogout);

module.exports = router;
