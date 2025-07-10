const socialPostModel = require('../models/socialPostModel');
const socialAccountModel = require('../models/socialAccountModel'); // To verify account ownership

// POST /api/social-posts
const createPost = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { social_media_account_id, content, media_urls, scheduled_at, status, campaign_id } = req.body;

    if (!social_media_account_id || !content || !scheduled_at) {
      return res.status(400).json({ message: 'Social media account ID, content, and scheduled time are required.' });
    }

    // Verify the social_media_account_id belongs to the user
    const account = await socialAccountModel.findSocialAccountById(social_media_account_id, user_id);
    if (!account) {
      return res.status(403).json({ message: 'Forbidden: Specified social media account not found or not owned by user.' });
    }
    if (status && !socialPostModel.VALID_POST_STATUSES.includes(status)){
        return res.status(400).json({ message: `Invalid status. Must be one of: ${socialPostModel.VALID_POST_STATUSES.join(', ')}` });
    }


    const postData = {
      user_id,
      social_media_account_id,
      content,
      media_urls,
      scheduled_at,
      status: status || 'draft',
      campaign_id
    };

    const newPost = await socialPostModel.createSocialPost(postData);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating social post:', error);
    if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/social-posts
const getUserPosts = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    // TODO: Add filtering by status, account_id, date range in query params
    const posts = await socialPostModel.findSocialPostsByUserId(user_id);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching user social posts:', error);
    next(error);
  }
};

// GET /api/social-posts/:id
const getPostById = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(post_id)) {
      return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    const post = await socialPostModel.findSocialPostById(post_id, user_id);
    if (!post) {
      return res.status(404).json({ message: 'Social post not found or not owned by user.' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching social post by ID:', error);
    next(error);
  }
};

// PUT /api/social-posts/:id
const updatePost = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;
    const updateData = req.body; // { content, media_urls, scheduled_at, status, social_media_account_id }

    if (isNaN(post_id)) {
      return res.status(400).json({ message: 'Invalid post ID format.' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
    }

    // If social_media_account_id is being updated, verify ownership of the new account
    if (updateData.social_media_account_id) {
        const account = await socialAccountModel.findSocialAccountById(updateData.social_media_account_id, user_id);
        if (!account) {
          return res.status(403).json({ message: 'Forbidden: New specified social media account not found or not owned by user.' });
        }
    }
    if (updateData.status && !socialPostModel.VALID_POST_STATUSES.includes(updateData.status)){
        return res.status(400).json({ message: `Invalid status. Must be one of: ${socialPostModel.VALID_POST_STATUSES.join(', ')}` });
    }


    const updatedPost = await socialPostModel.updateSocialPost(post_id, user_id, updateData);
    if (!updatedPost) { // Model handles ownership check and existence
        return res.status(404).json({ message: 'Social post not found or not owned by user.' });
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating social post:', error);
    if (error.message.includes('Cannot update post') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// DELETE /api/social-posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    if (isNaN(post_id)) {
      return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    // Verify ownership before deleting (model also does this, but good for controller too)
    const existingPost = await socialPostModel.findSocialPostById(post_id, user_id);
    if (!existingPost) {
      return res.status(404).json({ message: 'Social post not found or not owned by user.' });
    }

    const success = await socialPostModel.deleteSocialPost(post_id, user_id);
     if (!success) { // Should ideally not happen if above check passes
        return res.status(404).json({ message: 'Social post not found or deletion failed.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting social post:', error);
     if (error.message.includes('Cannot delete post')) { // From model's business logic
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  createPost,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
};
