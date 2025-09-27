// Unit Tests for User Controller - TeachAI Backend
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');
const { registerUser, loginUser, getUserProfile, updateProfile } = require('../../controllers/userController');
const { protect } = require('../../middlewares/auth');

// Create test app
const app = express();
app.use(express.json());

// Mock middleware for tests that don't need authentication
const mockAuth = (req, res, next) => {
    req.user = { _id: 'testUserId', email: 'test@example.com' };
    next();
};

// Setup routes for testing
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', mockAuth, getUserProfile);
app.put('/api/auth/profile', mockAuth, updateProfile);

describe('User Controller Tests', () => {
    describe('POST /api/auth/register', () => {
        beforeEach(async () => {
            // Clear users before each test
            await User.deleteMany({});
        });

        test('should register a new user successfully', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'student'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.name).toBe(userData.name);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.role).toBe(userData.role);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();

            // Verify user was saved to database
            const savedUser = await User.findOne({ email: userData.email });
            expect(savedUser).toBeTruthy();
            expect(savedUser.name).toBe(userData.name);
        });

        test('should not register user with existing email', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123'
            };

            // Create user first
            await global.testUtils.createTestUser(userData);

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        test('should not register user with invalid email format', async () => {
            const userData = {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should not register user with weak password', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should not register user with missing required fields', async () => {
            const userData = {
                name: 'John Doe'
                // Missing email and password
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser;

        beforeEach(async () => {
            // Clear users before each test
            await User.deleteMany({});
            
            // Create test user
            testUser = await global.testUtils.createTestUser({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        });

        test('should login user with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();

            // Verify JWT token is valid
            const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET);
            expect(decoded.id).toBe(testUser._id.toString());
        });

        test('should not login with incorrect email', async () => {
            const loginData = {
                email: 'wrong@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid credentials');
        });

        test('should not login with incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid credentials');
        });

        test('should not login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let testUser;

        beforeEach(async () => {
            await User.deleteMany({});
            testUser = await global.testUtils.createTestUser();
        });

        test('should get user profile for authenticated user', async () => {
            // Mock the user in request
            app.get('/api/auth/profile-test', (req, res, next) => {
                req.user = testUser;
                next();
            }, getUserProfile);

            const response = await request(app)
                .get('/api/auth/profile-test')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.name).toBe(testUser.name);
            expect(response.body.data.user.password).toBeUndefined();
        });
    });

    describe('PUT /api/auth/profile', () => {
        let testUser;

        beforeEach(async () => {
            await User.deleteMany({});
            testUser = await global.testUtils.createTestUser();
        });

        test('should update user profile successfully', async () => {
            const updateData = {
                name: 'Updated Name',
                bio: 'Updated bio'
            };

            // Create route with actual user for update
            app.put('/api/auth/profile-test', (req, res, next) => {
                req.user = testUser;
                next();
            }, updateProfile);

            const response = await request(app)
                .put('/api/auth/profile-test')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.name).toBe(updateData.name);
            expect(response.body.data.user.bio).toBe(updateData.bio);

            // Verify update in database
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.name).toBe(updateData.name);
            expect(updatedUser.bio).toBe(updateData.bio);
        });

        test('should not update email to existing user email', async () => {
            // Create another user
            const otherUser = await global.testUtils.createTestUser({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123'
            });

            const updateData = {
                email: 'other@example.com'
            };

            app.put('/api/auth/profile-test-2', (req, res, next) => {
                req.user = testUser;
                next();
            }, updateProfile);

            const response = await request(app)
                .put('/api/auth/profile-test-2')
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        test('should not update with invalid email format', async () => {
            const updateData = {
                email: 'invalid-email'
            };

            app.put('/api/auth/profile-test-3', (req, res, next) => {
                req.user = testUser;
                next();
            }, updateProfile);

            const response = await request(app)
                .put('/api/auth/profile-test-3')
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Password Security', () => {
        test('should hash password before saving', async () => {
            const userData = {
                name: 'Security Test',
                email: 'security@example.com',
                password: 'password123'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const savedUser = await User.findOne({ email: userData.email });
            expect(savedUser.password).not.toBe(userData.password);
            expect(savedUser.password.length).toBeGreaterThan(50); // Hashed password length

            // Verify password can be verified
            const isMatch = await bcrypt.compare(userData.password, savedUser.password);
            expect(isMatch).toBe(true);
        });
    });

    describe('JWT Token Validation', () => {
        test('should generate valid JWT token on login', async () => {
            const testUser = await global.testUtils.createTestUser();
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'password123'
                })
                .expect(200);

            const token = response.body.data.token;
            expect(token).toBeDefined();

            // Verify token structure and content
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded.id).toBe(testUser._id.toString());
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeDefined();
        });
    });
});