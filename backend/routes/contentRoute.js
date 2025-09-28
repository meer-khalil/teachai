const express = require('express');
const {
  createContent,
  getAllContent,
  getContent,
  updateContent,
  deleteContent,
  publishContent,
  archiveContent,
  getContentVersions,
  revertToVersion,
  getVersionDiff,
  addCollaborator,
  removeCollaborator,
  createTemplate,
  getTemplates,
  getTemplate
} = require('../controllers/contentController');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { createLimiter } = require('../middlewares/requestLimit');

const router = express.Router();

// Content Template Routes
router.route('/templates')
  .get(getTemplates)
  .post(isAuthenticatedUser, createLimiter({ max: 10, windowMs: 60 * 1000 }), createTemplate);

router.route('/templates/:id')
  .get(getTemplate);

// Content Routes
router.route('/')
  .get(getAllContent)
  .post(isAuthenticatedUser, createLimiter({ max: 20, windowMs: 60 * 1000 }), createContent);

router.route('/:identifier')
  .get(getContent);

router.route('/:id')
  .put(isAuthenticatedUser, createLimiter({ max: 30, windowMs: 60 * 1000 }), updateContent)
  .delete(isAuthenticatedUser, deleteContent);

// Content Management Routes
router.patch('/:id/publish', isAuthenticatedUser, publishContent);
router.patch('/:id/archive', isAuthenticatedUser, archiveContent);

// Version Control Routes
router.get('/:id/versions', isAuthenticatedUser, getContentVersions);
router.patch('/:id/versions/:versionNumber/revert', isAuthenticatedUser, revertToVersion);
router.get('/:id/versions/diff', isAuthenticatedUser, getVersionDiff);

// Collaboration Routes
router.route('/:id/collaborators')
  .post(isAuthenticatedUser, createLimiter({ max: 10, windowMs: 60 * 1000 }), addCollaborator);

router.delete('/:id/collaborators/:userId', isAuthenticatedUser, removeCollaborator);

module.exports = router;