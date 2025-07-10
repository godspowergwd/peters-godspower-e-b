const emailTemplateModel = require('../models/emailTemplateModel');

// POST /api/email-templates
const createTemplate = async (req, res, next) => {
  try {
    const { name, html_content } = req.body;
    const user_id = req.user.id; // From protect middleware

    if (!name || !html_content) {
      return res.status(400).json({ message: 'Name and HTML content are required for an email template.' });
    }

    const templateData = { user_id, name, html_content };
    const newTemplate = await emailTemplateModel.createEmailTemplate(templateData);
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating email template:', error);
    if (error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/email-templates
const getUserTemplates = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const templates = await emailTemplateModel.findEmailTemplatesByUserId(user_id);
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching user email templates:', error);
    next(error);
  }
};

// GET /api/email-templates/:id
const getTemplateById = async (req, res, next) => {
  try {
    const template_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(template_id)) {
      return res.status(400).json({ message: 'Invalid template ID format.' });
    }

    const template = await emailTemplateModel.findEmailTemplateById(template_id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found.' });
    }

    if (template.user_id !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this email template.' });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching email template by ID:', error);
    next(error);
  }
};

// PUT /api/email-templates/:id
const updateTemplate = async (req, res, next) => {
  try {
    const template_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;
    const { name, html_content } = req.body;

    if (isNaN(template_id)) {
      return res.status(400).json({ message: 'Invalid template ID format.' });
    }

    if (!name && !html_content) {
        return res.status(400).json({ message: 'No update data (name or html_content) provided.' });
    }

    const existingTemplate = await emailTemplateModel.findEmailTemplateById(template_id);
    if (!existingTemplate) {
      return res.status(404).json({ message: 'Email template not found.' });
    }
    if (existingTemplate.user_id !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this email template.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (html_content) updateData.html_content = html_content;

    const updatedTemplate = await emailTemplateModel.updateEmailTemplate(template_id, updateData);
    res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error('Error updating email template:', error);
    next(error);
  }
};

// DELETE /api/email-templates/:id
const deleteTemplate = async (req, res, next) => {
  try {
    const template_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(template_id)) {
      return res.status(400).json({ message: 'Invalid template ID format.' });
    }

    const existingTemplate = await emailTemplateModel.findEmailTemplateById(template_id);
    if (!existingTemplate) {
      return res.status(404).json({ message: 'Email template not found.' });
    }
    if (existingTemplate.user_id !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this email template.' });
    }

    await emailTemplateModel.deleteEmailTemplate(template_id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email template:', error);
    next(error);
  }
};

module.exports = {
  createTemplate,
  getUserTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
