const { Client } = require('@elastic/elasticsearch');
const config = require('../config/keys');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class SearchService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.indices = {
      posts: 'posts',
      stories: 'stories',
      users: 'users',
      courses: 'courses',
      comments: 'comments'
    };
    this.initializeClient();
  }

  async initializeClient() {
    try {
      // In development, use local Elasticsearch or skip if not available
      if (process.env.NODE_ENV === 'development' && !process.env.ELASTICSEARCH_URL) {
        logger.warn('⚠️ Skipping Elasticsearch in development mode - using fallback search');
        return;
      }

      const clientConfig = {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: process.env.ELASTICSEARCH_AUTH ? {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || 'password'
        } : undefined,
        requestTimeout: 30000,
        maxRetries: 3
      };

      this.client = new Client(clientConfig);

      // Test connection
      await this.client.ping();
      this.isConnected = true;

      logger.info('✅ Elasticsearch connected successfully');

      // Initialize indices
      await this.initializeIndices();
      
    } catch (error) {
      logger.warn(`⚠️ Elasticsearch connection failed: ${error.message}`);
      this.isConnected = false;
    }
  }

  async initializeIndices() {
    if (!this.isConnected) return;

    try {
      // Create indices with mappings
      for (const [key, index] of Object.entries(this.indices)) {
        const exists = await this.client.indices.exists({ index });
        
        if (!exists) {
          await this.client.indices.create({
            index,
            body: this.getIndexMapping(key)
          });
          logger.info(`📋 Created index: ${index}`);
        }
      }
    } catch (error) {
      logger.error('Search index initialization error:', error);
    }
  }

  getIndexMapping(type) {
    const baseMapping = {
      settings: {
        analysis: {
          analyzer: {
            custom_text_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'stemmer']
            },
            search_analyzer: {
              type: 'custom',
              tokenizer: 'keyword',
              filter: ['lowercase']
            }
          }
        },
        max_result_window: 50000
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };

    switch (type) {
      case 'posts':
        baseMapping.mappings.properties = {
          ...baseMapping.mappings.properties,
          title: {
            type: 'text',
            analyzer: 'custom_text_analyzer',
            search_analyzer: 'search_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' }
            }
          },
          content: {
            type: 'text',
            analyzer: 'custom_text_analyzer'
          },
          excerpt: { type: 'text' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              email: { type: 'keyword' }
            }
          },
          categories: { type: 'keyword' },
          tags: { type: 'keyword' },
          status: { type: 'keyword' },
          views: { type: 'integer' },
          likes: { type: 'integer' },
          difficulty: { type: 'keyword' },
          rating: { type: 'float' }
        };
        break;

      case 'stories':
        baseMapping.mappings.properties = {
          ...baseMapping.mappings.properties,
          title: {
            type: 'text',
            analyzer: 'custom_text_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' }
            }
          },
          content: {
            type: 'text',
            analyzer: 'custom_text_analyzer'
          },
          summary: { type: 'text' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' }
            }
          },
          category: { type: 'keyword' },
          tags: { type: 'keyword' },
          status: { type: 'keyword' },
          readTime: { type: 'integer' },
          views: { type: 'integer' }
        };
        break;

      case 'users':
        baseMapping.mappings.properties = {
          ...baseMapping.mappings.properties,
          name: {
            type: 'text',
            analyzer: 'custom_text_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' }
            }
          },
          email: { type: 'keyword' },
          bio: { type: 'text' },
          role: { type: 'keyword' },
          skills: { type: 'keyword' },
          location: { type: 'text' },
          joinedAt: { type: 'date' },
          isActive: { type: 'boolean' },
          profileComplete: { type: 'boolean' }
        };
        break;

      case 'courses':
        baseMapping.mappings.properties = {
          ...baseMapping.mappings.properties,
          title: {
            type: 'text',
            analyzer: 'custom_text_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' }
            }
          },
          description: {
            type: 'text',
            analyzer: 'custom_text_analyzer'
          },
          instructor: {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' }
            }
          },
          category: { type: 'keyword' },
          level: { type: 'keyword' },
          duration: { type: 'integer' },
          price: { type: 'float' },
          rating: { type: 'float' },
          studentsCount: { type: 'integer' },
          isPublished: { type: 'boolean' }
        };
        break;

      case 'comments':
        baseMapping.mappings.properties = {
          ...baseMapping.mappings.properties,
          content: {
            type: 'text',
            analyzer: 'custom_text_analyzer'
          },
          author: {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' }
            }
          },
          postId: { type: 'keyword' },
          parentId: { type: 'keyword' },
          likes: { type: 'integer' },
          isApproved: { type: 'boolean' }
        };
        break;
    }

    return baseMapping;
  }

  // Index document
  async indexDocument(type, id, document) {
    if (!this.isConnected) {
      logger.warn('Search indexing skipped - Elasticsearch not connected');
      return false;
    }

    try {
      const index = this.indices[type];
      if (!index) {
        throw new Error(`Unknown document type: ${type}`);
      }

      // Prepare document for indexing
      const doc = this.prepareDocument(type, document);

      await this.client.index({
        index,
        id,
        body: doc
      });

      // Refresh index for immediate search
      await this.client.indices.refresh({ index });

      logger.debug(`📋 Document indexed: ${type}/${id}`);
      return true;
    } catch (error) {
      logger.error(`Search indexing error for ${type}/${id}:`, error);
      return false;
    }
  }

  // Bulk index documents
  async bulkIndex(type, documents) {
    if (!this.isConnected || !documents.length) {
      return { success: false, indexed: 0 };
    }

    try {
      const index = this.indices[type];
      const body = [];

      documents.forEach(doc => {
        body.push({ index: { _index: index, _id: doc._id || doc.id } });
        body.push(this.prepareDocument(type, doc));
      });

      const response = await this.client.bulk({ body });

      const errors = response.items.filter(item => item.index.error);
      if (errors.length > 0) {
        logger.error('Bulk index errors:', errors);
      }

      const indexed = response.items.length - errors.length;
      logger.info(`📋 Bulk indexed ${indexed}/${documents.length} documents`);

      return { success: true, indexed, errors: errors.length };
    } catch (error) {
      logger.error(`Bulk index error for ${type}:`, error);
      return { success: false, indexed: 0 };
    }
  }

  // Delete document
  async deleteDocument(type, id) {
    if (!this.isConnected) return false;

    try {
      const index = this.indices[type];
      await this.client.delete({ index, id });
      logger.debug(`🗑️ Document deleted: ${type}/${id}`);
      return true;
    } catch (error) {
      if (error.meta?.statusCode !== 404) {
        logger.error(`Delete document error ${type}/${id}:`, error);
      }
      return false;
    }
  }

  // Search documents
  async search(options = {}) {
    const {
      query = '',
      type = null,
      filters = {},
      sort = '_score',
      order = 'desc',
      from = 0,
      size = 20,
      facets = false,
      userId = null
    } = options;

    // Use fallback search if Elasticsearch not available
    if (!this.isConnected) {
      return this.fallbackSearch(options);
    }

    try {
      // Cache key for search results
      const cacheKey = `search:${JSON.stringify(options)}`;
      
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const searchBody = this.buildSearchQuery({
        query,
        type,
        filters,
        sort,
        order,
        from,
        size,
        facets
      });

      const indices = type ? [this.indices[type]] : Object.values(this.indices);
      
      const response = await this.client.search({
        index: indices.join(','),
        body: searchBody,
        track_total_hits: true
      });

      const results = this.formatSearchResults(response, facets);

      // Cache results for 5 minutes
      await cacheService.set(cacheKey, results, 300);

      // Track search analytics
      this.trackSearch({
        query,
        type,
        filters,
        resultsCount: results.total,
        userId
      });

      return results;

    } catch (error) {
      logger.error('Search error:', error);
      
      // Fallback to basic search
      return this.fallbackSearch(options);
    }
  }

  // Search suggestions/autocomplete
  async suggest(query, type = null, limit = 5) {
    if (!this.isConnected || !query) {
      return [];
    }

    try {
      const cacheKey = `suggest:${query}:${type}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const indices = type ? [this.indices[type]] : Object.values(this.indices);
      
      const response = await this.client.search({
        index: indices.join(','),
        body: {
          suggest: {
            text_suggest: {
              prefix: query,
              completion: {
                field: 'title.suggest',
                size: limit,
                skip_duplicates: true
              }
            }
          }
        }
      });

      const suggestions = response.suggest.text_suggest[0].options.map(option => ({
        text: option._source.title,
        type: option._index,
        score: option._score
      }));

      // Cache for 10 minutes
      await cacheService.set(cacheKey, suggestions, 600);

      return suggestions;
    } catch (error) {
      logger.error('Search suggestion error:', error);
      return [];
    }
  }

  // Get search facets
  async getFacets(type = null, filters = {}) {
    if (!this.isConnected) {
      return {};
    }

    try {
      const cacheKey = `facets:${type}:${JSON.stringify(filters)}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const indices = type ? [this.indices[type]] : Object.values(this.indices);
      
      const response = await this.client.search({
        index: indices.join(','),
        size: 0,
        body: {
          query: this.buildFilterQuery(filters),
          aggs: this.buildFacetAggregations(type)
        }
      });

      const facets = this.formatFacets(response.aggregations);

      // Cache for 15 minutes
      await cacheService.set(cacheKey, facets, 900);

      return facets;
    } catch (error) {
      logger.error('Facets error:', error);
      return {};
    }
  }

  // Helper methods
  prepareDocument(type, document) {
    const doc = { ...document };
    
    // Convert MongoDB ObjectId to string
    if (doc._id) {
      doc.id = doc._id.toString();
      delete doc._id;
    }

    // Ensure dates are properly formatted
    if (doc.createdAt) doc.createdAt = new Date(doc.createdAt).toISOString();
    if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt).toISOString();

    // Type-specific preparations
    switch (type) {
      case 'posts':
      case 'stories':
        if (doc.title) {
          doc.title_suggest = {
            input: [doc.title, ...this.generateTitleVariations(doc.title)]
          };
        }
        break;
      case 'users':
        if (doc.name) {
          doc.name_suggest = {
            input: [doc.name, ...doc.name.split(' ')]
          };
        }
        break;
    }

    return doc;
  }

  generateTitleVariations(title) {
    const variations = [];
    const words = title.toLowerCase().split(' ');
    
    // Add partial matches
    for (let i = 1; i <= words.length; i++) {
      variations.push(words.slice(0, i).join(' '));
    }

    return [...new Set(variations)];
  }

  buildSearchQuery({ query, type, filters, sort, order, from, size, facets }) {
    const searchBody = {
      from,
      size,
      query: {
        bool: {
          must: [],
          filter: []
        }
      },
      sort: this.buildSort(sort, order),
      highlight: {
        fields: {
          title: {},
          content: { fragment_size: 150, number_of_fragments: 3 }
        }
      }
    };

    // Add search query
    if (query) {
      searchBody.query.bool.must.push({
        multi_match: {
          query,
          fields: ['title^3', 'content^2', 'description^2', 'name^3', 'tags^1.5'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or'
        }
      });
    } else {
      searchBody.query.bool.must.push({ match_all: {} });
    }

    // Add filters
    const filterQuery = this.buildFilterQuery(filters);
    if (filterQuery.bool.filter.length > 0) {
      searchBody.query.bool.filter.push(...filterQuery.bool.filter);
    }

    // Add type filter
    if (type) {
      searchBody.query.bool.filter.push({
        term: { _index: this.indices[type] }
      });
    }

    // Add facet aggregations
    if (facets) {
      searchBody.aggs = this.buildFacetAggregations(type);
    }

    return searchBody;
  }

  buildFilterQuery(filters) {
    const query = { bool: { filter: [] } };

    Object.entries(filters).forEach(([field, value]) => {
      if (value === null || value === undefined || value === '') return;

      if (Array.isArray(value)) {
        if (value.length > 0) {
          query.bool.filter.push({ terms: { [field]: value } });
        }
      } else if (typeof value === 'object') {
        // Range filters
        if (value.min !== undefined || value.max !== undefined) {
          const range = {};
          if (value.min !== undefined) range.gte = value.min;
          if (value.max !== undefined) range.lte = value.max;
          query.bool.filter.push({ range: { [field]: range } });
        }
      } else {
        query.bool.filter.push({ term: { [field]: value } });
      }
    });

    return query;
  }

  buildSort(sort, order) {
    const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
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

  buildFacetAggregations(type) {
    const aggs = {
      types: {
        terms: { field: '_index', size: 10 }
      }
    };

    // Type-specific facets
    if (!type || type === 'posts') {
      aggs.categories = { terms: { field: 'categories', size: 20 } };
      aggs.tags = { terms: { field: 'tags', size: 30 } };
      aggs.difficulty = { terms: { field: 'difficulty', size: 5 } };
      aggs.authors = { terms: { field: 'author.name.keyword', size: 10 } };
    }

    if (!type || type === 'stories') {
      aggs.story_categories = { terms: { field: 'category', size: 15 } };
      aggs.story_tags = { terms: { field: 'tags', size: 25 } };
    }

    if (!type || type === 'users') {
      aggs.roles = { terms: { field: 'role', size: 10 } };
      aggs.skills = { terms: { field: 'skills', size: 20 } };
    }

    if (!type || type === 'courses') {
      aggs.course_categories = { terms: { field: 'category', size: 15 } };
      aggs.levels = { terms: { field: 'level', size: 5 } };
      aggs.price_ranges = {
        range: {
          field: 'price',
          ranges: [
            { key: 'Free', to: 1 },
            { key: '$1-$50', from: 1, to: 50 },
            { key: '$50-$100', from: 50, to: 100 },
            { key: '$100+', from: 100 }
          ]
        }
      };
    }

    return aggs;
  }

  formatSearchResults(response, includeFacets = false) {
    const results = {
      total: response.hits.total.value,
      hits: response.hits.hits.map(hit => ({
        id: hit._id,
        type: hit._index,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight || {}
      })),
      took: response.took
    };

    if (includeFacets && response.aggregations) {
      results.facets = this.formatFacets(response.aggregations);
    }

    return results;
  }

  formatFacets(aggregations) {
    const facets = {};

    Object.entries(aggregations).forEach(([key, agg]) => {
      if (agg.buckets) {
        facets[key] = agg.buckets.map(bucket => ({
          key: bucket.key,
          count: bucket.doc_count
        }));
      }
    });

    return facets;
  }

  // Fallback search using basic database queries
  async fallbackSearch(options) {
    logger.warn('Using fallback search - limited functionality');
    
    // This would integrate with your existing database models
    // For now, return empty results
    return {
      total: 0,
      hits: [],
      took: 0,
      facets: {},
      fallback: true
    };
  }

  // Track search analytics
  async trackSearch({ query, type, filters, resultsCount, userId }) {
    try {
      const analytics = {
        query: query || '',
        type,
        filters,
        resultsCount,
        userId,
        timestamp: new Date(),
        sessionId: `${userId}-${Date.now()}`
      };

      // Store in cache for processing
      await cacheService.set(
        `search_analytics:${Date.now()}:${Math.random()}`,
        analytics,
        3600 // 1 hour
      );

    } catch (error) {
      logger.error('Search analytics tracking error:', error);
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'unhealthy',
        message: 'Elasticsearch not connected',
        fallback: true
      };
    }

    try {
      const response = await this.client.cluster.health();
      return {
        status: response.status === 'red' ? 'unhealthy' : 'healthy',
        cluster: response.cluster_name,
        nodes: response.number_of_nodes,
        shards: {
          active: response.active_shards,
          relocating: response.relocating_shards,
          initializing: response.initializing_shards,
          unassigned: response.unassigned_shards
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

module.exports = searchService;