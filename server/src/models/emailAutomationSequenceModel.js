// In-memory store for Email Automation Sequences
// IMPORTANT: NOT FOR PRODUCTION

const sequencesInMemoryStore = [];
let currentSequenceId = 1;

/**
 * Creates a new email automation sequence step.
 * @param {object} sequenceData - Data for the new sequence step.
 * @param {number} sequenceData.email_campaign_id - ID of the campaign this sequence belongs to.
 * @param {number} sequenceData.email_template_id - ID of the email template to use.
 * @param {number} sequenceData.delay_hours - Delay in hours before sending (e.g., after previous email or trigger).
 * @param {number} sequenceData.sequence_order - Order of this email in the sequence.
 * @param {number} sequenceData.user_id - ID of the user who owns this sequence (via the campaign).
 * @returns {Promise<object>} - The created sequence step object.
 */
const createEmailAutomationSequence = async (sequenceData) => {
  const { email_campaign_id, email_template_id, delay_hours = 0, sequence_order, user_id } = sequenceData;

  if (!email_campaign_id || !email_template_id || sequence_order === undefined || !user_id) {
    throw new Error('Campaign ID, Template ID, User ID, and Sequence Order are required.');
  }
  if (typeof delay_hours !== 'number' || delay_hours < 0) {
    throw new Error('Delay hours must be a non-negative number.');
  }
   if (typeof sequence_order !== 'number' || sequence_order < 0) {
    throw new Error('Sequence order must be a non-negative number.');
  }


  const newSequenceStep = {
    id: currentSequenceId++,
    email_campaign_id: parseInt(email_campaign_id, 10),
    email_template_id: parseInt(email_template_id, 10),
    user_id: parseInt(user_id, 10),
    delay_hours,
    sequence_order,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), // Though typically sequences are set once
  };

  sequencesInMemoryStore.push(newSequenceStep);
  return { ...newSequenceStep };
};

/**
 * Finds all sequence steps for a given email campaign ID, ordered by sequence_order.
 * @param {number} emailCampaignId - The ID of the email campaign.
 * @param {number} userId - The ID of the user who owns the campaign.
 * @returns {Promise<object[]>} - An array of sequence step objects.
 */
const findSequencesByCampaignId = async (emailCampaignId, userId) => {
  const campaignIdInt = parseInt(emailCampaignId, 10);
  const userIdInt = parseInt(userId, 10);
  return sequencesInMemoryStore
    .filter(s => s.email_campaign_id === campaignIdInt && s.user_id === userIdInt)
    .sort((a, b) => a.sequence_order - b.sequence_order) // Sort by order
    .map(s => ({ ...s }));
};

/**
 * Finds a specific sequence step by its ID.
 * @param {number} sequenceId - The ID of the sequence step.
 * @param {number} userId - The ID of the user who owns the sequence.
 * @returns {Promise<object|null>} - The sequence step or null.
 */
const findSequenceById = async (sequenceId, userId) => {
    const seqIdInt = parseInt(sequenceId, 10);
    const userIdInt = parseInt(userId, 10);
    const sequence = sequencesInMemoryStore.find(s => s.id === seqIdInt && s.user_id === userIdInt);
    return sequence ? { ...sequence } : null;
};


/**
 * Updates an email automation sequence step.
 * @param {number} sequenceId - The ID of the sequence step to update.
 * @param {number} userId - The ID of the user who owns the sequence.
 * @param {object} updateData - Data to update (email_template_id, delay_hours, sequence_order).
 * @returns {Promise<object|null>} - The updated sequence step object or null if not found/not owned.
 */
const updateEmailAutomationSequence = async (sequenceId, userId, updateData) => {
  const seqIdInt = parseInt(sequenceId, 10);
  const userIdInt = parseInt(userId, 10);
  const sequenceIndex = sequencesInMemoryStore.findIndex(s => s.id === seqIdInt && s.user_id === userIdInt);

  if (sequenceIndex === -1) {
    return null; // Not found or not owned by this user
  }

  const existingSequence = sequencesInMemoryStore[sequenceIndex];

  // Validate updateData
  if (updateData.delay_hours !== undefined && (typeof updateData.delay_hours !== 'number' || updateData.delay_hours < 0)) {
    throw new Error('Delay hours must be a non-negative number.');
  }
  if (updateData.sequence_order !== undefined && (typeof updateData.sequence_order !== 'number' || updateData.sequence_order < 0)) {
    throw new Error('Sequence order must be a non-negative number.');
  }
   if (updateData.email_template_id !== undefined && typeof updateData.email_template_id !== 'number') {
    throw new Error('Email template ID must be a number if provided.');
  }


  const updatedSequence = {
    ...existingSequence,
    ...updateData, // Apply updates
    id: existingSequence.id, // Ensure ID is not changed
    user_id: existingSequence.user_id, // Ensure user_id is not changed
    email_campaign_id: existingSequence.email_campaign_id, // Campaign link should not change here
    updated_at: new Date().toISOString(),
  };
  updatedSequence.created_at = existingSequence.created_at;


  sequencesInMemoryStore[sequenceIndex] = updatedSequence;
  return { ...updatedSequence };
};

/**
 * Deletes an email automation sequence step by its ID.
 * @param {number} sequenceId - The ID of the sequence step to delete.
 * @param {number} userId - The ID of the user who owns the sequence.
 * @returns {Promise<boolean>} - True if deleted, false if not found/not owned.
 */
const deleteEmailAutomationSequence = async (sequenceId, userId) => {
  const seqIdInt = parseInt(sequenceId, 10);
  const userIdInt = parseInt(userId, 10);
  const sequenceIndex = sequencesInMemoryStore.findIndex(s => s.id === seqIdInt && s.user_id === userIdInt);

  if (sequenceIndex === -1) {
    return false;
  }

  sequencesInMemoryStore.splice(sequenceIndex, 1);
  return true;
};

/**
 * Deletes all sequence steps for a given email campaign ID.
 * To be called when an email campaign is deleted.
 * @param {number} emailCampaignId - The ID of the email campaign.
 * @param {number} userId - The ID of the user who owns the campaign.
 * @returns {Promise<number>} - The number of sequences deleted.
 */
const deleteSequencesByCampaignId = async (emailCampaignId, userId) => {
    const campaignIdInt = parseInt(emailCampaignId, 10);
    const userIdInt = parseInt(userId, 10);
    let deletedCount = 0;
    for (let i = sequencesInMemoryStore.length - 1; i >= 0; i--) {
        if (sequencesInMemoryStore[i].email_campaign_id === campaignIdInt && sequencesInMemoryStore[i].user_id === userIdInt) {
            sequencesInMemoryStore.splice(i, 1);
            deletedCount++;
        }
    }
    return deletedCount;
};


module.exports = {
  createEmailAutomationSequence,
  findSequencesByCampaignId,
  findSequenceById,
  updateEmailAutomationSequence,
  deleteEmailAutomationSequence,
  deleteSequencesByCampaignId, // Important for when a campaign is deleted
  _sequencesInMemoryStore: sequencesInMemoryStore, // For testing
  _resetSequencesInMemoryStore: () => { // For testing
    sequencesInMemoryStore.length = 0;
    currentSequenceId = 1;
  }
};
