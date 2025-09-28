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
const { protect } = require('../middlewares/auth');
const requestLimit = require('../middlewares/requestLimit');

const router = express.Router();

// Content Template Routes
router.route('/templates')
  .get(getTemplates)
  .post(protect, requestLimit(10, 60), createTemplate);

router.route('/templates/:id')
  .get(getTemplate);

// Content Routes
router.route('/')
  .get(getAllContent)
  .post(protect, requestLimit(20, 60), createContent);

router.route('/:identifier')
  .get(getContent);

router.route('/:id')
  .put(protect, requestLimit(30, 60), updateContent)
  .delete(protect, deleteContent);

// Content Management Routes
router.patch('/:id/publish', protect, publishContent);
router.patch('/:id/archive', protect, archiveContent);

// Version Control Routes
router.get('/:id/versions', protect, getContentVersions);
router.patch('/:id/versions/:versionNumber/revert', protect, revertToVersion);
router.get('/:id/versions/diff', protect, getVersionDiff);

// Collaboration Routes
router.route('/:id/collaborators')
  .post(protect, requestLimit(10, 60), addCollaborator);

router.delete('/:id/collaborators/:userId', protect, removeCollaborator);

module.exports = router;