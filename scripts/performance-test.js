const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Performance testing configuration
const CONFIG = {
    baseURL: process.env.API_URL || 'http://localhost:5000',
    flaskURL: process.env.FLASK_URL || 'http://localhost:5001',
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 10,
    testDuration: parseInt(process.env.TEST_DURATION) || 60, // seconds
    rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 10, // seconds
    outputDir: path.join(__dirname, '../performance-results'),
    endpoints: [
        // Backend API endpoints
        { method: 'GET', path: '/api/v1/posts', weight: 30 },
        { method: 'GET', path: '/api/v1/users/profile', weight: 20, auth: true },
        { method: 'POST', path: '/api/v1/chat', weight: 25, body: { prompt: 'Hello, how are you?' } },
        { method: 'GET', path: '/api/v1/chat/history', weight: 15, auth: true },
        { method: 'POST', path: '/api/v1/posts', weight: 10, auth: true, body: { title: 'Test Post', content: 'Test content' } },
        
        // AI Service endpoints
        { method: 'POST', path: '/generate_quiz', weight: 20, flask: true, body: { topic: 'Mathematics', difficulty: 'medium' } },
        { method: 'POST', path: '/grade_essay', weight: 15, flask: true, body: { essay: 'This is a test essay.' } },
        { method: 'POST', path: '/lesson_planner', weight: 10, flask: true, body: { subject: 'Science', grade: '8' } }
    ]
};

class PerformanceTester {
    constructor(config) {
        this.config = config;
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errorsByEndpoint: {},
            responseTimesByEndpoint: {},
            throughput: 0,
            averageResponseTime: 0,
            p50ResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            startTime: null,
            endTime: null
        };
        this.users = [];
        this.isRunning = false;
        
        // Create output directory
        if (!fs.existsSync(config.outputDir)) {
            fs.mkdirSync(config.outputDir, { recursive: true });
        }
    }

    // Generate weighted random endpoint
    selectRandomEndpoint() {
        const totalWeight = this.config.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const endpoint of this.config.endpoints) {
            random -= endpoint.weight;
            if (random <= 0) {
                return endpoint;
            }
        }
        
        return this.config.endpoints[0]; // Fallback
    }

    // Make HTTP request
    async makeRequest(endpoint, userToken = null) {
        const startTime = Date.now();
        const baseURL = endpoint.flask ? this.config.flaskURL : this.config.baseURL;
        const url = `${baseURL}${endpoint.path}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'PerformanceTester/1.0'
        };
        
        if (endpoint.auth && userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
        }

        try {
            const response = await axios({
                method: endpoint.method,
                url,
                headers,
                data: endpoint.body,
                timeout: 30000 // 30 second timeout
            });

            const responseTime = Date.now() - startTime;
            
            this.recordSuccess(endpoint.path, responseTime);
            return { success: true, responseTime, status: response.status };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.recordError(endpoint.path, error);
            
            return { 
                success: false, 
                responseTime, 
                error: error.message,
                status: error.response?.status || 0 
            };
        }
    }

    // Record successful request
    recordSuccess(endpoint, responseTime) {
        this.results.totalRequests++;
        this.results.successfulRequests++;
        this.results.responseTimes.push(responseTime);
        
        if (!this.results.responseTimesByEndpoint[endpoint]) {
            this.results.responseTimesByEndpoint[endpoint] = [];
        }
        this.results.responseTimesByEndpoint[endpoint].push(responseTime);
        
        // Update min/max response times
        this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
        this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
    }

    // Record failed request
    recordError(endpoint, error) {
        this.results.totalRequests++;
        this.results.failedRequests++;
        
        if (!this.results.errorsByEndpoint[endpoint]) {
            this.results.errorsByEndpoint[endpoint] = [];
        }
        this.results.errorsByEndpoint[endpoint].push({
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Calculate percentiles
    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    // Generate user session
    async simulateUser(userId) {
        console.log(`👤 User ${userId} started`);
        let userToken = null;
        
        // Try to authenticate user for endpoints that need auth
        try {
            const authResponse = await this.makeRequest({
                method: 'POST',
                path: '/api/v1/auth/login',
                body: { 
                    email: `testuser${userId}@example.com`, 
                    password: 'testpassword' 
                }
            });
            
            if (authResponse.success && authResponse.data) {
                userToken = authResponse.data.token;
            }
        } catch (error) {
            console.warn(`⚠️ Authentication failed for user ${userId}, continuing without auth`);
        }

        // Main testing loop
        while (this.isRunning) {
            const endpoint = this.selectRandomEndpoint();
            await this.makeRequest(endpoint, userToken);
            
            // Random delay between requests (0.5-2 seconds)
            const delay = 500 + Math.random() * 1500;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`👤 User ${userId} finished`);
    }

    // Start performance test
    async startTest() {
        console.log('🚀 Starting performance test...');
        console.log(`Configuration:
        - Base URL: ${this.config.baseURL}
        - Flask URL: ${this.config.flaskURL}
        - Concurrent Users: ${this.config.concurrentUsers}
        - Test Duration: ${this.config.testDuration}s
        - Ramp Up Time: ${this.config.rampUpTime}s
        - Endpoints: ${this.config.endpoints.length}`);

        this.results.startTime = new Date();
        this.isRunning = true;

        // Gradual ramp-up of users
        for (let i = 0; i < this.config.concurrentUsers; i++) {
            setTimeout(() => {
                const userPromise = this.simulateUser(i + 1);
                this.users.push(userPromise);
            }, (i * this.config.rampUpTime * 1000) / this.config.concurrentUsers);
        }

        // Run test for specified duration
        setTimeout(() => {
            this.stopTest();
        }, this.config.testDuration * 1000);

        // Show progress every 10 seconds
        const progressInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(progressInterval);
                return;
            }
            
            const elapsed = (Date.now() - this.results.startTime.getTime()) / 1000;
            const currentThroughput = this.results.totalRequests / elapsed;
            
            console.log(`⏱️ Progress: ${elapsed.toFixed(1)}s - Requests: ${this.results.totalRequests}, Throughput: ${currentThroughput.toFixed(2)} req/s, Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(1)}%`);
        }, 10000);
    }

    // Stop performance test
    async stopTest() {
        console.log('🛑 Stopping performance test...');
        this.isRunning = false;
        this.results.endTime = new Date();

        // Wait for all users to complete
        await Promise.allSettled(this.users);

        // Calculate final metrics
        this.calculateMetrics();
        
        // Generate and save report
        this.generateReport();
        
        console.log('✅ Performance test completed');
    }

    // Calculate performance metrics
    calculateMetrics() {
        const totalTime = (this.results.endTime.getTime() - this.results.startTime.getTime()) / 1000;
        
        this.results.throughput = this.results.totalRequests / totalTime;
        
        if (this.results.responseTimes.length > 0) {
            this.results.averageResponseTime = this.results.responseTimes.reduce((sum, time) => sum + time, 0) / this.results.responseTimes.length;
            this.results.p50ResponseTime = this.calculatePercentile(this.results.responseTimes, 50);
            this.results.p95ResponseTime = this.calculatePercentile(this.results.responseTimes, 95);
            this.results.p99ResponseTime = this.calculatePercentile(this.results.responseTimes, 99);
        }
    }

    // Generate detailed report
    generateReport() {
        const report = {
            testConfiguration: {
                baseURL: this.config.baseURL,
                flaskURL: this.config.flaskURL,
                concurrentUsers: this.config.concurrentUsers,
                testDuration: this.config.testDuration,
                rampUpTime: this.config.rampUpTime
            },
            testResults: {
                startTime: this.results.startTime.toISOString(),
                endTime: this.results.endTime.toISOString(),
                totalDuration: (this.results.endTime.getTime() - this.results.startTime.getTime()) / 1000,
                totalRequests: this.results.totalRequests,
                successfulRequests: this.results.successfulRequests,
                failedRequests: this.results.failedRequests,
                successRate: ((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2) + '%',
                throughput: this.results.throughput.toFixed(2) + ' req/s',
                averageResponseTime: this.results.averageResponseTime.toFixed(2) + 'ms',
                responseTimePercentiles: {
                    p50: this.results.p50ResponseTime + 'ms',
                    p95: this.results.p95ResponseTime + 'ms',
                    p99: this.results.p99ResponseTime + 'ms'
                },
                responseTimeRange: {
                    min: this.results.minResponseTime + 'ms',
                    max: this.results.maxResponseTime + 'ms'
                }
            },
            endpointMetrics: {},
            errors: this.results.errorsByEndpoint
        };

        // Calculate per-endpoint metrics
        for (const [endpoint, responseTimes] of Object.entries(this.results.responseTimesByEndpoint)) {
            if (responseTimes.length > 0) {
                report.endpointMetrics[endpoint] = {
                    requests: responseTimes.length,
                    averageResponseTime: (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2) + 'ms',
                    minResponseTime: Math.min(...responseTimes) + 'ms',
                    maxResponseTime: Math.max(...responseTimes) + 'ms',
                    p95ResponseTime: this.calculatePercentile(responseTimes, 95) + 'ms'
                };
            }
        }

        // Save detailed report
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.config.outputDir, `performance-report-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Save CSV for analysis
        this.generateCSVReport(timestamp);

        // Print summary to console
        this.printSummary(report);
        
        console.log(`📁 Detailed report saved to: ${reportPath}`);
    }

    // Generate CSV report for analysis
    generateCSVReport(timestamp) {
        const csvData = [
            ['Timestamp', 'Endpoint', 'Method', 'ResponseTime', 'Success', 'Status']
        ];

        // Add sample data (in real implementation, you'd collect this during the test)
        const csvPath = path.join(this.config.outputDir, `performance-data-${timestamp}.csv`);
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        fs.writeFileSync(csvPath, csvContent);
    }

    // Print summary to console
    printSummary(report) {
        console.log('\n📊 PERFORMANCE TEST SUMMARY');
        console.log('================================');
        console.log(`Total Requests: ${report.testResults.totalRequests}`);
        console.log(`Success Rate: ${report.testResults.successRate}`);
        console.log(`Throughput: ${report.testResults.throughput}`);
        console.log(`Average Response Time: ${report.testResults.averageResponseTime}`);
        console.log(`P95 Response Time: ${report.testResults.responseTimePercentiles.p95}`);
        console.log(`P99 Response Time: ${report.testResults.responseTimePercentiles.p99}`);
        console.log('================================\n');

        // Show top slowest endpoints
        console.log('🐌 SLOWEST ENDPOINTS:');
        const endpointsBySpeed = Object.entries(report.endpointMetrics)
            .sort((a, b) => parseFloat(b[1].averageResponseTime) - parseFloat(a[1].averageResponseTime))
            .slice(0, 5);
        
        endpointsBySpeed.forEach(([endpoint, metrics], index) => {
            console.log(`${index + 1}. ${endpoint} - ${metrics.averageResponseTime} (${metrics.requests} requests)`);
        });

        // Show errors if any
        if (Object.keys(report.errors).length > 0) {
            console.log('\n❌ ERRORS BY ENDPOINT:');
            for (const [endpoint, errors] of Object.entries(report.errors)) {
                console.log(`${endpoint}: ${errors.length} errors`);
            }
        }
    }
}

// CLI interface
async function main() {
    const tester = new PerformanceTester(CONFIG);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⚠️ Received interrupt signal, stopping test...');
        tester.stopTest().then(() => process.exit(0));
    });

    try {
        await tester.startTest();
    } catch (error) {
        console.error('❌ Performance test failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { PerformanceTester, CONFIG };