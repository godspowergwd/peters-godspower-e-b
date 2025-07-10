require('dotenv').config(); // Single dotenv config at the top
const express = require('express');
const cors = require('cors');

// Route imports (ensure each is listed only once)
const authRoutes = require('./routes/authRoutes');
const landingPageRoutes = require('./routes/landingPageRoutes');
const leadRoutes = require('./routes/leadRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const emailCampaignRoutes = require('./routes/emailCampaignRoutes');
const socialAccountRoutes = require('./routes/socialAccountRoutes');
const socialPostRoutes = require('./routes/socialPostRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
// const campaignRoutes = require('./routes/campaignRoutes'); // Example for future routes

const app = express();

// Middleware
// Stripe webhook endpoint needs raw body, so it must be configured before express.json()
// Apply express.raw middleware only to the Stripe webhook route.
// IMPORTANT: This must come BEFORE app.use(express.json());
app.use('/api/stripe/webhooks', express.raw({ type: 'application/json' }));

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON bodies for other routes
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI Marketing App API!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/landing-pages', landingPageRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/email-campaigns', emailCampaignRoutes);
app.use('/api/social-accounts', socialAccountRoutes);
app.use('/api/social-posts', socialPostRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/stripe', stripeWebhookRoutes); // Webhooks for Stripe (handles /api/stripe/webhooks)
app.use('/api/admin/auth', adminAuthRoutes); // Admin authentication
app.use('/api/admin/users', adminUserRoutes); // Admin user management
// Note: The public route GET /api/landing-pages/public/:slug is defined within landingPageRoutes.js
// app.use('/api/campaigns', campaignRoutes);


// Global Error Handler (Basic Example)
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server.',
    error: process.env.NODE_ENV === 'development' ? { message: err.message, stack: err.stack } : {}
  });
});

module.exports = app;
