const { Content, ContentTemplate } = require('../models/contentModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require('../utils/api');

// @desc    Create new content
// @route   POST /api/v1/content
// @access  Private
const createContent = asyncErrorHandler(async (req, res, next) => {
  const {
    title,
    content,
    contentType,
    format = 'html',
    categories,
    tags,
    visibility = 'public',
    seo,
    metadata,
    featuredImage,
    template,
    customFields,
    scheduledPublishAt,
    approvalRequired = false
  } = req.body;

  // Create content with author
  const newContent = await Content.create({
    title,
    content,
    contentType,
    format,
    categories,
    tags,
    visibility,
    seo,
    metadata,
    featuredImage,
    template,
    customFields,
    scheduledPublishAt,
    author: req.user._id,
    workflow: {
      approvalRequired,
      currentStep: 'creation'
    }
  });

  // Create initial version
  newContent.addVersion(content, req.user._id, 'Initial content creation');
  await newContent.save();

  // Populate response
  await newContent.populate([
    { path: 'author', select: 'name avatar email' },
    { path: 'categories', select: 'name slug description' },
    { path: 'template', select: 'name description' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Content created successfully',
    data: {
      content: newContent
    }
  });
});

// @desc    Get all content with filters
// @route   GET /api/v1/content
// @access  Public
const getAllContent = asyncErrorHandler(async (req, res, next) => {
  const features = new APIFeatures(Content.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Add default filters for public access
  if (!req.user || req.user.role !== 'admin') {
    features.query = features.query.find({ 
      status: 'published',
      visibility: { $in: ['public'] }
    });
  }

  const content = await features.query
    .populate('author', 'name avatar email')
    .populate('categories', 'name slug description')
    .select('-versions'); // Exclude version history for list view

  const total = await Content.countDocuments(features.query.getQuery());

  res.status(200).json({
    success: true,
    data: {
      content,
      pagination: {
        total,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        pages: Math.ceil(total / (parseInt(req.query.limit) || 10))
      }
    }
  });
});

// @desc    Get single content by ID or slug
// @route   GET /api/v1/content/:identifier
// @access  Public
const getContent = asyncErrorHandler(async (req, res, next) => {
  const { identifier } = req.params;
  
  let content;
  
  // Try to find by slug first, then by ID
  if (mongoose.isValidObjectId(identifier)) {
    content = await Content.findById(identifier);
  } else {
    content = await Content.getContentBySlug(identifier);
  }

  if (!content) {
    return next(new ErrorHandler('Content not found', 404));
  }

  // Check access permissions
  if (content.status !== 'published') {
    if (!req.user) {
      return next(new ErrorHandler('Content not found', 404));
    }
    
    if (content.author._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return next(new ErrorHandler('Access denied', 403));
    }
  }

  // Check visibility
  if (content.visibility === 'private') {
    if (!req.user || (content.author._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin')) {
      return next(new ErrorHandler('Access denied', 403));
    }
  }

  if (content.visibility === 'restricted') {
    if (!req.user || (!content.allowedUsers.includes(req.user._id) && 
        req.user.role !== 'admin')) {
      return next(new ErrorHandler('Access denied', 403));
    }
  }

  if (content.visibility === 'password-protected' && req.query.password !== content.accessPassword) {
    return res.status(200).json({
      success: true,
      passwordRequired: true,
      data: {
        title: content.title,
        author: content.author,
        createdAt: content.createdAt
      }
    });
  }

  // Increment view count
  if (content.status === 'published') {
    content.stats.views += 1;
    await content.save({ validateBeforeSave: false });
  }

  await content.populate([
    { path: 'categories', select: 'name slug description' },
    { path: 'collaborators.user', select: 'name avatar' },
    { path: 'relatedContent.content', select: 'title slug author contentType featuredImage' }
  ]);

  res.status(200).json({
    success: true,
    data: {
      content
    }
  });
});

// @desc    Update content
// @route   PUT /api/v1/content/:id
// @access  Private
const updateContent = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { 
    title, 
    content, 
    contentType, 
    categories, 
    tags, 
    visibility, 
    seo, 
    metadata, 
    featuredImage,
    versionComment
  } = req.body;

  const existingContent = await Content.getContentForEdit(id, req.user);

  const oldContent = existingContent.content;

  // Update content fields
  Object.assign(existingContent, {
    title: title || existingContent.title,
    content: content || existingContent.content,
    contentType: contentType || existingContent.contentType,
    categories: categories || existingContent.categories,
    tags: tags || existingContent.tags,
    visibility: visibility || existingContent.visibility,
    seo: { ...existingContent.seo, ...(seo || {}) },
    metadata: { ...existingContent.metadata, ...(metadata || {}) },
    featuredImage: featuredImage || existingContent.featuredImage,
    lastEditedBy: req.user._id,
    lastEditedAt: new Date()
  });

  // Create new version if content changed
  if (content && content !== oldContent) {
    existingContent.addVersion(
      content, 
      req.user._id, 
      versionComment || 'Content updated'
    );
  }

  await existingContent.save();

  await existingContent.populate([
    { path: 'author', select: 'name avatar email' },
    { path: 'categories', select: 'name slug description' },
    { path: 'lastEditedBy', select: 'name avatar' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Content updated successfully',
    data: {
      content: existingContent
    }
  });
});

// @desc    Delete content
// @route   DELETE /api/v1/content/:id
// @access  Private
const deleteContent = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const content = await Content.findById(id);

  if (!content) {
    return next(new ErrorHandler('Content not found', 404));
  }

  // Check permissions
  if (content.author.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    return next(new ErrorHandler('Access denied', 403));
  }

  await content.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Content deleted successfully'
  });
});

// @desc    Publish content
// @route   PATCH /api/v1/content/:id/publish
// @access  Private
const publishContent = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const content = await Content.findById(id);

  if (!content) {
    return next(new ErrorHandler('Content not found', 404));
  }

  if (!content.canUserPublish(req.user)) {
    return next(new ErrorHandler('You do not have permission to publish this content', 403));
  }

  // Check if approval is required
  if (content.workflow.approvalRequired) {
    const allApproved = content.workflow.approvers.every(approver => approver.approved);
    if (!allApproved) {
      return next(new ErrorHandler('Content requires approval before publishing', 400));
    }
  }

  content.status = 'published';
  content.publishedAt = new Date();
  content.workflow.currentStep = 'publishing';

  await content.save();

  res.status(200).json({
    success: true,
    message: 'Content published successfully',
    data: {
      content
    }
  });
});

// @desc    Archive content
// @route   PATCH /api/v1/content/:id/archive
// @access  Private
const archiveContent = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const content = await Content.findById(id);

  if (!content) {
    return next(new ErrorHandler('Content not found', 404));
  }

  if (!content.canUserEdit(req.user)) {
    return next(new ErrorHandler('Access denied', 403));
  }

  content.status = 'archived';
  await content.save();

  res.status(200).json({
    success: true,
    message: 'Content archived successfully'
  });
});

// @desc    Get content versions
// @route   GET /api/v1/content/:id/versions
// @access  Private
const getContentVersions = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const content = await Content.getContentForEdit(id, req.user);

  res.status(200).json({
    success: true,
    data: {
      versions: content.versions,
      currentVersion: content.currentVersion
    }
  });
});

// @desc    Revert to content version
// @route   PATCH /api/v1/content/:id/versions/:versionNumber/revert
// @access  Private
const revertToVersion = asyncErrorHandler(async (req, res, next) => {
  const { id, versionNumber } = req.params;

  const content = await Content.getContentForEdit(id, req.user);

  try {
    const version = content.revertToVersion(parseInt(versionNumber));
    
    // Create a new version for the revert
    content.addVersion(
      version.content,
      req.user._id,
      `Reverted to version ${versionNumber}`
    );

    await content.save();

    res.status(200).json({
      success: true,
      message: `Content reverted to version ${versionNumber}`,
      data: {
        content,
        revertedVersion: version
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// @desc    Get version diff
// @route   GET /api/v1/content/:id/versions/diff
// @access  Private
const getVersionDiff = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { versionA, versionB } = req.query;

  const content = await Content.getContentForEdit(id, req.user);

  try {
    const diff = content.getVersionDiff(
      versionA === 'current' ? 'current' : parseInt(versionA),
      versionB === 'current' ? 'current' : parseInt(versionB)
    );

    res.status(200).json({
      success: true,
      data: {
        diff,
        versionA,
        versionB
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// @desc    Add collaborator to content
// @route   POST /api/v1/content/:id/collaborators
// @access  Private
const addCollaborator = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userId, role, permissions } = req.body;

  const content = await Content.findById(id);

  if (!content) {
    return next(new ErrorHandler('Content not found', 404));
  }

  if (content.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorHandler('Only the author or admin can add collaborators', 403));
  }

  // Check if user is already a collaborator
  const existingCollaborator = content.collaborators.find(
    c => c.user.toString() === userId
  );

  if (existingCollaborator) {
    return next(new ErrorHandler('User is already a collaborator', 400));
  }

  content.collaborators.push({
    user: userId,
    role,
    permissions: permissions || {
      canEdit: role === 'editor',
      canReview: role === 'reviewer' || role === 'editor',
      canPublish: false,
      canDelete: false
    }
  });

  await content.save();

  await content.populate('collaborators.user', 'name avatar email');

  res.status(200).json({
    success: true,
    message: 'Collaborator added successfully',
    data: {
      collaborators: content.collaborators
    }
  });
});

// @desc    Remove collaborator from content
// @route   DELETE /api/v1/content/:id/collaborators/:userId
// @access  Private
const removeCollaborator = asyncErrorHandler(async (req, res, next) => {
  const { id, userId } = req.params;

  const content = await Content.findById(id);

  if (!content) {
    return next(new ErrorHandler('Content not found', 404));
  }

  if (content.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorHandler('Only the author or admin can remove collaborators', 403));
  }

  content.collaborators = content.collaborators.filter(
    c => c.user.toString() !== userId
  );

  await content.save();

  res.status(200).json({
    success: true,
    message: 'Collaborator removed successfully'
  });
});

// Template Controllers

// @desc    Create content template
// @route   POST /api/v1/content/templates
// @access  Private
const createTemplate = asyncErrorHandler(async (req, res, next) => {
  const template = await ContentTemplate.create({
    ...req.body,
    author: req.user._id
  });

  await template.populate('author', 'name avatar email');

  res.status(201).json({
    success: true,
    message: 'Template created successfully',
    data: {
      template
    }
  });
});

// @desc    Get all templates
// @route   GET /api/v1/content/templates
// @access  Public
const getTemplates = asyncErrorHandler(async (req, res, next) => {
  const features = new APIFeatures(ContentTemplate.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Filter for public templates for non-authenticated users
  if (!req.user) {
    features.query = features.query.find({ isPublic: true });
  } else if (req.user.role !== 'admin') {
    features.query = features.query.find({
      $or: [
        { isPublic: true },
        { author: req.user._id }
      ]
    });
  }

  const templates = await features.query.populate('author', 'name avatar');
  const total = await ContentTemplate.countDocuments(features.query.getQuery());

  res.status(200).json({
    success: true,
    data: {
      templates,
      pagination: {
        total,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        pages: Math.ceil(total / (parseInt(req.query.limit) || 10))
      }
    }
  });
});

// @desc    Get template by ID
// @route   GET /api/v1/content/templates/:id
// @access  Public
const getTemplate = asyncErrorHandler(async (req, res, next) => {
  const template = await ContentTemplate.findById(req.params.id)
    .populate('author', 'name avatar email');

  if (!template) {
    return next(new ErrorHandler('Template not found', 404));
  }

  // Check access
  if (!template.isPublic) {
    if (!req.user || (template.author._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin')) {
      return next(new ErrorHandler('Access denied', 403));
    }
  }

  res.status(200).json({
    success: true,
    data: {
      template
    }
  });
});

module.exports = {
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
};