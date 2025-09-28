const express = require('express');
const router = express.Router();
const {
  createOrJoinSession,
  leaveSession,
  getSessionParticipants,
  applyOperation,
  getOperations,
  acquireLock,
  releaseLock,
  addComment,
  replyToComment,
  resolveComment,
  getComments,
  updateSessionSettings,
  getUserSessions
} = require('../controllers/collaborationController');
const { isAuthenticatedUser } = require('../middlewares/auth');

// Protect all routes
router.use(isAuthenticatedUser);

// Session management routes
router.post('/content/:contentId/session', createOrJoinSession);
router.delete('/session/:sessionId/leave', leaveSession);
router.get('/session/:sessionId/participants', getSessionParticipants);
router.put('/session/:sessionId/settings', updateSessionSettings);
router.get('/user/sessions', getUserSessions);

// Real-time collaboration routes
router.post('/session/:sessionId/operation', applyOperation);
router.get('/session/:sessionId/operations', getOperations);

// Locking mechanism routes
router.post('/session/:sessionId/lock', acquireLock);
router.delete('/session/:sessionId/lock', releaseLock);

// Collaborative comments routes
router.post('/content/:contentId/comments', addComment);
router.post('/comment/:commentId/reply', replyToComment);
router.put('/comment/:commentId/resolve', resolveComment);
router.get('/content/:contentId/comments', getComments);

module.exports = router;