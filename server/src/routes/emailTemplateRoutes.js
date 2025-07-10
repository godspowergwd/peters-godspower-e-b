const express = require('express');
const emailTemplateController = require('../controllers/emailTemplateController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require authentication

// Create a new email template
router.post('/', protect, emailTemplateController.createTemplate);

// Get all email templates for the authenticated user
router.get('/', protect, emailTemplateController.getUserTemplates);

// Get a specific email template by ID
router.get('/:id', protect, emailTemplateController.getTemplateById);

// Update an email template
router.put('/:id', protect, emailTemplateController.updateTemplate);

// Delete an email template
router.delete('/:id', protect, emailTemplateController.deleteTemplate);

module.exports = router;
