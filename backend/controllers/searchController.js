const searchService = require('../services/searchService');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

// Main search endpoint
const searchContent = asyncErrorHandler(async (req, res, next) => {
  const {
    q: query = '',
    type = null,
    category,
    tags,
    author,
    difficulty,
    status = 'published',
    dateFrom,
    dateTo,
    minRating,
    maxRating,
    sort = 'relevance',
    order = 'desc',
    page = 1,
    limit = 20,
    facets = false
  } = req.query;

  // Validate inputs
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 results per page
  const from = (pageNum - 1) * limitNum;

  // Build filters object
  const filters = {
    status
  };

  // Add category filter
  if (category) {
    filters.categories = Array.isArray(category) ? category : [category];
  }

  // Add tags filter
  if (tags) {
    filters.tags = Array.isArray(tags) ? tags : tags.split(',');
  }

  // Add author filter
  if (author) {
    filters['author.name.keyword'] = author;
  }

  // Add difficulty filter
  if (difficulty) {
    filters.difficulty = difficulty;
  }

  // Add date range filter
  if (dateFrom || dateTo) {
    filters.createdAt = {};
    if (dateFrom) filters.createdAt.min = new Date(dateFrom).toISOString();
    if (dateTo) filters.createdAt.max = new Date(dateTo).toISOString();
  }

  // Add rating range filter
  if (minRating || maxRating) {
    filters.rating = {};
    if (minRating) filters.rating.min = parseFloat(minRating);
    if (maxRating) filters.rating.max = parseFloat(maxRating);
  }

  try {
    const searchOptions = {
      query: query.trim(),
      type,
      filters,
      sort,
      order,
      from,
      size: limitNum,
      facets: facets === 'true',
      userId: req.user?.id
    };

    const results = await searchService.search(searchOptions);

    // Calculate pagination
    const totalPages = Math.ceil(results.total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        results: results.hits,
        facets: results.facets || {},
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: results.total,
          totalPages,
          hasNext,
          hasPrev
        },
        meta: {
          took: results.took,
          fallback: results.fallback || false
        }
      }
    });

  } catch (error) {
    logger.error('Search error:', error);
    return next(new ErrorHandler('Search failed', 500));
  }
});

// Search suggestions/autocomplete
const getSearchSuggestions = asyncErrorHandler(async (req, res, next) => {
  const { q: query = '', type = null, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(200).json({
      success: true,
      data: {
        suggestions: []
      }
    });
  }

  try {
    const suggestions = await searchService.suggest(
      query.trim(), 
      type, 
      Math.min(20, parseInt(limit))
    );

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        suggestions
      }
    });

  } catch (error) {
    logger.error('Search suggestions error:', error);
    return next(new ErrorHandler('Failed to get search suggestions', 500));
  }
});

// Get available search facets
const getSearchFacets = asyncErrorHandler(async (req, res, next) => {
  const { type = null } = req.query;

  try {
    const facets = await searchService.getFacets(type);

    res.status(200).json({
      success: true,
      data: {
        type,
        facets
      }
    });

  } catch (error) {
    logger.error('Search facets error:', error);
    return next(new ErrorHandler('Failed to get search facets', 500));
  }
});

// Advanced search with complex filters
const advancedSearch = asyncErrorHandler(async (req, res, next) => {
  const {
    queries = [], // Array of query objects with field-specific searches
    filters = {},
    must = [], // Must match all conditions
    should = [], // Should match any condition
    mustNot = [], // Must not match any condition
    sort = 'relevance',
    order = 'desc',
    page = 1,
    limit = 20,
    highlight = true,
    explain = false
  } = req.body;

  // Validate inputs
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const from = (pageNum - 1) * limitNum;

  try {
    // Build complex search query
    const searchBody = {
      from,
      size: limitNum,
      query: {
        bool: {
          must: [...must],
          should: [...should],
          must_not: [...mustNot],
          filter: []
        }
      },
      sort: buildAdvancedSort(sort, order),
      explain: explain === true
    };

    // Add field-specific queries
    if (queries.length > 0) {
      queries.forEach(q => {
        if (q.field && q.value) {
          const queryObj = {
            match: {
              [q.field]: {
                query: q.value,
                boost: q.boost || 1.0,
                fuzziness: q.fuzziness || 'AUTO'
              }
            }
          };
          searchBody.query.bool.must.push(queryObj);
        }
      });
    }

    // Add filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          searchBody.query.bool.filter.push({ terms: { [field]: value } });
        } else {
          searchBody.query.bool.filter.push({ term: { [field]: value } });
        }
      }
    });

    // Add highlighting
    if (highlight) {
      searchBody.highlight = {
        fields: {
          title: { fragment_size: 100, number_of_fragments: 1 },
          content: { fragment_size: 150, number_of_fragments: 3 },
          description: { fragment_size: 100, number_of_fragments: 1 }
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      };
    }

    // Execute search
    const response = await searchService.client.search({
      index: Object.values(searchService.indices).join(','),
      body: searchBody
    });

    const results = searchService.formatSearchResults(response, false);

    // Calculate pagination
    const totalPages = Math.ceil(results.total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        results: results.hits,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: results.total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        meta: {
          took: results.took,
          maxScore: response.hits.max_score
        }
      }
    });

  } catch (error) {
    logger.error('Advanced search error:', error);
    return next(new ErrorHandler('Advanced search failed', 500));
  }
});

// Similar content recommendations
const getSimilarContent = asyncErrorHandler(async (req, res, next) => {
  const { id, type, limit = 5 } = req.params;

  if (!id || !type) {
    return next(new ErrorHandler('Content ID and type are required', 400));
  }

  try {
    // Get the source document
    const sourceDoc = await searchService.client.get({
      index: searchService.indices[type],
      id
    });

    if (!sourceDoc.found) {
      return next(new ErrorHandler('Source content not found', 404));
    }

    // Build "more like this" query
    const searchBody = {
      size: parseInt(limit),
      query: {
        more_like_this: {
          fields: ['title', 'content', 'description', 'tags'],
          like: [
            {
              _index: searchService.indices[type],
              _id: id
            }
          ],
          min_term_freq: 1,
          max_query_terms: 12,
          min_doc_freq: 1,
          boost: 1.0
        }
      }
    };

    const response = await searchService.client.search({
      index: searchService.indices[type],
      body: searchBody
    });

    const results = searchService.formatSearchResults(response, false);

    res.status(200).json({
      success: true,
      data: {
        source: {
          id,
          type,
          title: sourceDoc._source.title
        },
        similar: results.hits
      }
    });

  } catch (error) {
    logger.error('Similar content error:', error);
    return next(new ErrorHandler('Failed to get similar content', 500));
  }
});

// Search analytics
const getSearchAnalytics = asyncErrorHandler(async (req, res, next) => {
  const {
    startDate,
    endDate,
    type = 'all',
    groupBy = 'day'
  } = req.query;

  // Only allow admins to view analytics
  if (req.user.role !== 'admin') {
    return next(new ErrorHandler('Access denied', 403));
  }

  try {
    // Get search analytics from cache
    const cacheKey = `search_analytics:${startDate}:${endDate}:${type}:${groupBy}`;
    let analytics = await cacheService.get(cacheKey);

    if (!analytics) {
      // Calculate analytics from stored data
      analytics = await calculateSearchAnalytics({
        startDate,
        endDate,
        type,
        groupBy
      });

      // Cache for 1 hour
      await cacheService.set(cacheKey, analytics, 3600);
    }

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Search analytics error:', error);
    return next(new ErrorHandler('Failed to get search analytics', 500));
  }
});

// Popular searches
const getPopularSearches = asyncErrorHandler(async (req, res, next) => {
  const { limit = 20, timeframe = '7d' } = req.query;

  try {
    const cacheKey = `popular_searches:${timeframe}:${limit}`;
    let popularSearches = await cacheService.get(cacheKey);

    if (!popularSearches) {
      // Get popular searches from analytics
      popularSearches = await getPopularSearchTerms(timeframe, parseInt(limit));
      
      // Cache for 6 hours
      await cacheService.set(cacheKey, popularSearches, 21600);
    }

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        searches: popularSearches
      }
    });

  } catch (error) {
    logger.error('Popular searches error:', error);
    return next(new ErrorHandler('Failed to get popular searches', 500));
  }
});

// Search health check
const getSearchHealth = asyncErrorHandler(async (req, res, next) => {
  try {
    const health = await searchService.healthCheck();

    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      data: health
    });

  } catch (error) {
    logger.error('Search health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Search service health check failed'
    });
  }
});

// Reindex content (admin only)
const reindexContent = asyncErrorHandler(async (req, res, next) => {
  const { type, batchSize = 100 } = req.body;

  // Only allow admins
  if (req.user.role !== 'admin') {
    return next(new ErrorHandler('Access denied', 403));
  }

  try {
    let results;
    
    if (type && ['posts', 'stories', 'users', 'courses', 'comments'].includes(type)) {
      results = await reindexDocumentType(type, batchSize);
    } else {
      // Reindex all types
      results = await reindexAllContent(batchSize);
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Reindexing completed',
        results
      }
    });

  } catch (error) {
    logger.error('Reindex error:', error);
    return next(new ErrorHandler('Reindexing failed', 500));
  }
});

// Helper functions
function buildAdvancedSort(sort, order) {
  const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
  
  if (Array.isArray(sort)) {
    return sort.map(s => {
      if (typeof s === 'string') {
        return { [s]: { order: sortOrder } };
      } else if (typeof s === 'object') {
        return s;
      }
      return { _score: { order: 'desc' } };
    });
  }

  switch (sort) {
    case 'date':
    case 'createdAt':
      return [{ createdAt: { order: sortOrder } }];
    case 'updated':
    case 'updatedAt':
      return [{ updatedAt: { order: sortOrder } }];
    case 'title':
      return [{ 'title.keyword': { order: sortOrder } }];
    case 'views':
      return [{ views: { order: sortOrder } }];
    case 'rating':
      return [{ rating: { order: sortOrder } }];
    case 'relevance':
    case '_score':
    default:
      return [{ _score: { order: sortOrder } }];
  }
}

async function calculateSearchAnalytics({ startDate, endDate, type, groupBy }) {
  // This would integrate with your analytics collection
  // For now, return mock data structure
  return {
    totalSearches: 0,
    uniqueQueries: 0,
    avgResultsPerQuery: 0,
    zeroResultQueries: 0,
    topQueries: [],
    searchTrends: []
  };
}

async function getPopularSearchTerms(timeframe, limit) {
  // This would analyze cached search analytics
  // For now, return empty array
  return [];
}

async function reindexDocumentType(type, batchSize) {
  // This would fetch documents from database and reindex them
  // Implementation depends on your database models
  return {
    type,
    processed: 0,
    indexed: 0,
    errors: 0
  };
}

async function reindexAllContent(batchSize) {
  const types = ['posts', 'stories', 'users', 'courses', 'comments'];
  const results = {};

  for (const type of types) {
    results[type] = await reindexDocumentType(type, batchSize);
  }

  return results;
}

module.exports = {
  searchContent,
  getSearchSuggestions,
  getSearchFacets,
  advancedSearch,
  getSimilarContent,
  getSearchAnalytics,
  getPopularSearches,
  getSearchHealth,
  reindexContent
};