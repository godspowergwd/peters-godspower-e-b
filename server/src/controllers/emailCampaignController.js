const emailCampaignModel = require('../models/emailCampaignModel');
const validator = require('validator'); // For email validation if needed for from_email

// POST /api/email-campaigns
const createCampaign = async (req, res, next) => {
  try {
    const { name, subject, from_email, status } = req.body;
    const user_id = req.user.id; // From protect middleware

    if (!name) {
      return res.status(400).json({ message: 'Campaign name is required.' });
    }
    if (from_email && !validator.isEmail(from_email)) {
        return res.status(400).json({ message: 'Invalid from_email format.' });
    }
    if (status && !emailCampaignModel.VALID_CAMPAIGN_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${emailCampaignModel.VALID_CAMPAIGN_STATUSES.join(', ')}` });
    }

    const campaignData = { user_id, name, subject, from_email, status: status || 'draft' };
    const newCampaign = await emailCampaignModel.createEmailCampaign(campaignData);
    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Error creating email campaign:', error);
    if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/email-campaigns
const getUserCampaigns = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const campaigns = await emailCampaignModel.findEmailCampaignsByUserId(user_id);
    res.status(200).json(campaigns);
  } catch (error) {
    console.error('Error fetching user email campaigns:', error);
    next(error);
  }
};

// GET /api/email-campaigns/:id
const getCampaignById = async (req, res, next) => {
  try {
    const campaign_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(campaign_id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format.' });
    }

    const campaign = await emailCampaignModel.findEmailCampaignById(campaign_id);
    if (!campaign) {
      return res.status(404).json({ message: 'Email campaign not found.' });
    }

    if (campaign.user_id !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this email campaign.' });
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching email campaign by ID:', error);
    next(error);
  }
};

// PUT /api/email-campaigns/:id
const updateCampaign = async (req, res, next) => {
  try {
    const campaign_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;
    const { name, subject, from_email, status } = req.body;

    if (isNaN(campaign_id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format.' });
    }
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
    }
    if (from_email && !validator.isEmail(from_email)) {
        return res.status(400).json({ message: 'Invalid from_email format.' });
    }
    if (status && !emailCampaignModel.VALID_CAMPAIGN_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${emailCampaignModel.VALID_CAMPAIGN_STATUSES.join(', ')}` });
    }


    const existingCampaign = await emailCampaignModel.findEmailCampaignById(campaign_id);
    if (!existingCampaign) {
      return res.status(404).json({ message: 'Email campaign not found.' });
    }
    if (existingCampaign.user_id !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this email campaign.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (from_email !== undefined) updateData.from_email = from_email;
    if (status !== undefined) updateData.status = status;


    const updatedCampaign = await emailCampaignModel.updateEmailCampaign(campaign_id, updateData);
    res.status(200).json(updatedCampaign);
  } catch (error) {
    console.error('Error updating email campaign:', error);
     if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// DELETE /api/email-campaigns/:id
const deleteCampaign = async (req, res, next) => {
  try {
    const campaign_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(campaign_id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format.' });
    }

    const existingCampaign = await emailCampaignModel.findEmailCampaignById(campaign_id);
    if (!existingCampaign) {
      return res.status(404).json({ message: 'Email campaign not found.' });
    }
    if (existingCampaign.user_id !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this email campaign.' });
    }

    await emailCampaignModel.deleteEmailCampaign(campaign_id);
    // TODO: In a real app, also delete associated sequences, stop active sends, etc.
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email campaign:', error);
    next(error);
  }
};

module.exports = {
  createCampaign,
  getUserCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
};
