// Cache Test Client
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCache() {
  try {
    console.log('🧪 Testing Cache System...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await makeRequest('GET', '/test-health');
    console.log('✅ Health:', JSON.stringify(health, null, 2));

    // Test 2: Initial stats
    console.log('\n2. Testing cache stats (empty cache)...');
    const emptyStats = await makeRequest('GET', '/test-cache-stats');
    console.log('✅ Empty Stats:', JSON.stringify(emptyStats, null, 2));

    // Test 3: Set cache value
    console.log('\n3. Setting cache value...');
    const setResult = await makeRequest('POST', '/test-cache-set/user:123', {
      value: { id: 123, name: 'John Doe', email: 'john@example.com' },
      ttl: 300
    });
    console.log('✅ Set Result:', JSON.stringify(setResult, null, 2));

    // Test 4: Get cache value
    console.log('\n4. Getting cache value...');
    const getValue = await makeRequest('GET', '/test-cache-get/user:123');
    console.log('✅ Get Value:', JSON.stringify(getValue, null, 2));

    // Test 5: Stats with data
    console.log('\n5. Testing cache stats (with data)...');
    const statsWithData = await makeRequest('GET', '/test-cache-stats');
    console.log('✅ Stats with Data:', JSON.stringify(statsWithData, null, 2));

    // Test 6: Get non-existent key
    console.log('\n6. Getting non-existent key...');
    const missingValue = await makeRequest('GET', '/test-cache-get/user:999');
    console.log('✅ Missing Value:', JSON.stringify(missingValue, null, 2));

    // Test 7: Set multiple values
    console.log('\n7. Setting multiple cache values...');
    await makeRequest('POST', '/test-cache-set/session:abc', {
      value: { sessionId: 'abc', userId: 123, expires: new Date() },
      ttl: 600
    });
    await makeRequest('POST', '/test-cache-set/config:app', {
      value: { theme: 'dark', language: 'en', notifications: true },
      ttl: 3600
    });

    // Test 8: Final stats
    console.log('\n8. Final cache stats...');
    const finalStats = await makeRequest('GET', '/test-cache-stats');
    console.log('✅ Final Stats:', JSON.stringify(finalStats, null, 2));

    console.log('\n🎉 All cache tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCache();