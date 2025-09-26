const responseTime = require('response-time');
const os = require('os');
const process = require('process');
const { performance } = require('perf_hooks');

// Performance monitoring class
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                averageResponseTime: 0,
                slowRequests: 0
            },
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0
            },
            cpu: {
                usage: 0,
                loadAverage: []
            },
            database: {
                connections: 0,
                queries: 0,
                slowQueries: 0,
                averageQueryTime: 0
            },
            cache: {
                hits: 0,
                misses: 0,
                hitRate: 0
            }
        };
        
        this.responseTimeHistory = [];
        this.maxHistorySize = 1000;
        this.slowRequestThreshold = 1000; // 1 second
        
        // Start monitoring intervals
        this.startMonitoring();
    }

    // Response time middleware
    createResponseTimeMiddleware() {
        return responseTime((req, res, time) => {
            this.recordRequestMetrics(req, res, time);
        });
    }

    // Record request metrics
    recordRequestMetrics(req, res, responseTime) {
        this.metrics.requests.total++;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
            this.metrics.requests.successful++;
        } else {
            this.metrics.requests.failed++;
        }

        // Track slow requests
        if (responseTime > this.slowRequestThreshold) {
            this.metrics.requests.slowRequests++;
            console.warn(`🐌 Slow request: ${req.method} ${req.url} - ${responseTime}ms`);
        }

        // Update response time history
        this.responseTimeHistory.push({
            time: Date.now(),
            responseTime,
            method: req.method,
            url: req.url,
            status: res.statusCode
        });

        // Keep history size manageable
        if (this.responseTimeHistory.length > this.maxHistorySize) {
            this.responseTimeHistory.shift();
        }

        // Calculate average response time
        this.metrics.requests.averageResponseTime = 
            this.responseTimeHistory.reduce((sum, record) => sum + record.responseTime, 0) / 
            this.responseTimeHistory.length;
    }

    // Request performance tracking middleware
    createPerformanceTrackingMiddleware() {
        return (req, res, next) => {
            const startTime = performance.now();
            req.startTime = startTime;

            // Track memory usage at request start
            const startMemory = process.memoryUsage();
            req.startMemory = startMemory;

            // Override res.end to capture final metrics
            const originalEnd = res.end;
            res.end = (...args) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                const endMemory = process.memoryUsage();

                // Log detailed performance info for slow requests
                if (duration > this.slowRequestThreshold) {
                    console.log(`📊 Request Performance Details:`, {
                        method: req.method,
                        url: req.url,
                        duration: `${duration.toFixed(2)}ms`,
                        memoryIncrease: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`,
                        statusCode: res.statusCode
                    });
                }

                originalEnd.apply(res, args);
            };

            next();
        };
    }

    // Memory monitoring
    updateMemoryMetrics() {
        const memoryUsage = process.memoryUsage();
        this.metrics.memory = {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
        };

        // Log memory warnings
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        if (memoryUsagePercent > 90) {
            console.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
        }
    }

    // CPU monitoring
    updateCPUMetrics() {
        this.metrics.cpu.loadAverage = os.loadavg();
        
        // Calculate CPU usage (simplified)
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        this.metrics.cpu.usage = Math.round(cpuUsage);

        if (cpuUsage > 80) {
            console.warn(`⚠️ High CPU usage: ${cpuUsage.toFixed(1)}%`);
        }
    }

    // Database metrics (to be called from database operations)
    recordDatabaseMetrics(operationType, duration, success = true) {
        this.metrics.database.queries++;
        
        if (duration > 100) { // 100ms threshold for slow queries
            this.metrics.database.slowQueries++;
        }

        // Calculate average query time
        if (this.metrics.database.queries > 0) {
            this.metrics.database.averageQueryTime = 
                (this.metrics.database.averageQueryTime * (this.metrics.database.queries - 1) + duration) / 
                this.metrics.database.queries;
        }
    }

    // Cache metrics (to be called from cache operations)
    recordCacheMetrics(isHit) {
        if (isHit) {
            this.metrics.cache.hits++;
        } else {
            this.metrics.cache.misses++;
        }

        const totalCacheRequests = this.metrics.cache.hits + this.metrics.cache.misses;
        if (totalCacheRequests > 0) {
            this.metrics.cache.hitRate = (this.metrics.cache.hits / totalCacheRequests * 100).toFixed(2);
        }
    }

    // Start monitoring intervals
    startMonitoring() {
        // Update system metrics every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.updateMemoryMetrics();
            this.updateCPUMetrics();
        }, 30000);

        // Log performance summary every 5 minutes
        this.summaryInterval = setInterval(() => {
            this.logPerformanceSummary();
        }, 300000);
    }

    // Stop monitoring
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.summaryInterval) {
            clearInterval(this.summaryInterval);
        }
    }

    // Log performance summary
    logPerformanceSummary() {
        console.log('📊 Performance Summary:', {
            requests: this.metrics.requests,
            memory: this.metrics.memory,
            cpu: this.metrics.cpu,
            database: this.metrics.database,
            cache: this.metrics.cache
        });
    }

    // Get current metrics
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            nodejs: {
                version: process.version,
                platform: process.platform,
                arch: process.arch
            },
            system: {
                totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
                freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
                cpuCores: os.cpus().length,
                osType: os.type(),
                osRelease: os.release()
            }
        };
    }

    // Get performance insights
    getPerformanceInsights() {
        const insights = [];
        const metrics = this.getMetrics();

        // Memory insights
        const memoryUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
        if (memoryUsagePercent > 80) {
            insights.push({
                type: 'warning',
                category: 'memory',
                message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
                recommendation: 'Consider implementing memory optimization or increasing available memory'
            });
        }

        // Response time insights
        if (metrics.requests.averageResponseTime > 500) {
            insights.push({
                type: 'warning',
                category: 'response_time',
                message: `High average response time: ${metrics.requests.averageResponseTime.toFixed(1)}ms`,
                recommendation: 'Implement caching, optimize database queries, or review slow endpoints'
            });
        }

        // Error rate insights
        const errorRate = (metrics.requests.failed / metrics.requests.total) * 100;
        if (errorRate > 5) {
            insights.push({
                type: 'error',
                category: 'error_rate',
                message: `High error rate: ${errorRate.toFixed(1)}%`,
                recommendation: 'Review error logs and implement better error handling'
            });
        }

        // Cache performance insights
        if (metrics.cache.hitRate < 60) {
            insights.push({
                type: 'info',
                category: 'cache',
                message: `Low cache hit rate: ${metrics.cache.hitRate}%`,
                recommendation: 'Review caching strategy and TTL settings'
            });
        }

        // Database performance insights
        if (metrics.database.averageQueryTime > 100) {
            insights.push({
                type: 'warning',
                category: 'database',
                message: `Slow database queries: ${metrics.database.averageQueryTime.toFixed(1)}ms average`,
                recommendation: 'Optimize database queries and ensure proper indexing'
            });
        }

        return insights;
    }

    // Health check endpoint data
    getHealthCheck() {
        const metrics = this.getMetrics();
        const insights = this.getPerformanceInsights();
        
        const hasErrors = insights.some(insight => insight.type === 'error');
        const hasWarnings = insights.some(insight => insight.type === 'warning');
        
        let status = 'healthy';
        if (hasErrors) {
            status = 'unhealthy';
        } else if (hasWarnings) {
            status = 'degraded';
        }

        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: metrics.uptime,
            metrics: {
                requests: metrics.requests.total,
                averageResponseTime: metrics.requests.averageResponseTime,
                memoryUsage: `${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB`,
                cpuUsage: `${metrics.cpu.usage}%`,
                cacheHitRate: `${metrics.cache.hitRate}%`
            },
            insights: insights.length > 0 ? insights : undefined
        };
    }

    // Reset metrics
    resetMetrics() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                averageResponseTime: 0,
                slowRequests: 0
            },
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0
            },
            cpu: {
                usage: 0,
                loadAverage: []
            },
            database: {
                connections: 0,
                queries: 0,
                slowQueries: 0,
                averageQueryTime: 0
            },
            cache: {
                hits: 0,
                misses: 0,
                hitRate: 0
            }
        };
        this.responseTimeHistory = [];
        console.log('📊 Performance metrics reset');
    }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = {
    PerformanceMonitor,
    performanceMonitor
};