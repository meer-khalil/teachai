const request = require('supertest');
const express = require('express');
const { jest } = require('@jest/globals');

// Mock the monitoring and logging modules
jest.mock('../middlewares/logger');
jest.mock('../utils/monitoring');
jest.mock('../config/database');

const app = require('../app');

describe('Error Handling Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Health Check Endpoints', () => {
        test('GET /health should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('checks');
        });

        test('GET /api/v1/health should return detailed health status', async () => {
            const response = await request(app)
                .get('/api/v1/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('checks');
            expect(response.body.checks).toHaveProperty('system');
            expect(response.body.checks).toHaveProperty('database');
        });
    });

    describe('Monitoring Endpoints', () => {
        test('GET /api/v1/monitoring/metrics should return metrics', async () => {
            const response = await request(app)
                .get('/api/v1/monitoring/metrics')
                .expect(200);

            expect(response.body).toHaveProperty('requests');
            expect(response.body).toHaveProperty('performance');
            expect(response.body).toHaveProperty('errors');
            expect(response.body).toHaveProperty('system');
        });

        test('GET /api/v1/monitoring/alerts should return alerts', async () => {
            const response = await request(app)
                .get('/api/v1/monitoring/alerts')
                .expect(200);

            expect(response.body).toHaveProperty('active');
            expect(response.body).toHaveProperty('recent');
            expect(response.body).toHaveProperty('total');
        });
    });

    describe('Error Handling Middleware', () => {
        test('should handle 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/v1/non-existent-route')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('not found');
        });

        test('should handle application errors gracefully', async () => {
            // This would test a route that intentionally throws an error
            // You would need to create such a route for testing purposes
            
            const testApp = express();
            testApp.get('/test-error', (req, res, next) => {
                const error = new Error('Test error');
                error.statusCode = 400;
                next(error);
            });

            // Import error middleware
            const { errorHandler } = require('../middlewares/error-handler');
            testApp.use(errorHandler);

            const response = await request(testApp)
                .get('/test-error')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Request Logging and Monitoring', () => {
        test('should log and monitor successful requests', async () => {
            const { applicationMonitor } = require('../utils/monitoring');
            
            await request(app)
                .get('/health')
                .expect(200);

            // Verify that the monitoring system was called
            expect(applicationMonitor.emit).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    method: 'GET',
                    url: '/health',
                    statusCode: 200,
                    success: true
                })
            );
        });

        test('should log and monitor failed requests', async () => {
            const { applicationMonitor } = require('../utils/monitoring');
            
            await request(app)
                .get('/api/v1/non-existent-route')
                .expect(404);

            // Verify that the monitoring system was called for failed request
            expect(applicationMonitor.emit).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    method: 'GET',
                    statusCode: 404,
                    success: false
                })
            );
        });
    });

    describe('Request Validation', () => {
        test('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/api/v1/test-endpoint')
                .send('invalid json')
                .set('Content-Type', 'application/json')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        test('should handle oversized requests', async () => {
            const largeData = 'x'.repeat(50 * 1024 * 1024); // 50MB string
            
            const response = await request(app)
                .post('/api/v1/test-endpoint')
                .send({ data: largeData })
                .expect(413);

            expect(response.body).toHaveProperty('success', false);
        });
    });
});

describe('Error Utility Functions', () => {
    const { 
        AppError, 
        ValidationError, 
        AuthenticationError,
        createError,
        isOperationalError 
    } = require('../utils/errors');

    describe('Custom Error Classes', () => {
        test('AppError should create proper error instance', () => {
            const error = new AppError('Test error', 400);
            
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
            expect(error.name).toBe('AppError');
        });

        test('ValidationError should create proper validation error', () => {
            const error = new ValidationError('Invalid input', [
                { field: 'email', message: 'Email is required' }
            ]);
            
            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.validationErrors).toHaveLength(1);
            expect(error.name).toBe('ValidationError');
        });

        test('AuthenticationError should create proper auth error', () => {
            const error = new AuthenticationError('Unauthorized access');
            
            expect(error.message).toBe('Unauthorized access');
            expect(error.statusCode).toBe(401);
            expect(error.name).toBe('AuthenticationError');
        });
    });

    describe('Error Factory Functions', () => {
        test('createError should create appropriate error type', () => {
            const validationError = createError('validation', 'Validation failed');
            expect(validationError).toBeInstanceOf(ValidationError);

            const authError = createError('authentication', 'Auth failed');
            expect(authError).toBeInstanceOf(AuthenticationError);

            const genericError = createError('generic', 'Generic error', 500);
            expect(genericError).toBeInstanceOf(AppError);
            expect(genericError.statusCode).toBe(500);
        });

        test('isOperationalError should identify operational errors', () => {
            const operationalError = new AppError('Operational error', 400);
            const systemError = new Error('System error');

            expect(isOperationalError(operationalError)).toBe(true);
            expect(isOperationalError(systemError)).toBe(false);
        });
    });
});

describe('Monitoring System', () => {
    const { ApplicationMonitor } = require('../utils/monitoring');
    
    let monitor;
    
    beforeEach(() => {
        monitor = new ApplicationMonitor({
            metricsInterval: 100, // Short interval for testing
            alertThresholds: {
                errorRate: 10,
                responseTime: 500,
                memoryUsage: 90,
                cpuUsage: 90
            }
        });
    });
    
    afterEach(() => {
        if (monitor) {
            monitor.stopMonitoring();
        }
    });

    test('should record request metrics correctly', () => {
        const requestData = {
            method: 'GET',
            url: '/test',
            statusCode: 200,
            responseTime: 150,
            success: true
        };

        monitor.recordRequest(requestData);

        const metrics = monitor.getMetrics();
        expect(metrics.requests.total).toBe(1);
        expect(metrics.requests.successful).toBe(1);
        expect(metrics.requests.failed).toBe(0);
    });

    test('should record error metrics correctly', () => {
        const error = new Error('Test error');
        error.type = 'ValidationError';
        
        monitor.recordError(error, { endpoint: '/test' });

        const metrics = monitor.getMetrics();
        expect(metrics.errors.total).toBe(1);
        expect(metrics.errors.byType.get('ValidationError')).toBe(1);
    });

    test('should record performance metrics correctly', () => {
        const perfData = {
            operation: 'database_query',
            duration: 250,
            memory: 75,
            cpu: 45
        };

        monitor.recordPerformance(perfData);

        const metrics = monitor.getMetrics();
        expect(metrics.system.memoryUsage).toBe(75);
        expect(metrics.system.cpuUsage).toBe(45);
    });

    test('should generate alerts when thresholds are exceeded', (done) => {
        monitor.on('alert', (alert) => {
            expect(alert).toHaveProperty('type');
            expect(alert).toHaveProperty('severity');
            expect(alert).toHaveProperty('message');
            done();
        });

        // Simulate high memory usage
        monitor.recordPerformance({
            operation: 'memory_test',
            memory: 95 // Exceeds threshold of 90%
        });

        // Trigger alert check
        monitor.checkAlerts();
    });

    test('should calculate response time percentiles correctly', () => {
        // Add multiple response times
        const responseTimes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
        
        responseTimes.forEach(time => {
            monitor.recordResponseTime(time);
        });

        const metrics = monitor.getMetrics();
        expect(metrics.performance.averageResponseTime).toBe(550);
        expect(metrics.performance.p95ResponseTime).toBeGreaterThan(0);
        expect(metrics.performance.p99ResponseTime).toBeGreaterThan(0);
    });
});