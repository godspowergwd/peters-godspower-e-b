const leadModel = require('../models/leadModel');
const landingPageModel = require('../models/landingPageModel'); // To verify landing page exists and get its owner
const validator = require('validator');

// POST /api/leads/capture/:landingPageSlug
// Capture a new lead from a public landing page form submission
const captureLead = async (req, res, next) => {
  try {
    const { landingPageSlug } = req.params;
    const { email, first_name, last_name, ...custom_fields } = req.body; // Capture other fields dynamically

    if (!landingPageSlug) {
      return res.status(400).json({ message: 'Landing page slug is required.' });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    // Find the landing page by slug
    const landingPage = await landingPageModel.findLandingPageBySlug(landingPageSlug);
    if (!landingPage) {
      return res.status(404).json({ message: 'Landing page not found.' });
    }
    if (!landingPage.is_published) {
      return res.status(403).json({ message: 'This landing page is not currently active for lead capture.' });
    }

    const leadData = {
      landing_page_id: landingPage.id,
      user_id: landingPage.user_id, // The user who owns the landing page
      email,
      first_name,
      last_name,
      custom_fields, // Store any extra form fields
    };

    const newLead = await leadModel.createLead(leadData);
    // For a public capture, we might not want to return the full lead object,
    // or at least not sensitive parts like user_id.
    // A simple success message is often best.
    res.status(201).json({ message: 'Lead captured successfully.', lead_id: newLead.id });
  } catch (error) {
    console.error('Error capturing lead:', error);
    if (error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/leads/page/:landingPageId
// Get all leads for a specific landing page (protected, for page owner)
const getLeadsByPage = async (req, res, next) => {
  try {
    const landingPageId = parseInt(req.params.landingPageId, 10);
    const authenticatedUserId = req.user.id;

    if (isNaN(landingPageId)) {
        return res.status(400).json({ message: 'Invalid landing page ID format.'});
    }

    // Verify the landing page exists and is owned by the authenticated user
    const landingPage = await landingPageModel.findLandingPageById(landingPageId);
    if (!landingPage) {
      return res.status(404).json({ message: 'Landing page not found.' });
    }
    if (landingPage.user_id !== authenticatedUserId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view leads for this page.' });
    }

    const leads = await leadModel.findLeadsByLandingPageId(landingPageId);
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads by page:', error);
    next(error);
  }
};

// GET /api/leads/user
// Get all leads for the authenticated user across all their landing pages
const getLeadsByUser = async (req, res, next) => {
    try {
        const authenticatedUserId = req.user.id;
        const leads = await leadModel.findLeadsByUserId(authenticatedUserId);
        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads by user:', error);
        next(error);
    }
};


// GET /api/leads/:id
// Get a specific lead by ID (protected, lead must belong to the authenticated user)
const getLeadById = async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id;

    if (isNaN(leadId)) {
        return res.status(400).json({ message: 'Invalid lead ID format.'});
    }

    const lead = await leadModel.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    // Authorization: Check if the lead's associated user_id matches the authenticated user
    if (lead.user_id !== authenticatedUserId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view this lead.' });
    }

    res.status(200).json(lead);
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    next(error);
  }
};

// DELETE /api/leads/:id
// Delete a lead (protected, lead must belong to the authenticated user)
const deleteLeadById = async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id;

    if (isNaN(leadId)) {
        return res.status(400).json({ message: 'Invalid lead ID format.'});
    }

    // Verify the lead exists and is owned by the authenticated user before deleting
    const lead = await leadModel.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    if (lead.user_id !== authenticatedUserId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this lead.' });
    }

    const success = await leadModel.deleteLead(leadId);
    if (!success) { // Should not happen if previous checks passed
      return res.status(404).json({ message: 'Lead not found or deletion failed.' });
    }

    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting lead:', error);
    next(error);
  }
};

module.exports = {
  captureLead,
  getLeadsByPage,
  getLeadsByUser,
  getLeadById,
  deleteLeadById,
};
