const sequenceModel = require('../models/emailAutomationSequenceModel');
const emailCampaignModel = require('../models/emailCampaignModel'); // To verify campaign ownership
const emailTemplateModel = require('../models/emailTemplateModel'); // To verify template ownership/existence

// Middleware to check campaign ownership and existence for sequence operations
const checkCampaignAccess = async (req, res, next) => {
    try {
        const campaignId = parseInt(req.params.campaignId, 10);
        const userId = req.user.id;

        if (isNaN(campaignId)) {
            return res.status(400).json({ message: 'Invalid Campaign ID format.' });
        }

        const campaign = await emailCampaignModel.findEmailCampaignById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Email campaign not found.' });
        }
        if (campaign.user_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this email campaign.' });
        }
        req.campaign = campaign; // Attach campaign to request for later use
        next();
    } catch (error) {
        next(error);
    }
};


// POST /api/email-campaigns/:campaignId/sequences
const createSequence = async (req, res, next) => {
  try {
    const email_campaign_id = req.campaign.id; // From checkCampaignAccess middleware
    const user_id = req.user.id;
    const { email_template_id, delay_hours, sequence_order } = req.body;

    if (email_template_id === undefined || delay_hours === undefined || sequence_order === undefined) {
      return res.status(400).json({ message: 'Email template ID, delay hours, and sequence order are required.' });
    }

    // Verify the template exists and belongs to the user
    const template = await emailTemplateModel.findEmailTemplateById(email_template_id);
    if (!template || template.user_id !== user_id) {
        return res.status(404).json({ message: 'Email template not found or not owned by user.' });
    }

    const sequenceData = { user_id, email_campaign_id, email_template_id, delay_hours, sequence_order };
    const newSequence = await sequenceModel.createEmailAutomationSequence(sequenceData);
    res.status(201).json(newSequence);
  } catch (error) {
    console.error('Error creating email sequence:', error);
    if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/email-campaigns/:campaignId/sequences
const getSequencesForCampaign = async (req, res, next) => {
  try {
    const email_campaign_id = req.campaign.id; // From checkCampaignAccess middleware
    const user_id = req.user.id;
    const sequences = await sequenceModel.findSequencesByCampaignId(email_campaign_id, user_id);
    res.status(200).json(sequences);
  } catch (error) {
    console.error('Error fetching sequences for campaign:', error);
    next(error);
  }
};

// GET /api/email-campaigns/:campaignId/sequences/:sequenceId
const getSequenceById = async (req, res, next) => {
    try {
        // Campaign access already verified by checkCampaignAccess
        const sequence_id = parseInt(req.params.sequenceId, 10);
        const user_id = req.user.id;

        if (isNaN(sequence_id)) {
            return res.status(400).json({ message: 'Invalid Sequence ID format.' });
        }

        const sequence = await sequenceModel.findSequenceById(sequence_id, user_id);
        if (!sequence) {
            return res.status(404).json({ message: 'Sequence step not found or not owned by user.' });
        }
        // Ensure the sequence belongs to the campaign in the path
        if (sequence.email_campaign_id !== req.campaign.id) {
            return res.status(403).json({ message: 'Sequence does not belong to the specified campaign.'})
        }

        res.status(200).json(sequence);
    } catch (error) {
        console.error('Error fetching sequence by ID:', error);
        next(error);
    }
};


// PUT /api/email-campaigns/:campaignId/sequences/:sequenceId
const updateSequence = async (req, res, next) => {
  try {
    // Campaign access already verified by checkCampaignAccess
    const sequence_id = parseInt(req.params.sequenceId, 10);
    const user_id = req.user.id;
    const { email_template_id, delay_hours, sequence_order } = req.body;

    if (isNaN(sequence_id)) {
      return res.status(400).json({ message: 'Invalid Sequence ID format.' });
    }
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
    }

    // Verify the sequence exists and belongs to the user and this campaign
    const existingSequence = await sequenceModel.findSequenceById(sequence_id, user_id);
    if (!existingSequence || existingSequence.email_campaign_id !== req.campaign.id) {
        return res.status(404).json({ message: 'Sequence step not found for this campaign or not owned by user.' });
    }

    // If template ID is being updated, verify new template
    if (email_template_id !== undefined) {
        const template = await emailTemplateModel.findEmailTemplateById(email_template_id);
        if (!template || template.user_id !== user_id) {
            return res.status(404).json({ message: 'New email template not found or not owned by user.' });
        }
    }

    const updateData = {};
    if (email_template_id !== undefined) updateData.email_template_id = email_template_id;
    if (delay_hours !== undefined) updateData.delay_hours = delay_hours;
    if (sequence_order !== undefined) updateData.sequence_order = sequence_order;


    const updatedSequence = await sequenceModel.updateEmailAutomationSequence(sequence_id, user_id, updateData);
    res.status(200).json(updatedSequence);
  } catch (error) {
    console.error('Error updating email sequence:', error);
    if (error.message.includes('must be')) { // Catches validation errors from model
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// DELETE /api/email-campaigns/:campaignId/sequences/:sequenceId
const deleteSequence = async (req, res, next) => {
  try {
    // Campaign access already verified by checkCampaignAccess
    const sequence_id = parseInt(req.params.sequenceId, 10);
    const user_id = req.user.id;

    if (isNaN(sequence_id)) {
      return res.status(400).json({ message: 'Invalid Sequence ID format.' });
    }

    // Verify the sequence exists and belongs to the user and this campaign before deleting
    const existingSequence = await sequenceModel.findSequenceById(sequence_id, user_id);
    if (!existingSequence || existingSequence.email_campaign_id !== req.campaign.id) {
        return res.status(404).json({ message: 'Sequence step not found for this campaign or not owned by user.' });
    }

    await sequenceModel.deleteEmailAutomationSequence(sequence_id, user_id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email sequence:', error);
    next(error);
  }
};

module.exports = {
  checkCampaignAccess, // Export middleware for use in routes
  createSequence,
  getSequencesForCampaign,
  getSequenceById,
  updateSequence,
  deleteSequence,
};
