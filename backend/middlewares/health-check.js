const mongoose = require('mongoose');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { performanceMonitor } = require('../utils/performance-monitor');
const { getCacheStats } = require('./cache');

// Health check status levels
const HealthStatus = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded', 
    UNHEALTHY: 'unhealthy',
    CRITICAL: 'critical'
};

// Individual health check functions
const healthChecks = {
    // Basic system health
    system: async () => {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const memoryUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        return {
            status: memoryUsedPercent > 90 ? HealthStatus.CRITICAL : 
                   memoryUsedPercent > 80 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
            details: {
                uptime: Math.floor(uptime),
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    percentage: Math.round(memoryUsedPercent)
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                loadAverage: os.loadavg(),
                nodeVersion: process.version,
                platform: process.platform
            }
        };
    },

    // Database connectivity
    database: async () => {
        try {
            const dbState = mongoose.connection.readyState;
            const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            
            if (dbState === 1) { // Connected
                // Test with a simple operation
                const startTime = Date.now();
                await mongoose.connection.db.admin().ping();
                const responseTime = Date.now() - startTime;
                
                const stats = await mongoose.connection.db.stats();
                
                return {
                    status: responseTime > 1000 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
                    details: {
                        state: stateNames[dbState],
                        responseTime: `${responseTime}ms`,
                        host: mongoose.connection.host,
                        port: mongoose.connection.port,
                        name: mongoose.connection.name,
                        collections: stats.collections,
                        objects: stats.objects,
                        dataSize: `${Math.round(stats.dataSize / 1024 / 1024)}MB`,
                        storageSize: `${Math.round(stats.storageSize / 1024 / 1024)}MB`
                    }
                };
            } else {
                return {
                    status: HealthStatus.CRITICAL,
                    details: {
                        state: stateNames[dbState] || 'unknown',
                        error: 'Database not connected'
                    }
                };
            }
        } catch (error) {
            return {
                status: HealthStatus.CRITICAL,
                details: {
                    error: error.message,
                    state: 'error'
                }
            };
        }
    },

    // Cache system health (Redis/Memory)
    cache: async () => {
        try {
            const stats = await getCacheStats();
            
            return {
                status: stats.connected ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                details: {
                    type: stats.type,
                    connected: stats.connected,
                    ...(stats.type === 'Memory' ? {
                        size: stats.size,
                        maxSize: stats.maxSize,
                        utilizationPercent: Math.round((stats.size / stats.maxSize) * 100)
                    } : {
                        memory: stats.memory,
                        keyspace: stats.keyspace
                    })
                }
            };
        } catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                details: {
                    error: error.message,
                    type: 'unknown'
                }
            };
        }
    },

    // Disk space check
    disk: async () => {
        try {
            const { stdout } = await exec('df -h .');
            const lines = stdout.trim().split('\n');
            const diskInfo = lines[1].split(/\s+/);
            
            const usedPercent = parseInt(diskInfo[4].replace('%', ''));
            
            return {
                status: usedPercent > 90 ? HealthStatus.CRITICAL :
                       usedPercent > 80 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
                details: {
                    total: diskInfo[1],
                    used: diskInfo[2],
                    available: diskInfo[3],
                    usedPercent: `${usedPercent}%`,
                    mountPoint: diskInfo[5]
                }
            };
        } catch (error) {
            // Fallback for systems where df command is not available
            try {
                const stats = await fs.stat('.');
                return {
                    status: HealthStatus.HEALTHY,
                    details: {
                        available: 'Unable to determine disk usage',
                        error: error.message
                    }
                };
            } catch (fallbackError) {
                return {
                    status: HealthStatus.UNHEALTHY,
                    details: {
                        error: fallbackError.message
                    }
                };
            }
        }
    },

    // External services health
    externalServices: async () => {
        const services = [];
        
        // Check OpenAI API if configured
        if (process.env.OPENAI_API_KEY) {
            try {
                const startTime = Date.now();
                // Simple request to check API availability
                const response = await fetch('https://api.openai.com/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });
                
                const responseTime = Date.now() - startTime;
                
                services.push({
                    name: 'OpenAI API',
                    status: response.ok ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                    responseTime: `${responseTime}ms`,
                    statusCode: response.status
                });
            } catch (error) {
                services.push({
                    name: 'OpenAI API',
                    status: HealthStatus.UNHEALTHY,
                    error: error.message
                });
            }
        }

        // Check Flask AI service
        const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
        try {
            const startTime = Date.now();
            const response = await fetch(`${flaskUrl}/health`, {
                timeout: 3000
            });
            const responseTime = Date.now() - startTime;
            
            services.push({
                name: 'Flask AI Service',
                status: response.ok ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                responseTime: `${responseTime}ms`,
                statusCode: response.status
            });
        } catch (error) {
            services.push({
                name: 'Flask AI Service',
                status: HealthStatus.UNHEALTHY,
                error: error.message
            });
        }

        // Determine overall external services status
        const criticalServices = services.filter(s => s.status === HealthStatus.CRITICAL).length;
        const unhealthyServices = services.filter(s => s.status === HealthStatus.UNHEALTHY).length;
        const degradedServices = services.filter(s => s.status === HealthStatus.DEGRADED).length;

        let overallStatus = HealthStatus.HEALTHY;
        if (criticalServices > 0) overallStatus = HealthStatus.CRITICAL;
        else if (unhealthyServices > 0) overallStatus = HealthStatus.UNHEALTHY;
        else if (degradedServices > 0) overallStatus = HealthStatus.DEGRADED;

        return {
            status: overallStatus,
            details: {
                services,
                summary: {
                    total: services.length,
                    healthy: services.filter(s => s.status === HealthStatus.HEALTHY).length,
                    degraded: degradedServices,
                    unhealthy: unhealthyServices,
                    critical: criticalServices
                }
            }
        };
    },

    // Application performance metrics
    performance: async () => {
        const metrics = performanceMonitor.getMetrics();
        
        const avgResponseTime = metrics.requests.averageResponseTime;
        const errorRate = metrics.requests.total > 0 ? 
            (metrics.requests.failed / metrics.requests.total) * 100 : 0;
        
        let status = HealthStatus.HEALTHY;
        if (errorRate > 10 || avgResponseTime > 2000) status = HealthStatus.CRITICAL;
        else if (errorRate > 5 || avgResponseTime > 1000) status = HealthStatus.DEGRADED;
        
        return {
            status,
            details: {
                requests: {
                    total: metrics.requests.total,
                    successful: metrics.requests.successful,
                    failed: metrics.requests.failed,
                    errorRate: `${errorRate.toFixed(2)}%`,
                    averageResponseTime: `${avgResponseTime.toFixed(2)}ms`
                },
                memory: metrics.memory,
                cpu: metrics.cpu,
                uptime: `${Math.floor(metrics.uptime)}s`
            }
        };
    }
};

// Run individual health check
const runHealthCheck = async (checkName) => {
    const startTime = Date.now();
    
    try {
        const result = await healthChecks[checkName]();
        const duration = Date.now() - startTime;
        
        return {
            ...result,
            checkName,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        
        return {
            status: HealthStatus.CRITICAL,
            checkName,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            details: {
                error: error.message,
                stack: error.stack
            }
        };
    }
};

// Run all health checks
const runAllHealthChecks = async () => {
    const startTime = Date.now();
    
    const checkPromises = Object.keys(healthChecks).map(checkName => 
        runHealthCheck(checkName)
    );
    
    const results = await Promise.allSettled(checkPromises);
    const totalDuration = Date.now() - startTime;
    
    const healthResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : {
            status: HealthStatus.CRITICAL,
            details: { error: result.reason.message }
        }
    );

    // Determine overall health status
    const criticalChecks = healthResults.filter(r => r.status === HealthStatus.CRITICAL).length;
    const unhealthyChecks = healthResults.filter(r => r.status === HealthStatus.UNHEALTHY).length;
    const degradedChecks = healthResults.filter(r => r.status === HealthStatus.DEGRADED).length;
    const healthyChecks = healthResults.filter(r => r.status === HealthStatus.HEALTHY).length;

    let overallStatus = HealthStatus.HEALTHY;
    if (criticalChecks > 0) overallStatus = HealthStatus.CRITICAL;
    else if (unhealthyChecks > 0) overallStatus = HealthStatus.UNHEALTHY;
    else if (degradedChecks > 0) overallStatus = HealthStatus.DEGRADED;

    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
        summary: {
            total: healthResults.length,
            healthy: healthyChecks,
            degraded: degradedChecks,
            unhealthy: unhealthyChecks,
            critical: criticalChecks
        },
        checks: healthResults.reduce((acc, result) => {
            acc[result.checkName] = result;
            return acc;
        }, {}),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };
};

// Basic health check endpoint
const basicHealthCheck = async (req, res) => {
    try {
        const health = await runHealthCheck('system');
        
        res.status(health.status === HealthStatus.HEALTHY ? 200 : 503).json({
            status: health.status,
            timestamp: health.timestamp,
            uptime: Math.floor(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: HealthStatus.CRITICAL,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Detailed health check endpoint
const detailedHealthCheck = async (req, res) => {
    try {
        const health = await runAllHealthChecks();
        
        const statusCode = health.status === HealthStatus.HEALTHY ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({
            status: HealthStatus.CRITICAL,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Liveness probe (for Kubernetes)
const livenessProbe = async (req, res) => {
    // Simple check to see if the application is running
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime())
    });
};

// Readiness probe (for Kubernetes)
const readinessProbe = async (req, res) => {
    try {
        // Check critical systems
        const dbHealth = await runHealthCheck('database');
        
        if (dbHealth.status === HealthStatus.CRITICAL) {
            return res.status(503).json({
                status: 'not ready',
                reason: 'Database not available',
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    // Health check functions
    runHealthCheck,
    runAllHealthChecks,
    
    // Express route handlers
    basicHealthCheck,
    detailedHealthCheck,
    livenessProbe,
    readinessProbe,
    
    // Constants
    HealthStatus,
    
    // Individual health checks (for testing)
    healthChecks
};