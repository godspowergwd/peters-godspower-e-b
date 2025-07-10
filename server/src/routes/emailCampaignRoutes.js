const express = require('express');
const emailCampaignController = require('../controllers/emailCampaignController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require authentication

// Create a new email campaign
router.post('/', protect, emailCampaignController.createCampaign);

// Get all email campaigns for the authenticated user
router.get('/', protect, emailCampaignController.getUserCampaigns);

// Get a specific email campaign by ID
router.get('/:id', protect, emailCampaignController.getCampaignById);

// Update an email campaign
router.put('/:id', protect, emailCampaignController.updateCampaign);

// Delete an email campaign
router.delete('/:id', protect, emailCampaignController.deleteCampaign);

// Routes for managing email sequences within a campaign will be added later
// e.g., POST /:campaignId/sequences
//      GET /:campaignId/sequences
//      PUT /:campaignId/sequences/:sequenceId
//      DELETE /:campaignId/sequences/:sequenceId

// Nested routes for email sequences within a campaign
const emailAutomationSequenceRoutes = require('./emailAutomationSequenceRoutes');
router.use('/:campaignId/sequences', emailAutomationSequenceRoutes);

module.exports = router;
