// This is a placeholder. In a real application, this would interact with a database.
// For now, we'll use an in-memory store for demonstration.
// IMPORTANT: THIS IS NOT SUITABLE FOR PRODUCTION.

const landingPagesInMemoryStore = [];
let currentPageId = 1;

/**
 * Creates a new landing page.
 * @param {object} pageData - Data for the new page.
 * @param {number} pageData.user_id - The ID of the user creating the page.
 * @param {string} pageData.name - The name of the landing page.
 * @param {string} [pageData.slug] - Optional URL slug.
 * @param {object} [pageData.content_json] - JSON content of the page.
 * @param {boolean} [pageData.is_published=false] - Publication status.
 * @returns {Promise<object>} - A promise that resolves to the newly created landing page object.
 */
const createLandingPage = async (pageData) => {
  const { user_id, name, slug, content_json, is_published = false } = pageData;

  if (!user_id || !name) {
    throw new Error('User ID and name are required to create a landing page.');
  }

  // Basic slug generation if not provided (can be improved)
  const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

  const newPage = {
    id: currentPageId++,
    user_id: parseInt(user_id, 10), // Ensure user_id is an integer
    name,
    slug: generatedSlug,
    content_json: content_json || { elements: [] }, // Default to empty elements array
    is_published,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // campaign_id: null, // Future feature
  };

  landingPagesInMemoryStore.push(newPage);
  return { ...newPage }; // Return a copy
};

/**
 * Finds a landing page by its ID.
 * @param {number} id - The ID of the landing page.
 * @returns {Promise<object|null>} - The page object or null if not found.
 */
const findLandingPageById = async (id) => {
  const pageId = parseInt(id, 10);
  const page = landingPagesInMemoryStore.find(p => p.id === pageId);
  return page ? { ...page } : null;
};

/**
 * Finds all landing pages for a given user ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object[]>} - An array of landing page objects.
 */
const findLandingPagesByUserId = async (userId) => {
  const uId = parseInt(userId, 10);
  return landingPagesInMemoryStore.filter(p => p.user_id === uId).map(p => ({ ...p }));
};

/**
 * Updates a landing page.
 * @param {number} id - The ID of the landing page to update.
 * @param {object} updateData - The data to update.
 * @returns {Promise<object|null>} - The updated page object or null if not found.
 */
const updateLandingPage = async (id, updateData) => {
  const pageId = parseInt(id, 10);
  const pageIndex = landingPagesInMemoryStore.findIndex(p => p.id === pageId);

  if (pageIndex === -1) {
    return null;
  }

  const existingPage = landingPagesInMemoryStore[pageIndex];
  const updatedPage = {
    ...existingPage,
    ...updateData,
    id: existingPage.id, // Ensure ID is not changed
    user_id: existingPage.user_id, // Ensure user_id is not changed by accident
    updated_at: new Date().toISOString(),
  };

  // Prevent created_at from being overwritten if not explicitly passed in updateData
  if (updateData.created_at === undefined) {
    updatedPage.created_at = existingPage.created_at;
  }


  landingPagesInMemoryStore[pageIndex] = updatedPage;
  return { ...updatedPage };
};

/**
 * Deletes a landing page by its ID.
 * @param {number} id - The ID of the landing page to delete.
 * @returns {Promise<boolean>} - True if deleted, false if not found.
 */
const deleteLandingPage = async (id) => {
  const pageId = parseInt(id, 10);
  const pageIndex = landingPagesInMemoryStore.findIndex(p => p.id === pageId);

  if (pageIndex === -1) {
    return false;
  }

  landingPagesInMemoryStore.splice(pageIndex, 1);
  return true;
};

/**
 * Finds a landing page by its slug.
 * (Useful for public page rendering)
 * @param {string} slug - The slug of the landing page.
 * @returns {Promise<object|null>} - The page object or null if not found.
 */
const findLandingPageBySlug = async (slug) => {
    const page = landingPagesInMemoryStore.find(p => p.slug === slug);
    return page ? { ...page } : null;
};


module.exports = {
  createLandingPage,
  findLandingPageById,
  findLandingPagesByUserId,
  updateLandingPage,
  deleteLandingPage,
  findLandingPageBySlug, // Added for public access if needed
  _landingPagesInMemoryStore: landingPagesInMemoryStore, // For testing/inspection
  _resetLandingPagesInMemoryStore: () => { // For testing
    landingPagesInMemoryStore.length = 0;
    currentPageId = 1;
  }
};
