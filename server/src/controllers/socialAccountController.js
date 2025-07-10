const socialAccountModel = require('../models/socialAccountModel');

// POST /api/social-accounts/connect/:platform (Mocked)
// In a real app, this would be part of an OAuth flow.
// Here, we simulate receiving necessary details after OAuth.
const connectAccount = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user_id = req.user.id; // From protect middleware
    // These would typically come from the OAuth callback/token exchange
    const { account_id_on_platform, access_token, refresh_token, token_expires_at } = req.body;

    if (!account_id_on_platform || !access_token) {
      return res.status(400).json({ message: 'Account ID on platform and access token are required from OAuth flow.' });
    }
    if (!socialAccountModel.SUPPORTED_PLATFORMS.includes(platform)) {
        return res.status(400).json({ message: `Platform '${platform}' is not supported.` });
    }

    const accountData = {
      user_id,
      platform,
      account_id_on_platform,
      access_token, // In a real app, handle with care
      refresh_token,
      token_expires_at,
    };

    const newAccount = await socialAccountModel.connectSocialAccount(accountData);
    res.status(201).json({ message: `${platform} account connected successfully.`, account: newAccount });
  } catch (error) {
    console.error(`Error connecting ${req.params.platform} account:`, error);
    if (error.message.includes('required') || error.message.includes('not supported') || error.message.includes('already connected')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/social-accounts
const getUserAccounts = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const accounts = await socialAccountModel.findSocialAccountsByUserId(user_id);
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching user social accounts:', error);
    next(error);
  }
};

// GET /api/social-accounts/:id
const getAccountById = async (req, res, next) => {
  try {
    const account_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(account_id)) {
      return res.status(400).json({ message: 'Invalid account ID format.' });
    }

    const account = await socialAccountModel.findSocialAccountById(account_id, user_id);
    if (!account) {
      return res.status(404).json({ message: 'Social account not found or not owned by user.' });
    }
    res.status(200).json(account);
  } catch (error) {
    console.error('Error fetching social account by ID:', error);
    next(error);
  }
};


// DELETE /api/social-accounts/:id
const disconnectAccount = async (req, res, next) => {
  try {
    const account_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

     if (isNaN(account_id)) {
      return res.status(400).json({ message: 'Invalid account ID format.' });
    }

    // Verify ownership before deleting
    const existingAccount = await socialAccountModel.findSocialAccountById(account_id, user_id);
    if (!existingAccount) {
      return res.status(404).json({ message: 'Social account not found or not owned by user.' });
    }

    const success = await socialAccountModel.deleteSocialAccount(account_id, user_id);
    if (!success) { // Should ideally not happen if above check passes
        return res.status(404).json({ message: 'Social account not found or deletion failed.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    next(error);
  }
};

module.exports = {
  connectAccount,
  getUserAccounts,
  getAccountById,
  disconnectAccount,
};
