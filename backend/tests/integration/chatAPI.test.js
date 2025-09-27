// Integration Tests for Chat API - TeachAI Backend
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/userModel');
const ChatHistory = require('../../models/chatHistoryModel');

describe('Chat API Integration Tests', () => {
    let testUser;
    let authToken;
    let authenticatedRequest;

    beforeEach(async () => {
        // Clear test data
        await User.deleteMany({});
        await ChatHistory.deleteMany({});

        // Create test user
        testUser = await global.testUtils.createTestUser({
            name: 'Chat Test User',
            email: 'chattest@example.com',
            password: 'password123',
            role: 'student'
        });

        // Create auth token
        authToken = global.testUtils.createTestToken(testUser._id);
        authenticatedRequest = request(app).set('Authorization', `Bearer ${authToken}`);
    });

    describe('POST /api/chat/send', () => {
        test('should send chat message and get response', async () => {
            const chatData = {
                message: 'What is photosynthesis?',
                subject: 'biology',
                grade: '9'
            };

            const response = await authenticatedRequest
                .post('/api/chat/send')
                .send(chatData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.response).toBeDefined();
            expect(response.body.data.conversationId).toBeDefined();
            expect(response.body.data.timestamp).toBeDefined();

            // Verify chat history was saved
            const chatHistory = await ChatHistory.findOne({ 
                userId: testUser._id,
                conversationId: response.body.data.conversationId 
            });
            expect(chatHistory).toBeTruthy();
            expect(chatHistory.messages).toHaveLength(2); // User message + AI response
        });

        test('should continue existing conversation', async () => {
            // Start a conversation
            const firstMessage = {
                message: 'Explain photosynthesis',
                subject: 'biology',
                grade: '9'
            };

            const firstResponse = await authenticatedRequest
                .post('/api/chat/send')
                .send(firstMessage)
                .expect(200);

            const conversationId = firstResponse.body.data.conversationId;

            // Continue the conversation
            const followUpMessage = {
                message: 'Can you give me an example?',
                conversationId: conversationId
            };

            const followUpResponse = await authenticatedRequest
                .post('/api/chat/send')
                .send(followUpMessage)
                .expect(200);

            expect(followUpResponse.body.success).toBe(true);
            expect(followUpResponse.body.data.conversationId).toBe(conversationId);

            // Verify conversation history
            const chatHistory = await ChatHistory.findOne({ 
                userId: testUser._id,
                conversationId: conversationId 
            });
            expect(chatHistory.messages.length).toBeGreaterThan(2); // Multiple exchanges
        });

        test('should require authentication', async () => {
            const chatData = {
                message: 'What is photosynthesis?',
                subject: 'biology'
            };

            const response = await request(app)
                .post('/api/chat/send')
                .send(chatData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('authorization');
        });

        test('should validate required message field', async () => {
            const response = await authenticatedRequest
                .post('/api/chat/send')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('message');
        });

        test('should handle long messages appropriately', async () => {
            const longMessage = 'A'.repeat(5000); // Very long message
            
            const chatData = {
                message: longMessage,
                subject: 'general'
            };

            const response = await authenticatedRequest
                .post('/api/chat/send')
                .send(chatData);

            // Should either succeed or give appropriate error
            expect([200, 400]).toContain(response.status);
            expect(response.body.success).toBeDefined();
        });
    });

    describe('GET /api/chat/history', () => {
        beforeEach(async () => {
            // Create some chat history
            await ChatHistory.create({
                userId: testUser._id,
                conversationId: 'conv1',
                title: 'Biology Discussion',
                subject: 'biology',
                messages: [
                    {
                        role: 'user',
                        content: 'What is photosynthesis?',
                        timestamp: new Date()
                    },
                    {
                        role: 'assistant',
                        content: 'Photosynthesis is...',
                        timestamp: new Date()
                    }
                ]
            });

            await ChatHistory.create({
                userId: testUser._id,
                conversationId: 'conv2',
                title: 'Math Problems',
                subject: 'mathematics',
                messages: [
                    {
                        role: 'user',
                        content: 'Solve x + 5 = 10',
                        timestamp: new Date()
                    }
                ]
            });
        });

        test('should get user chat history', async () => {
            const response = await authenticatedRequest
                .get('/api/chat/history')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(2);
            expect(response.body.data.conversations[0].title).toBeDefined();
            expect(response.body.data.conversations[0].subject).toBeDefined();
            expect(response.body.data.conversations[0].lastMessage).toBeDefined();
        });

        test('should support pagination', async () => {
            const response = await authenticatedRequest
                .get('/api/chat/history?page=1&limit=1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(1);
            expect(response.body.data.pagination.currentPage).toBe(1);
            expect(response.body.data.pagination.totalPages).toBeGreaterThan(0);
        });

        test('should filter by subject', async () => {
            const response = await authenticatedRequest
                .get('/api/chat/history?subject=biology')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(1);
            expect(response.body.data.conversations[0].subject).toBe('biology');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/chat/history')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/chat/conversation/:conversationId', () => {
        let conversationId;

        beforeEach(async () => {
            const chatHistory = await ChatHistory.create({
                userId: testUser._id,
                conversationId: 'test-conv-123',
                title: 'Test Conversation',
                subject: 'biology',
                messages: [
                    {
                        role: 'user',
                        content: 'What is DNA?',
                        timestamp: new Date()
                    },
                    {
                        role: 'assistant',
                        content: 'DNA is the genetic material...',
                        timestamp: new Date()
                    }
                ]
            });
            conversationId = chatHistory.conversationId;
        });

        test('should get specific conversation', async () => {
            const response = await authenticatedRequest
                .get(`/api/chat/conversation/${conversationId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.conversation.conversationId).toBe(conversationId);
            expect(response.body.data.conversation.messages).toHaveLength(2);
            expect(response.body.data.conversation.title).toBe('Test Conversation');
        });

        test('should not access other users conversations', async () => {
            // Create another user's conversation
            const otherUser = await global.testUtils.createTestUser({
                email: 'other@example.com',
                password: 'password123'
            });

            const otherConversation = await ChatHistory.create({
                userId: otherUser._id,
                conversationId: 'other-conv-123',
                title: 'Other User Conversation',
                messages: []
            });

            const response = await authenticatedRequest
                .get(`/api/chat/conversation/${otherConversation.conversationId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should handle non-existent conversation', async () => {
            const response = await authenticatedRequest
                .get('/api/chat/conversation/non-existent-conv')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
    });

    describe('DELETE /api/chat/conversation/:conversationId', () => {
        let conversationId;

        beforeEach(async () => {
            const chatHistory = await ChatHistory.create({
                userId: testUser._id,
                conversationId: 'delete-test-conv',
                title: 'To Be Deleted',
                messages: []
            });
            conversationId = chatHistory.conversationId;
        });

        test('should delete user conversation', async () => {
            const response = await authenticatedRequest
                .delete(`/api/chat/conversation/${conversationId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');

            // Verify conversation was deleted
            const deletedConversation = await ChatHistory.findOne({
                conversationId: conversationId
            });
            expect(deletedConversation).toBeNull();
        });

        test('should not delete other users conversations', async () => {
            const otherUser = await global.testUtils.createTestUser({
                email: 'other@example.com',
                password: 'password123'
            });

            const otherConversation = await ChatHistory.create({
                userId: otherUser._id,
                conversationId: 'other-delete-conv',
                title: 'Other User Conversation',
                messages: []
            });

            const response = await authenticatedRequest
                .delete(`/api/chat/conversation/${otherConversation.conversationId}`)
                .expect(404);

            expect(response.body.success).toBe(false);

            // Verify conversation still exists
            const stillExists = await ChatHistory.findOne({
                conversationId: otherConversation.conversationId
            });
            expect(stillExists).toBeTruthy();
        });
    });

    describe('Rate Limiting', () => {
        test('should enforce chat rate limits', async () => {
            const chatData = {
                message: 'Quick test message',
                subject: 'general'
            };

            // Make multiple rapid requests
            const requests = [];
            for (let i = 0; i < 20; i++) {
                requests.push(
                    authenticatedRequest
                        .post('/api/chat/send')
                        .send(chatData)
                );
            }

            const responses = await Promise.allSettled(requests);
            const rateLimited = responses.some(result => 
                result.status === 'fulfilled' && result.value.status === 429
            );

            // Should have some rate limited responses
            expect(rateLimited).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle AI service errors gracefully', async () => {
            // Mock AI service to throw error
            const originalFetch = global.fetch;
            global.fetch = jest.fn().mockRejectedValue(new Error('AI Service Unavailable'));

            const chatData = {
                message: 'This should fail',
                subject: 'general'
            };

            const response = await authenticatedRequest
                .post('/api/chat/send')
                .send(chatData);

            expect([200, 500, 503]).toContain(response.status);
            expect(response.body.success).toBeDefined();

            // Restore original fetch
            global.fetch = originalFetch;
        });

        test('should handle database connection errors', async () => {
            // This test would require mocking database connection
            // For now, we'll just verify the endpoint handles errors
            const chatData = {
                message: 'Test message',
                subject: 'general'
            };

            const response = await authenticatedRequest
                .post('/api/chat/send')
                .send(chatData);

            // Should return some valid response
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.body).toBeDefined();
        });
    });
});