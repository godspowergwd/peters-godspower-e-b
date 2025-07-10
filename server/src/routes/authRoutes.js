const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

const router = express.Router();

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', authController.signup);

// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current logged-in user's profile
// @access  Private (requires token)
router.get('/me', protect, authController.getMe);

// Example of a protected route that might also check for roles in the future:
// router.get('/admin-only', protect, authorize('admin'), (req, res) => {
//   res.json({ message: 'Welcome Admin!' });
// });

module.exports = router;
