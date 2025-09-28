const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middlewares/auth');
const requestLimit = require('../middlewares/requestLimit');

const {
  searchContent,
  getSearchSuggestions,
  getSearchFacets,
  advancedSearch,
  getSimilarContent,
  getSearchAnalytics,
  getPopularSearches,
  getSearchHealth,
  reindexContent
} = require('../controllers/searchController');

// Apply rate limiting to all search routes
router.use(requestLimit.createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many search requests, please try again later'
}));

// Public search routes
router.get('/query', searchContent);
router.get('/suggest', getSearchSuggestions);
router.get('/facets', getSearchFacets);
router.get('/popular', getPopularSearches);
router.get('/health', getSearchHealth);

// Content similarity (public but requires content ID)
router.get('/similar/:type/:id', getSimilarContent);

// Advanced search with complex queries
router.post('/advanced', advancedSearch);

// Protected routes - require authentication
router.use(isAuthenticatedUser);

// Analytics routes (admin only - checked in controller)
router.get('/analytics', getSearchAnalytics);

// Admin-only routes for search management
router.post('/reindex', 
  requestLimit.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 reindex operations per hour
    message: 'Reindex operations are limited'
  }),
  reindexContent
);

module.exports = router;