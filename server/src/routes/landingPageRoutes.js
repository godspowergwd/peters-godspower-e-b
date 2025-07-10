const express = require('express');
const landingPageController = require('../controllers/landingPageController');
const { protect } = require('../middleware/authMiddleware'); // To protect routes

const router = express.Router();

// Routes for authenticated users (managing their pages)
// All these routes will be prefixed with something like /api/landing-pages

// Create a new landing page
router.post('/', protect, landingPageController.createPage);

// Get all landing pages for the authenticated user
router.get('/', protect, landingPageController.getUserPages);

// Get a specific landing page by ID (owned by the user)
router.get('/:id', protect, landingPageController.getPageById);

// Update a landing page (owned by the user)
router.put('/:id', protect, landingPageController.updatePage);

// Delete a landing page (owned by the user)
router.delete('/:id', protect, landingPageController.deletePage);


// --- Public Route ---
// This route is for viewing published landing pages by slug.
// It should NOT be protected by the standard `protect` middleware that requires user login.
// It might be better placed in a separate router file or under a different prefix if complex,
// but for simplicity, we can add it here and ensure it doesn't use `protect`.

// Get a published landing page by its slug
// Example: GET /api/public/pages/my-awesome-page-slug
// To make this distinct, it might be better to have a separate router for public routes, e.g.,
// const publicRouter = express.Router();
// publicRouter.get('/pages/:slug', landingPageController.getPublicPageBySlug);
// app.use('/api/public', publicRouter);
// For now, adding it here with a clear comment. If we create a separate public router, this would move.
router.get('/public/:slug', landingPageController.getPublicPageBySlug);


module.exports = router;
