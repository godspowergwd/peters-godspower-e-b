const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware'); // To protect user-specific routes

const router = express.Router();

// GET /api/subscriptions/plans - List available subscription plans (public or protected, depending on app logic)
// For now, let's make it public so users can see plans before logging in/signing up.
router.get('/plans', subscriptionController.listAvailablePlans);

// POST /api/subscriptions/create-checkout-session - Create a Stripe Checkout session for a plan
// Requires authentication as it's user-specific and needs/creates a Stripe Customer ID.
router.post('/create-checkout-session', protect, subscriptionController.createCheckoutSession);

// GET /api/subscriptions/my-subscription - Get current user's subscription details
router.get('/my-subscription', protect, subscriptionController.getCurrentUserSubscription);

// POST /api/subscriptions/cancel - Cancel user's active subscription
router.post('/cancel', protect, subscriptionController.cancelSubscription);

// TODO:
// POST /api/subscriptions/update - For changing plans (requires more complex Stripe logic)
// GET /api/subscriptions/billing-portal - To redirect user to Stripe's self-service billing portal

module.exports = router;
