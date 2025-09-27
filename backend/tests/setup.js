// Jest Test Setup Configuration for TeachAI Backend
// This file runs before all tests and sets up the testing environment

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis-mock');

// Global test configuration
global.testTimeout = 30000;

// Mock external services
jest.mock('redis', () => require('redis-mock'));
jest.mock('cloudinary');
jest.mock('stripe');
jest.mock('nodemailer');

// Mock Winston logger for tests
jest.mock('../middlewares/logger', () => ({
    appLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    errorLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    performanceLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    securityLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    requestLogger: jest.fn((req, res, next) => next()),
    requestTimer: jest.fn((req, res, next) => next())
}));

// Mock monitoring system
jest.mock('../utils/monitoring', () => ({
    applicationMonitor: {
        emit: jest.fn(),
        getMetrics: jest.fn(() => ({
            requests: { total: 0, successful: 0, failed: 0 },
            performance: { averageResponseTime: 0 },
            errors: { total: 0 },
            system: { uptime: 0 }
        })),
        getAlerts: jest.fn(() => ({
            active: [],
            recent: [],
            total: 0
        }))
    }
}));

// Global test variables
let mongoServer;
let mongoUri;

// Setup before all tests
beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
    process.env.JWT_EXPIRE = '1h';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
}, 60000);

// Cleanup after all tests
afterAll(async () => {
    if (mongoServer) {
        await mongoose.disconnect();
        await mongoServer.stop();
    }
}, 60000);

// Setup before each test
beforeEach(async () => {
    // Clear all mock calls
    jest.clearAllMocks();
    
    // Reset mongoose connection state
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
    }
});

// Cleanup after each test
afterEach(async () => {
    // Clear all collections
    if (mongoose.connection.readyState === 1) {
        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    }
    
    // Clear timers
    jest.clearAllTimers();
});

// Global test utilities
global.testUtils = {
    // Create test user
    createTestUser: async (overrides = {}) => {
        const User = require('../models/userModel');
        const defaultUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            ...overrides
        };
        return await User.create(defaultUser);
    },
    
    // Create test JWT token
    createTestToken: (userId) => {
        const jwt = require('jsonwebtoken');
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });
    },
    
    // Mock authentication middleware
    mockAuthUser: (user) => {
        return (req, res, next) => {
            req.user = user;
            next();
        };
    },
    
    // Create test request with auth
    createAuthenticatedRequest: async (app, user) => {
        const token = global.testUtils.createTestToken(user._id);
        return request(app).set('Authorization', `Bearer ${token}`);
    },
    
    // Wait for async operations
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Mock external API responses
    mockExternalAPI: (url, response) => {
        const nock = require('nock');
        return nock(url).persist().get(() => true).reply(200, response);
    }
};

// Error handling for unhandled promises in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress console logs during tests unless NODE_ENV is 'test-verbose'
if (process.env.NODE_ENV === 'test' && process.env.NODE_ENV !== 'test-verbose') {
    global.console = {
        ...console,
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };
}

console.log('🧪 Test environment setup complete');