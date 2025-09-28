// Simple HTTP client to test our cache endpoints
const http = require('http');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCacheEndpoints() {
  console.log('🧪 Testing Cache System Endpoints...\n');
  
  try {
    // Test 1: Cache Health Check
    console.log('1️⃣ Testing Cache Health Check...');
    const healthResponse = await makeRequest('http://localhost:4000/api/v1/cache/health');
    console.log('✅ Status:', healthResponse.statusCode);
    console.log('📊 Response:', JSON.stringify(healthResponse.data, null, 2));
    console.log('');
    
    // Test 2: Basic Health Check
    console.log('2️⃣ Testing Basic Health Check...');
    const basicHealthResponse = await makeRequest('http://localhost:4000/health');
    console.log('✅ Status:', basicHealthResponse.statusCode);
    console.log('📊 Response:', JSON.stringify(basicHealthResponse.data, null, 2));
    console.log('');
    
    // Test 3: API Health Check
    console.log('3️⃣ Testing API Health Check...');
    const apiHealthResponse = await makeRequest('http://localhost:4000/api/v1/health');
    console.log('✅ Status:', apiHealthResponse.statusCode);
    console.log('📊 Response:', JSON.stringify(apiHealthResponse.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Error testing cache endpoints:', error.message);
  }
}

// Run the tests
testCacheEndpoints().then(() => {
  console.log('🎉 Cache endpoint testing completed!');
}).catch((error) => {
  console.error('💥 Test failed:', error);
});