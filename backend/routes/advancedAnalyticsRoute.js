const express = require('express');
const router = express.Router();
const {
  trackUserInteraction,
  endUserSession,
  recordContentView,
  getUserAnalytics,
  getContentAnalytics,
  getDashboardAnalytics,
  getRealTimeAnalytics,
  createFunnel,
  getFunnelAnalytics,
  exportAnalytics
} = require('../controllers/advancedAnalyticsController');
const { verifyJWT } = require('../middlewares/auth');

// User interaction tracking
router.post('/track/interaction', verifyJWT, trackUserInteraction);
router.post('/track/session/end', verifyJWT, endUserSession);

// Content analytics
router.post('/track/content/:contentId/view', recordContentView);
router.get('/content/:contentId', verifyJWT, getContentAnalytics);

// User analytics
router.get('/user/:userId', verifyJWT, getUserAnalytics);

// Dashboard analytics
router.get('/dashboard', verifyJWT, getDashboardAnalytics);
router.get('/realtime', verifyJWT, getRealTimeAnalytics);

// Funnel analytics
router.post('/funnel', verifyJWT, createFunnel);
router.get('/funnel/:funnelId', verifyJWT, getFunnelAnalytics);

// Export analytics
router.get('/export', verifyJWT, exportAnalytics);

module.exports = router;