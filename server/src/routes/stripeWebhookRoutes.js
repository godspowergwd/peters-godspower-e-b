const express = require('express');
const stripeWebhookController = require('../controllers/stripeWebhookController');

const router = express.Router();

// POST /api/stripe/webhooks - Stripe webhook endpoint
// This route needs the raw request body for Stripe signature verification.
// The main app.js should apply express.raw({type: 'application/json'}) middleware BEFORE this route.
router.post('/webhooks', stripeWebhookController.handleStripeWebhook);

module.exports = router;
