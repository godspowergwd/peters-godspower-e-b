const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All analytics routes are protected and require authentication

// GET /api/analytics/summary - Provides a summary of data for the user's dashboard
router.get('/summary', protect, analyticsController.getDashboardSummary);

// Future analytics routes could be added here:
// router.get('/leads-growth', protect, analyticsController.getLeadsGrowthData);
// router.get('/email-campaign-performance/:campaignId', protect, analyticsController.getEmailCampaignPerformance);
// router.get('/landing-page-details/:pageId', protect, analyticsController.getLandingPageDetailedStats);

module.exports = router;
