// In-memory store for Social Media Accounts
// IMPORTANT: NOT FOR PRODUCTION

const socialAccountsInMemoryStore = [];
let currentAccountId = 1;

const SUPPORTED_PLATFORMS = ['Twitter', 'Facebook', 'LinkedIn']; // Example platforms

/**
 * Connects a new social media account (mock implementation).
 * In a real app, this would involve OAuth and securely storing tokens.
 * @param {object} accountData - Data for the new account.
 * @param {number} accountData.user_id - ID of the user connecting the account.
 * @param {string} accountData.platform - Name of the social media platform.
 * @param {string} accountData.account_id_on_platform - User's ID or username on the platform.
 * @param {string} accountData.access_token - Access token for API interaction.
 * @param {string} [accountData.refresh_token] - Refresh token, if applicable.
 * @param {string|Date} [accountData.token_expires_at] - Expiry date/time of the access token.
 * @returns {Promise<object>} - The connected account object.
 */
const connectSocialAccount = async (accountData) => {
  const {
    user_id,
    platform,
    account_id_on_platform,
    access_token, // In real app, this would be sensitive
    refresh_token,
    token_expires_at,
  } = accountData;

  if (!user_id || !platform || !account_id_on_platform || !access_token) {
    throw new Error('User ID, platform, account ID on platform, and access token are required.');
  }
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error(`Platform '${platform}' is not supported. Supported platforms: ${SUPPORTED_PLATFORMS.join(', ')}`);
  }

  // Check for duplicates for the same user and platform account ID
  const existing = socialAccountsInMemoryStore.find(
    acc => acc.user_id === parseInt(user_id, 10) &&
           acc.platform === platform &&
           acc.account_id_on_platform === account_id_on_platform
  );
  if (existing) {
    // Optionally, update tokens if it's a re-connection, or throw error
    throw new Error(`This ${platform} account (${account_id_on_platform}) is already connected for this user.`);
  }


  const newAccount = {
    id: currentAccountId++,
    user_id: parseInt(user_id, 10),
    platform,
    account_id_on_platform, // e.g., Twitter handle, Facebook Page ID
    access_token_hash: `mock_hashed_${access_token}`, // Simulate hashing/encryption
    refresh_token_hash: refresh_token ? `mock_hashed_${refresh_token}` : null,
    token_expires_at: token_expires_at ? new Date(token_expires_at).toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  socialAccountsInMemoryStore.push(newAccount);
  // Return a version without sensitive token data for general use
  const { access_token_hash, refresh_token_hash, ...safeAccountData } = newAccount;
  return { ...safeAccountData, platform_account_name: account_id_on_platform }; // Add a display name
};

/**
 * Finds a connected social account by its internal ID.
 * @param {number} id - The internal ID of the connected account.
 * @param {number} userId - The ID of the user who owns the account.
 * @returns {Promise<object|null>} - The account object (without sensitive tokens) or null if not found/owned.
 */
const findSocialAccountById = async (id, userId) => {
  const accountId = parseInt(id, 10);
  const uId = parseInt(userId, 10);
  const account = socialAccountsInMemoryStore.find(acc => acc.id === accountId && acc.user_id === uId);
  if (!account) return null;

  const { access_token_hash, refresh_token_hash, ...safeAccountData } = account;
  return { ...safeAccountData, platform_account_name: account.account_id_on_platform };
};

/**
 * Finds all connected social accounts for a given user ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object[]>} - An array of account objects (without sensitive tokens).
 */
const findSocialAccountsByUserId = async (userId) => {
  const uId = parseInt(userId, 10);
  return socialAccountsInMemoryStore
    .filter(acc => acc.user_id === uId)
    .map(acc => {
      const { access_token_hash, refresh_token_hash, ...safeAccountData } = acc;
      return { ...safeAccountData, platform_account_name: acc.account_id_on_platform };
    });
};

/**
 * Retrieves a social account with its token data (internal use, e.g., by a posting service).
 * CAUTION: Handle token data with extreme care.
 * @param {number} accountId - The internal ID of the connected account.
 * @returns {Promise<object|null>} - The full account object including hashed tokens, or null.
 */
const getSocialAccountWithTokensForService = async (accountId) => {
    const accId = parseInt(accountId, 10);
    const account = socialAccountsInMemoryStore.find(acc => acc.id === accId);
    // In a real app, you'd decrypt tokens here. For mock, we return the "hashed" ones.
    return account ? { ...account, access_token: account.access_token_hash, refresh_token: account.refresh_token_hash } : null;
};


/**
 * Deletes/disconnects a social media account by its internal ID.
 * @param {number} id - The internal ID of the account to delete.
 * @param {number} userId - The ID of the user who owns the account.
 * @returns {Promise<boolean>} - True if deleted, false if not found/not owned.
 */
const deleteSocialAccount = async (id, userId) => {
  const accountId = parseInt(id, 10);
  const uId = parseInt(userId, 10);
  const accountIndex = socialAccountsInMemoryStore.findIndex(acc => acc.id === accountId && acc.user_id === uId);

  if (accountIndex === -1) {
    return false;
  }

  socialAccountsInMemoryStore.splice(accountIndex, 1);
  return true;
};

module.exports = {
  connectSocialAccount,
  findSocialAccountById,
  findSocialAccountsByUserId,
  deleteSocialAccount,
  getSocialAccountWithTokensForService, // For internal service use
  SUPPORTED_PLATFORMS,
  _socialAccountsInMemoryStore: socialAccountsInMemoryStore, // For testing
  _resetSocialAccountsInMemoryStore: () => { // For testing
    socialAccountsInMemoryStore.length = 0;
    currentAccountId = 1;
  }
};
