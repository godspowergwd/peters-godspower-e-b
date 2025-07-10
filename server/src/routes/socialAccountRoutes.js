const express = require('express');
const socialAccountController = require('../controllers/socialAccountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require authentication

// (Mock) Connect a new social media account (e.g., after OAuth flow)
// For a real OAuth flow, you'd have a /api/social-accounts/oauth/:platform/initiate
// and a /api/social-accounts/oauth/:platform/callback
router.post('/connect/:platform', protect, socialAccountController.connectAccount);

// Get all connected social accounts for the authenticated user
router.get('/', protect, socialAccountController.getUserAccounts);

// Get a specific connected social account by ID
router.get('/:id', protect, socialAccountController.getAccountById);

// Disconnect (delete) a social media account
router.delete('/:id', protect, socialAccountController.disconnectAccount);

module.exports = router;
