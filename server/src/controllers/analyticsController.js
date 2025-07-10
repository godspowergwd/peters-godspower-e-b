// Analytics Controller: Provides data for the dashboard

const userModel = require('../models/userModel');
const landingPageModel = require('../models/landingPageModel');
const leadModel = require('../models/leadModel');
const emailTemplateModel = require('../models/emailTemplateModel');
const emailCampaignModel = require('../models/emailCampaignModel');
const socialAccountModel = require('../models/socialAccountModel');
const socialPostModel = require('../models/socialPostModel');
// const sentEmailModel = require('../models/sentEmailModel'); // For when email sending/tracking is added

// GET /api/analytics/summary
const getDashboardSummary = async (req, res, next) => {
  try {
    const user_id = req.user.id; // Authenticated user

    // --- Landing Page Analytics ---
    const userLandingPages = await landingPageModel.findLandingPagesByUserId(user_id);
    const totalLandingPages = userLandingPages.length;
    // Placeholder for views and conversion rates as these are not tracked yet
    const landingPageAnalytics = {
      totalCount: totalLandingPages,
      // Example future data:
      // totalViews: userLandingPages.reduce((sum, page) => sum + (page.views || 0), 0),
      // averageConversionRate: 0, // Would need leads/views logic per page
      pages: userLandingPages.map(p => ({
          id: p.id,
          name: p.name,
          is_published: p.is_published,
          created_at: p.created_at,
          // views: p.views || 0, // Future
          // leads: (await leadModel.findLeadsByLandingPageId(p.id)).length // Can be intensive here
      }))
    };

    // --- Lead Analytics ---
    const userLeads = await leadModel.findLeadsByUserId(user_id);
    const totalLeads = userLeads.length;
    const leadsByPage = {};
    for (const lead of userLeads) {
        leadsByPage[lead.landing_page_id] = (leadsByPage[lead.landing_page_id] || 0) + 1;
    }
    // Add lead counts to landingPageAnalytics.pages (less intensive than querying per page above)
    landingPageAnalytics.pages.forEach(p => {
        p.leadsCaptured = leadsByPage[p.id] || 0;
        // p.conversionRate = p.views > 0 ? (p.leadsCaptured / p.views) * 100 : 0; // Future
    });


    const leadAnalytics = {
      totalCount: totalLeads,
      // Example future data:
      // leadsToday: userLeads.filter(l => new Date(l.captured_at).toDateString() === new Date().toDateString()).length,
      // leadsBySource: leadsByPage // Already calculated
    };

    // --- Email Marketing Analytics ---
    const userEmailTemplates = await emailTemplateModel.findEmailTemplatesByUserId(user_id);
    const userEmailCampaigns = await emailCampaignModel.findEmailCampaignsByUserId(user_id);
    const emailCampaignsByStatus = userEmailCampaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {});
    const emailMarketingAnalytics = {
      totalTemplates: userEmailTemplates.length,
      totalCampaigns: userEmailCampaigns.length,
      campaignsByStatus: emailCampaignsByStatus,
      // Example future data (from sentEmailModel):
      // totalEmailsSent: 0,
      // overallOpenRate: 0,
      // overallClickRate: 0,
    };

    // --- Social Media Analytics ---
    const userSocialAccounts = await socialAccountModel.findSocialAccountsByUserId(user_id);
    const userSocialPosts = await socialPostModel.findSocialPostsByUserId(user_id);
    const socialPostsByStatus = userSocialPosts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});
    const socialMediaAnalytics = {
      connectedAccounts: userSocialAccounts.length,
      totalPostsScheduledOrSent: userSocialPosts.length, // Includes drafts, failed etc.
      postsByStatus: socialPostsByStatus,
      // Example future data:
      // totalEngagement: 0, // Would require API calls to each platform for likes, shares etc.
    };

    // --- Overall Summary ---
    const summary = {
      landingPages: landingPageAnalytics,
      leads: leadAnalytics,
      emailMarketing: emailMarketingAnalytics,
      socialMedia: socialMediaAnalytics,
      // Could add user profile info here too if relevant for dashboard
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    next(error);
  }
};

// Placeholder for more specific analytics endpoints if needed in the future
// e.g., GET /api/analytics/leads-over-time
// e.g., GET /api/analytics/campaign/:campaignId/performance

module.exports = {
  getDashboardSummary,
};
