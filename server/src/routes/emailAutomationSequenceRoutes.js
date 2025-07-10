const express = require('express');
const sequenceController = require('../controllers/emailAutomationSequenceController');
const { protect } = require('../middleware/authMiddleware');

// This router will be mounted under /api/email-campaigns/:campaignId/sequences
// So, campaignId will be available in req.params
// The sequenceController.checkCampaignAccess middleware will handle campaign validation and ownership.
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :campaignId

// All routes are protected and also use the campaign access check middleware
router.use(protect); // User must be authenticated
router.use(sequenceController.checkCampaignAccess); // User must own the campaign in :campaignId

// Create a new sequence step for the campaign
// POST /api/email-campaigns/:campaignId/sequences/
router.post('/', sequenceController.createSequence);

// Get all sequence steps for the campaign
// GET /api/email-campaigns/:campaignId/sequences/
router.get('/', sequenceController.getSequencesForCampaign);

// Get a specific sequence step by ID
// GET /api/email-campaigns/:campaignId/sequences/:sequenceId
router.get('/:sequenceId', sequenceController.getSequenceById);

// Update a sequence step
// PUT /api/email-campaigns/:campaignId/sequences/:sequenceId
router.put('/:sequenceId', sequenceController.updateSequence);

// Delete a sequence step
// DELETE /api/email-campaigns/:campaignId/sequences/:sequenceId
router.delete('/:sequenceId', sequenceController.deleteSequence);

module.exports = router;
