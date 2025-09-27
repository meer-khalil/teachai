/**
 * Example Integration: Using Error Handling & Monitoring System in Controllers
 * 
 * This file demonstrates how to integrate the comprehensive error handling
 * and monitoring system into existing TeachAI controllers.
 */

const asyncHandler = require('express-async-handler');
const { appLogger, errorLogger, performanceLogger } = require('../middlewares/logger');
const { applicationMonitor } = require('../utils/monitoring');
const { 
    AppError, 
    ValidationError, 
    AuthenticationError,
    createError,
    isOperationalError 
} = require('../utils/errors');

// Example: Enhanced User Controller with Error Handling
class EnhancedUserController {
    /**
     * Register User with comprehensive error handling and monitoring
     */
    static registerUser = asyncHandler(async (req, res, next) => {
        const startTime = Date.now();
        const { name, email, password } = req.body;

        try {
            // Log the registration attempt
            appLogger.info('User Registration Attempt', {
                email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                correlationId: req.correlationId
            });

            // Input validation with custom errors
            if (!name || !email || !password) {
                const validationErrors = [];
                if (!name) validationErrors.push({ field: 'name', message: 'Name is required' });
                if (!email) validationErrors.push({ field: 'email', message: 'Email is required' });
                if (!password) validationErrors.push({ field: 'password', message: 'Password is required' });
                
                throw new ValidationError('Registration validation failed', validationErrors);
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new ValidationError('Invalid email format', [
                    { field: 'email', message: 'Please provide a valid email address' }
                ]);
            }

            // Password strength validation
            if (password.length < 8) {
                throw new ValidationError('Weak password', [
                    { field: 'password', message: 'Password must be at least 8 characters long' }
                ]);
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new AppError('User already exists with this email', 409);
            }

            // Create user (this would be your existing user creation logic)
            const user = await User.create({ name, email, password });

            // Record performance metrics
            const duration = Date.now() - startTime;
            applicationMonitor.emit('performance', {
                operation: 'user_registration',
                duration,
                success: true
            });

            // Log successful registration
            appLogger.info('User Registration Successful', {
                userId: user._id,
                email: user.email,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Record error metrics
            applicationMonitor.emit('error', error, {
                operation: 'user_registration',
                endpoint: req.originalUrl,
                method: req.method,
                userId: req.user?.id,
                duration
            });

            // Log the error with context
            errorLogger.error('User Registration Failed', {
                error: error.message,
                stack: error.stack,
                email,
                ip: req.ip,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            // Pass error to global error handler
            next(error);
        }
    });

    /**
     * User Login with enhanced security logging
     */
    static loginUser = asyncHandler(async (req, res, next) => {
        const startTime = Date.now();
        const { email, password } = req.body;

        try {
            // Log login attempt
            appLogger.info('User Login Attempt', {
                email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                correlationId: req.correlationId
            });

            // Validation
            if (!email || !password) {
                // Record security event for invalid login attempt
                applicationMonitor.emit('security', {
                    type: 'auth_failure',
                    details: { reason: 'missing_credentials', email, ip: req.ip },
                    severity: 'medium'
                });

                throw new ValidationError('Email and password are required', [
                    { field: 'email', message: 'Email is required' },
                    { field: 'password', message: 'Password is required' }
                ]);
            }

            // Find user
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                applicationMonitor.emit('security', {
                    type: 'auth_failure',
                    details: { reason: 'user_not_found', email, ip: req.ip },
                    severity: 'medium'
                });

                throw new AuthenticationError('Invalid email or password');
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                applicationMonitor.emit('security', {
                    type: 'auth_failure',
                    details: { reason: 'invalid_password', email, ip: req.ip },
                    severity: 'high'
                });

                throw new AuthenticationError('Invalid email or password');
            }

            // Generate token (your existing JWT logic)
            const token = user.generateAuthToken();

            // Record successful login
            const duration = Date.now() - startTime;
            applicationMonitor.emit('performance', {
                operation: 'user_login',
                duration,
                success: true
            });

            appLogger.info('User Login Successful', {
                userId: user._id,
                email: user.email,
                ip: req.ip,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            
            applicationMonitor.emit('error', error, {
                operation: 'user_login',
                endpoint: req.originalUrl,
                method: req.method,
                email,
                duration
            });

            errorLogger.error('User Login Failed', {
                error: error.message,
                email,
                ip: req.ip,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            next(error);
        }
    });

    /**
     * Get User Profile with performance monitoring
     */
    static getUserProfile = asyncHandler(async (req, res, next) => {
        const startTime = Date.now();

        try {
            const userId = req.user.id;

            // Fetch user with performance tracking
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            const duration = Date.now() - startTime;
            
            // Record performance metrics
            applicationMonitor.emit('performance', {
                operation: 'get_user_profile',
                duration,
                success: true
            });

            performanceLogger.info('User Profile Retrieved', {
                userId,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            
            applicationMonitor.emit('error', error, {
                operation: 'get_user_profile',
                endpoint: req.originalUrl,
                method: req.method,
                userId: req.user?.id,
                duration
            });

            next(error);
        }
    });
}

// Example: Enhanced Chat Controller with AI Service Error Handling
class EnhancedChatController {
    /**
     * Process Chat with AI Service Error Handling
     */
    static processChatMessage = asyncHandler(async (req, res, next) => {
        const startTime = Date.now();
        const { message, chatbotType } = req.body;

        try {
            appLogger.info('Chat Message Processing Started', {
                userId: req.user.id,
                chatbotType,
                messageLength: message?.length,
                correlationId: req.correlationId
            });

            // Validation
            if (!message || !chatbotType) {
                throw new ValidationError('Message and chatbot type are required', [
                    { field: 'message', message: 'Message is required' },
                    { field: 'chatbotType', message: 'Chatbot type is required' }
                ]);
            }

            // Rate limiting check (example)
            const userUsage = await Usage.findOne({ userId: req.user.id });
            if (userUsage && userUsage.dailyRequests >= userUsage.dailyLimit) {
                applicationMonitor.emit('security', {
                    type: 'rate_limit_violation',
                    details: { userId: req.user.id, requests: userUsage.dailyRequests },
                    severity: 'medium'
                });

                throw new AppError('Daily message limit reached', 429);
            }

            // Call AI Service with error handling
            let aiResponse;
            try {
                // This would call your Flask AI service
                aiResponse = await callAIService(message, chatbotType, {
                    timeout: 30000, // 30 second timeout
                    retries: 2
                });
                
            } catch (aiError) {
                // Handle AI service specific errors
                if (aiError.code === 'TIMEOUT') {
                    throw new AppError('AI service timeout - please try again', 408);
                } else if (aiError.code === 'RATE_LIMIT') {
                    throw new AppError('AI service rate limit exceeded', 429);
                } else if (aiError.code === 'INVALID_INPUT') {
                    throw new ValidationError('Invalid message content', [
                        { field: 'message', message: 'Message content is not suitable for processing' }
                    ]);
                } else {
                    throw new AppError('AI service temporarily unavailable', 503);
                }
            }

            // Save chat history (your existing logic)
            const chatHistory = await ChatHistory.create({
                userId: req.user.id,
                message,
                response: aiResponse,
                chatbotType,
                timestamp: new Date()
            });

            // Update usage
            await Usage.findOneAndUpdate(
                { userId: req.user.id },
                { $inc: { dailyRequests: 1 } },
                { upsert: true }
            );

            const duration = Date.now() - startTime;

            applicationMonitor.emit('performance', {
                operation: 'chat_processing',
                duration,
                success: true,
                metadata: { chatbotType, responseLength: aiResponse?.length }
            });

            appLogger.info('Chat Message Processing Completed', {
                userId: req.user.id,
                chatHistoryId: chatHistory._id,
                chatbotType,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            res.status(200).json({
                success: true,
                response: aiResponse,
                chatId: chatHistory._id
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            
            applicationMonitor.emit('error', error, {
                operation: 'chat_processing',
                endpoint: req.originalUrl,
                method: req.method,
                userId: req.user?.id,
                chatbotType,
                duration
            });

            errorLogger.error('Chat Message Processing Failed', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                chatbotType,
                messageLength: message?.length,
                duration: `${duration}ms`,
                correlationId: req.correlationId
            });

            next(error);
        }
    });
}

// Mock AI Service Call with Error Handling
async function callAIService(message, chatbotType, options = {}) {
    const axios = require('axios');
    
    try {
        const response = await axios.post(`${process.env.FLASK_API_URL}/chat`, {
            message,
            chatbot_type: chatbotType
        }, {
            timeout: options.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FLASK_API_KEY}`
            }
        });

        return response.data.response;
        
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            const timeoutError = new Error('AI service timeout');
            timeoutError.code = 'TIMEOUT';
            throw timeoutError;
        }
        
        if (error.response?.status === 429) {
            const rateLimitError = new Error('Rate limit exceeded');
            rateLimitError.code = 'RATE_LIMIT';
            throw rateLimitError;
        }
        
        if (error.response?.status === 400) {
            const invalidInputError = new Error('Invalid input');
            invalidInputError.code = 'INVALID_INPUT';
            throw invalidInputError;
        }
        
        // Generic AI service error
        const serviceError = new Error('AI service error');
        serviceError.code = 'SERVICE_ERROR';
        serviceError.originalError = error;
        throw serviceError;
    }
}

// Example middleware for request correlation
const addCorrelationId = (req, res, next) => {
    req.correlationId = req.get('X-Correlation-ID') || 
                       `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.set('X-Correlation-ID', req.correlationId);
    next();
};

module.exports = {
    EnhancedUserController,
    EnhancedChatController,
    addCorrelationId
};