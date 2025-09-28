import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 50 },   // Normal load
    { duration: '2m', target: 100 },  // Peak load
    { duration: '5m', target: 100 },  // Stay at peak
    { duration: '2m', target: 50 },   // Scale down
    { duration: '3m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    error_rate: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/v1`;

// Test data
const users = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

function getRandomUser() {
  return users[Math.floor(Math.random() * users.length)];
}

export function setup() {
  console.log('Starting performance test against:', BASE_URL);
  
  // Test health endpoint
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'Health check passes': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL, apiUrl: API_URL };
}

export default function(data) {
  // Health check
  healthCheck();
  
  // Authentication flow
  const authToken = authenticate();
  
  if (authToken) {
    // API endpoints testing
    testDashboard(authToken);
    testChatbot(authToken);
    testFileUpload(authToken);
    testAnalytics(authToken);
  }
  
  // Static content
  testStaticContent();
  
  sleep(1); // Think time
}

function healthCheck() {
  const response = http.get(`${BASE_URL}/health`);
  const success = check(response, {
    'Health check status': (r) => r.status === 200,
    'Health check response time': (r) => r.timings.duration < 100,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function authenticate() {
  const user = getRandomUser();
  
  // Login attempt
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const loginSuccess = check(loginResponse, {
    'Login status': (r) => r.status === 200,
    'Login response time': (r) => r.timings.duration < 1000,
    'Login has token': (r) => r.json('token') !== undefined,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
    return null;
  }
  
  return loginResponse.json('token');
}

function testDashboard(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get dashboard data
  const dashboardResponse = http.get(`${API_URL}/user/dashboard`, { headers });
  
  const success = check(dashboardResponse, {
    'Dashboard status': (r) => r.status === 200,
    'Dashboard response time': (r) => r.timings.duration < 500,
    'Dashboard has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testChatbot(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Send chat message
  const chatResponse = http.post(`${API_URL}/chatbot/send`, JSON.stringify({
    message: 'Hello, this is a performance test message',
    chatbotType: 'general',
  }), { headers });
  
  const success = check(chatResponse, {
    'Chat status': (r) => r.status === 200,
    'Chat response time': (r) => r.timings.duration < 2000, // AI responses can take longer
    'Chat has response': (r) => r.json('response') !== undefined,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testFileUpload(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
  };
  
  // Simulate small file upload
  const fileData = 'This is test file content for performance testing';
  const formData = {
    file: http.file(fileData, 'test.txt', 'text/plain'),
    type: 'document',
  };
  
  const uploadResponse = http.post(`${API_URL}/upload`, formData, { headers });
  
  const success = check(uploadResponse, {
    'Upload status': (r) => r.status === 200,
    'Upload response time': (r) => r.timings.duration < 1000,
    'Upload successful': (r) => r.json('success') === true,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testAnalytics(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get analytics data
  const analyticsResponse = http.get(`${API_URL}/analytics/overview`, { headers });
  
  const success = check(analyticsResponse, {
    'Analytics status': (r) => r.status === 200,
    'Analytics response time': (r) => r.timings.duration < 800,
    'Analytics has metrics': (r) => r.json('metrics') !== undefined,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testStaticContent() {
  // Test static assets
  const staticTests = [
    `${BASE_URL}/`,
    `${BASE_URL}/manifest.json`,
    `${BASE_URL}/favicon.ico`,
  ];
  
  staticTests.forEach(url => {
    const response = http.get(url);
    const success = check(response, {
      [`Static ${url} status`]: (r) => r.status === 200,
      [`Static ${url} cache headers`]: (r) => r.headers['Cache-Control'] !== undefined,
    });
    
    if (!success) {
      errorRate.add(1);
    }
  });
}

export function teardown(data) {
  console.log('Performance test completed');
  console.log('Test ran against:', data.baseUrl);
}