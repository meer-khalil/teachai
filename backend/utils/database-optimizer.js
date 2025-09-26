const mongoose = require('mongoose');

// Database optimization utilities
class DatabaseOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.queryStats = {
            totalQueries: 0,
            slowQueries: 0,
            cacheHits: 0,
            averageResponseTime: 0,
            slowQueryThreshold: 100 // milliseconds
        };
    }

    // Optimize MongoDB connection with performance settings
    static getOptimizedConnectionOptions() {
        return {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferMaxEntries: 0, // Disable mongoose buffering
            bufferCommands: false, // Disable mongoose buffering
            
            // Use read preference for better performance
            readPreference: 'primaryPreferred',
            
            // Connection pool settings
            minPoolSize: 2, // Minimum connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            
            // Write concern for better performance
            writeConcern: {
                w: 'majority',
                j: true,
                wtimeout: 1000
            }
        };
    }

    // Create compound indexes for better query performance
    static async createOptimizedIndexes() {
        try {
            const db = mongoose.connection.db;
            
            // User model indexes
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            await db.collection('users').createIndex({ createdAt: -1 });
            await db.collection('users').createIndex({ isActive: 1, role: 1 });
            
            // Post model indexes
            await db.collection('posts').createIndex({ author: 1, createdAt: -1 });
            await db.collection('posts').createIndex({ category: 1, isPublished: 1 });
            await db.collection('posts').createIndex({ tags: 1 });
            await db.collection('posts').createIndex({ title: 'text', content: 'text' });
            
            // Chat history indexes
            await db.collection('chathistories').createIndex({ userId: 1, createdAt: -1 });
            await db.collection('chathistories').createIndex({ sessionId: 1 });
            
            // Order indexes
            await db.collection('orders').createIndex({ userId: 1, status: 1 });
            await db.collection('orders').createIndex({ createdAt: -1 });
            
            // Payment indexes
            await db.collection('payments').createIndex({ orderId: 1 });
            await db.collection('payments').createIndex({ paymentId: 1 }, { unique: true });
            
            // Contact form indexes
            await db.collection('contacts').createIndex({ email: 1, createdAt: -1 });
            
            console.log('✅ Database indexes created successfully');
        } catch (error) {
            console.error('❌ Error creating database indexes:', error);
        }
    }

    // Query performance monitoring middleware
    static createQueryMonitor() {
        return function(next) {
            const startTime = Date.now();
            const query = this;
            
            // Override exec method to monitor performance
            const originalExec = query.exec;
            query.exec = async function() {
                const start = Date.now();
                
                try {
                    const result = await originalExec.call(this);
                    const duration = Date.now() - start;
                    
                    // Log slow queries
                    if (duration > 100) { // 100ms threshold
                        console.warn(`🐌 Slow query detected (${duration}ms):`, {
                            collection: this.model.collection.name,
                            operation: this.op,
                            filter: JSON.stringify(this.getFilter()),
                            duration
                        });
                    }
                    
                    return result;
                } catch (error) {
                    console.error('Query error:', error);
                    throw error;
                }
            };
            
            next();
        };
    }

    // Optimize aggregation pipelines
    static optimizeAggregationPipeline(pipeline) {
        const optimized = [...pipeline];
        
        // Move $match stages to the beginning
        const matchStages = optimized.filter(stage => stage.$match);
        const otherStages = optimized.filter(stage => !stage.$match);
        
        // Move $limit stages earlier if possible
        const limitIndex = otherStages.findIndex(stage => stage.$limit);
        if (limitIndex > -1 && limitIndex > 2) {
            const limitStage = otherStages.splice(limitIndex, 1)[0];
            otherStages.splice(2, 0, limitStage);
        }
        
        return [...matchStages, ...otherStages];
    }

    // Cursor-based pagination helper
    static createCursorPagination(Model, options = {}) {
        return async function(req, res, next) {
            try {
                const {
                    limit = 20,
                    sortField = 'createdAt',
                    sortDirection = -1,
                    cursorField = '_id'
                } = options;
                
                const { cursor, first = limit } = req.query;
                
                let query = Model.find();
                
                // Apply cursor-based filtering
                if (cursor) {
                    const operator = sortDirection === -1 ? '$lt' : '$gt';
                    query = query.where(cursorField)[operator](cursor);
                }
                
                // Apply sorting and limiting
                query = query
                    .sort({ [sortField]: sortDirection })
                    .limit(parseInt(first) + 1); // +1 to check if there are more items
                
                const results = await query.exec();
                const hasMore = results.length > first;
                
                if (hasMore) {
                    results.pop(); // Remove the extra item
                }
                
                const nextCursor = hasMore && results.length > 0 
                    ? results[results.length - 1][cursorField] 
                    : null;
                
                req.paginationResult = {
                    data: results,
                    pageInfo: {
                        hasNextPage: hasMore,
                        nextCursor,
                        count: results.length
                    }
                };
                
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    // Bulk operations helper
    static createBulkOperationHelper(Model) {
        return {
            // Bulk insert with validation
            bulkInsert: async (documents) => {
                try {
                    const result = await Model.insertMany(documents, {
                        ordered: false, // Continue on error
                        rawResult: true
                    });
                    
                    console.log(`✅ Bulk insert completed: ${result.insertedCount} documents`);
                    return result;
                } catch (error) {
                    console.error('Bulk insert error:', error);
                    throw error;
                }
            },

            // Bulk update with upsert
            bulkUpdate: async (operations) => {
                try {
                    const bulkOps = operations.map(op => ({
                        updateOne: {
                            filter: op.filter,
                            update: op.update,
                            upsert: op.upsert || false
                        }
                    }));
                    
                    const result = await Model.bulkWrite(bulkOps);
                    console.log(`✅ Bulk update completed:`, result);
                    return result;
                } catch (error) {
                    console.error('Bulk update error:', error);
                    throw error;
                }
            },

            // Bulk delete
            bulkDelete: async (filters) => {
                try {
                    const bulkOps = filters.map(filter => ({
                        deleteMany: { filter }
                    }));
                    
                    const result = await Model.bulkWrite(bulkOps);
                    console.log(`✅ Bulk delete completed:`, result);
                    return result;
                } catch (error) {
                    console.error('Bulk delete error:', error);
                    throw error;
                }
            }
        };
    }

    // Query optimization helpers
    static optimizeQuery(query, options = {}) {
        const {
            selectFields,
            populateFields,
            lean = true,
            limit,
            sort
        } = options;

        // Apply field selection
        if (selectFields) {
            query = query.select(selectFields);
        }

        // Apply population
        if (populateFields) {
            if (Array.isArray(populateFields)) {
                populateFields.forEach(field => {
                    query = query.populate(field);
                });
            } else {
                query = query.populate(populateFields);
            }
        }

        // Use lean queries for read-only operations
        if (lean) {
            query = query.lean();
        }

        // Apply sorting
        if (sort) {
            query = query.sort(sort);
        }

        // Apply limit
        if (limit) {
            query = query.limit(limit);
        }

        return query;
    }

    // Connection monitoring
    static monitorConnection() {
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        // Monitor slow operations
        mongoose.set('debug', (collectionName, method, query, doc, options) => {
            const start = Date.now();
            
            return function() {
                const duration = Date.now() - start;
                if (duration > 100) {
                    console.log(`🐌 Slow DB operation: ${collectionName}.${method} (${duration}ms)`);
                }
            };
        });
    }

    // Get database performance statistics
    static async getPerformanceStats() {
        try {
            const db = mongoose.connection.db;
            const stats = await db.stats();
            const serverStatus = await db.admin().serverStatus();
            
            return {
                database: {
                    collections: stats.collections,
                    objects: stats.objects,
                    avgObjSize: stats.avgObjSize,
                    dataSize: stats.dataSize,
                    storageSize: stats.storageSize,
                    indexes: stats.indexes,
                    indexSize: stats.indexSize
                },
                server: {
                    uptime: serverStatus.uptime,
                    connections: serverStatus.connections,
                    memory: serverStatus.mem,
                    network: serverStatus.network
                }
            };
        } catch (error) {
            console.error('Error getting DB stats:', error);
            return null;
        }
    }

    // Memory usage optimization
    static optimizeMemoryUsage() {
        // Set mongoose options for better memory usage
        mongoose.set('strictQuery', true);
        
        // Disable automatic index creation in production
        if (process.env.NODE_ENV === 'production') {
            mongoose.set('autoIndex', false);
        }

        // Set buffer commands
        mongoose.set('bufferCommands', false);
        
        // Set buffer max entries
        mongoose.set('bufferMaxEntries', 0);
    }
}

module.exports = DatabaseOptimizer;