// In-memory store for Social Media Posts
// IMPORTANT: NOT FOR PRODUCTION

const socialPostsInMemoryStore = [];
let currentPostId = 1;

const VALID_POST_STATUSES = ['scheduled', 'publishing', 'published', 'failed', 'archived', 'draft'];

/**
 * Creates a new social media post (schedules it).
 * @param {object} postData - Data for the new post.
 * @param {number} postData.user_id - ID of the user creating the post.
 * @param {number} postData.social_media_account_id - ID of the connected account to post from.
 * @param {string} postData.content - Text content of the post.
 * @param {string[]} [postData.media_urls] - Array of URLs for images/videos.
 * @param {string|Date} postData.scheduled_at - ISO string or Date object for when to publish.
 * @param {string} [postData.status='draft'] - Initial status of the post.
 * @param {number} [postData.campaign_id] - Optional: Link to a marketing campaign.
 * @returns {Promise<object>} - The created/scheduled post object.
 */
const createSocialPost = async (postData) => {
  const {
    user_id,
    social_media_account_id,
    content,
    media_urls = [],
    scheduled_at,
    status = 'draft', // Default to draft, user can then schedule it
    campaign_id,
  } = postData;

  if (!user_id || !social_media_account_id || !content || !scheduled_at) {
    throw new Error('User ID, social account ID, content, and scheduled time are required.');
  }
  if (status && !VALID_POST_STATUSES.includes(status)) {
    throw new Error(`Invalid post status. Must be one of: ${VALID_POST_STATUSES.join(', ')}`);
  }
  try {
    new Date(scheduled_at).toISOString(); // Validate date format
  } catch (e) {
    throw new Error('Invalid scheduled_at date format.');
  }


  const newPost = {
    id: currentPostId++,
    user_id: parseInt(user_id, 10),
    social_media_account_id: parseInt(social_media_account_id, 10),
    campaign_id: campaign_id ? parseInt(campaign_id, 10) : null,
    content,
    media_urls,
    scheduled_at: new Date(scheduled_at).toISOString(),
    status,
    published_at: null,
    post_id_on_platform: null,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  socialPostsInMemoryStore.push(newPost);
  return { ...newPost };
};

/**
 * Finds a social post by its ID.
 * @param {number} id - The ID of the post.
 * @param {number} userId - The ID of the user who owns the post.
 * @returns {Promise<object|null>} - The post object or null if not found/owned.
 */
const findSocialPostById = async (id, userId) => {
  const postId = parseInt(id, 10);
  const uId = parseInt(userId, 10);
  const post = socialPostsInMemoryStore.find(p => p.id === postId && p.user_id === uId);
  return post ? { ...post } : null;
};

/**
 * Finds all social posts for a given user ID.
 * Can be filtered by status or social_media_account_id if needed later.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object[]>} - An array of post objects.
 */
const findSocialPostsByUserId = async (userId) => {
  const uId = parseInt(userId, 10);
  return socialPostsInMemoryStore.filter(p => p.user_id === uId).map(p => ({ ...p }));
};

/**
 * Updates a social media post.
 * Only certain fields should be updatable, especially if status is 'scheduled'.
 * @param {number} id - The ID of the post to update.
 * @param {number} userId - The ID of the user who owns the post.
 * @param {object} updateData - Data to update (content, media_urls, scheduled_at, status).
 * @returns {Promise<object|null>} - The updated post object or null if not found/owned/not updatable.
 */
const updateSocialPost = async (id, userId, updateData) => {
  const postId = parseInt(id, 10);
  const uId = parseInt(userId, 10);
  const postIndex = socialPostsInMemoryStore.findIndex(p => p.id === postId && p.user_id === uId);

  if (postIndex === -1) {
    return null; // Not found or not owned
  }

  const existingPost = socialPostsInMemoryStore[postIndex];

  // Business logic: e.g., cannot update if already published or publishing
  if (['publishing', 'published'].includes(existingPost.status) && existingPost.status !== 'draft' && existingPost.status !== 'scheduled' && existingPost.status !== 'failed') {
    // Allow updating 'failed' posts to be rescheduled or content fixed.
    // Allow updating 'draft' or 'scheduled' posts.
    if (updateData.status && !['archived', 'failed'].includes(updateData.status) ) { // only allow archiving or re-marking as failed if already published
         throw new Error(`Cannot update post with status '${existingPost.status}' unless changing status to 'archived' or 'failed'.`);
    } else if (!updateData.status) { // if not changing status, don't allow other edits.
         throw new Error(`Cannot update post with status '${existingPost.status}'. Only status can be changed to 'archived' or 'failed'.`);
    }
  }


  if (updateData.status && !VALID_POST_STATUSES.includes(updateData.status)) {
    throw new Error(`Invalid post status. Must be one of: ${VALID_POST_STATUSES.join(', ')}`);
  }
  if (updateData.scheduled_at) {
    try {
      new Date(updateData.scheduled_at).toISOString(); // Validate date format
    } catch (e) {
      throw new Error('Invalid scheduled_at date format for update.');
    }
    updateData.scheduled_at = new Date(updateData.scheduled_at).toISOString();
  }


  const updatedPost = {
    ...existingPost,
    ...updateData,
    id: existingPost.id,
    user_id: existingPost.user_id,
    social_media_account_id: updateData.social_media_account_id ? parseInt(updateData.social_media_account_id, 10) : existingPost.social_media_account_id,
    updated_at: new Date().toISOString(),
  };
  updatedPost.created_at = existingPost.created_at;


  socialPostsInMemoryStore[postIndex] = updatedPost;
  return { ...updatedPost };
};

/**
 * Deletes a social media post by its ID.
 * @param {number} id - The ID of the post to delete.
 * @param {number} userId - The ID of the user who owns the post.
 * @returns {Promise<boolean>} - True if deleted, false if not found/owned.
 */
const deleteSocialPost = async (id, userId) => {
  const postId = parseInt(id, 10);
  const uId = parseInt(userId, 10);
  const postIndex = socialPostsInMemoryStore.findIndex(p => p.id === postId && p.user_id === uId);

  if (postIndex === -1) {
    return false;
  }

  const existingPost = socialPostsInMemoryStore[postIndex];
  // Business logic: e.g., cannot delete if 'publishing' or 'published' (maybe archive instead)
  if (['publishing', 'published'].includes(existingPost.status)) {
      // Instead of throwing error, one might change status to 'archived'
      // For now, let's prevent deletion of published/publishing posts.
      // throw new Error(`Cannot delete post with status '${existingPost.status}'. Consider archiving.`);
      // Or, simply allow deletion. For this model, we'll allow it.
  }

  socialPostsInMemoryStore.splice(postIndex, 1);
  return true;
};

/**
 * Finds posts that are due to be published.
 * @param {Date} now - The current time.
 * @returns {Promise<object[]>} - Array of posts to be published.
 */
const findDuePosts = async (now = new Date()) => {
    const nowISO = now.toISOString();
    return socialPostsInMemoryStore
        .filter(p => p.status === 'scheduled' && p.scheduled_at <= nowISO)
        .map(p => ({ ...p }));
};


module.exports = {
  createSocialPost,
  findSocialPostById,
  findSocialPostsByUserId,
  updateSocialPost,
  deleteSocialPost,
  findDuePosts, // For the scheduler service
  VALID_POST_STATUSES,
  _socialPostsInMemoryStore: socialPostsInMemoryStore, // For testing
  _resetSocialPostsInMemoryStore: () => { // For testing
    socialPostsInMemoryStore.length = 0;
    currentPostId = 1;
  }
};
