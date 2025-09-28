import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CacheManagement.css';

const CacheManagement = () => {
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheHealth, setCacheHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [keyToSearch, setKeyToSearch] = useState('');
  const [keyValue, setKeyValue] = useState(null);
  const [patternToDelete, setPatternToDelete] = useState('');

  useEffect(() => {
    fetchCacheData();
    const interval = setInterval(fetchCacheData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCacheData = async () => {
    try {
      const [statsResponse, healthResponse] = await Promise.all([
        axios.get('/api/v1/cache/stats'),
        axios.get('/api/v1/cache/health')
      ]);

      setCacheStats(statsResponse.data.data);
      setCacheHealth(healthResponse.data.data);
      setError(null);
    } catch (err) {
      console.error('Cache data fetch error:', err);
      setError('Failed to fetch cache data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeySearch = async () => {
    if (!keyToSearch.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/cache/key/${encodeURIComponent(keyToSearch)}`);
      setKeyValue(response.data.data);
    } catch (err) {
      console.error('Key search error:', err);
      setKeyValue({ error: err.response?.data?.message || 'Key not found' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePattern = async () => {
    if (!patternToDelete.trim()) return;

    if (!window.confirm(`Are you sure you want to delete all keys matching pattern: ${patternToDelete}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`/api/v1/cache/pattern/${encodeURIComponent(patternToDelete)}`);
      alert(`Deleted ${response.data.data.deletedCount} keys`);
      setPatternToDelete('');
      fetchCacheData();
    } catch (err) {
      console.error('Pattern delete error:', err);
      alert('Failed to delete pattern: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFlushCache = async () => {
    const confirmation = prompt('Type "FLUSH_ALL_CACHE" to confirm cache flush:');
    if (confirmation !== 'FLUSH_ALL_CACHE') return;

    try {
      setLoading(true);
      await axios.delete('/api/v1/cache/flush', {
        data: { confirm: 'FLUSH_ALL_CACHE' }
      });
      alert('Cache flushed successfully');
      fetchCacheData();
    } catch (err) {
      console.error('Cache flush error:', err);
      alert('Failed to flush cache: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cacheStats) {
    return (
      <div className="cache-management">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading cache data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cache-management">
      <div className="cache-header">
        <h2>🚀 Cache Management</h2>
        <div className="cache-actions">
          <button 
            className="refresh-btn"
            onClick={fetchCacheData}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button 
            className="flush-btn danger"
            onClick={handleFlushCache}
            disabled={loading}
          >
            🗑️ Flush All
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="cache-tabs">
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          🏥 Health
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🔧 Tools
        </button>
      </div>

      <div className="cache-content">
        {activeTab === 'stats' && cacheStats && (
          <div className="cache-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Memory Cache</h3>
                <div className="stat-items">
                  <div className="stat-item">
                    <span className="stat-label">Keys:</span>
                    <span className="stat-value">{cacheStats.memory.keys}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Hits:</span>
                    <span className="stat-value">{cacheStats.memory.hits}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Misses:</span>
                    <span className="stat-value">{cacheStats.memory.misses}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Hit Rate:</span>
                    <span className={`stat-value ${parseFloat(cacheStats.memory.hitRate) > 80 ? 'good' : 'warning'}`}>
                      {cacheStats.memory.hitRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3>Redis Cache</h3>
                <div className="stat-items">
                  <div className="stat-item">
                    <span className="stat-label">Status:</span>
                    <span className={`stat-value ${cacheStats.redis.connected ? 'good' : 'error'}`}>
                      {cacheStats.redis.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {cacheStats.redis.info && (
                    <>
                      <div className="stat-item">
                        <span className="stat-label">Memory:</span>
                        <span className="stat-value">
                          {Math.round(cacheStats.redis.info.used_memory / 1024 / 1024)} MB
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Peak Memory:</span>
                        <span className="stat-value">
                          {Math.round(cacheStats.redis.info.used_memory_peak / 1024 / 1024)} MB
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="stat-card performance-card">
                <h3>Performance</h3>
                <div className="performance-meter">
                  <div className="meter">
                    <div 
                      className="meter-fill"
                      style={{ 
                        width: `${cacheStats.memory.hitRate}%`,
                        backgroundColor: parseFloat(cacheStats.memory.hitRate) > 80 ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                  <span>Hit Rate: {cacheStats.memory.hitRate}%</span>
                </div>
                <div className="performance-stats">
                  <div>Total Requests: {cacheStats.memory.hits + cacheStats.memory.misses}</div>
                  <div>Cache Efficiency: {parseFloat(cacheStats.memory.hitRate) > 80 ? 'Excellent' : 'Needs Improvement'}</div>
                </div>
              </div>
            </div>

            <div className="timestamp">
              Last Updated: {new Date(cacheStats.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {activeTab === 'health' && cacheHealth && (
          <div className="cache-health">
            <div className={`health-status ${cacheHealth.status}`}>
              <div className="status-indicator">
                <span className={`status-dot ${cacheHealth.status}`}></span>
                <h3>System Status: {cacheHealth.status.toUpperCase()}</h3>
              </div>
              <div className="health-timestamp">
                {new Date(cacheHealth.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="health-services">
              <div className={`service-card ${cacheHealth.services.memory.status}`}>
                <h4>💾 Memory Cache</h4>
                <div className="service-details">
                  <div>Status: {cacheHealth.services.memory.status}</div>
                  <div>Keys: {cacheHealth.services.memory.keys}</div>
                </div>
              </div>

              <div className={`service-card ${cacheHealth.services.redis.status}`}>
                <h4>📡 Redis Cache</h4>
                <div className="service-details">
                  <div>Status: {cacheHealth.services.redis.status}</div>
                  <div>Connected: {cacheHealth.services.redis.connected ? 'Yes' : 'No'}</div>
                  {cacheHealth.services.redis.ping && (
                    <div>Ping: {cacheHealth.services.redis.ping}</div>
                  )}
                  {cacheHealth.services.redis.error && (
                    <div className="error-text">Error: {cacheHealth.services.redis.error}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="cache-tools">
            <div className="tool-section">
              <h3>🔍 Key Search</h3>
              <div className="tool-input-group">
                <input
                  type="text"
                  placeholder="Enter cache key to search..."
                  value={keyToSearch}
                  onChange={(e) => setKeyToSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleKeySearch()}
                />
                <button onClick={handleKeySearch} disabled={loading}>
                  Search
                </button>
              </div>
              
              {keyValue && (
                <div className="key-result">
                  {keyValue.error ? (
                    <div className="error-text">{keyValue.error}</div>
                  ) : (
                    <div className="key-details">
                      <div><strong>Key:</strong> {keyValue.key}</div>
                      <div><strong>TTL:</strong> {keyValue.ttl} seconds</div>
                      <div><strong>Value:</strong></div>
                      <pre className="key-value">{JSON.stringify(keyValue.value, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="tool-section">
              <h3>🗑️ Pattern Delete</h3>
              <div className="tool-input-group">
                <input
                  type="text"
                  placeholder="Enter pattern to delete (e.g., user:123:*)"
                  value={patternToDelete}
                  onChange={(e) => setPatternToDelete(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDeletePattern()}
                />
                <button 
                  onClick={handleDeletePattern} 
                  disabled={loading}
                  className="danger"
                >
                  Delete
                </button>
              </div>
              
              <div className="pattern-examples">
                <p><strong>Pattern Examples:</strong></p>
                <ul>
                  <li><code>user:*</code> - All user-related keys</li>
                  <li><code>api:search:*</code> - All search API cache</li>
                  <li><code>session:*</code> - All session data</li>
                  <li><code>stats:daily:*</code> - All daily statistics</li>
                </ul>
              </div>
            </div>

            <div className="tool-section">
              <h3>⚠️ Danger Zone</h3>
              <div className="danger-actions">
                <button 
                  className="flush-btn danger"
                  onClick={handleFlushCache}
                  disabled={loading}
                >
                  🗑️ Flush All Cache
                </button>
                <p className="danger-warning">
                  This action will delete ALL cached data and cannot be undone.
                  You will be prompted to type "FLUSH_ALL_CACHE" to confirm.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheManagement;