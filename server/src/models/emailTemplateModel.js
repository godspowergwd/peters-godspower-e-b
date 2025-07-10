// In-memory store for Email Templates
// IMPORTANT: NOT FOR PRODUCTION

const emailTemplatesInMemoryStore = [];
let currentTemplateId = 1;

/**
 * Creates a new email template.
 * @param {object} templateData - Data for the new template.
 * @param {number} templateData.user_id - ID of the user creating the template.
 * @param {string} templateData.name - Name of the template.
 * @param {string} templateData.html_content - HTML content of the email.
 * @returns {Promise<object>} - The created template object.
 */
const createEmailTemplate = async (templateData) => {
  const { user_id, name, html_content } = templateData;

  if (!user_id || !name || !html_content) {
    throw new Error('User ID, name, and HTML content are required for an email template.');
  }

  const newTemplate = {
    id: currentTemplateId++,
    user_id: parseInt(user_id, 10),
    name,
    html_content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  emailTemplatesInMemoryStore.push(newTemplate);
  return { ...newTemplate };
};

/**
 * Finds an email template by its ID.
 * @param {number} id - The ID of the template.
 * @returns {Promise<object|null>} - The template object or null if not found.
 */
const findEmailTemplateById = async (id) => {
  const templateId = parseInt(id, 10);
  const template = emailTemplatesInMemoryStore.find(t => t.id === templateId);
  return template ? { ...template } : null;
};

/**
 * Finds all email templates for a given user ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object[]>} - An array of template objects.
 */
const findEmailTemplatesByUserId = async (userId) => {
  const uId = parseInt(userId, 10);
  return emailTemplatesInMemoryStore.filter(t => t.user_id === uId).map(t => ({ ...t }));
};

/**
 * Updates an email template.
 * @param {number} id - The ID of the template to update.
 * @param {object} updateData - Data to update (name, html_content).
 * @returns {Promise<object|null>} - The updated template object or null if not found.
 */
const updateEmailTemplate = async (id, updateData) => {
  const templateId = parseInt(id, 10);
  const templateIndex = emailTemplatesInMemoryStore.findIndex(t => t.id === templateId);

  if (templateIndex === -1) {
    return null;
  }

  const existingTemplate = emailTemplatesInMemoryStore[templateIndex];
  const updatedTemplate = {
    ...existingTemplate,
    ...updateData, // Apply updates for fields like name, html_content
    id: existingTemplate.id, // Ensure ID is not changed
    user_id: existingTemplate.user_id, // Ensure user_id is not changed
    updated_at: new Date().toISOString(),
  };
  // Prevent created_at from being overwritten
  updatedTemplate.created_at = existingTemplate.created_at;


  emailTemplatesInMemoryStore[templateIndex] = updatedTemplate;
  return { ...updatedTemplate };
};

/**
 * Deletes an email template by its ID.
 * @param {number} id - The ID of the template to delete.
 * @returns {Promise<boolean>} - True if deleted, false if not found.
 */
const deleteEmailTemplate = async (id) => {
  const templateId = parseInt(id, 10);
  const templateIndex = emailTemplatesInMemoryStore.findIndex(t => t.id === templateId);

  if (templateIndex === -1) {
    return false;
  }

  emailTemplatesInMemoryStore.splice(templateIndex, 1);
  return true;
};

module.exports = {
  createEmailTemplate,
  findEmailTemplateById,
  findEmailTemplatesByUserId,
  updateEmailTemplate,
  deleteEmailTemplate,
  _emailTemplatesInMemoryStore: emailTemplatesInMemoryStore, // For testing
  _resetEmailTemplatesInMemoryStore: () => { // For testing
    emailTemplatesInMemoryStore.length = 0;
    currentTemplateId = 1;
  }
};
