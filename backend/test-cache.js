// Test Cache System
const express = require('express');
const NodeCache = require('node-cache');

// Simple memory cache for testing
const testCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 1000
});

const app = express();
app.use(express.json());

// Test route to set cache
app.post('/test-cache-set/:key', (req, res) => {
  const { key } = req.params;
  const { value, ttl = 300 } = req.body;
  
  testCache.set(key, value, ttl);
  
  res.json({
    success: true,
    message: `Cache set for key: ${key}`,
    ttl
  });
});

// Test route to get cache
app.get('/test-cache-get/:key', (req, res) => {
  const { key } = req.params;
  const value = testCache.get(key);
  
  if (value !== undefined) {
    res.json({
      success: true,
      key,
      value,
      found: true
    });
  } else {
    res.json({
      success: false,
      key,
      found: false,
      message: 'Key not found in cache'
    });
  }
});

// Test route to get cache stats
app.get('/test-cache-stats', (req, res) => {
  const keys = testCache.keys();
  const stats = testCache.getStats();
  
  res.json({
    success: true,
    stats: {
      keys: keys.length,
      keysList: keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) : 0
    }
  });
});

// Health check
app.get('/test-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: {
      type: 'memory',
      keys: testCache.keys().length
    }
  });
});

const PORT = process.env.CACHE_TEST_PORT || 4001;

app.listen(PORT, () => {
  console.log(`🧪 Cache test server running on http://localhost:${PORT}`);
  console.log('Test endpoints:');
  console.log(`  GET  http://localhost:${PORT}/test-health`);
  console.log(`  GET  http://localhost:${PORT}/test-cache-stats`);
  console.log(`  GET  http://localhost:${PORT}/test-cache-get/:key`);
  console.log(`  POST http://localhost:${PORT}/test-cache-set/:key`);
});