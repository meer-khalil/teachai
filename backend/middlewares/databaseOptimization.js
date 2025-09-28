const mongoose = require('mongoose');
const { cacheService } = require('../utils/cacheService');

// Database connection optimization
const optimizeDbConnection = () => {
  // Set mongoose options for performance
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferMaxEntries', 0);
  mongoose.set('maxTimeMS', 30000);
  
  // Connection pool settings
  const connectionOptions = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0, // Disable mongoose buffering
    
    // Connection management
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    waitQueueTimeoutMS: 2000, // Make the MongoDB driver wait up to 2 seconds for a connection
    
    // Performance optimizations
    compressors: ['zlib'], // Enable compression
    zlibCompressionLevel: 6, // Compression level
    
    // Monitoring
    monitorCommands: process.env.NODE_ENV === 'development'
  };
  
  return connectionOptions;
};

// Query optimization middleware
const queryOptimizationMiddleware = () => {
  // Add query optimization hooks to all schemas
  const originalFind = mongoose.Query.prototype.find;
  const originalFindOne = mongoose.Query.prototype.findOne;
  const originalFindOneAndUpdate = mongoose.Query.prototype.findOneAndUpdate;
  
  // Override find method to add optimizations
  mongoose.Query.prototype.find = function(...args) {
    // Add lean by default for read operations
    if (!this.getOptions().lean && !this._pipeline) {
      this.lean();
    }
    
    // Add query timeout
    this.maxTimeMS(10000);
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      const startTime = Date.now();
      const originalExec = this.exec;
      
      this.exec = function() {
        return originalExec.call(this).then(result => {
          const duration = Date.now() - startTime;
          if (duration > 100) {
            console.warn(`🐌 Slow Query (${duration}ms):`, this.getQuery());
          }
          return result;
        });
      };
    }
    
    return originalFind.apply(this, args);
  };
  
  // Override findOne with optimizations
  mongoose.Query.prototype.findOne = function(...args) {
    if (!this.getOptions().lean) {
      this.lean();
    }
    this.maxTimeMS(5000);
    return originalFindOne.apply(this, args);
  };
  
  // Override findOneAndUpdate with optimizations
  mongoose.Query.prototype.findOneAndUpdate = function(...args) {
    this.maxTimeMS(10000);
    return originalFindOneAndUpdate.apply(this, args);
  };
};

// Database query caching middleware
const dbCacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'db:',
    cacheableOperations = ['find', 'findOne', 'count', 'countDocuments']
  } = options;
  
  return (schema) => {
    // Pre-hook for cacheable operations
    cacheableOperations.forEach(operation => {
      schema.pre(operation, async function() {
        // Generate cache key based on model name, operation, and query
        const modelName = this.model.modelName;
        const query = JSON.stringify(this.getQuery());
        const options = JSON.stringify(this.getOptions());
        const cacheKey = `${keyPrefix}${modelName}:${operation}:${Buffer.from(query + options).toString('base64')}`;
        
        // Try to get from cache
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          // Return cached result
          this._cached = true;
          this._cachedResult = cached;
          console.log(`🎯 DB Cache HIT: ${modelName}.${operation}`);
        } else {
          this._cacheKey = cacheKey;
          console.log(`❌ DB Cache MISS: ${modelName}.${operation}`);
        }
      });
      
      schema.post(operation, async function(result) {
        // Cache the result if not from cache
        if (!this._cached && this._cacheKey && result) {
          await cacheService.set(this._cacheKey, result, ttl).catch(console.error);
          console.log(`✅ DB Result cached: ${this.model.modelName}.${operation}`);
        }
      });
    });
    
    // Invalidate cache on write operations
    const writeOperations = ['save', 'update', 'updateOne', 'updateMany', 'findOneAndUpdate', 'remove', 'deleteOne', 'deleteMany'];
    
    writeOperations.forEach(operation => {
      schema.post(operation, async function() {
        // Invalidate all cache entries for this model
        const modelName = this.model ? this.model.modelName : this.constructor.modelName;
        const pattern = `${keyPrefix}${modelName}:*`;
        
        try {
          const deletedCount = await cacheService.delPattern(pattern);
          if (deletedCount > 0) {
            console.log(`🗑️ DB Cache invalidated for ${modelName}: ${deletedCount} keys`);
          }
        } catch (error) {
          console.error('DB Cache invalidation error:', error);
        }
      });
    });
  };
};

// Index optimization suggestions
const indexOptimizer = {
  analyzeQueries: async (model, queries = []) => {
    const suggestions = [];
    
    for (const query of queries) {
      const explained = await model.find(query).explain('executionStats');
      const stats = explained[0].executionStats;
      
      if (stats.totalDocsExamined > stats.totalDocsReturned * 10) {
        suggestions.push({
          query,
          issue: 'High document examination ratio',
          suggestion: 'Consider adding an index for query fields',
          examined: stats.totalDocsExamined,
          returned: stats.totalDocsReturned,
          ratio: stats.totalDocsExamined / (stats.totalDocsReturned || 1)
        });
      }
      
      if (stats.executionTimeMillis > 100) {
        suggestions.push({
          query,
          issue: 'Slow query execution',
          suggestion: 'Optimize query or add compound index',
          executionTime: stats.executionTimeMillis
        });
      }
    }
    
    return suggestions;
  },
  
  suggestIndexes: (model) => {
    const schema = model.schema;
    const paths = schema.paths;
    const suggestions = [];
    
    // Analyze schema paths for index opportunities
    Object.keys(paths).forEach(path => {
      const schemaPath = paths[path];
      
      // Suggest indexes for frequently queried fields
      if (schemaPath.options.index === undefined) {
        if (path === 'email' || path === 'username' || path === 'slug') {
          suggestions.push({
            field: path,
            type: 'single',
            reason: 'Commonly queried field'
          });
        }
        
        if (schemaPath.instance === 'Date' && (path.includes('created') || path.includes('updated'))) {
          suggestions.push({
            field: path,
            type: 'single',
            reason: 'Date field for sorting/filtering'
          });
        }
      }
    });
    
    return suggestions;
  }
};

// Connection monitoring middleware
const connectionMonitor = () => {
  const connection = mongoose.connection;
  
  connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });
  
  connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    
    // Store connection error in cache for monitoring
    cacheService.set('db:last_error', {
      error: err.message,
      timestamp: new Date(),
      type: 'connection'
    }, { ttl: 3600, useRedis: true }).catch(console.error);
  });
  
  connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });
  
  connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });
  
  // Monitor connection pool
  connection.on('fullsetup', () => {
    console.log('📊 MongoDB connection pool established');
  });
  
  // Performance monitoring
  setInterval(async () => {
    try {
      const stats = {
        readyState: connection.readyState,
        poolSize: connection.db?.serverConfig?.poolSize || 0,
        host: connection.host,
        port: connection.port,
        name: connection.name,
        collections: connection.collections ? Object.keys(connection.collections).length : 0
      };
      
      await cacheService.set('db:connection_stats', stats, { ttl: 60, useRedis: true });
    } catch (error) {
      console.error('Error monitoring connection:', error);
    }
  }, 30000); // Every 30 seconds
};

// Aggregation optimization helper
const optimizeAggregation = {
  addIndexHints: (pipeline, hints = []) => {
    // Add $hint stage for better index usage
    if (hints.length > 0) {
      const hintStage = { $hint: hints[0] };
      return [hintStage, ...pipeline];
    }
    return pipeline;
  },
  
  addEarlyFiltering: (pipeline) => {
    // Move $match stages as early as possible
    const matchStages = pipeline.filter(stage => stage.$match);
    const otherStages = pipeline.filter(stage => !stage.$match);
    return [...matchStages, ...otherStages];
  },
  
  optimizePipeline: (pipeline) => {
    let optimized = [...pipeline];
    
    // Move $match stages to the beginning
    optimized = optimizeAggregation.addEarlyFiltering(optimized);
    
    // Add $limit early if sorting
    const sortIndex = optimized.findIndex(stage => stage.$sort);
    const limitIndex = optimized.findIndex(stage => stage.$limit);
    
    if (sortIndex !== -1 && limitIndex !== -1 && sortIndex < limitIndex) {
      // Move $limit after $sort for better performance
      const limitStage = optimized[limitIndex];
      optimized.splice(limitIndex, 1);
      optimized.splice(sortIndex + 1, 0, limitStage);
    }
    
    return optimized;
  }
};

// Database performance monitoring
const dbPerformanceMonitor = async (req, res, next) => {
  const start = Date.now();
  
  // Hook into mongoose to track query performance
  const originalExec = mongoose.Query.prototype.exec;
  
  mongoose.Query.prototype.exec = function() {
    const queryStart = Date.now();
    const operation = this.op;
    const modelName = this.model.modelName;
    
    return originalExec.call(this).then(result => {
      const duration = Date.now() - queryStart;
      
      // Log slow queries
      if (duration > 100) {
        console.warn(`🐌 Slow DB Query: ${modelName}.${operation} (${duration}ms)`);
      }
      
      // Store query performance data
      const perfKey = `db:perf:${Date.now()}`;
      cacheService.set(perfKey, {
        model: modelName,
        operation,
        duration,
        query: this.getQuery(),
        timestamp: new Date()
      }, { ttl: 3600, useRedis: true }).catch(console.error);
      
      return result;
    });
  };
  
  next();
  
  // Restore original exec after request
  res.on('finish', () => {
    mongoose.Query.prototype.exec = originalExec;
  });
};

module.exports = {
  optimizeDbConnection,
  queryOptimizationMiddleware,
  dbCacheMiddleware,
  indexOptimizer,
  connectionMonitor,
  optimizeAggregation,
  dbPerformanceMonitor
};