const express = require('express');
const router = express.Router();
const {
  trackEvent,
  getDashboardOverview,
  getUserAnalytics,
  getContentAnalytics,
  getPerformanceAnalytics,
  getUserBehaviorInsights,
  exportAnalytics
} = require('../controllers/analyticsController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Public analytics tracking
router.post('/track', trackEvent);

// Protected analytics routes (require authentication)
router.use(isAuthenticatedUser);

// Dashboard overview (accessible to all authenticated users for their own data)
router.get('/dashboard', getDashboardOverview);

// User behavior insights
router.get('/behavior/:userId?', getUserBehaviorInsights);

// Admin-only analytics routes
router.get('/users', authorizeRoles('admin'), getUserAnalytics);
router.get('/content', authorizeRoles('admin'), getContentAnalytics);
router.get('/performance', authorizeRoles('admin'), getPerformanceAnalytics);
router.get('/export', authorizeRoles('admin'), exportAnalytics);

module.exports = router;