const express = require('express');
const leadController = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware'); // For protected routes

const router = express.Router();

// --- Public Route for Lead Capture ---
// POST /api/leads/capture/:landingPageSlug
// This endpoint is used by public landing page forms to submit lead data.
// It does NOT use the `protect` middleware because visitors are not authenticated.
router.post('/capture/:landingPageSlug', leadController.captureLead);


// --- Protected Routes for Lead Management by Authenticated User ---

// GET /api/leads/page/:landingPageId
// Get all leads for a specific landing page owned by the authenticated user.
router.get('/page/:landingPageId', protect, leadController.getLeadsByPage);

// GET /api/leads/user
// Get all leads associated with the authenticated user across all their pages.
router.get('/user', protect, leadController.getLeadsByUser);

// GET /api/leads/:id
// Get a specific lead by its ID, if owned by the authenticated user.
router.get('/:id', protect, leadController.getLeadById);

// DELETE /api/leads/:id
// Delete a specific lead by its ID, if owned by the authenticated user.
router.delete('/:id', protect, leadController.deleteLeadById);

// Potential future routes:
// PUT /api/leads/:id - Update lead details (e.g., add notes, change status)
// POST /api/leads/export - Export leads for a user or page

module.exports = router;
