const express = require('express');
const socialPostController = require('../controllers/socialPostController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require authentication

// Create (schedule) a new social media post
router.post('/', protect, socialPostController.createPost);

// Get all social media posts for the authenticated user
router.get('/', protect, socialPostController.getUserPosts);

// Get a specific social media post by ID
router.get('/:id', protect, socialPostController.getPostById);

// Update a social media post (e.g., content, scheduled time, if not yet published)
router.put('/:id', protect, socialPostController.updatePost);

// Delete a social media post
router.delete('/:id', protect, socialPostController.deletePost);

module.exports = router;
