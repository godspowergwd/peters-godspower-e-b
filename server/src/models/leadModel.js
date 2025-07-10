// Placeholder for lead data storage (in-memory)
// IMPORTANT: NOT FOR PRODUCTION

const leadsInMemoryStore = [];
let currentLeadId = 1;

/**
 * Creates a new lead.
 * @param {object} leadData - Data for the new lead.
 * @param {number} leadData.landing_page_id - ID of the landing page that captured the lead.
 * @param {number} leadData.user_id - ID of the user who owns the landing page (and thus the lead data).
 * @param {string} leadData.email - Email of the lead.
 * @param {string} [leadData.first_name] - Lead's first name.
 * @param {string} [leadData.last_name] - Lead's last name.
 * @param {object} [leadData.custom_fields] - Other captured fields.
 * @returns {Promise<object>} - The created lead object.
 */
const createLead = async (leadData) => {
  const { landing_page_id, user_id, email, first_name, last_name, custom_fields } = leadData;

  if (!landing_page_id || !user_id || !email) {
    throw new Error('Landing page ID, user ID, and email are required to create a lead.');
  }

  const newLead = {
    id: currentLeadId++,
    landing_page_id: parseInt(landing_page_id, 10),
    user_id: parseInt(user_id, 10),
    email,
    first_name: first_name || null,
    last_name: last_name || null,
    custom_fields: custom_fields || {},
    captured_at: new Date().toISOString(),
    // email_campaign_id: null, // Future feature
  };

  leadsInMemoryStore.push(newLead);
  return { ...newLead }; // Return a copy
};

/**
 * Finds a lead by its ID.
 * @param {number} id - The ID of the lead.
 * @returns {Promise<object|null>} - The lead object or null if not found.
 */
const findLeadById = async (id) => {
  const leadId = parseInt(id, 10);
  const lead = leadsInMemoryStore.find(l => l.id === leadId);
  return lead ? { ...lead } : null;
};

/**
 * Finds all leads for a given landing page ID.
 * @param {number} landingPageId - The ID of the landing page.
 * @returns {Promise<object[]>} - An array of lead objects.
 */
const findLeadsByLandingPageId = async (landingPageId) => {
  const pageId = parseInt(landingPageId, 10);
  return leadsInMemoryStore.filter(l => l.landing_page_id === pageId).map(l => ({ ...l }));
};

/**
 * Finds all leads for a given user ID (owner of the landing pages).
 * This could be useful for a general "all my leads" view.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object[]>} - An array of lead objects.
 */
const findLeadsByUserId = async (userId) => {
    const uId = parseInt(userId, 10);
    return leadsInMemoryStore.filter(l => l.user_id === uId).map(l => ({ ...l }));
};


/**
 * Deletes a lead by its ID.
 * @param {number} id - The ID of the lead to delete.
 * @returns {Promise<boolean>} - True if deleted, false if not found.
 */
const deleteLead = async (id) => {
  const leadId = parseInt(id, 10);
  const leadIndex = leadsInMemoryStore.findIndex(l => l.id === leadId);

  if (leadIndex === -1) {
    return false;
  }

  leadsInMemoryStore.splice(leadIndex, 1);
  return true;
};

module.exports = {
  createLead,
  findLeadById,
  findLeadsByLandingPageId,
  findLeadsByUserId, // Added for general lead management by user
  deleteLead,
  _leadsInMemoryStore: leadsInMemoryStore, // For testing/inspection
  _resetLeadsInMemoryStore: () => { // For testing
    leadsInMemoryStore.length = 0;
    currentLeadId = 1;
  }
};
