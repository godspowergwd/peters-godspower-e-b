// In-memory store for Email Campaigns
// IMPORTANT: NOT FOR PRODUCTION

const emailCampaignsInMemoryStore = [];
let currentCampaignId = 1;

const VALID_CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'];

/**
 * Creates a new email campaign.
 * @param {object} campaignData - Data for the new campaign.
 * @param {number} campaignData.user_id - ID of the user creating the campaign.
 * @param {string} campaignData.name - Name of the campaign.
 * @param {string} [campaignData.subject] - Default subject line for emails in this campaign.
 * @param {string} [campaignData.from_email] - Default from_email for this campaign.
 * @param {string} [campaignData.status='draft'] - Initial status of the campaign.
 * @returns {Promise<object>} - The created campaign object.
 */
const createEmailCampaign = async (campaignData) => {
  const { user_id, name, subject, from_email, status = 'draft' } = campaignData;

  if (!user_id || !name) {
    throw new Error('User ID and name are required for an email campaign.');
  }
  if (status && !VALID_CAMPAIGN_STATUSES.includes(status)) {
    throw new Error(`Invalid campaign status. Must be one of: ${VALID_CAMPAIGN_STATUSES.join(', ')}`);
  }

  const newCampaign = {
    id: currentCampaignId++,
    user_id: parseInt(user_id, 10),
    name,
    subject: subject || '', // Default subject
    from_email: from_email || '', // Default from email
    status,
    // campaign_id: null, // Link to an overall marketing campaign (from database_schema.md) - for future
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  emailCampaignsInMemoryStore.push(newCampaign);
  return { ...newCampaign };
};

/**
 * Finds an email campaign by its ID.
 * @param {number} id - The ID of the campaign.
 * @returns {Promise<object|null>} - The campaign object or null if not found.
 */
const findEmailCampaignById = async (id) => {
  const campaignId = parseInt(id, 10);
  const campaign = emailCampaignsInMemoryStore.find(c => c.id === campaignId);
  return campaign ? { ...campaign } : null;
};

/**
 * Finds all email campaigns for a given user ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object[]>} - An array of campaign objects.
 */
const findEmailCampaignsByUserId = async (userId) => {
  const uId = parseInt(userId, 10);
  return emailCampaignsInMemoryStore.filter(c => c.user_id === uId).map(c => ({ ...c }));
};

/**
 * Updates an email campaign.
 * @param {number} id - The ID of the campaign to update.
 * @param {object} updateData - Data to update (name, subject, from_email, status).
 * @returns {Promise<object|null>} - The updated campaign object or null if not found.
 */
const updateEmailCampaign = async (id, updateData) => {
  const campaignId = parseInt(id, 10);
  const campaignIndex = emailCampaignsInMemoryStore.findIndex(c => c.id === campaignId);

  if (campaignIndex === -1) {
    return null;
  }

  if (updateData.status && !VALID_CAMPAIGN_STATUSES.includes(updateData.status)) {
    throw new Error(`Invalid campaign status. Must be one of: ${VALID_CAMPAIGN_STATUSES.join(', ')}`);
  }

  const existingCampaign = emailCampaignsInMemoryStore[campaignIndex];
  const updatedCampaign = {
    ...existingCampaign,
    ...updateData,
    id: existingCampaign.id,
    user_id: existingCampaign.user_id,
    updated_at: new Date().toISOString(),
  };
  updatedCampaign.created_at = existingCampaign.created_at;


  emailCampaignsInMemoryStore[campaignIndex] = updatedCampaign;
  return { ...updatedCampaign };
};

/**
 * Deletes an email campaign by its ID.
 * @param {number} id - The ID of the campaign to delete.
 * @returns {Promise<boolean>} - True if deleted, false if not found.
 */
const deleteEmailCampaign = async (id) => {
  const campaignId = parseInt(id, 10);
  const campaignIndex = emailCampaignsInMemoryStore.findIndex(c => c.id === campaignId);

  if (campaignIndex === -1) {
    return false;
  }

  // Consider implications: what happens to sequences or sent emails associated with this campaign?
  // For in-memory, we just delete the campaign. In a real DB, might need cascading deletes or archiving.
  emailCampaignsInMemoryStore.splice(campaignIndex, 1);
  return true;
};

module.exports = {
  createEmailCampaign,
  findEmailCampaignById,
  findEmailCampaignsByUserId,
  updateEmailCampaign,
  deleteEmailCampaign,
  VALID_CAMPAIGN_STATUSES,
  _emailCampaignsInMemoryStore: emailCampaignsInMemoryStore, // For testing
  _resetEmailCampaignsInMemoryStore: () => { // For testing
    emailCampaignsInMemoryStore.length = 0;
    currentCampaignId = 1;
  }
};
