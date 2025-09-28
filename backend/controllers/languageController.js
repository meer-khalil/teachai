const { 
  Translation, 
  ContentLocalization, 
  LanguagePreference, 
  TranslationRequest 
} = require('../models/languageModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const CustomError = require('../utils/errorHandler');
const ApiFeatures = require('../utils/api');

// Translation management
const createTranslation = asyncErrorHandler(async (req, res, next) => {
  const { key, namespace = 'common', translations, context, metadata } = req.body;

  if (!key || !translations) {
    return next(new CustomError('Key and translations are required', 400));
  }

  // Check if translation already exists
  const existingTranslation = await Translation.findOne({ key, namespace });
  if (existingTranslation) {
    return next(new CustomError('Translation with this key already exists', 400));
  }

  const translation = new Translation({
    key,
    namespace,
    translations: new Map(Object.entries(translations)),
    context,
    metadata,
    createdBy: req.user.id
  });

  await translation.save();

  res.status(201).json({
    success: true,
    message: 'Translation created successfully',
    data: { translation }
  });
});

const updateTranslation = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { translations, context, metadata, status } = req.body;

  const translation = await Translation.findById(id);
  if (!translation) {
    return next(new CustomError('Translation not found', 404));
  }

  if (translations) {
    translation.translations = new Map(Object.entries(translations));
  }
  if (context !== undefined) translation.context = context;
  if (metadata) translation.metadata = { ...translation.metadata, ...metadata };
  if (status) translation.status = status;
  
  translation.lastModifiedBy = req.user.id;
  translation.version += 1;

  await translation.save();

  res.status(200).json({
    success: true,
    message: 'Translation updated successfully',
    data: { translation }
  });
});

const deleteTranslation = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const translation = await Translation.findByIdAndDelete(id);
  if (!translation) {
    return next(new CustomError('Translation not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Translation deleted successfully'
  });
});

const getTranslations = asyncErrorHandler(async (req, res, next) => {
  const { namespace, language, status, search } = req.query;
  
  const query = {};
  if (namespace) query.namespace = namespace;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { key: { $regex: search, $options: 'i' } },
      { context: { $regex: search, $options: 'i' } }
    ];
  }

  const features = new ApiFeatures(
    Translation.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email'),
    req.query
  ).paginate().sort();

  const translations = await features.query;

  // Filter by language if specified
  let filteredTranslations = translations;
  if (language) {
    filteredTranslations = translations.filter(t => 
      t.translations.has(language)
    );
  }

  // Convert Map to Object for response
  const responseData = filteredTranslations.map(t => ({
    ...t.toObject(),
    translations: Object.fromEntries(t.translations)
  }));

  res.status(200).json({
    success: true,
    results: responseData.length,
    data: { translations: responseData }
  });
});

const getTranslationsByLanguage = asyncErrorHandler(async (req, res, next) => {
  const { language } = req.params;
  const { namespace } = req.query;

  const translations = await Translation.getTranslationsForLanguage(language, namespace);

  res.status(200).json({
    success: true,
    language,
    namespace: namespace || 'all',
    data: { translations }
  });
});

// Content localization
const createContentLocalization = asyncErrorHandler(async (req, res, next) => {
  const { contentId, contentType, originalLanguage } = req.body;

  if (!contentId || !contentType) {
    return next(new CustomError('Content ID and type are required', 400));
  }

  // Check if localization already exists
  const existing = await ContentLocalization.findOne({ contentId, contentType });
  if (existing) {
    return next(new CustomError('Localization already exists for this content', 400));
  }

  const localization = new ContentLocalization({
    contentId,
    contentType,
    originalLanguage: originalLanguage || 'en'
  });

  await localization.save();

  res.status(201).json({
    success: true,
    message: 'Content localization created successfully',
    data: { localization }
  });
});

const addLocalizedVersion = asyncErrorHandler(async (req, res, next) => {
  const { contentId, contentType } = req.params;
  const { language, title, content, description, tags, translationMethod = 'manual' } = req.body;

  if (!language || !content) {
    return next(new CustomError('Language and content are required', 400));
  }

  let localization = await ContentLocalization.findOne({ contentId, contentType });
  if (!localization) {
    localization = new ContentLocalization({ contentId, contentType });
  }

  const versionData = {
    title,
    content,
    description,
    tags,
    translatedBy: req.user.id,
    translationMethod,
    quality: translationMethod === 'ai' ? 75 : 90 // Default quality scores
  };

  await localization.addLocalizedVersion(language, versionData);

  res.status(200).json({
    success: true,
    message: 'Localized version added successfully',
    data: { localization }
  });
});

const getContentLocalization = asyncErrorHandler(async (req, res, next) => {
  const { contentId, contentType } = req.params;
  const { language } = req.query;

  const localization = await ContentLocalization.findByContentAndType(contentId, contentType)
    .populate('localizedVersions.translatedBy', 'name email')
    .populate('localizedVersions.reviewedBy', 'name email');

  if (!localization) {
    return next(new CustomError('Localization not found', 404));
  }

  let responseData = localization;
  if (language) {
    const localizedContent = localization.getLocalizedContent(language);
    if (!localizedContent) {
      return next(new CustomError(`No localization found for language: ${language}`, 404));
    }
    responseData = { ...localization.toObject(), localizedContent };
  }

  res.status(200).json({
    success: true,
    data: { localization: responseData }
  });
});

// User language preferences
const updateLanguagePreference = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const {
    preferredLanguage,
    fallbackLanguages,
    autoDetect,
    dateFormat,
    numberFormat,
    timezone,
    translationSettings
  } = req.body;

  let preference = await LanguagePreference.findOne({ userId });
  
  if (!preference) {
    preference = new LanguagePreference({ userId });
  }

  if (preferredLanguage) preference.preferredLanguage = preferredLanguage;
  if (fallbackLanguages) preference.fallbackLanguages = fallbackLanguages;
  if (autoDetect !== undefined) preference.autoDetect = autoDetect;
  if (dateFormat) preference.dateFormat = dateFormat;
  if (numberFormat) preference.numberFormat = numberFormat;
  if (timezone) preference.timezone = timezone;
  if (translationSettings) {
    preference.translationSettings = { ...preference.translationSettings, ...translationSettings };
  }

  await preference.save();

  res.status(200).json({
    success: true,
    message: 'Language preferences updated successfully',
    data: { preference }
  });
});

const getLanguagePreference = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  const preference = await LanguagePreference.findOne({ userId });
  
  // Return default preference if not found
  const defaultPreference = {
    userId,
    preferredLanguage: 'en',
    fallbackLanguages: ['en'],
    autoDetect: true,
    dateFormat: 'auto',
    numberFormat: 'auto',
    timezone: 'auto',
    translationSettings: {
      autoTranslate: false,
      showOriginal: true,
      translationQuality: 'balanced'
    }
  };

  res.status(200).json({
    success: true,
    data: { preference: preference || defaultPreference }
  });
});

// Translation requests
const createTranslationRequest = asyncErrorHandler(async (req, res, next) => {
  const {
    contentId,
    contentType,
    sourceLanguage,
    targetLanguage,
    priority = 'medium',
    deadline,
    translationMethod = 'ai',
    notes
  } = req.body;

  if (!contentId || !contentType || !sourceLanguage || !targetLanguage) {
    return next(new CustomError('Content ID, type, source and target languages are required', 400));
  }

  const request = new TranslationRequest({
    contentId,
    contentType,
    sourceLanguage,
    targetLanguage,
    priority,
    deadline,
    translationMethod,
    notes,
    requestedBy: req.user.id
  });

  await request.save();

  // If AI translation, process immediately
  if (translationMethod === 'ai') {
    processAITranslation(request._id).catch(console.error);
  }

  res.status(201).json({
    success: true,
    message: 'Translation request created successfully',
    data: { request }
  });
});

const getTranslationRequests = asyncErrorHandler(async (req, res, next) => {
  const { status, priority, targetLanguage, assignedTo } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (targetLanguage) query.targetLanguage = targetLanguage;
  if (assignedTo) query.assignedTo = assignedTo;

  const features = new ApiFeatures(
    TranslationRequest.find(query)
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email'),
    req.query
  ).paginate().sort();

  const requests = await features.query;

  res.status(200).json({
    success: true,
    results: requests.length,
    data: { requests }
  });
});

const updateTranslationRequest = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, assignedTo, qualityScore, feedback, notes } = req.body;

  const request = await TranslationRequest.findById(id);
  if (!request) {
    return next(new CustomError('Translation request not found', 404));
  }

  if (status) request.status = status;
  if (assignedTo) request.assignedTo = assignedTo;
  if (qualityScore) request.qualityScore = qualityScore;
  if (feedback) request.feedback = feedback;
  if (notes) request.notes = notes;

  if (status === 'completed') {
    request.completedAt = new Date();
  }

  await request.save();

  res.status(200).json({
    success: true,
    message: 'Translation request updated successfully',
    data: { request }
  });
});

// AI Translation processing (placeholder for AI service integration)
const processAITranslation = async (requestId) => {
  try {
    const request = await TranslationRequest.findById(requestId);
    if (!request) return;

    request.status = 'in_progress';
    await request.save();

    // Simulate AI translation processing
    setTimeout(async () => {
      try {
        // Here you would integrate with AI translation service
        // For now, we'll mark it as completed
        request.status = 'completed';
        request.qualityScore = 85;
        request.completedAt = new Date();
        await request.save();
      } catch (error) {
        console.error('AI translation failed:', error);
        request.status = 'failed';
        await request.save();
      }
    }, 5000);
  } catch (error) {
    console.error('Error processing AI translation:', error);
  }
};

// Bulk operations
const bulkCreateTranslations = asyncErrorHandler(async (req, res, next) => {
  const { translations } = req.body;

  if (!translations || !Array.isArray(translations)) {
    return next(new CustomError('Translations array is required', 400));
  }

  const results = [];
  const errors = [];

  for (const translationData of translations) {
    try {
      const { key, namespace = 'common', translations: translationMap } = translationData;
      
      const translation = new Translation({
        key,
        namespace,
        translations: new Map(Object.entries(translationMap)),
        createdBy: req.user.id
      });

      await translation.save();
      results.push(translation);
    } catch (error) {
      errors.push({
        key: translationData.key,
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Created ${results.length} translations successfully`,
    data: { 
      created: results,
      errors: errors
    }
  });
});

// Export translations for external tools
const exportTranslations = asyncErrorHandler(async (req, res, next) => {
  const { namespace, language, format = 'json' } = req.query;

  const query = {};
  if (namespace) query.namespace = namespace;

  const translations = await Translation.find(query);
  
  let exportData = {};
  
  if (language) {
    // Export specific language
    translations.forEach(t => {
      const translation = t.getTranslation(language);
      if (translation) {
        exportData[t.key] = translation;
      }
    });
  } else {
    // Export all languages
    translations.forEach(t => {
      exportData[t.key] = Object.fromEntries(t.translations);
    });
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertTranslationsToCSV(exportData, language);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="translations_${namespace || 'all'}_${language || 'all'}.csv"`);
    res.send(csvData);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="translations_${namespace || 'all'}_${language || 'all'}.json"`);
    res.json({
      success: true,
      namespace: namespace || 'all',
      language: language || 'all',
      exportedAt: new Date(),
      count: Object.keys(exportData).length,
      data: exportData
    });
  }
});

// Helper function to convert translations to CSV
const convertTranslationsToCSV = (data, singleLanguage) => {
  if (singleLanguage) {
    const rows = [['Key', 'Translation']];
    Object.entries(data).forEach(([key, translation]) => {
      rows.push([key, translation]);
    });
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  } else {
    const allLanguages = new Set();
    Object.values(data).forEach(translations => {
      Object.keys(translations).forEach(lang => allLanguages.add(lang));
    });
    
    const headers = ['Key', ...Array.from(allLanguages)];
    const rows = [headers];
    
    Object.entries(data).forEach(([key, translations]) => {
      const row = [key];
      Array.from(allLanguages).forEach(lang => {
        row.push(translations[lang] || '');
      });
      rows.push(row);
    });
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
};

module.exports = {
  createTranslation,
  updateTranslation,
  deleteTranslation,
  getTranslations,
  getTranslationsByLanguage,
  createContentLocalization,
  addLocalizedVersion,
  getContentLocalization,
  updateLanguagePreference,
  getLanguagePreference,
  createTranslationRequest,
  getTranslationRequests,
  updateTranslationRequest,
  bulkCreateTranslations,
  exportTranslations
};