const EventEmitter = require('events');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const { appLogger, errorLogger, performanceLogger, securityLogger } = require('../middlewares/logger');

class ApplicationMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            metricsInterval: options.metricsInterval || 60000, // 1 minute
            alertThresholds: {
                errorRate: options.errorRateThreshold || 5, // 5%
                responseTime: options.responseTimeThreshold || 1000, // 1 second
                memoryUsage: options.memoryThreshold || 80, // 80%
                cpuUsage: options.cpuThreshold || 80, // 80%
                diskUsage: options.diskThreshold || 85, // 85%
                ...options.alertThresholds
            },
            retentionPeriod: options.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
            ...options
        };

        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                byEndpoint: new Map(),
                byStatusCode: new Map(),
                byUserAgent: new Map()
            },
            performance: {
                responseTimes: [],
                slowRequests: 0,
                averageResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0
            },
            errors: {
                total: 0,
                byType: new Map(),
                byEndpoint: new Map(),
                recent: []
            },
            system: {
                uptime: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                diskUsage: 0,
                activeConnections: 0
            },
            security: {
                blockedRequests: 0,
                rateLimitViolations: 0,
                authFailures: 0,
                suspiciousActivity: []
            }
        };

        this.alerts = [];
        this.activeAlerts = new Map();
        this.monitoringStarted = false;

        this.startMonitoring();
    }

    // Start all monitoring processes
    startMonitoring() {
        if (this.monitoringStarted) return;

        console.log('🔍 Starting application monitoring...');
        
        // Collect metrics periodically
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsInterval);

        // Check alerts periodically
        this.alertsInterval = setInterval(() => {
            this.checkAlerts();
        }, 30000); // Check every 30 seconds

        // Cleanup old data daily
        cron.schedule('0 0 * * *', () => {
            this.cleanupOldData();
        });

        // Generate daily reports
        cron.schedule('0 6 * * *', () => {
            this.generateDailyReport();
        });

        // Process monitoring events
        this.setupEventListeners();

        this.monitoringStarted = true;
        appLogger.info('Application monitoring started', {
            metricsInterval: this.config.metricsInterval,
            alertThresholds: this.config.alertThresholds
        });
    }

    // Stop monitoring
    stopMonitoring() {
        if (!this.monitoringStarted) return;

        if (this.metricsInterval) clearInterval(this.metricsInterval);
        if (this.alertsInterval) clearInterval(this.alertsInterval);
        
        this.monitoringStarted = false;
        console.log('🔍 Application monitoring stopped');
    }

    // Setup event listeners for monitoring
    setupEventListeners() {
        // Listen for request events
        this.on('request', (data) => {
            this.recordRequest(data);
        });

        // Listen for error events
        this.on('error', (error, context) => {
            this.recordError(error, context);
        });

        // Listen for performance events
        this.on('performance', (data) => {
            this.recordPerformance(data);
        });

        // Listen for security events
        this.on('security', (event) => {
            this.recordSecurityEvent(event);
        });
    }

    // Record request metrics
    recordRequest(data) {
        const { method, url, statusCode, responseTime, userAgent, success } = data;

        this.metrics.requests.total++;
        
        if (success) {
            this.metrics.requests.successful++;
        } else {
            this.metrics.requests.failed++;
        }

        // Track by endpoint
        const endpoint = `${method} ${url}`;
        const endpointCount = this.metrics.requests.byEndpoint.get(endpoint) || 0;
        this.metrics.requests.byEndpoint.set(endpoint, endpointCount + 1);

        // Track by status code
        const statusCount = this.metrics.requests.byStatusCode.get(statusCode) || 0;
        this.metrics.requests.byStatusCode.set(statusCode, statusCount + 1);

        // Track by user agent
        if (userAgent) {
            const uaCount = this.metrics.requests.byUserAgent.get(userAgent) || 0;
            this.metrics.requests.byUserAgent.set(userAgent, uaCount + 1);
        }

        // Record response time
        if (responseTime) {
            this.recordResponseTime(responseTime);
        }
    }

    // Record response time metrics
    recordResponseTime(responseTime) {
        this.metrics.performance.responseTimes.push({
            time: responseTime,
            timestamp: Date.now()
        });

        // Keep only recent response times (last hour)
        const oneHourAgo = Date.now() - 3600000;
        this.metrics.performance.responseTimes = this.metrics.performance.responseTimes
            .filter(rt => rt.timestamp > oneHourAgo);

        // Track slow requests
        if (responseTime > this.config.alertThresholds.responseTime) {
            this.metrics.performance.slowRequests++;
        }

        // Calculate averages and percentiles
        this.calculateResponseTimeMetrics();
    }

    // Calculate response time metrics
    calculateResponseTimeMetrics() {
        const times = this.metrics.performance.responseTimes.map(rt => rt.time);
        
        if (times.length === 0) return;

        // Average response time
        this.metrics.performance.averageResponseTime = 
            times.reduce((sum, time) => sum + time, 0) / times.length;

        // Percentiles
        const sorted = times.sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);
        
        this.metrics.performance.p95ResponseTime = sorted[p95Index] || 0;
        this.metrics.performance.p99ResponseTime = sorted[p99Index] || 0;
    }

    // Record error metrics
    recordError(error, context = {}) {
        this.metrics.errors.total++;

        // Track by error type
        const errorType = error.type || error.name || 'UnknownError';
        const typeCount = this.metrics.errors.byType.get(errorType) || 0;
        this.metrics.errors.byType.set(errorType, typeCount + 1);

        // Track by endpoint
        if (context.endpoint) {
            const endpointCount = this.metrics.errors.byEndpoint.get(context.endpoint) || 0;
            this.metrics.errors.byEndpoint.set(context.endpoint, endpointCount + 1);
        }

        // Keep recent errors for analysis
        this.metrics.errors.recent.push({
            error: {
                type: errorType,
                message: error.message,
                stack: error.stack
            },
            context,
            timestamp: Date.now()
        });

        // Keep only recent errors (last 24 hours)
        const oneDayAgo = Date.now() - 86400000;
        this.metrics.errors.recent = this.metrics.errors.recent
            .filter(err => err.timestamp > oneDayAgo);
    }

    // Record performance metrics
    recordPerformance(data) {
        const { operation, duration, memory, cpu } = data;

        if (duration) {
            this.recordResponseTime(duration);
        }

        if (memory) {
            this.metrics.system.memoryUsage = memory;
        }

        if (cpu) {
            this.metrics.system.cpuUsage = cpu;
        }

        // Log performance data
        performanceLogger.info('Performance Metric', {
            operation,
            duration: duration ? `${duration}ms` : undefined,
            memory: memory ? `${memory}%` : undefined,
            cpu: cpu ? `${cpu}%` : undefined,
            timestamp: new Date().toISOString()
        });
    }

    // Record security events
    recordSecurityEvent(event) {
        const { type, details, severity = 'medium' } = event;

        switch (type) {
            case 'blocked_request':
                this.metrics.security.blockedRequests++;
                break;
            case 'rate_limit_violation':
                this.metrics.security.rateLimitViolations++;
                break;
            case 'auth_failure':
                this.metrics.security.authFailures++;
                break;
        }

        // Track suspicious activity
        if (severity === 'high' || severity === 'critical') {
            this.metrics.security.suspiciousActivity.push({
                type,
                details,
                severity,
                timestamp: Date.now()
            });

            // Keep only recent suspicious activity (last 7 days)
            const weekAgo = Date.now() - 604800000;
            this.metrics.security.suspiciousActivity = this.metrics.security.suspiciousActivity
                .filter(activity => activity.timestamp > weekAgo);
        }

        securityLogger.warn('Security Event', {
            type,
            details,
            severity,
            timestamp: new Date().toISOString()
        });
    }

    // Collect system metrics
    async collectMetrics() {
        try {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();

            // Update system metrics
            this.metrics.system.uptime = Math.floor(process.uptime());
            this.metrics.system.memoryUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            
            // CPU usage calculation (simplified)
            const totalCpuTime = cpuUsage.user + cpuUsage.system;
            this.metrics.system.cpuUsage = (totalCpuTime / 1000000) / this.metrics.system.uptime * 100;

            // Emit performance event
            this.emit('performance', {
                operation: 'system_metrics',
                memory: this.metrics.system.memoryUsage,
                cpu: this.metrics.system.cpuUsage
            });

        } catch (error) {
            errorLogger.error('Failed to collect system metrics', { error: error.message });
        }
    }

    // Check for alert conditions
    checkAlerts() {
        const now = Date.now();
        const alerts = [];

        // Check error rate
        if (this.metrics.requests.total > 0) {
            const errorRate = (this.metrics.requests.failed / this.metrics.requests.total) * 100;
            if (errorRate > this.config.alertThresholds.errorRate) {
                alerts.push({
                    type: 'high_error_rate',
                    severity: 'high',
                    message: `High error rate detected: ${errorRate.toFixed(2)}%`,
                    value: errorRate,
                    threshold: this.config.alertThresholds.errorRate
                });
            }
        }

        // Check average response time
        if (this.metrics.performance.averageResponseTime > this.config.alertThresholds.responseTime) {
            alerts.push({
                type: 'slow_response_time',
                severity: 'medium',
                message: `Slow average response time: ${this.metrics.performance.averageResponseTime.toFixed(2)}ms`,
                value: this.metrics.performance.averageResponseTime,
                threshold: this.config.alertThresholds.responseTime
            });
        }

        // Check memory usage
        if (this.metrics.system.memoryUsage > this.config.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'high_memory_usage',
                severity: 'high',
                message: `High memory usage: ${this.metrics.system.memoryUsage.toFixed(2)}%`,
                value: this.metrics.system.memoryUsage,
                threshold: this.config.alertThresholds.memoryUsage
            });
        }

        // Check CPU usage
        if (this.metrics.system.cpuUsage > this.config.alertThresholds.cpuUsage) {
            alerts.push({
                type: 'high_cpu_usage',
                severity: 'high',
                message: `High CPU usage: ${this.metrics.system.cpuUsage.toFixed(2)}%`,
                value: this.metrics.system.cpuUsage,
                threshold: this.config.alertThresholds.cpuUsage
            });
        }

        // Process alerts
        for (const alert of alerts) {
            this.processAlert(alert, now);
        }
    }

    // Process individual alert
    processAlert(alert, timestamp) {
        const alertKey = `${alert.type}`;
        const existingAlert = this.activeAlerts.get(alertKey);

        // Check if this is a new alert or needs to be updated
        if (!existingAlert || existingAlert.value !== alert.value) {
            const alertData = {
                ...alert,
                timestamp,
                id: `alert_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
            };

            this.activeAlerts.set(alertKey, alertData);
            this.alerts.push(alertData);

            // Emit alert event
            this.emit('alert', alertData);

            // Log alert
            if (alert.severity === 'critical' || alert.severity === 'high') {
                errorLogger.error('Alert Triggered', alertData);
            } else {
                appLogger.warn('Alert Triggered', alertData);
            }
        }
    }

    // Get current metrics
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime())
        };
    }

    // Get alert summary
    getAlerts(limit = 50) {
        return {
            active: Array.from(this.activeAlerts.values()),
            recent: this.alerts.slice(-limit).reverse(),
            total: this.alerts.length
        };
    }

    // Clear specific alert
    clearAlert(alertType) {
        this.activeAlerts.delete(alertType);
        appLogger.info('Alert Cleared', { alertType });
    }

    // Clear all alerts
    clearAllAlerts() {
        this.activeAlerts.clear();
        appLogger.info('All alerts cleared');
    }

    // Generate daily report
    async generateDailyReport() {
        try {
            const report = {
                date: new Date().toISOString().split('T')[0],
                summary: {
                    totalRequests: this.metrics.requests.total,
                    successRate: this.metrics.requests.total > 0 ? 
                        ((this.metrics.requests.successful / this.metrics.requests.total) * 100).toFixed(2) + '%' : '0%',
                    averageResponseTime: this.metrics.performance.averageResponseTime.toFixed(2) + 'ms',
                    totalErrors: this.metrics.errors.total,
                    alertsTriggered: this.alerts.length
                },
                topEndpoints: this.getTopEndpoints(10),
                errorBreakdown: this.getErrorBreakdown(),
                performanceMetrics: {
                    p95ResponseTime: this.metrics.performance.p95ResponseTime + 'ms',
                    p99ResponseTime: this.metrics.performance.p99ResponseTime + 'ms',
                    slowRequests: this.metrics.performance.slowRequests
                },
                systemHealth: {
                    uptime: Math.floor(this.metrics.system.uptime / 3600) + ' hours',
                    memoryUsage: this.metrics.system.memoryUsage.toFixed(2) + '%',
                    cpuUsage: this.metrics.system.cpuUsage.toFixed(2) + '%'
                }
            };

            // Save report to file
            const reportsDir = path.join(__dirname, '../reports');
            await fs.mkdir(reportsDir, { recursive: true });
            
            const reportPath = path.join(reportsDir, `daily-report-${report.date}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

            appLogger.info('Daily Report Generated', { reportPath, summary: report.summary });

            return report;
        } catch (error) {
            errorLogger.error('Failed to generate daily report', { error: error.message });
        }
    }

    // Get top endpoints by request count
    getTopEndpoints(limit = 10) {
        return Array.from(this.metrics.requests.byEndpoint.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([endpoint, count]) => ({ endpoint, count }));
    }

    // Get error breakdown by type
    getErrorBreakdown() {
        return Array.from(this.metrics.errors.byType.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({ type, count }));
    }

    // Cleanup old data
    async cleanupOldData() {
        const cutoff = Date.now() - this.config.retentionPeriod;

        // Clean up old alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);

        // Clean up old response times
        this.metrics.performance.responseTimes = this.metrics.performance.responseTimes
            .filter(rt => rt.timestamp > cutoff);

        // Clean up old errors
        this.metrics.errors.recent = this.metrics.errors.recent
            .filter(err => err.timestamp > cutoff);

        appLogger.info('Old monitoring data cleaned up', { 
            cutoffDate: new Date(cutoff).toISOString() 
        });
    }
}

// Global monitoring instance
const applicationMonitor = new ApplicationMonitor();

// Export for use in other modules
module.exports = {
    ApplicationMonitor,
    applicationMonitor
};